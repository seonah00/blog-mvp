/**
 * Google Places API (New) Server Utilities
 * 
 * Text Search + Place Details with FieldMask
 * Server-side only - canonical implementation
 * 
 * Replaces: lib/integrations/google-places.ts (legacy)
 */

import { GOOGLE_MAPS_API_KEY } from '@/lib/integrations/env'

const GOOGLE_PLACES_BASE = 'https://places.googleapis.com/v1'

export interface GooglePlaceSearchResult {
  placeId: string
  name: string
  formattedAddress: string
  primaryType: string
  rating?: number
  userRatingCount?: number
  lat: number
  lng: number
  businessStatus?: string
}

export interface GooglePlaceDetailsResult {
  placeId: string
  name: string
  formattedAddress: string
  primaryType: string
  rating?: number
  userRatingCount?: number
  lat: number
  lng: number
  businessStatus?: string
  websiteUri?: string
  nationalPhoneNumber?: string
  openingHours?: { weekdayDescriptions: string[] }
  googleMapsUri: string
  reviews?: Array<{
    text?: { text: string; languageCode: string }
    rating: number
    publishTime: string
  }>
}

/**
 * Google Places Text Search (New API)
 * FieldMask로 비용 최적화
 */
export async function searchGooglePlacesText(
  query: string,
  options: {
    regionBias?: string
    maxResults?: number
  } = {}
): Promise<GooglePlaceSearchResult[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY must be set')
  }

  const { regionBias = 'kr', maxResults = 10 } = options

  const url = `${GOOGLE_PLACES_BASE}/places:searchText`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.primaryType,places.rating,places.userRatingCount,places.location,places.businessStatus',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: maxResults,
      regionCode: regionBias,
    }),
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Google Places Text Search error: ${JSON.stringify(errorData)}`)
  }

  const data = await response.json() as {
    places: Array<{
      id: string
      displayName: { text: string; languageCode: string }
      formattedAddress: string
      primaryType: string
      rating?: number
      userRatingCount?: number
      location: { latitude: number; longitude: number }
      businessStatus?: string
    }>
  }

  return (data.places || []).map(place => ({
    placeId: place.id,
    name: place.displayName.text,
    formattedAddress: place.formattedAddress,
    primaryType: place.primaryType,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    lat: place.location.latitude,
    lng: place.location.longitude,
    businessStatus: place.businessStatus,
  }))
}

/**
 * Google Place Details (New API)
 * FieldMask로 필요한 필드만 선택
 */
export async function getGooglePlaceDetails(
  placeId: string,
  options: {
    includeReviews?: boolean
    includeOpeningHours?: boolean
    includeWebsite?: boolean
    includePhone?: boolean
  } = {}
): Promise<GooglePlaceDetailsResult> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY must be set')
  }

  const {
    includeReviews = false,
    includeOpeningHours = true,
    includeWebsite = true,
    includePhone = true,
  } = options

  const fields = [
    'id',
    'displayName',
    'formattedAddress',
    'primaryType',
    'rating',
    'userRatingCount',
    'location',
    'businessStatus',
    'googleMapsUri',
  ]

  if (includeOpeningHours) fields.push('regularOpeningHours')
  if (includeWebsite) fields.push('websiteUri')
  if (includePhone) fields.push('nationalPhoneNumber')
  if (includeReviews) fields.push('reviews')

  const url = `${GOOGLE_PLACES_BASE}/places/${placeId}`

  const response = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': fields.join(','),
    },
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Google Place Details error: ${JSON.stringify(errorData)}`)
  }

  const place = await response.json()

  return {
    placeId: place.id,
    name: place.displayName?.text,
    formattedAddress: place.formattedAddress,
    primaryType: place.primaryType,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    lat: place.location?.latitude,
    lng: place.location?.longitude,
    businessStatus: place.businessStatus,
    websiteUri: place.websiteUri,
    nationalPhoneNumber: place.nationalPhoneNumber,
    openingHours: place.regularOpeningHours,
    googleMapsUri: place.googleMapsUri,
    reviews: place.reviews,
  }
}
