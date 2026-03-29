/**
 * Research Actions
 * 
 * Server/Client actions for research operations
 * - Place search with parallel API calls
 * - Result normalization and deduplication
 * - Review digest generation
 * 
 * TODO: 검색 캐시/요청 제한 - 동일 query 재검색 방지
 * TODO: observability/logging - 검색 성공률/응답시간 모니터링
 * TODO: 실제 AI provider 기반 요약 연동
 */

'use server'

import { searchGooglePlaces } from '@/lib/integrations/google-places'
import { searchNaverLocal } from '@/lib/integrations/naver-local'
import { shouldUseMockPlaces, isGooglePlacesAvailable, isNaverLocalAvailable } from '@/lib/integrations/env'
import { generateReviewDigest } from '@/lib/ai/restaurant-research'
import type { PlaceCandidate, UserReviewInput, ReviewDigest } from '@/types'

export interface SearchPlacesResult {
  success: boolean
  candidates: PlaceCandidate[]
  sources: {
    google: number
    naver: number
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
 * Parallel calls to Google Places + Naver Local
 * Falls back to mock if no API keys or USE_MOCK_PLACES set
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
      sources: { google: 0, naver: 0, mock: 0 },
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
      sources: { google: 0, naver: 0, mock: mockCandidates.length },
      warnings: ['Mock 데이터를 사용 중입니다. 실제 검색을 위해 API 키를 설정하세요.'],
      errors: [],
      usedFallback: true,
    }
  }

  const searchQuery = region.trim() ? `${region.trim()} ${query.trim()}` : query.trim()
  
  console.log('[Search] Starting parallel search:', { 
    query: searchQuery, 
    googleAvailable: isGooglePlacesAvailable(),
    naverAvailable: isNaverLocalAvailable(),
  })
  
  // Parallel API calls with individual error handling
  const results = await Promise.allSettled([
    isGooglePlacesAvailable() 
      ? searchGooglePlaces(searchQuery).catch(err => {
          console.error('[Search] Google Places failed:', err)
          errors.push(`Google Places: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
          return []
        })
      : Promise.resolve([]),
    isNaverLocalAvailable()
      ? searchNaverLocal(searchQuery).catch(err => {
          console.error('[Search] Naver Local failed:', err)
          errors.push(`Naver Local: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
          return []
        })
      : Promise.resolve([]),
  ])

  const googleResults = results[0].status === 'fulfilled' ? results[0].value : []
  const naverResults = results[1].status === 'fulfilled' ? results[1].value : []
  
  // Check if both failed
  if (results[0].status === 'rejected' && results[1].status === 'rejected') {
    console.log('[Search] Both APIs failed, using mock fallback')
    const mockCandidates = await getMockPlaceCandidates(query.trim(), region.trim())
    
    return {
      success: true,
      candidates: mockCandidates,
      sources: { google: 0, naver: 0, mock: mockCandidates.length },
      warnings: ['API 호출에 실패하여 Mock 데이터를 표시합니다.'],
      errors,
      usedFallback: true,
    }
  }
  
  // Track partial failures
  if (results[0].status === 'rejected' || googleResults.length === 0 && isGooglePlacesAvailable()) {
    if (results[0].status === 'rejected') {
      warnings.push('Google Places API 호출 실패')
    }
  }
  
  if (results[1].status === 'rejected' || naverResults.length === 0 && isNaverLocalAvailable()) {
    if (results[1].status === 'rejected') {
      warnings.push('Naver Local API 호출 실패')
    }
  }

  // Merge and deduplicate
  const allCandidates = [...googleResults, ...naverResults]
  const deduplicated = deduplicateCandidates(allCandidates)
  
  // Sort by source priority: google > naver > manual
  const sourcePriority = { google_places_api: 1, naver_local_api: 2, manual: 3 }
  deduplicated.sort((a, b) => {
    return (sourcePriority[a.source] || 9) - (sourcePriority[b.source] || 9)
  })

  console.log('[Search] Results summary:', {
    google: googleResults.length,
    naver: naverResults.length,
    final: deduplicated.length,
    warnings: warnings.length,
    errors: errors.length,
  })

  // Empty result handling
  if (deduplicated.length === 0) {
    return {
      success: true,
      candidates: [],
      sources: { google: 0, naver: 0, mock: 0 },
      warnings: [...warnings, '검색 결과가 없습니다. 다른 검색어를 시도해보세요.'],
      errors,
      usedFallback: false,
    }
  }

  return {
    success: true,
    candidates: deduplicated,
    sources: {
      google: googleResults.length,
      naver: naverResults.length,
      mock: 0,
    },
    warnings,
    errors,
    usedFallback: false,
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
