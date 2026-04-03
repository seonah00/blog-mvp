/**
 * Pipeline Types - 단계별 블로그 초안 생성 파이프라인 타입 정의
 * 
 * 8단계 파이프라인:
 * 1. Source Collection
 * 2. Research Distillation  
 * 3. Outline Generation
 * 4. Title Generation
 * 5. Body Generation
 * 6. Natural Rewrite
 * 7. Quality Review
 * 8. Draft Commit
 */

import type {
  InformationalProjectMeta,
  InformationalOutline,
  SourceDocument,
  InformationalDraftSettings,
  RestaurantDraftSettings,
  NormalizedPlaceProfile,
  ReviewDigest,
} from '@/types'

// Re-export QualityCheckResult from quality-filter
export type { QualityCheckResult } from '../quality-filter'

// ============================================
// 공통 파이프라인 타입
// ============================================

export type PipelineStage =
  | 'source-collection'
  | 'research-distillation'
  | 'outline-generation'
  | 'title-generation'
  | 'body-generation'
  | 'natural-rewrite'
  | 'quality-review'
  | 'draft-commit'

export interface PipelineStatus {
  currentStage: PipelineStage
  stageProgress: number // 0-100
  overallProgress: number // 0-100
  stageMessage: string
  startTime: string
  estimatedEndTime?: string
}

export interface PipelineLog {
  stage: PipelineStage
  timestamp: string
  message: string
  level: 'info' | 'warn' | 'error'
  details?: unknown
}

// ============================================
// Stage 1: Source Collection Output
// ============================================

export interface PipelineSource {
  id: string
  type: 'perplexity' | 'liner' | 'place' | 'review' | 'user' | 'web' | 'file'
  rawContent: string
  metadata: {
    title?: string
    url?: string
    timestamp: string
    credibility: 'high' | 'medium' | 'low'
    sourceId?: string // 기존 source document와 연결
  }
}

// ============================================
// Stage 2: Research Distillation Output
// ============================================

export interface DistilledClaim {
  claim: string
  source: string
  evidence?: string
  confidence: 'high' | 'medium' | 'low'
}

export interface DistilledComparison {
  point: string
  items: Array<{
    name: string
    description: string
  }>
}

export interface DistilledExample {
  scenario: string
  detail: string
  source: string
}

export interface DistilledFacts {
  keyClaims: DistilledClaim[]
  comparisons: DistilledComparison[]
  examples: DistilledExample[]
  keyPoints: string[]
  warnings: string[] // 제거된 노이즈/광고성 내역
  keywordContext: Record<string, string[]> // 키워드별 사용 맥락
  stats?: Array<{
    metric: string
    value: string
    source: string
  }>
}

// ============================================
// Stage 3: Outline Generation Output
// ============================================

export interface OutlineSection {
  heading: string
  goal: string // 이 섹션에서 달성할 목표
  keyPoints: string[] // 반드시 다룰 핵심 포인트
  targetLength: number // 목표 글자 수
  order: number
}

export interface StructuredOutline {
  intro: {
    hook: string // 독자를 끌어들일 도입
    goal: string // 서론에서 달성할 목표
    targetLength: number
  }
  sections: OutlineSection[]
  conclusion: {
    summary: string // 요약할 내용
    takeaway: string // 독자가 얻어갈 인사이트
    targetLength: number
  }
  totalTargetLength: number
  estimatedReadTime: number // 예상 읽기 시간(분)
}

// ============================================
// Stage 4: Title Generation Output
// ============================================

export interface TitleCandidate {
  title: string
  score: number // 0-100
  reason: string
  includesKeyword: boolean
}

export interface TitleGenerationResult {
  candidates: TitleCandidate[]
  selectedTitle: string
  // 품질 검증 필드
  titleKeywordIncluded: boolean
  titleKeyword: string
  titleQualityStatus: 'pass' | 'fail' | 'fixed'
  titleQualityReason: string
  titleValidationSummary: string[]
  // 검증 상세
  checks: {
    keywordIncluded: boolean
    naturalPhrasing: boolean
    noForbiddenWords: boolean
    appropriateLength: boolean
    titleBodyAlignment?: boolean
  }
}

// ============================================
// Stage 5: Body Generation Output
// ============================================

export interface DraftSection {
  heading: string
  content: string
  wordCount: number
}

export interface RawDraft {
  content: string // 전체 마크다운
  sections: DraftSection[]
  keywordUsage: Record<string, number> // 키워드별 사용 횟수
  sourcesReferenced: string[] // 참조한 소스 ID
  metadata: {
    wordCount: number
    estimatedReadTime: number
    tone: string
  }
}

// ============================================
// Stage 6: Natural Rewrite Output
// ============================================

export interface StyleChange {
  type: 'memo' | 'instruction' | 'mechanical' | 'awkward' | 'improved'
  original: string
  rewritten: string
  reason: string
}

export interface RewrittenDraft {
  content: string
  sections: DraftSection[]
  styleChanges: StyleChange[]
  improvementNotes: string[]
}

// ============================================
// Stage 7: Quality Review Output
// ============================================

export interface BannedTermsCheck {
  found: number
  fixed: number
  status: 'pass' | 'fail' | 'warning'
  summary: string[]
  details?: Array<{
    term: string
    context: string
    replacement: string
  }>
}

export interface PlaceholderCheck {
  found: number
  status: 'pass' | 'fail'
  placeholders?: string[]
}

export interface TemplateCheck {
  found: number
  status: 'pass' | 'fail'
  markers?: string[]
}

export interface DuplicateCheck {
  sentences: number
  sections: number
  status: 'pass' | 'fail'
  duplicateSentences?: Array<{
    text: string
    occurrences: number
  }>
}

export interface MetaWritingCheck {
  found: number
  status: 'pass' | 'fail'
  phrases?: string[]
}

export interface TitleBodyAlignment {
  aligned: boolean
  issues: string[]
  suggestions?: string[]
}

export interface QualityReviewResult {
  bannedTermsCheck: BannedTermsCheck
  placeholderCheck: PlaceholderCheck
  templateCheck: TemplateCheck
  duplicateCheck: DuplicateCheck
  metaWritingCheck: MetaWritingCheck
  titleBodyAlignment: TitleBodyAlignment
  finalStatus: 'pass' | 'fail' | 'fixed'
  fixedContent: string
  reviewNotes: string[]
}

// ============================================
// Stage 8: Pipeline Result
// ============================================

export interface FinalDraft {
  title: string
  content: string
  sections: DraftSection[]
  outline: StructuredOutline
  titleResult: TitleGenerationResult
  qualityReport: QualityReviewResult
  keywordUsage: Record<string, number>
  metadata: {
    wordCount: number
    estimatedReadTime: number
    tone: string
    generatedAt: string
    pipelineVersion: string
  }
}

export interface PipelineResult {
  success: boolean
  stage: PipelineStage // 현재/실패 단계
  draft?: FinalDraft
  status?: PipelineStatus
  logs: PipelineLog[]
  error?: {
    stage: PipelineStage
    message: string
    details?: unknown
  }
}

// ============================================
// Pipeline Input Types
// ============================================

// Extended types for pipeline with optional fields for flexibility
export interface InformationalPipelineInput {
  projectId: string
  meta: InformationalProjectMeta & {
    topic?: string
    targetAudience?: string
  }
  sources: Array<SourceDocument & {
    rawText?: string
    savedAt?: string
    credibility?: 'high' | 'medium' | 'low'
  }>
  settings: InformationalDraftSettings & {
    tone?: string
    length?: string
  }
  existingOutline?: InformationalOutline & {
    intro?: { hook?: string; goal?: string }
    sections: Array<{
      heading: string
      goal?: string
      keyPoints?: string[]
    }>
  }
}

export interface RestaurantPipelineInput {
  projectId: string
  placeProfile: NormalizedPlaceProfile
  reviewDigest: ReviewDigest
  settings: RestaurantDraftSettings & {
    tone?: string
    length?: string
  }
  webEvidence?: PipelineWebEvidence[]
}

// Simple WebEvidence for pipeline (differs from types/evidence.ts)
export interface PipelineWebEvidence {
  url: string
  title: string
  snippet: string
  relevance: number
}

// ============================================
// Stage-specific Configuration
// ============================================

export interface StageConfig {
  enabled: boolean
  retryCount: number
  timeoutMs: number
  skipIfExists?: boolean
}

export interface PipelineConfig {
  stages: Record<PipelineStage, StageConfig>
  quality: {
    minPassScore: number // 기본 80
    autoFix: boolean // 자동 수정 허용 여부
    maxRetries: number // 품질 재시도 횟수
  }
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    includeRawOutput: boolean
  }
}

// ============================================
// Error Types
// ============================================

export class PipelineError extends Error {
  constructor(
    public stage: PipelineStage,
    message: string,
    public cause?: Error,
    public recoverable: boolean = false
  ) {
    super(`[${stage}] ${message}`)
    this.name = 'PipelineError'
  }
}

export class QualityCheckError extends PipelineError {
  constructor(
    stage: PipelineStage,
    public checks: Partial<QualityReviewResult>,
    message: string = '품질 검사 실패'
  ) {
    super(stage, message, undefined, false)
    this.name = 'QualityCheckError'
  }
}
