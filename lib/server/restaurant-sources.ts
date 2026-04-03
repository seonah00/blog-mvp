/**
 * Restaurant Review Sources Filtering
 * 
 * Server-side only
 */

import type { RestaurantSourceDocument } from '@/types/restaurant-search'
import { searchNaverBlog, searchNaverWeb } from './naver-search'

export async function collectRestaurantSources(
  placeName: string,
  region?: string,
  options: {
    maxBlogResults?: number
    maxWebResults?: number
  } = {}
): Promise<{
  sources: RestaurantSourceDocument[]
  rejected: RestaurantSourceDocument[]
}> {
  const { maxBlogResults = 10, maxWebResults = 5 } = options
  
  const query = region ? `${placeName} ${region}` : placeName
  
  const [blogResults, webResults] = await Promise.allSettled([
    searchNaverBlog(query, { display: maxBlogResults, sort: 'sim' }),
    searchNaverWeb(`${placeName} ${region || ''} 후기 맛집`, { display: maxWebResults }),
  ])
  
  const sources: RestaurantSourceDocument[] = []
  const rejected: RestaurantSourceDocument[] = []
  
  if (blogResults.status === 'fulfilled') {
    for (const item of blogResults.value) {
      const source: RestaurantSourceDocument = {
        sourceId: `naver-blog-${Buffer.from(item.url).toString('base64').slice(0, 16)}`,
        provider: 'naver_blog',
        title: item.title,
        url: item.url,
        snippet: item.snippet,
        publishedAt: item.publishedAt,
        sourceName: item.blogName,
        relevanceScore: 0.5,
        matchedPlaceName: checkPlaceNameMatch(placeName, item.title + item.snippet),
        matchedRegion: region ? checkRegionMatch(region, item.snippet) : true,
        isOfficial: false,
        warnings: [],
      }
      
      const filterResult = filterSource(source, placeName, region)
      if (filterResult.accepted) {
        sources.push({ ...source, relevanceScore: filterResult.score })
      } else {
        rejected.push({ ...source, warnings: filterResult.reason ? [filterResult.reason] : [] })
      }
    }
  }
  
  if (webResults.status === 'fulfilled') {
    for (const item of webResults.value) {
      const source: RestaurantSourceDocument = {
        sourceId: `naver-web-${Buffer.from(item.url).toString('base64').slice(0, 16)}`,
        provider: 'naver_web',
        title: item.title,
        url: item.url,
        snippet: item.snippet,
        relevanceScore: 0.3,
        matchedPlaceName: checkPlaceNameMatch(placeName, item.title + item.snippet),
        matchedRegion: region ? checkRegionMatch(region, item.snippet) : true,
        isOfficial: checkOfficialSite(item.url),
        warnings: [],
      }
      
      const filterResult = filterSource(source, placeName, region)
      if (filterResult.accepted) {
        sources.push({ ...source, relevanceScore: filterResult.score })
      } else {
        rejected.push({ ...source, warnings: filterResult.reason ? [filterResult.reason] : [] })
      }
    }
  }
  
  sources.sort((a, b) => b.relevanceScore - a.relevanceScore)
  
  return { sources, rejected }
}

function filterSource(
  source: RestaurantSourceDocument,
  placeName: string,
  region?: string
): { accepted: boolean; score: number; reason?: string } {
  if (!source.matchedPlaceName) {
    return { accepted: false, score: 0, reason: '상호명 불일치' }
  }
  
  if (region && !source.matchedRegion) {
    return { accepted: false, score: 0, reason: '지역 불일치' }
  }
  
  if (!source.snippet || source.snippet.length < 20) {
    return { accepted: false, score: 0, reason: '내용 부족' }
  }
  
  if (isAdvertisementSuspicious(source)) {
    return { accepted: false, score: 0, reason: '광고성 의심' }
  }
  
  let score = source.relevanceScore
  
  if (source.matchedPlaceName) score += 0.3
  if (source.matchedRegion) score += 0.2
  if (source.isOfficial) score += 0.2
  
  return { accepted: true, score: Math.min(1, score) }
}

function checkPlaceNameMatch(placeName: string, text: string): boolean {
  const normalizedPlace = placeName.toLowerCase().replace(/\s/g, '')
  const normalizedText = text.toLowerCase().replace(/\s/g, '')
  
  if (normalizedText.includes(normalizedPlace)) return true
  
  const placeParts = normalizedPlace.split(/[·,\s]/)
  let matchCount = 0
  for (const part of placeParts) {
    if (part.length >= 2 && normalizedText.includes(part)) {
      matchCount++
    }
  }
  
  return matchCount >= Math.ceil(placeParts.length / 2)
}

function checkRegionMatch(region: string, text: string): boolean {
  const normalizedRegion = region.toLowerCase().replace(/\s/g, '')
  const normalizedText = text.toLowerCase().replace(/\s/g, '')
  
  return normalizedText.includes(normalizedRegion)
}

function checkOfficialSite(url: string): boolean {
  const officialPatterns = [
    /instagram\.com/,
    /facebook\.com/,
    /naver\.me\/[a-zA-Z0-9]+/,
    /place\.naver\.com/,
    /map\.kakao\.com/,
  ]
  
  return officialPatterns.some(pattern => pattern.test(url))
}

function isAdvertisementSuspicious(source: RestaurantSourceDocument): boolean {
  const text = (source.title + ' ' + source.snippet).toLowerCase()
  
  const adKeywords = [
    '제휴', '협찬', '광고', '원고료', '체험단',
    '업체로부터', '소정의', '수수료',
  ]
  
  return adKeywords.some(keyword => text.includes(keyword))
}
