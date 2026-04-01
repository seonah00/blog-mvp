/**
 * Research Actions
 * 
 * Server/Client actions for research operations
 * - Place search with parallel API calls (Naver/Kakao/Google)
 * - Result normalization and deduplication
 * - Review digest generation
 * - Optional Perplexity web research
 * 
 * TODO: 검색 캐시/요청 제한 - 동일 query 재검색 방지
 * TODO: observability/logging - 검색 성공률/응답시간 모니터링
 */

'use server'

import { searchGooglePlaces } from '@/lib/integrations/google-places'
import { searchNaverLocal } from '@/lib/integrations/naver-local'
import { searchKakaoLocal } from '@/lib/integrations/kakao-local'
import { 
  shouldUseMockPlaces, 
  isGooglePlacesAvailable, 
  isNaverLocalAvailable,
  isKakaoLocalAvailable,
  isRestaurantWebResearchEnabled,
} from '@/lib/integrations/env'
import { generateReviewDigest } from '@/lib/ai/restaurant-research'
import { mergeCandidatesToCanonical, toNormalizedProfile } from '@/lib/research/canonical-place'
import { researchRestaurantPlace } from '@/lib/integrations/perplexity'
import { perplexityResultToEvidence } from '@/lib/research/evidence-aggregator'
import type { PlaceCandidate, UserReviewInput, ReviewDigest, CanonicalPlace, WebEvidence } from '@/types'

export interface SearchPlacesResult {
  success: boolean
  candidates: PlaceCandidate[]
  /** Canonical Place 결과 (NEW) */
  canonicalPlaces?: CanonicalPlace[]
  sources: {
    google: number
    naver: number
    kakao: number
    mock: number
  }
  warnings: string[]
  errors: string[]
  usedFallback: boolean
}

export interface GenerateReviewDigestResult {
  success: boolean
  digest?: ReviewDigest
  error?: string
  warnings: string[]
}

export interface ResearchPlaceWithEvidenceResult {
  success: boolean
  evidence?: WebEvidence
  error?: string
}

/**
 * Mock place search 결과
 * API key가 없거나 USE_MOCK_PLACES 설정 시 사용
 */
async function getMockPlaceCandidates(
  query: string,
  region: string
): Promise<PlaceCandidate[]> {
  console.log('[Mock] Generating mock place candidates:', { query, region })
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600))
  
  const timestamp = Date.now()
  const searchKeyword = region ? `${region} ${query}` : query
  
  return [
    {
      id: `mock-${timestamp}-1`,
      source: 'manual',
      externalId: `mock-${timestamp}-1`,
      name: `${searchKeyword} 본점`,
      category: '양식',
      address: '서울시 예시구 예시로 123',
      roadAddress: `${region || '서울'} 예시로 123`,
      latitude: 37.5665,
      longitude: 126.9780,
      rating: 4.5,
      reviewCount: 127,
      phone: '02-1234-5678',
      websiteUrl: undefined,
      description: '맛있는 파스타와 와인을 즐길 수 있는 곳. 분위기가 좋아 데이트 장소로 인기입니다.',
      mapUrl: undefined,
    },
    {
      id: `mock-${timestamp}-2`,
      source: 'manual',
      externalId: `mock-${timestamp}-2`,
      name: `${searchKeyword} 2호점`,
      category: '이탈리안 레스토랑',
      address: '서울시 예시구 데모길 456',
      roadAddress: `${region || '서울'} 데모길 456`,
      latitude: 37.5670,
      longitude: 126.9785,
      rating: 4.3,
      reviewCount: 89,
      phone: '02-8765-4321',
      websiteUrl: undefined,
      description: '넓은 홀과 프라이빗 룸이 있는 단체 모임에 적합한 공간입니다.',
      mapUrl: undefined,
    },
    {
      id: `mock-${timestamp}-3`,
      source: 'manual',
      externalId: `mock-${timestamp}-3`,
      name: `${searchKeyword} 신사점`,
      category: '파스타 전문점',
      address: '서울시 예시구 신사동 789',
      roadAddress: `${region || '서울'} 신사로 789`,
      latitude: 37.5270,
      longitude: 127.0280,
      rating: 4.7,
      reviewCount: 256,
      phone: '02-1111-2222',
      websiteUrl: undefined,
      description: '셰프 특제 소스가 인기인 숨은 맛집입니다.',
      mapUrl: undefined,
    },
  ]
}

/**
 * Simple deduplication by name + address similarity
 */
function deduplicateCandidates(candidates: PlaceCandidate[]): PlaceCandidate[] {
  const seen = new Set<string>()
  
  return candidates.filter((candidate) => {
    // Normalize key: name + address (first 20 chars)
    const name = candidate.name.trim().toLowerCase().replace(/\s+/g, '')
    const address = (candidate.roadAddress || candidate.address || '').slice(0, 20).trim().toLowerCase()
    const key = `${name}|${address}`
    
    if (seen.has(key)) {
      console.log('[Dedupe] Skipping duplicate:', candidate.name)
      return false
    }
    
    seen.add(key)
    return true
  })
}

/**
 * Search places from multiple sources
 * 
 * Parallel calls to Naver + Kakao (+ optional Google)
 * Falls back to mock if no API keys or USE_MOCK_PLACES set
 * Returns both raw candidates and canonical places
 */
export async function searchPlacesAction(
  query: string,
  region: string = ''
): Promise<SearchPlacesResult> {
  const warnings: string[] = []
  const errors: string[] = []
  
  // Input validation
  if (!query.trim()) {
    return {
      success: false,
      candidates: [],
      sources: { google: 0, naver: 0, kakao: 0, mock: 0 },
      warnings: [],
      errors: ['검색어를 입력해주세요.'],
      usedFallback: false,
    }
  }
  
  // Check mock fallback
  if (shouldUseMockPlaces()) {
    console.log('[Search] Using mock fallback (no API keys or USE_MOCK_PLACES=true)')
    const mockCandidates = await getMockPlaceCandidates(query.trim(), region.trim())
    
    return {
      success: true,
      candidates: mockCandidates,
      sources: { google: 0, naver: 0, kakao: 0, mock: mockCandidates.length },
      warnings: ['Mock 데이터를 사용 중입니다. 실제 검색을 위해 API 키를 설정하세요.'],
      errors: [],
      usedFallback: true,
    }
  }

  const searchQuery = region.trim() ? `${region.trim()} ${query.trim()}` : query.trim()
  
  const kakaoAvailable = isKakaoLocalAvailable()
  
  console.log('[Search] Starting parallel search:', { 
    query: searchQuery, 
    naverAvailable: isNaverLocalAvailable(),
    kakaoAvailable,
    googleAvailable: isGooglePlacesAvailable(),
  })
  
  // Kakao가 비활성화된 경우 warning 추가 (non-blocking)
  if (!kakaoAvailable && process.env.RESTAURANT_ENABLE_KAKAO === 'false') {
    warnings.push('Kakao Local API가 비활성화되어 있습니다. Naver 검색만 사용합니다.')
  }
  
  // Parallel API calls with individual error handling
  // Order: Naver, Kakao (optional), Google
  // Kakao는 선택사항 - 실패필도 전체 검색을 막지 않음
  const results = await Promise.allSettled([
    isNaverLocalAvailable()
      ? searchNaverLocal(searchQuery).catch(err => {
          console.error('[Search] Naver Local failed:', err)
          errors.push(`Naver Local: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
          return []
        })
      : Promise.resolve([]),
    // Kakao는 선택사항 - 비활성화된 경우 호출 생략
    kakaoAvailable
      ? searchKakaoLocal(searchQuery).catch(err => {
          console.error('[Search] Kakao Local failed:', err)
          // 403 Forbidden은 치명적 에러가 아닌 warning으로 처리
          if (err instanceof Error && err.message.includes('403')) {
            warnings.push('Kakao Local API 접근 권한 없음 (403). Naver 검색으로 대체합니다.')
          } else {
            errors.push(`Kakao Local: ${err.message}`)
          }
          return []
        })
      : Promise.resolve([]),
    isGooglePlacesAvailable() 
      ? searchGooglePlaces(searchQuery).catch(err => {
          console.error('[Search] Google Places failed:', err)
          errors.push(`Google Places: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
          return []
        })
      : Promise.resolve([]),
  ])

  const naverResults = results[0].status === 'fulfilled' ? results[0].value : []
  const kakaoResults = results[1].status === 'fulfilled' ? results[1].value : []
  const googleResults = results[2].status === 'fulfilled' ? results[2].value : []
  
  // Check if all failed
  const allFailed = results.every(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.length === 0))
  
  if (allFailed) {
    console.log('[Search] All APIs failed or returned empty, using mock fallback')
    const mockCandidates = await getMockPlaceCandidates(query.trim(), region.trim())
    
    return {
      success: true,
      candidates: mockCandidates,
      sources: { google: 0, naver: 0, kakao: 0, mock: mockCandidates.length },
      warnings: ['API 호출에 실패하여 Mock 데이터를 표시합니다.'],
      errors,
      usedFallback: true,
    }
  }
  
  // Track partial failures
  results.forEach((result, index) => {
    const name = ['Naver', 'Kakao', 'Google'][index]
    const isAvailable = [isNaverLocalAvailable(), isKakaoLocalAvailable(), isGooglePlacesAvailable()][index]
    
    if (result.status === 'rejected') {
      warnings.push(`${name} API 호출 실패`)
    } else if (result.value.length === 0 && isAvailable) {
      warnings.push(`${name} 검색 결과 없음`)
    }
  })

  // Merge all candidates
  const allCandidates = [...naverResults, ...kakaoResults, ...googleResults]
  
  // Legacy dedupe (for backward compatibility)
  const deduplicated = deduplicateCandidates(allCandidates)
  
  // NEW: Canonical Place 병합
  const { places: canonicalPlaces } = mergeCandidatesToCanonical(allCandidates)
  
  // Sort by source priority: naver > kakao > google > manual
  const sourcePriority: Record<string, number> = { 
    naver_local_api: 1, 
    kakao_local_api: 2,
    google_places_api: 3, 
    manual: 4 
  }
  deduplicated.sort((a, b) => {
    return (sourcePriority[a.source] || 9) - (sourcePriority[b.source] || 9)
  })

  console.log('[Search] Results summary:', {
    naver: naverResults.length,
    kakao: kakaoResults.length,
    google: googleResults.length,
    canonical: canonicalPlaces.length,
    warnings: warnings.length,
    errors: errors.length,
  })

  // Empty result handling
  if (deduplicated.length === 0) {
    return {
      success: true,
      candidates: [],
      sources: { google: 0, naver: 0, kakao: 0, mock: 0 },
      warnings: [...warnings, '검색 결과가 없습니다. 다른 검색어를 시도해보세요.'],
      errors,
      usedFallback: false,
    }
  }

  return {
    success: true,
    candidates: deduplicated,
    canonicalPlaces,
    sources: {
      google: googleResults.length,
      naver: naverResults.length,
      kakao: kakaoResults.length,
      mock: 0,
    },
    warnings,
    errors,
    usedFallback: false,
  }
}

/**
 * Research a specific restaurant place using Perplexity
 * Optional enhancement - failures are non-blocking
 */
export async function researchRestaurantPlaceAction(
  projectId: string,
  placeName: string,
  region?: string,
  category?: string
): Promise<ResearchPlaceWithEvidenceResult> {
  console.log('[Research Action] Starting web research:', {
    projectId,
    placeName,
    region,
  })
  
  // Check if web research is enabled
  if (!isRestaurantWebResearchEnabled()) {
    console.log('[Research Action] Web research disabled or Perplexity not available')
    return {
      success: false,
      error: 'Web research not enabled',
    }
  }
  
  try {
    const researchResult = await researchRestaurantPlace({
      placeName,
      region,
      category,
    })
    
    // Convert to Evidence
    const evidence = perplexityResultToEvidence(researchResult, placeName)
    
    console.log('[Research Action] Successfully generated evidence:', {
      projectId,
      evidenceId: evidence.id,
      confidence: evidence.confidence,
    })
    
    return {
      success: true,
      evidence,
    }
    
  } catch (error) {
    console.error('[Research Action] Web research failed:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '웹 조사 중 오류가 발생했습니다.',
    }
  }
}

/**
 * Generate review digest from user input reviews
 * 
 * @param projectId - 프로젝트 ID
 * @param placeName - 매장명
 * @param placeCategory - 매장 카테고리
 * @param reviews - 사용자 입력 리뷰 배열
 * @returns GenerateReviewDigestResult
 * 
 * TODO: 실제 AI provider 기반 요약 연동 (OpenAI/Anthropic)
 * TODO: 로깅 / retry / observability 추가
 */
export async function generateReviewDigestAction(
  projectId: string,
  placeName: string,
  placeCategory: string,
  reviews: UserReviewInput[]
): Promise<GenerateReviewDigestResult> {
  const warnings: string[] = []
  
  console.log('[Digest Action] Starting review digest generation:', {
    projectId,
    placeName,
    reviewCount: reviews.length,
  })
  
  // 입력 검증
  if (!projectId.trim()) {
    return {
      success: false,
      error: '프로젝트 ID가 필요합니다.',
      warnings: [],
    }
  }
  
  if (!placeName.trim()) {
    return {
      success: false,
      error: '매장명이 필요합니다.',
      warnings: [],
    }
  }
  
  if (!reviews || reviews.length === 0) {
    return {
      success: false,
      error: '최소 1개 이상의 리뷰가 필요합니다.',
      warnings: [],
    }
  }
  
  // 유효한 리뷰 필터링 (최소 10자 이상)
  const validReviews = reviews.filter(review => {
    const isValid = review.content.trim().length >= 10
    if (!isValid) {
      console.log('[Digest Action] Skipping short review:', review.id)
    }
    return isValid
  })
  
  if (validReviews.length === 0) {
    return {
      success: false,
      error: '유효한 리뷰가 없습니다. (최소 10자 이상)',
      warnings: ['일부 리뷰가 너무 짧아 제외되었습니다.'],
    }
  }
  
  if (validReviews.length < reviews.length) {
    warnings.push(`${reviews.length - validReviews.length}개의 짧은 리뷰가 제외되었습니다.`)
  }
  
  try {
    // AI 요약 생성
    const digest = await generateReviewDigest(validReviews, {
      name: placeName,
      category: placeCategory || '음식점',
    })
    
    console.log('[Digest Action] Successfully generated digest:', {
      projectId,
      highlightsCount: digest.highlights.length,
      quotesCount: digest.quotes.length,
      sentiment: digest.sentiment,
    })
    
    return {
      success: true,
      digest,
      warnings,
    }
    
  } catch (error) {
    console.error('[Digest Action] Failed to generate digest:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '요약 생성 중 오류가 발생했습니다.',
      warnings,
    }
  }
}
