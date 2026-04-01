/**
 * Evidence Types
 * 
 * 웹 조사 및 출처 기반 증거 데이터 타입 정의
 * Perplexity 등 외부 조사 소스의 결과를 구조화
 */

// ───────────────────────────────────────────────
// Evidence Source Types
// ───────────────────────────────────────────────

export type EvidenceSourceType = 'perplexity_search' | 'perplexity_research' | 'manual'

export interface EvidenceSource {
  type: EvidenceSourceType
  provider: string
  queriedAt: string
}

// ───────────────────────────────────────────────
// Web Evidence
// ───────────────────────────────────────────────

export type EvidenceConfidence = 'verified' | 'mentioned' | 'uncertain'

export interface WebEvidence {
  /** 고유 ID */
  id: string
  
  /** 증거 유형 */
  type: EvidenceSourceType
  
  /** 출처 정보 */
  source: EvidenceSource
  
  // ── 조사 대상 ──
  
  /** 조사 대상 장소 이름 */
  placeName: string
  
  // ── 조사 내용 ──
  
  /** 사용된 검색어 */
  query: string
  
  /** AI 요약/분석 결과 */
  summary: string
  
  /** 원문 인용 가능한 구절 */
  quotableTexts?: string[]
  
  /** 출처 링크 */
  citations: string[]
  
  /** 발견된 키워드/태그 */
  extractedKeywords?: string[]
  
  // ── 신뢰도 및 정책 ──
  
  /** 정보 신뢰도 */
  confidence: EvidenceConfidence
  
  /** 검증 시점 */
  verifiedAt: string
  
  /** 사용 정책 */
  usagePolicy: {
    /** 직접 인용 가능 여부 */
    canQuote: boolean
    /** 재구성(패러프레이즈) 가능 여부 */
    canParaphrase: boolean
    /** 출처 표시 필수 여부 */
    requiresAttribution: boolean
  }
  
  /** 주의사항/한계 */
  limitations?: string[]
  
  // ── 메타 ──
  
  /** 생성 시점 */
  createdAt: string
  
  /** 만료 시점 (선택적) */
  expiresAt?: string
}

// ───────────────────────────────────────────────
// Evidence Collection
// ───────────────────────────────────────────────

export interface EvidenceCollection {
  /** 프로젝트 ID */
  projectId: string
  
  /** 연관된 장소 ID */
  placeId?: string
  
  /** 증거 목록 */
  evidences: WebEvidence[]
  
  /** 마지막 업데이트 */
  updatedAt: string
}

// ───────────────────────────────────────────────
// Evidence Query Input
// ───────────────────────────────────────────────

export interface EvidenceQueryInput {
  /** 검색 주제 */
  topic: string
  
  /** 세부 컨텍스트 */
  context?: string
  
  /** 원하는 증거 유형 */
  evidenceTypes?: EvidenceSourceType[]
  
  /** 최대 결과 수 */
  maxResults?: number
  
  /** 시간 제한 (최근 N일) */
  recencyDays?: number
}

// ───────────────────────────────────────────────
// Helper Types
// ───────────────────────────────────────────────

export interface EvidenceSummary {
  /** 총 증거 수 */
  totalCount: number
  
  /** 신뢰도별 분포 */
  confidenceDistribution: Record<EvidenceConfidence, number>
  
  /** 출처별 분포 */
  sourceDistribution: Record<EvidenceSourceType, number>
  
  /** 핵심 인용구 */
  keyQuotes: string[]
  
  /** 주요 출처 링크 */
  topCitations: string[]
}
