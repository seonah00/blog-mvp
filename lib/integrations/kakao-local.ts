/**
 * Kakao Local Search API Integration
 * 
 * 공식 Kakao 지역/키워드 검색 API wrapper
 * @see https://developers.kakao.com/docs/latest/ko/local/dev-guide
 * 
 * ⚠️ Policy: 웹 크롤링 금지. 공식 API만 사용.
 * ⚠️ Do not implement web scraping here.
 */

import type { PlaceCandidate } from '@/types'
import { isKakaoLocalAvailable, getServerEnv } from './env'

// ============================================
// Kakao API Response Types
// ============================================

interface KakaoPlaceDocument {
  /** 장소 ID */
  id: string
  /** 장소명 */
  place_name: string
  /** 카테고리 */
  category_name: string
  /** 카테고리 그룹 코드 */
  category_group_code: string
  /** 카테고리 그룹명 */
  category_group_name: string
  /** 전화번호 */
  phone: string
  /** 전체 주소 */
  address_name: string
  /** 도로명 주소 */
  road_address_name: string
  /** X좌표 (경도) */
  x: string
  /** Y좌표 (위도) */
  y: string
  /** 장소 URL */
  place_url: string
  /** 거리 (미터, 좌표 검색 시에만) */
  distance?: string
}

interface KakaoMeta {
  /** 검색어에 검색된 문서 수 */
  total_count: number
  /** 노출 가능한 문서 수 */
  pageable_count: number
  /** 현재 페이지가 마지막 페이지인지 여부 */
  is_end: boolean
  /** 같은 장소 집계 여부 (안씀) */
  same_name?: {
    region: string[]
    keyword: string
    selected_region: string
  }
}

interface KakaoLocalResponse {
  meta: KakaoMeta
  documents: KakaoPlaceDocument[]
}

// ============================================
// Search Options
// ============================================

export interface KakaoSearchOptions {
  /** 검색 결과 정렬 방식 */
  sort?: 'accuracy' | 'distance'
  /** 결과 페이지 번호 (1-45) */
  page?: number
  /** 한 페이지에 보여질 문서 수 (1-15) */
  size?: number
  /** X 좌표 (경도) - 거리순 정렬 시 사용 */
  x?: string
  /** Y 좌표 (위도) - 거리순 정렬 시 사용 */
  y?: string
  /** 검색 반경 (미터) - 거리순 정렬 시 사용 */
  radius?: number
  /** 카테고리 그룹 코드 필터 */
  categoryGroupCode?: string
}

// ============================================
// Category Group Codes (Kakao)
// ============================================

export const KAKAO_CATEGORY_CODES = {
  FOOD: 'FD6',           // 음식점
  CAFE: 'CE7',           // 카페
  STORE: 'CS2',          // 편의점
  // 필요시 추가
} as const

// ============================================
// Main Search Function
// ============================================

/**
 * Kakao Local Keyword Search
 * 
 * @param query - 검색어 (예: "강남 파스타")
 * @param options - 검색 옵션
 * @returns PlaceCandidate[]
 * 
 * TODO: 좌표 기반 검색 확장 - 주변 장소 검색 지원
 * TODO: 카테고리 필터링 확장 - FD6/CE7 등 선택적 필터
 */
export async function searchKakaoLocal(
  query: string,
  options?: KakaoSearchOptions
): Promise<PlaceCandidate[]> {
  if (!isKakaoLocalAvailable()) {
    console.log('[Kakao Local] API key not available, skipping')
    return []
  }

  const size = options?.size ?? 5
  const page = options?.page ?? 1
  const sort = options?.sort ?? 'accuracy'

  // Kakao Local Search API endpoint
  const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json')
  url.searchParams.set('query', query)
  url.searchParams.set('size', size.toString())
  url.searchParams.set('page', page.toString())
  url.searchParams.set('sort', sort)

  // Optional params
  if (options?.categoryGroupCode) {
    url.searchParams.set('category_group_code', options.categoryGroupCode)
  }
  if (options?.x && options?.y) {
    url.searchParams.set('x', options.x)
    url.searchParams.set('y', options.y)
    if (options.radius) {
      url.searchParams.set('radius', options.radius.toString())
    }
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${getServerEnv().KAKAO_REST_API_KEY}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Kakao Local] HTTP error:', response.status, errorText)
      
      // 403 Forbidden - 서비스 비활성화 등의 권한 문제
      if (response.status === 403) {
        console.warn('[Kakao Local] 403 Forbidden - Kakao Local API service may be disabled for this app')
        throw new Error('403: Kakao Local API service disabled')
      }
      
      return []
    }

    const data: KakaoLocalResponse = await response.json()

    if (!data.documents || data.documents.length === 0) {
      return []
    }

    // 정규화
    const candidates: PlaceCandidate[] = data.documents.map((doc) => ({
      id: `kakao-${doc.id}`,
      source: 'kakao_local_api' as const,
      externalId: doc.id,
      name: doc.place_name,
      category: formatCategory(doc.category_name),
      address: doc.address_name,
      roadAddress: doc.road_address_name || doc.address_name,
      latitude: parseFloat(doc.y) || undefined,
      longitude: parseFloat(doc.x) || undefined,
      rating: undefined, // Kakao API는 rating 미제공
      reviewCount: undefined, // Kakao API는 reviewCount 미제공
      phone: doc.phone || undefined,
      websiteUrl: doc.place_url || undefined,
      description: undefined,
      mapUrl: doc.place_url,
    }))

    console.log(`[Kakao Local] Found ${candidates.length} results`)
    return candidates

  } catch (error) {
    console.error('[Kakao Local] Request failed:', error)
    return []
  }
}

// ============================================
// Address to Coordinate Conversion
// ============================================

export interface KakaoAddressDocument {
  /** 전체 주소 */
  address_name: string
  /** X좌표 (경도) */
  x: string
  /** Y좌표 (위도) */
  y: string
  /** 주소 상세 정보 */
  address: {
    address_name: string
    region_1depth_name: string  // 시/도
    region_2depth_name: string  // 구/군
    region_3depth_name: string  // 동/면/읍
    mountain_yn: string
    main_address_no: string
    sub_address_no: string
  }
  /** 도로명 주소 상세 정보 */
  road_address: {
    address_name: string
    region_1depth_name: string
    region_2depth_name: string
    road_name: string
    underground_yn: string
    main_building_no: string
    sub_building_no: string
    building_name: string
    zone_no: string  // 우편번호
  } | null
}

/**
 * 주소를 좌표로 변환
 * 
 * @param address - 변환할 주소
 * @returns 좌표 정보 또는 null
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; region: string } | null> {
  if (!isKakaoLocalAvailable()) {
    return null
  }

  const url = new URL('https://dapi.kakao.com/v2/local/search/address.json')
  url.searchParams.set('query', address)

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${getServerEnv().KAKAO_REST_API_KEY}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[Kakao Geocode] HTTP error:', response.status)
      return null
    }

    const data = await response.json()
    
    if (!data.documents || data.documents.length === 0) {
      return null
    }

    const doc: KakaoAddressDocument = data.documents[0]
    
    return {
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x),
      region: `${doc.address.region_1depth_name} ${doc.address.region_2depth_name}`,
    }
  } catch (error) {
    console.error('[Kakao Geocode] Request failed:', error)
    return null
  }
}

// ============================================
// Coordinate to Region Conversion
// ============================================

export interface KakaoCoordToRegionResult {
  /** 행정동 이름 */
  region: string
  /** 법정동 이름 */
  legalRegion: string
  /** 전체 주소 */
  addressName: string
}

/**
 * 좌표를 행정구역 정보로 변환
 * 
 * @param lat - 위도
 * @param lng - 경도
 * @returns 행정구역 정보 또는 null
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<KakaoCoordToRegionResult | null> {
  if (!isKakaoLocalAvailable()) {
    return null
  }

  const url = new URL('https://dapi.kakao.com/v2/local/geo/coord2regioncode.json')
  url.searchParams.set('x', lng.toString())
  url.searchParams.set('y', lat.toString())

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${getServerEnv().KAKAO_REST_API_KEY}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[Kakao Reverse Geocode] HTTP error:', response.status)
      return null
    }

    const data = await response.json()
    
    if (!data.documents || data.documents.length === 0) {
      return null
    }

    // 행정동 (H) 우선 선택
    const adminDoc = data.documents.find((d: { region_type: string }) => d.region_type === 'H') || data.documents[0]
    const legalDoc = data.documents.find((d: { region_type: string }) => d.region_type === 'B') || adminDoc

    return {
      region: adminDoc.address_name,
      legalRegion: legalDoc.address_name,
      addressName: adminDoc.address_name,
    }
  } catch (error) {
    console.error('[Kakao Reverse Geocode] Request failed:', error)
    return null
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Kakao 카테고리명 정제
 * "음식점 > 양식 > 파스타전문" → "파스타전문"
 */
function formatCategory(categoryName: string): string {
  if (!categoryName) return '음식점'
  
  const parts = categoryName.split('>').map(p => p.trim())
  if (parts.length >= 3) {
    return parts[parts.length - 1]
  }
  return parts[parts.length - 1] || '음식점'
}

/**
 * 음식점/카페 카테고리 필터용 코드 반환
 */
export function getFoodCategoryCode(): string {
  return KAKAO_CATEGORY_CODES.FOOD
}

/**
 * 카페 카테고리 필터용 코드 반환
 */
export function getCafeCategoryCode(): string {
  return KAKAO_CATEGORY_CODES.CAFE
}
