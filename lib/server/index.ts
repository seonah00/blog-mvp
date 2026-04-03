/**
 * Server Utilities Public API
 * 
 * Restaurant search domain - canonical implementations
 */

// Search
export { searchRestaurantCandidates } from './restaurant-search'
export type { SearchCandidatesInput } from './restaurant-search'

// Grounding
export { getRestaurantGrounding } from './restaurant-grounding'
export type { GroundingInput } from './restaurant-grounding'

// Raw API clients (when direct access needed)
export { searchGooglePlacesText, getGooglePlaceDetails } from './google-places'
export type { 
  GooglePlaceSearchResult, 
  GooglePlaceDetailsResult 
} from './google-places'

export { searchNaverBlog, searchNaverWeb, searchNaverLocal } from './naver-search'
export type { 
  NaverBlogResult, 
  NaverWebResult, 
  NaverLocalResult 
} from './naver-search'

// Utilities
export {
  normalizePlaceName,
  normalizeAddress,
  calculateSimilarity,
  isRegionInAddress,
  scoreRestaurantCandidate,
  detectHomonymConflict,
} from './restaurant-candidate'

export { collectRestaurantSources } from './restaurant-sources'
