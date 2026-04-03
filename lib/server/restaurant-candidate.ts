/**
 * Restaurant Candidate Scoring & Normalization
 * 
 * Server-side only
 */

import type { RestaurantCandidate } from '@/types/restaurant-search'

export function normalizePlaceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[점|본점|지점|직영점|가맹점]/g, '')
    .replace(/[^\w가-힣]/g, '')
}

export function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/(도|시|구|군|읍|면|동|리|가|로|길)\s*/g, '$1 ')
    .trim()
}

export function calculateSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().replace(/\s/g, '')
  const s2 = b.toLowerCase().replace(/\s/g, '')
  
  if (s1 === s2) return 1.0
  if (s1.length === 0 || s2.length === 0) return 0.0
  
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

export function isRegionInAddress(region: string, address: string): boolean {
  if (!region || !address) return false
  
  const normalizedRegion = region.toLowerCase().replace(/\s/g, '')
  const normalizedAddress = address.toLowerCase().replace(/\s/g, '')
  
  return normalizedAddress.includes(normalizedRegion)
}

export function scoreRestaurantCandidate(
  candidate: RestaurantCandidate,
  queryName: string,
  queryRegion?: string
): { score: number; matchReasons: string[]; warnings: string[] } {
  let score = 0
  const matchReasons: string[] = []
  const warnings: string[] = []
  
  const normalizedQueryName = normalizePlaceName(queryName)
  const normalizedCandidateName = normalizePlaceName(candidate.name)
  
  const nameSimilarity = calculateSimilarity(normalizedQueryName, normalizedCandidateName)
  score += nameSimilarity * 40
  
  if (nameSimilarity === 1.0) {
    matchReasons.push('정확한 상호명 일치')
  } else if (nameSimilarity > 0.8) {
    matchReasons.push('유사 상호명')
  } else if (nameSimilarity < 0.5) {
    warnings.push('상호명 불일치 의심')
  }
  
  if (queryRegion && candidate.roadAddress) {
    if (isRegionInAddress(queryRegion, candidate.roadAddress)) {
      score += 30
      matchReasons.push('지역 일치')
    } else if (candidate.address && isRegionInAddress(queryRegion, candidate.address)) {
      score += 25
      matchReasons.push('지번 주소 지역 일치')
    } else {
      warnings.push('지역 불일치')
    }
  }
  
  if (candidate.roadAddress || candidate.address) {
    score += 10
    matchReasons.push('주소 정보 있음')
  }
  
  if (candidate.lat && candidate.lng) {
    score += 10
  }
  
  if (candidate.rating && candidate.reviewCount) {
    score += Math.min(10, candidate.rating * 2)
  }
  
  if (candidate.businessStatus === 'CLOSED_PERMANENTLY') {
    score -= 50
    warnings.push('폐업 확인됨')
  } else if (candidate.businessStatus === 'CLOSED_TEMPORARILY') {
    score -= 30
    warnings.push('임시 휴업 중')
  }
  
  if (candidate.googlePlaceId) {
    score += 10
    matchReasons.push('Google Places 확인됨')
  }
  
  score = Math.max(0, Math.min(100, score))
  
  return { score, matchReasons, warnings }
}

export function detectHomonymConflict(
  candidates: RestaurantCandidate[]
): RestaurantCandidate[] {
  const nameGroups = new Map<string, RestaurantCandidate[]>()
  
  for (const candidate of candidates) {
    const normalizedName = normalizePlaceName(candidate.name)
    if (!nameGroups.has(normalizedName)) {
      nameGroups.set(normalizedName, [])
    }
    nameGroups.get(normalizedName)!.push(candidate)
  }
  
  return candidates.map(candidate => {
    const normalizedName = normalizePlaceName(candidate.name)
    const group = nameGroups.get(normalizedName)!
    
    if (group.length > 1) {
      return {
        ...candidate,
        warnings: [
          ...candidate.warnings,
          `동명 매장 ${group.length}개 발견 - 지역 확인 필요`,
        ],
      }
    }
    
    return candidate
  })
}
