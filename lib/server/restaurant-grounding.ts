/**
 * Restaurant Grounding Logic
 * 
 * Server-side only - shared between Server Actions and API Routes
 */

import type { 
  RestaurantGroundingResult, 
  RestaurantFactualData,
  RestaurantCandidate 
} from '@/types/restaurant-search'
import { getGooglePlaceDetails } from './google-places'
import { collectRestaurantSources } from './restaurant-sources'

export interface GroundingInput {
  candidateId?: string
  placeName: string
  region?: string
  googlePlaceId?: string
  candidates?: RestaurantCandidate[]
}

export async function getRestaurantGrounding(
  input: GroundingInput
): Promise<RestaurantGroundingResult> {
  const { placeName, region, googlePlaceId, candidates = [] } = input
  
  const warnings: string[] = []
  
  // 1. Fetch factual data from Google Places if available
  let factualData: RestaurantFactualData = {
    name: placeName,
  }
  
  if (googlePlaceId) {
    try {
      const details = await getGooglePlaceDetails(googlePlaceId, {
        includeReviews: false,
        includeOpeningHours: true,
        includeWebsite: true,
        includePhone: true,
      })
      
      factualData = {
        name: details.name,
        roadAddress: details.formattedAddress,
        category: details.primaryType,
        rating: details.rating,
        reviewCount: details.userRatingCount,
        businessStatus: details.businessStatus as RestaurantFactualData['businessStatus'],
        websiteUrl: details.websiteUri,
        openingHours: details.openingHours?.weekdayDescriptions,
        googleMapsUrl: details.googleMapsUri,
        phone: details.nationalPhoneNumber,
        lat: details.lat,
        lng: details.lng,
      }
    } catch (err) {
      console.error('[Grounding] Google Place Details failed:', err)
      warnings.push('Google 상세 정보를 가져오지 못했습니다.')
    }
  }
  
  // 2. Collect review sources
  const { sources: reviewSources, rejected: rejectedSources } = await collectRestaurantSources(
    placeName,
    region,
    { maxBlogResults: 10, maxWebResults: 5 }
  ).catch(err => {
    console.error('[Grounding] Source collection failed:', err)
    warnings.push('후기 소스 수집에 일부 실패했습니다.')
    return { sources: [], rejected: [] }
  })
  
  // 3. Calculate confidence score
  let confidenceScore = 50
  if (googlePlaceId) confidenceScore += 20
  confidenceScore += Math.min(20, reviewSources.length * 2)
  if (region && factualData.roadAddress?.includes(region)) confidenceScore += 10
  
  if (factualData.businessStatus === 'CLOSED_PERMANENTLY') {
    confidenceScore = 0
    warnings.push('폐업된 매장으로 확인됩니다.')
  } else if (factualData.businessStatus === 'CLOSED_TEMPORARILY') {
    confidenceScore -= 20
    warnings.push('임시 휴업 중인 매장입니다.')
  }
  
  confidenceScore = Math.max(0, Math.min(100, confidenceScore))
  
  // Find selected candidate if provided
  const selectedCandidate = candidates.find(c => c.id === input.candidateId) || null
  
  return {
    selectedCandidate,
    candidates,
    factualData,
    reviewSources,
    rejectedSources,
    confidenceScore,
    warnings,
    compliance: {
      attributionRequired: !!googlePlaceId,
      googleMapsAttributionRequired: !!googlePlaceId,
      googleAttributionText: googlePlaceId ? 'Google Maps' : undefined,
    },
  }
}
