/**
 * Canonical Place Aggregation
 * 
 * Naver, Kakao, Google Places API 결과를 병합하여
 * 하나의 신뢰할 수 있는 Canonical Place로 정규화
 * 
 * Policy:
 * - Naver: 이름, 카테고리, 주소 우선
 * - Kakao: 좌표, 행정구역 우선
 * - Google: 보조 소스 (선택적)
 */

import type { 
  PlaceCandidate, 
  CanonicalPlace, 
  CanonicalPlaceInput,
  PlaceProvider 
} from '@/types'
import { createId } from '@/lib/utils'

// ============================================
// Types
// ============================================

export interface MergedPlaceResult {
  /** 병합된 Canonical Place 목록 */
  places: CanonicalPlace[]
  /** 중복으로 병합된 후보 수 */
  mergedCount: number
  /** 각 소스별 결과 수 */
  sourceCounts: Record<PlaceProvider, number>
}

export interface DedupeConfig {
  /** 이름 유사도 임계값 (0-1) */
  nameSimilarityThreshold: number
  /** 주소 유사도 임계값 (0-1) */
  addressSimilarityThreshold: number
  /** 거리 임계값 (미터) */
  distanceThresholdMeters: number
}

const DEFAULT_DEDUPE_CONFIG: DedupeConfig = {
  nameSimilarityThreshold: 0.8,
  addressSimilarityThreshold: 0.7,
  distanceThresholdMeters: 100,
}

// ============================================
// Main Merge Function
// ============================================

/**
 * 여러 소스의 PlaceCandidate를 병합하여 CanonicalPlace 생성
 * 
 * @param candidates - 모든 소스의 후보 목록
 * @param config - dedupe 설정
 * @returns 병합된 CanonicalPlace 목록
 */
export function mergeCandidatesToCanonical(
  candidates: PlaceCandidate[],
  config: Partial<DedupeConfig> = {}
): MergedPlaceResult {
  const fullConfig = { ...DEFAULT_DEDUPE_CONFIG, ...config }
  
  // 소스별로 그룹화
  const bySource = groupBySource(candidates)
  
  // Canonical Place 병합
  const placeMap = new Map<string, CanonicalPlace>()
  const processedCandidates = new Set<string>()
  
  // Primary: Naver 후보 처리
  bySource.naver?.forEach((naverCandidate) => {
    const canonical = createCanonicalFromSingle(naverCandidate, 'naver')
    
    // Kakao에서 일치하는 후보 찾기
    const matchingKakao = findMatchingCandidate(
      naverCandidate,
      bySource.kakao || [],
      fullConfig
    )
    
    if (matchingKakao) {
      mergeKakaoIntoCanonical(canonical, matchingKakao)
      processedCandidates.add(matchingKakao.id)
    }
    
    // Google에서 일치하는 후보 찾기
    const matchingGoogle = findMatchingCandidate(
      naverCandidate,
      bySource.google || [],
      fullConfig
    )
    
    if (matchingGoogle) {
      mergeGoogleIntoCanonical(canonical, matchingGoogle)
      processedCandidates.add(matchingGoogle.id)
    }
    
    placeMap.set(canonical.id, canonical)
    processedCandidates.add(naverCandidate.id)
  })
  
  // Secondary: Kakao 전용 후보 (Naver에 없는 것)
  bySource.kakao?.forEach((kakaoCandidate) => {
    if (processedCandidates.has(kakaoCandidate.id)) return
    
    const canonical = createCanonicalFromSingle(kakaoCandidate, 'kakao')
    
    // Google에서 일치하는 후보 찾기
    const matchingGoogle = findMatchingCandidate(
      kakaoCandidate,
      bySource.google || [],
      fullConfig
    )
    
    if (matchingGoogle) {
      mergeGoogleIntoCanonical(canonical, matchingGoogle)
      processedCandidates.add(matchingGoogle.id)
    }
    
    placeMap.set(canonical.id, canonical)
    processedCandidates.add(kakaoCandidate.id)
  })
  
  // Tertiary: Google 전용 후보 (나머지)
  bySource.google?.forEach((googleCandidate) => {
    if (processedCandidates.has(googleCandidate.id)) return
    
    const canonical = createCanonicalFromSingle(googleCandidate, 'google')
    placeMap.set(canonical.id, canonical)
    processedCandidates.add(googleCandidate.id)
  })
  
  // Manual (mock) 후보
  bySource.manual?.forEach((manualCandidate) => {
    if (processedCandidates.has(manualCandidate.id)) return
    
    const canonical = createCanonicalFromSingle(manualCandidate, 'manual')
    placeMap.set(canonical.id, canonical)
    processedCandidates.add(manualCandidate.id)
  })
  
  return {
    places: Array.from(placeMap.values()),
    mergedCount: candidates.length - placeMap.size,
    sourceCounts: {
      naver: bySource.naver?.length || 0,
      kakao: bySource.kakao?.length || 0,
      google: bySource.google?.length || 0,
      manual: bySource.manual?.length || 0,
    },
  }
}

// ============================================
// Canonical Place Creation
// ============================================

/**
 * 단일 후보로부터 CanonicalPlace 생성
 */
function createCanonicalFromSingle(
  candidate: PlaceCandidate,
  primarySource: PlaceProvider
): CanonicalPlace {
  const now = new Date().toISOString()
  
  const base: CanonicalPlace = {
    id: createCanonicalId(candidate),
    name: candidate.name,
    address: {
      road: candidate.roadAddress || candidate.address,
      full: candidate.roadAddress || candidate.address,
      jibun: candidate.source === 'naver_local_api' ? candidate.address : undefined,
    },
    coordinates: candidate.latitude && candidate.longitude
      ? {
          lat: candidate.latitude,
          lng: candidate.longitude,
          source: primarySource === 'kakao' ? 'kakao' : 'naver',
        }
      : { lat: 0, lng: 0, source: 'naver' },
    category: {
      primary: candidate.category?.split('>')[0]?.trim() || '음식점',
      secondary: candidate.category?.split('>').pop()?.trim(),
      full: candidate.category,
      source: primarySource === 'kakao' ? 'kakao' : 'naver',
    },
    contact: {
      phone: candidate.phone,
      naverLink: candidate.source === 'naver_local_api' ? candidate.mapUrl : undefined,
      kakaoLink: candidate.source === 'kakao_local_api' ? candidate.mapUrl : undefined,
      googleLink: candidate.source === 'google_places_api' 
        ? `https://www.google.com/maps/place/?q=place_id:${candidate.externalId}` 
        : undefined,
    },
    confidence: 'medium',
    sources: {},
    normalizedAt: now,
  }
  
  // 소스 정보 추가
  if (candidate.source === 'naver_local_api') {
    base.sources.naver = {
      id: candidate.externalId,
      link: candidate.mapUrl || '',
    }
  } else if (candidate.source === 'kakao_local_api') {
    base.sources.kakao = {
      id: candidate.externalId,
      placeUrl: candidate.mapUrl || '',
    }
  } else if (candidate.source === 'google_places_api') {
    base.sources.google = {
      placeId: candidate.externalId,
    }
  }
  
  return base
}

/**
 * Kakao 후보를 기존 CanonicalPlace에 병합
 */
function mergeKakaoIntoCanonical(
  canonical: CanonicalPlace,
  kakaoCandidate: PlaceCandidate
): void {
  // 좌표: Kakao 우선 (정확도 높음)
  if (kakaoCandidate.latitude && kakaoCandidate.longitude) {
    canonical.coordinates = {
      lat: kakaoCandidate.latitude,
      lng: kakaoCandidate.longitude,
      source: 'kakao',
    }
  }
  
  // 도로명 주소 보강
  if (kakaoCandidate.roadAddress) {
    canonical.address.road = kakaoCandidate.roadAddress
    canonical.address.full = kakaoCandidate.roadAddress
  }
  
  // 행정구역 추출 (주소에서)
  const regionMatch = kakaoCandidate.address?.match(/^([^\s]+)\s+([^\s]+)/)
  if (regionMatch) {
    canonical.address.region = `${regionMatch[1]} ${regionMatch[2]}`
  }
  
  // Kakao 링크
  canonical.contact.kakaoLink = kakaoCandidate.mapUrl
  
  // 소스 정보
  canonical.sources.kakao = {
    id: kakaoCandidate.externalId,
    placeUrl: kakaoCandidate.mapUrl || '',
  }
  
  // 신뢰도 업그레이드
  canonical.confidence = 'high'
}

/**
 * Google 후보를 기존 CanonicalPlace에 병합
 */
function mergeGoogleIntoCanonical(
  canonical: CanonicalPlace,
  googleCandidate: PlaceCandidate
): void {
  // 좌표: Kakao가 없을 때만 Google 사용
  if (canonical.coordinates.source !== 'kakao' && 
      googleCandidate.latitude && 
      googleCandidate.longitude) {
    canonical.coordinates = {
      lat: googleCandidate.latitude,
      lng: googleCandidate.longitude,
      source: 'naver', // Google 좌표도 naver로 표시
    }
  }
  
  // Google 링크
  canonical.contact.googleLink = 
    `https://www.google.com/maps/place/?q=place_id:${googleCandidate.externalId}`
  
  // 소스 정보
  canonical.sources.google = {
    placeId: googleCandidate.externalId,
  }
}

// ============================================
// Matching & Dedupe
// ============================================

/**
 * 후보 간 일치 여부 판단
 */
function findMatchingCandidate(
  target: PlaceCandidate,
  candidates: PlaceCandidate[],
  config: DedupeConfig
): PlaceCandidate | null {
  for (const candidate of candidates) {
    if (isMatch(target, candidate, config)) {
      return candidate
    }
  }
  return null
}

/**
 * 두 후보가 같은 장소인지 판단
 */
function isMatch(
  a: PlaceCandidate,
  b: PlaceCandidate,
  config: DedupeConfig
): boolean {
  // 이름 유사도
  const nameSim = calculateSimilarity(a.name, b.name)
  if (nameSim < config.nameSimilarityThreshold) {
    return false
  }
  
  // 주소 유사도
  const addrA = a.roadAddress || a.address
  const addrB = b.roadAddress || b.address
  const addrSim = calculateSimilarity(addrA, addrB)
  if (addrSim < config.addressSimilarityThreshold) {
    return false
  }
  
  // 좌표 거리 (둘 다 좌표가 있을 때)
  if (a.latitude && a.longitude && b.latitude && b.longitude) {
    const distance = calculateDistance(
      a.latitude, a.longitude,
      b.latitude, b.longitude
    )
    if (distance > config.distanceThresholdMeters) {
      return false
    }
  }
  
  return true
}

/**
 * 문자열 유사도 (간단한 구현 - Jaccard 유사도)
 */
function calculateSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  
  const normalize = (s: string) => 
    s.toLowerCase()
     .replace(/\s+/g, '')
     .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
  
  const na = normalize(a)
  const nb = normalize(b)
  
  if (na === nb) return 1
  
  // 문자 단위 세트로 Jaccard 계산
  const setA = new Set(na.split(''))
  const setB = new Set(nb.split(''))
  
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  
  return intersection.size / union.size
}

/**
 * 두 좌표 간 거리 계산 (Haversine formula, 미터 단위)
 */
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}

// ============================================
// Helpers
// ============================================

/**
 * 소스별로 후보 그룹화
 */
function groupBySource(candidates: PlaceCandidate[]): Record<PlaceProvider, PlaceCandidate[]> {
  const groups: Record<PlaceProvider, PlaceCandidate[]> = {
    naver: [],
    kakao: [],
    google: [],
    manual: [],
  }
  
  for (const candidate of candidates) {
    const provider: PlaceProvider = 
      candidate.source === 'naver_local_api' ? 'naver' :
      candidate.source === 'kakao_local_api' ? 'kakao' :
      candidate.source === 'google_places_api' ? 'google' : 'manual'
    
    groups[provider].push(candidate)
  }
  
  return groups
}

/**
 * Canonical ID 생성 (deterministic)
 * 이름 + 주소 기반 해시
 */
function createCanonicalId(candidate: PlaceCandidate): string {
  const key = `${candidate.name}|${candidate.roadAddress || candidate.address}`
  // 간단한 해시 생성
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `place-${Math.abs(hash).toString(36)}`
}

// ============================================
// Utility Functions
// ============================================

/**
 * CanonicalPlace를 NormalizedPlaceProfile로 변환
 * (기존 코드 호환성)
 */
export function toNormalizedProfile(place: CanonicalPlace): import('@/types').NormalizedPlaceProfile {
  return {
    name: place.name,
    address: place.address.full,
    category: place.category.secondary || place.category.primary,
    phone: place.contact.phone,
    coordinates: place.coordinates,
    sources: Object.keys(place.sources) as ('google' | 'naver' | 'manual')[],
    normalizedAt: place.normalizedAt,
  }
}

/**
 * CanonicalPlace 요약 정보 생성
 */
export function summarizeCanonicalPlace(place: CanonicalPlace): {
  name: string
  address: string
  category: string
  sourceSummary: string
} {
  const sources: string[] = []
  if (place.sources.naver) sources.push('Naver')
  if (place.sources.kakao) sources.push('Kakao')
  if (place.sources.google) sources.push('Google')
  
  return {
    name: place.name,
    address: place.address.full,
    category: place.category.full || place.category.primary,
    sourceSummary: sources.join(' + ') || 'Manual',
  }
}
