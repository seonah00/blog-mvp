/**
 * @deprecated Use lib/server/google-places.ts instead
 * 
 * This file is kept for backward compatibility.
 * It re-exports the legacy implementation.
 * 
 * Migration path:
 * - Old: import { searchGooglePlaces } from '@/lib/integrations/google-places'
 * - New: import { searchGooglePlacesText } from '@/lib/server/google-places'
 * 
 * The new implementation uses Google Places API (New) with FieldMask support.
 */

import type { PlaceCandidate } from '@/types'

const GOOGLE_PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place'

/**
 * @deprecated Use searchGooglePlacesText from lib/server/google-places.ts
 * 
 * Search places using Google Places Text Search API (Legacy)
 * This uses the old Places API endpoint without FieldMask support.
 */
export async function searchGooglePlaces(
  query: string,
  options?: {
    region?: string
    maxResults?: number
  }
): Promise<PlaceCandidate[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.warn('[Google Places Legacy] No API key available')
    return []
  }

  const { region = 'kr', maxResults = 10 } = options || {}
  
  const url = new URL(`${GOOGLE_PLACES_API_BASE}/textsearch/json`)
  url.searchParams.set('query', query)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('region', region)
  url.searchParams.set('language', 'ko')
  
  if (maxResults) {
    // Note: Text Search doesn't support maxResults directly, handled by client
  }

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API returned: ${data.status}`)
    }

    const results = data.results || []
    
    return results.slice(0, maxResults).map((place: {
      place_id: string
      name: string
      formatted_address: string
      types: string[]
      rating?: number
      user_ratings_total?: number
      geometry: { location: { lat: number; lng: number } }
      formatted_phone_number?: string
      website?: string
    }): PlaceCandidate => ({
      id: `google-${place.place_id}`,
      source: 'google_places_api',
      externalId: place.place_id,
      name: place.name,
      category: place.types?.[0] || 'restaurant',
      address: place.formatted_address,
      roadAddress: place.formatted_address,
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      phone: place.formatted_phone_number,
      mapUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      websiteUrl: place.website,
    }))

  } catch (error) {
    console.error('[Google Places Legacy] Search failed:', error)
    throw error
  }
}

/**
 * @deprecated Use getGooglePlaceDetails from lib/server/google-places.ts
 * 
 * Get place details using Google Places Details API (Legacy)
 */
export async function getGooglePlaceDetails(
  placeId: string
): Promise<Partial<PlaceCandidate>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.warn('[Google Places Legacy] No API key available')
    return {}
  }

  const url = new URL(`${GOOGLE_PLACES_API_BASE}/details/json`)
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('language', 'ko')
  url.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,website,opening_hours,rating,reviews')

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      throw new Error(`Google Places Details API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== 'OK') {
      throw new Error(`Google Places Details API returned: ${data.status}`)
    }

    const place = data.result

    return {
      name: place.name,
      address: place.formatted_address,
      roadAddress: place.formatted_address,
      phone: place.formatted_phone_number,
      websiteUrl: place.website,
      rating: place.rating,
    }

  } catch (error) {
    console.error('[Google Places Legacy] Get details failed:', error)
    throw error
  }
}
