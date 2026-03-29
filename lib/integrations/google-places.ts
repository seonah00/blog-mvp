/**
 * Google Places API Integration
 * 
 * 공식 Google Places Text Search API wrapper
 * @see https://developers.google.com/maps/documentation/places/web-service/text-search
 * 
 * ⚠️ Policy: 웹 크롤링 금지. 공식 API만 사용.
 * ⚠️ Do not implement web scraping here.
 */

import type { PlaceCandidate } from '@/types'
import { isGooglePlacesAvailable, getServerEnv } from './env'

/**
 * Google Places API 응답 타입
 */
interface GooglePlaceResult {
  place_id: string
  name: string
  formatted_address: string
  types?: string[]
  rating?: number
  user_ratings_total?: number
  geometry?: {
    location: {
      lat: number
      lng: number
    }
  }
  // website, phone 등은 Place Details API에서 제공
  // TODO: 상세 Place Details 확장 시 추가
}

interface GooglePlacesResponse {
  results: GooglePlaceResult[]
  status: string
  error_message?: string
}

/**
 * HTML 태그 제거 헬퍼
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Google Places Text Search
 * 
 * @param query - 검색어 (예: "강남 파스타")
 * @param options - 검색 옵션
 * @returns PlaceCandidate[]
 * 
 * TODO: Field mask 최소화 재검토 - 필요한 필드만 요청하도록 최적화
 * TODO: 실제 billing/quotas 고려 - 요청당 비용 및 일일 한도 확인
 */
export async function searchGooglePlaces(
  query: string,
  options?: { 
    region?: string
    maxResults?: number
  }
): Promise<PlaceCandidate[]> {
  if (!isGooglePlacesAvailable()) {
    console.log('[Google Places] API key not available, skipping')
    return []
  }

  const searchQuery = options?.region ? `${options.region} ${query}` : query
  const maxResults = options?.maxResults ?? 5

  // Google Places Text Search API endpoint
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', searchQuery)
  url.searchParams.set('key', getServerEnv().GOOGLE_MAPS_API_KEY!)
  url.searchParams.set('language', 'ko')

  // TODO: 추가 파라미터 (region, location 등) 확장 가능

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[Google Places] HTTP error:', response.status)
      return []
    }

    const data: GooglePlacesResponse = await response.json()

    if (data.status !== 'OK') {
      console.error('[Google Places] API error:', data.status, data.error_message)
      return []
    }

    // 정규화
    const candidates: PlaceCandidate[] = data.results
      .slice(0, maxResults)
      .map((place) => ({
        id: `google-${place.place_id}`,
        source: 'google_places_api',
        externalId: place.place_id,
        name: stripHtml(place.name),
        category: place.types?.[0] ? formatCategory(place.types[0]) : undefined,
        address: place.formatted_address,
        roadAddress: place.formatted_address,
        latitude: place.geometry?.location.lat,
        longitude: place.geometry?.location.lng,
        rating: place.rating,
        reviewCount: place.user_ratings_total,
        phone: undefined, // Place Details API 필요
        websiteUrl: undefined, // Place Details API 필요
        description: undefined,
        mapUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        // TODO: 상세 Place Details 확장 위치
        // 추가 필드는 Place Details API 호출 시 채워짐
      }))

    console.log(`[Google Places] Found ${candidates.length} results`)
    return candidates

  } catch (error) {
    console.error('[Google Places] Request failed:', error)
    return []
  }
}

/**
 * Google Place Details (확장용)
 * 
 * TODO: 상세 정보(phone, website, opening_hours 등)가 필요할 때 구현
 * 현재는 검색 결과에서 기본 정볼만 사용
 */
export async function getGooglePlaceDetails(
  placeId: string
): Promise<Partial<PlaceCandidate>> {
  if (!isGooglePlacesAvailable()) {
    return {}
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('key', getServerEnv().GOOGLE_MAPS_API_KEY!)
  url.searchParams.set('language', 'ko')
  url.searchParams.set('fields', 'formatted_phone_number,website,opening_hours,photos')

  try {
    const response = await fetch(url.toString())
    if (!response.ok) return {}

    const data = await response.json()
    if (data.status !== 'OK') return {}

    const result = data.result

    return {
      phone: result.formatted_phone_number,
      websiteUrl: result.website,
      // opening_hours 등 추가 가능
    }
  } catch (error) {
    console.error('[Google Places] Details request failed:', error)
    return {}
  }
}

/**
 * Google types를 한국어 카테고리로 변환
 */
function formatCategory(type: string): string {
  const categoryMap: Record<string, string> = {
    'restaurant': '음식점',
    'cafe': '카페',
    'bar': '바',
    'bakery': '베이커리',
    'meal_takeaway': '테이크아웃',
    'meal_delivery': '배달음식점',
    'food': '음식',
    'point_of_interest': '관심지',
    'establishment': '시설',
  }

  return categoryMap[type] || type.replace(/_/g, ' ')
}
