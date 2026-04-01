/**
 * Evidence Aggregator
 * 
 * Perplexity 등 외부 조사 소스의 결과를
 * 표준화된 WebEvidence 형식으로 변환
 */

import type { 
  WebEvidence, 
  EvidenceSourceType,
  EvidenceConfidence,
  EvidenceSummary 
} from '@/types/evidence'
import type { RestaurantResearchResult } from '@/lib/integrations/perplexity'
import { createId } from '@/lib/utils'

// ============================================
// Perplexity to Evidence Conversion
// ============================================

/**
 * Perplexity 조사 결과를 WebEvidence로 변환
 * 
 * @param result - Perplexity 조사 결과
 * @param placeName - 조사 대상 장소 이름
 * @param placeId - 연관된 장소 ID (선택적)
 * @returns WebEvidence
 */
export function perplexityResultToEvidence(
  result: RestaurantResearchResult,
  placeName: string,
  placeId?: string
): WebEvidence {
  const now = new Date().toISOString()
  
  // 신뢰도 결정
  const confidence = determineConfidence(result)
  
  // 사용 정책 결정
  const usagePolicy = determineUsagePolicy(result, confidence)
  
  return {
    id: createId('evidence'),
    type: 'perplexity_search',
    source: {
      type: 'perplexity_search',
      provider: 'perplexity',
      queriedAt: now,
    },
    placeName,
    query: result.query,
    summary: result.summary,
    quotableTexts: result.quotableTexts,
    citations: result.citations,
    extractedKeywords: result.keywords,
    confidence,
    verifiedAt: now,
    usagePolicy,
    limitations: extractLimitations(result),
    createdAt: now,
  }
}

/**
 * 여러 Perplexity 결과를 Evidence 배열로 변환
 */
export function perplexityResultsToEvidences(
  results: RestaurantResearchResult[],
  placeName: string,
  placeId?: string
): WebEvidence[] {
  return results.map(result => perplexityResultToEvidence(result, placeName, placeId))
}

// ============================================
// Confidence Determination
// ============================================

/**
 * 조사 결과의 신뢰도 판단
 * 
 * Policy:
 * - verified: 3개 이상 출처, 명확한 사실
 * - mentioned: 1-2개 출처, 언급 수준
 * - uncertain: 출처 불명확, 추측성 내용
 */
function determineConfidence(result: RestaurantResearchResult): EvidenceConfidence {
  // 출처 수 확인
  const citationCount = result.citations.length
  
  // 추측성 표현 확인
  const content = result.rawContent.toLowerCase()
  const hasSpeculative = 
    content.includes('추측') ||
    content.includes('아마도') ||
    content.includes('확인 필요') ||
    content.includes('불확실') ||
    content.includes('것으로 보임')
  
  // 명확한 불확실성 표시
  if (hasSpeculative || citationCount === 0) {
    return 'uncertain'
  }
  
  // 충분한 출처
  if (citationCount >= 3 && result.usageSuggestions.canQuoteDirectly) {
    return 'verified'
  }
  
  // 기본
  return 'mentioned'
}

// ============================================
// Usage Policy Determination
// ============================================

/**
 * 사용 정책 결정
 */
function determineUsagePolicy(
  result: RestaurantResearchResult,
  confidence: EvidenceConfidence
): WebEvidence['usagePolicy'] {
  switch (confidence) {
    case 'verified':
      return {
        canQuote: true,
        canParaphrase: true,
        requiresAttribution: true,
      }
    case 'mentioned':
      return {
        canQuote: false,
        canParaphrase: true,
        requiresAttribution: true,
      }
    case 'uncertain':
      return {
        canQuote: false,
        canParaphrase: false,
        requiresAttribution: true,
      }
  }
}

// ============================================
// Limitations Extraction
// ============================================

/**
 * 조사 결과의 한계점 추출
 */
function extractLimitations(result: RestaurantResearchResult): string[] | undefined {
  const limitations: string[] = []
  const content = result.rawContent.toLowerCase()
  
  // 시간적 한계
  if (content.includes('최근') || content.includes('과거')) {
    limitations.push('정보의 시점이 명확하지 않을 수 있음')
  }
  
  // 출처 한계
  if (result.citations.length < 2) {
    limitations.push('제한된 출처에 기반한 정보')
  }
  
  // 직접 확인 필요
  if (content.includes('직접') || content.includes('확인')) {
    limitations.push('직접 확인이 필요한 내용 포함')
  }
  
  return limitations.length > 0 ? limitations : undefined
}

// ============================================
// Evidence Summary
// ============================================

/**
 * Evidence 컬렉션 요약 생성
 */
export function summarizeEvidences(evidences: WebEvidence[]): EvidenceSummary {
  const confidenceDistribution: Record<EvidenceConfidence, number> = {
    verified: 0,
    mentioned: 0,
    uncertain: 0,
  }
  
  const sourceDistribution: Record<EvidenceSourceType, number> = {
    perplexity_search: 0,
    perplexity_research: 0,
    manual: 0,
  }
  
  const allQuotes: string[] = []
  const allCitations: string[] = []
  
  for (const evidence of evidences) {
    // 신뢰도 분포
    confidenceDistribution[evidence.confidence]++
    
    // 소스 분포
    sourceDistribution[evidence.type]++
    
    // 인용구 수집
    if (evidence.quotableTexts && evidence.quotableTexts.length > 0) {
      allQuotes.push(...evidence.quotableTexts.slice(0, 2))
    }
    
    // 출처 수집
    allCitations.push(...evidence.citations)
  }
  
  // 중복 제거 및 제한
  const uniqueCitations = [...new Set(allCitations)].slice(0, 5)
  const uniqueQuotes = [...new Set(allQuotes)].slice(0, 3)
  
  return {
    totalCount: evidences.length,
    confidenceDistribution,
    sourceDistribution,
    keyQuotes: uniqueQuotes,
    topCitations: uniqueCitations,
  }
}

// ============================================
// Evidence Filtering
// ============================================

export interface EvidenceFilter {
  /** 최소 신뢰도 */
  minConfidence?: EvidenceConfidence
  /** 특정 타입만 */
  types?: EvidenceSourceType[]
  /** 인용 가능한 것만 */
  quotableOnly?: boolean
}

/**
 * Evidence 필터링
 */
export function filterEvidences(
  evidences: WebEvidence[],
  filter: EvidenceFilter
): WebEvidence[] {
  return evidences.filter(evidence => {
    // 신뢰도 필터
    if (filter.minConfidence) {
      const confidenceOrder: EvidenceConfidence[] = ['uncertain', 'mentioned', 'verified']
      const evidenceIndex = confidenceOrder.indexOf(evidence.confidence)
      const minIndex = confidenceOrder.indexOf(filter.minConfidence)
      if (evidenceIndex < minIndex) return false
    }
    
    // 타입 필터
    if (filter.types && !filter.types.includes(evidence.type)) {
      return false
    }
    
    // 인용 가능 필터
    if (filter.quotableOnly && !evidence.usagePolicy.canQuote) {
      return false
    }
    
    return true
  })
}

// ============================================
// Draft Integration Helpers
// ============================================

export interface EvidenceForDraft {
  /** 사용자 표시용 요약 */
  displaySummary: string
  
  /** AI 프롬프트용 컨텍스트 */
  promptContext: string
  
  /** 인용구 목록 */
  safeQuotes: string[]
  
  /** 출처 표시 문자열 */
  attribution: string
  
  /** 주요 출처 링크 목록 */
  topCitations: string[]
  
  /** 주의사항 */
  cautions: string[]
}

/**
 * Draft 생성용 Evidence 데이터 준비
 */
export function prepareEvidenceForDraft(
  evidences: WebEvidence[]
): EvidenceForDraft {
  // 신뢰도 높은 것만 사용
  const usableEvidences = filterEvidences(evidences, {
    minConfidence: 'mentioned',
    quotableOnly: false,
  })
  
  // 요약 생성
  const summaries = usableEvidences.map(e => e.summary.slice(0, 200))
  const displaySummary = summaries.join('\n\n')
  
  // 프롬프트 컨텍스트
  const promptContext = usableEvidences.map(e => {
    const source = e.citations.length > 0 
      ? `[출처: ${e.citations[0]}]` 
      : '[출처: 웹 조사]'
    return `${e.summary.slice(0, 150)}... ${source}`
  }).join('\n')
  
  // 안전한 인용구 (verified만)
  const safeQuotes = usableEvidences
    .filter(e => e.confidence === 'verified' && e.usagePolicy.canQuote)
    .flatMap(e => e.quotableTexts || [])
    .slice(0, 3)
  
  // 출처 표시
  const allCitations = [...new Set(usableEvidences.flatMap(e => e.citations))]
  const attribution = allCitations.length > 0
    ? `참고 출처: ${allCitations.slice(0, 3).join(', ')}${allCitations.length > 3 ? ' 등' : ''}`
    : '웹 조사 자료 참고'
  
  // 주요 출처 (최대 5개)
  const topCitations = allCitations.slice(0, 5)
  
  // 주의사항 수집
  const cautions = usableEvidences
    .flatMap(e => e.limitations || [])
  
  return {
    displaySummary,
    promptContext,
    safeQuotes,
    attribution,
    topCitations,
    cautions: [...new Set(cautions)],
  }
}

// ============================================
// Validation
// ============================================

/**
 * Evidence 유효성 검사
 */
export function validateEvidence(evidence: WebEvidence): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!evidence.id) errors.push('ID가 없습니다')
  if (!evidence.query) errors.push('검색어가 없습니다')
  if (!evidence.summary) errors.push('요약이 없습니다')
  if (!evidence.citations || evidence.citations.length === 0) {
    errors.push('출처 링크가 없습니다')
  }
  if (!evidence.createdAt) errors.push('생성 시간이 없습니다')
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Evidence 만료 여부 확인
 */
export function isEvidenceExpired(
  evidence: WebEvidence,
  maxAgeDays: number = 30
): boolean {
  if (!evidence.createdAt) return true
  
  const created = new Date(evidence.createdAt)
  const now = new Date()
  const ageMs = now.getTime() - created.getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  
  return ageDays > maxAgeDays
}
