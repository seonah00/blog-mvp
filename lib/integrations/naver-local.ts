/**
 * @deprecated Use lib/server/naver-search.ts instead
 * 
 * This file is kept for backward compatibility.
 * It re-exports the legacy implementation.
 * 
 * Migration path:
 * - Old: import { searchNaverLocal } from '@/lib/integrations/naver-local'
 * - New: import { searchNaverLocal } from '@/lib/server/naver-search'
 * 
 * The new implementation adds:
 * - Naver Blog Search support
 * - Naver Web Search support
 * - Better error handling
 */

import type { PlaceCandidate } from '@/types'

const NAVER_LOCAL_API_BASE = 'https://openapi.naver.com/v1/search/local.json'

interface NaverLocalItem {
  title: string
  link: string
  category: string
  description: string
  telephone: string
  address: string
  roadAddress: string
  mapx: string
  mapy: string
}

/**
 * @deprecated Use searchNaverLocal from lib/server/naver-search.ts
 * 
 * Search local places using Naver Local Search API
 */
export async function searchNaverLocal(
  query: string,
  options?: {
    display?: number
    sort?: 'random' | 'comment'
  }
): Promise<PlaceCandidate[]> {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    console.warn('[Naver Local Legacy] Missing API credentials')
    return []
  }

  const { display = 5, sort = 'random' } = options || {}
  
  const url = new URL(NAVER_LOCAL_API_BASE)
  url.searchParams.set('query', query)
  url.searchParams.set('display', display.toString())
  url.searchParams.set('sort', sort)

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`Naver Local API error: ${response.status}`)
    }

    const data = await response.json()
    const items: NaverLocalItem[] = data.items || []

    return items.map((item, index): PlaceCandidate => {
      // Remove HTML tags from title
      const cleanTitle = item.title
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')

      return {
        id: `naver-${index}-${Date.now()}`,
        source: 'naver_local_api',
        externalId: item.link,
        name: cleanTitle,
        category: item.category,
        address: item.address,
        roadAddress: item.roadAddress,
        phone: item.telephone,
        mapUrl: item.link,
        description: item.description,
      }
    })

  } catch (error) {
    console.error('[Naver Local Legacy] Search failed:', error)
    throw error
  }
}
