/**
 * Naver Local Search API Integration
 * 
 * 공식 Naver 지역 검색 API wrapper
 * @see https://developers.naver.com/docs/serviceapi/search/local/local.md
 * 
 * ⚠️ Policy: 웹 크롤링 금지. 공식 API만 사용.
 * ⚠️ Do not implement web scraping here.
 */

import type { PlaceCandidate } from '@/types'
import { isNaverLocalAvailable, getServerEnv } from './env'

/**
 * Naver Local Search API 응답 타입
 */
interface NaverLocalItem {
  title: string
  link: string
  category: string
  description: string
  telephone: string
  address: string
  roadAddress: string
  mapx: string // 좌표 (카텍 좌표계)
  mapy: string
}

interface NaverLocalResponse {
  lastBuildDate: string
  total: number
  start: number
  display: number
  items: NaverLocalItem[]
}

/**
 * HTML 태그 제거 헬퍼
 * Naver 응답의 title에 <b> 태그가 포함될 수 있음
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * 카텍 좌표를 WGS84 위경도로 변환 (간단 approximation)
 * 정확한 변환을 위해서는 전용 라이브러리 권장
 */
function convertKatechToWGS84(mapx: string, mapy: string): { lat: number; lng: number } | undefined {
  try {
    // 카텍 좌표는 정수로 표현 (예: 1271234567 = 127.1234567)
    const x = parseInt(mapx, 10) / 10000000
    const y = parseInt(mapy, 10) / 10000000
    
    // TODO: 정확한 좌표 변환 필요 시 proj4js 등 사용
    // 현재는 rough approximation
    return { lat: y, lng: x }
  } catch {
    return undefined
  }
}

/**
 * Naver Local Search
 * 
 * @param query - 검색어 (예: "강남 파스타")
 * @param options - 검색 옵션
 * @returns PlaceCandidate[]
 * 
 * TODO: 정렬/검색 옵션 확장 - sort 파라미터 활용
 * TODO: 링크 후속 활용 정책 검토 - link 필드 사용 방식
 */
export async function searchNaverLocal(
  query: string,
  options?: {
    sort?: 'random' | 'comment'
    display?: number
  }
): Promise<PlaceCandidate[]> {
  if (!isNaverLocalAvailable()) {
    console.log('[Naver Local] API credentials not available, skipping')
    return []
  }

  const display = options?.display ?? 5
  const sort = options?.sort ?? 'random'

  // Naver Local Search API endpoint
  const url = new URL('https://openapi.naver.com/v1/search/local.json')
  url.searchParams.set('query', query)
  url.searchParams.set('display', display.toString())
  url.searchParams.set('start', '1')
  url.searchParams.set('sort', sort === 'comment' ? 'comment' : 'random')

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': getServerEnv().NAVER_CLIENT_ID!,
        'X-Naver-Client-Secret': getServerEnv().NAVER_CLIENT_SECRET!,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Naver Local] HTTP error:', response.status, errorText)
      return []
    }

    const data: NaverLocalResponse = await response.json()

    if (!data.items || data.items.length === 0) {
      return []
    }

    // 정규화
    const candidates: PlaceCandidate[] = data.items.map((item, index) => {
      const coords = convertKatechToWGS84(item.mapx, item.mapy)
      
      return {
        id: `naver-${index}-${Date.now()}`,
        source: 'naver_local_api',
        externalId: item.link, // Naver는 별도 ID 없음, link 사용
        name: stripHtml(item.title),
        category: item.category.split('>').pop()?.trim() || item.category,
        address: item.address,
        roadAddress: item.roadAddress,
        latitude: coords?.lat,
        longitude: coords?.lng,
        rating: undefined, // Naver Local API는 rating 미제공
        reviewCount: undefined, // Naver Local API는 reviewCount 미제공
        phone: item.telephone || undefined,
        websiteUrl: item.link || undefined,
        description: item.description || undefined,
        mapUrl: item.link,
      }
    })

    console.log(`[Naver Local] Found ${candidates.length} results`)
    return candidates

  } catch (error) {
    console.error('[Naver Local] Request failed:', error)
    return []
  }
}

/**
 * 카테고리 정리 헬퍼
 */
function formatCategory(category: string): string {
  // Naver category format: "음식점>양식>파스타전문"
  const parts = category.split('>')
  if (parts.length >= 2) {
    return `${parts[parts.length - 2].trim()} > ${parts[parts.length - 1].trim()}`
  }
  return category.trim()
}
