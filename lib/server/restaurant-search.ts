/**
 * Restaurant Search Orchestration
 * 
 * Server-side only - canonical implementation
 * Replaces legacy search logic in features/research/actions.ts
 */

import type { 
  RestaurantCandidate, 
  SearchCandidatesResult 
} from '@/types/restaurant-search'
import { searchGooglePlacesText } from './google-places'
import { searchNaverLocal } from './naver-search'
import { 
  normalizePlaceName, 
  scoreRestaurantCandidate,
  detectHomonymConflict 
} from './restaurant-candidate'

export interface SearchCandidatesInput {
  placeName: string
  region?: string
  category?: string
}

export async function searchRestaurantCandidates(
  input: SearchCandidatesInput
): Promise<SearchCandidatesResult> {
  const { placeName, region, category } = input
  
  if (!placeName?.trim()) {
    return {
      success: false,
      candidates: [],
      queryUsed: '',
      warnings: [],
      errors: ['매장명을 입력해주세요.'],
      sources: { google: 0, naver: 0 },
    }
  }
  
  const queries = buildSearchQueries(placeName, region, category)
  
  const warnings: string[] = []
  const errors: string[] = []
  
  // Parallel search
  const [googleResults, naverResults] = await Promise.allSettled([
    searchGooglePlacesText(queries.google, { regionBias: 'kr', maxResults: 10 })
      .catch(err => {
        console.error('[Search] Google Places failed:', err)
        errors.push(`Google Places: ${err.message}`)
        return []
      }),
    
    searchNaverLocal(queries.naver, { display: 5 })
      .catch(err => {
        console.error('[Search] Naver Local failed:', err)
        errors.push(`Naver Local: ${err.message}`)
        return []
      }),
  ])
  
  const googlePlaces = googleResults.status === 'fulfilled' ? googleResults.value : []
  const naverLocals = naverResults.status === 'fulfilled' ? naverResults.value : []
  
  const candidates: RestaurantCandidate[] = []
  
  // Transform Google results
  for (const place of googlePlaces) {
    const candidate: RestaurantCandidate = {
      id: `google-${place.placeId}`,
      provider: 'google_places',
      externalId: place.placeId,
      googlePlaceId: place.placeId,
      name: place.name,
      normalizedName: normalizePlaceName(place.name),
      roadAddress: place.formattedAddress,
      regionText: region,
      category: place.primaryType,
      lat: place.lat,
      lng: place.lng,
      rating: place.rating,
      reviewCount: place.userRatingCount,
      businessStatus: place.businessStatus as RestaurantCandidate['businessStatus'],
      googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.placeId}`,
      score: 0,
      matchReasons: [],
      warnings: [],
    }
    
    const scoring = scoreRestaurantCandidate(candidate, placeName, region)
    candidate.score = scoring.score
    candidate.matchReasons = scoring.matchReasons
    candidate.warnings = scoring.warnings
    
    candidates.push(candidate)
  }
  
  // Transform Naver results
  for (const place of naverLocals) {
    const candidate: RestaurantCandidate = {
      id: `naver-${Buffer.from(place.mapUrl).toString('base64').slice(0, 16)}`,
      provider: 'naver_local',
      externalId: place.mapUrl,
      name: place.name,
      normalizedName: normalizePlaceName(place.name),
      address: place.address,
      roadAddress: place.roadAddress,
      regionText: region,
      category: place.category,
      lat: place.lat,
      lng: place.lng,
      phone: place.phone,
      naverMapUrl: place.mapUrl,
      score: 0,
      matchReasons: [],
      warnings: [],
    }
    
    const scoring = scoreRestaurantCandidate(candidate, placeName, region)
    candidate.score = scoring.score
    candidate.matchReasons = scoring.matchReasons
    candidate.warnings = scoring.warnings
    
    candidates.push(candidate)
  }
  
  const processedCandidates = detectHomonymConflict(candidates)
  processedCandidates.sort((a, b) => b.score - a.score)
  
  if (processedCandidates.length === 0 && errors.length > 0) {
    return {
      success: false,
      candidates: [],
      queryUsed: queries.primary,
      warnings: ['검색 API 호출에 실패했습니다.'],
      errors,
      sources: { google: 0, naver: 0 },
    }
  }
  
  return {
    success: true,
    candidates: processedCandidates,
    queryUsed: queries.primary,
    warnings: warnings.length > 0 ? warnings : [],
    errors: errors.length > 0 ? errors : [],
    sources: {
      google: googlePlaces.length,
      naver: naverLocals.length,
    },
  }
}

function buildSearchQueries(
  placeName: string, 
  region?: string, 
  category?: string
): { google: string; naver: string; primary: string } {
  const queries: { google: string; naver: string; primary: string } = {
    google: placeName,
    naver: placeName,
    primary: placeName,
  }
  
  if (region) {
    queries.google = `${placeName} ${region}`
    queries.naver = `${placeName} ${region}`
    queries.primary = `${placeName} ${region}`
  }
  
  if (category) {
    queries.naver = `${queries.naver} ${category}`
  }
  
  return queries
}
