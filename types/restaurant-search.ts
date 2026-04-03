/**
 * Restaurant Search Types
 * 
 * Naver + Google Places 기반 검색/그라울딩 타입
 */

export type ExternalSearchProvider = 
  | 'google_places' 
  | 'naver_local' 
  | 'naver_blog' 
  | 'naver_web' 
  | 'official'

export type RestaurantBusinessStatus = 
  | 'OPERATIONAL' 
  | 'CLOSED_TEMPORARILY' 
  | 'CLOSED_PERMANENTLY'

export interface RestaurantCandidate {
  id: string
  provider: 'google_places' | 'naver_local'
  externalId: string
  googlePlaceId?: string
  name: string
  normalizedName: string
  address?: string
  roadAddress?: string
  regionText?: string
  category?: string
  lat?: number
  lng?: number
  rating?: number
  reviewCount?: number
  businessStatus?: RestaurantBusinessStatus
  openingHours?: string[]
  websiteUrl?: string
  phone?: string
  googleMapsUrl?: string
  naverMapUrl?: string
  score: number
  matchReasons: string[]
  warnings: string[]
  rawData?: Record<string, unknown>
}

export interface RestaurantSourceDocument {
  sourceId: string
  provider: ExternalSearchProvider
  title: string
  url: string
  snippet?: string
  publishedAt?: string
  sourceName?: string
  relevanceScore: number
  matchedPlaceName: boolean
  matchedRegion: boolean
  isOfficial: boolean
  warnings: string[]
}

export interface RestaurantFactualData {
  name?: string
  address?: string
  roadAddress?: string
  category?: string
  rating?: number
  reviewCount?: number
  businessStatus?: RestaurantBusinessStatus
  websiteUrl?: string
  openingHours?: string[]
  googleMapsUrl?: string
  phone?: string
  lat?: number
  lng?: number
}

export interface RestaurantGroundingResult {
  selectedCandidate: RestaurantCandidate | null
  candidates: RestaurantCandidate[]
  factualData: RestaurantFactualData
  reviewSources: RestaurantSourceDocument[]
  rejectedSources: RestaurantSourceDocument[]
  confidenceScore: number
  warnings: string[]
  compliance: {
    attributionRequired: boolean
    googleMapsAttributionRequired: boolean
    googleAttributionText?: string
  }
}

// Server Action return types (기존 타입과 호환)
export interface SearchCandidatesResult {
  success: boolean
  candidates: RestaurantCandidate[]
  queryUsed: string
  warnings: string[]
  errors: string[]
  sources: {
    google: number
    naver: number
  }
}

export interface GetGroundingResult {
  success: boolean
  grounding?: RestaurantGroundingResult
  error?: string
  warnings: string[]
}
