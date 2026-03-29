/**
 * Informational Content Domain Types
 * 
 * 정보성 콘텐츠 작성을 위한 타입 정의
 * @see PROMPT_GUIDE.md - Informational Research & Draft 섹션 (향후 추가)
 * 
 * Import Rule: types/common.ts 만 import 가능
 */

import type { ProjectTone, DraftLength, ParagraphDraft } from './common'

// ───────────────────────────────────────────────
// Project Meta
// ───────────────────────────────────────────────

export interface InformationalProjectMeta {
  /** 메인 키워드 */
  mainKeyword: string
  /** 서브 키워드 */
  subKeywords: string[]
  /** 검색 의도 (자유 텍스트) */
  searchIntent: string
  /** 독자층 수준 */
  audienceLevel: 'beginner' | 'intermediate' | 'expert'
  /** 글 목표 */
  goal: string
}

// ───────────────────────────────────────────────
// Research Phase
// ───────────────────────────────────────────────

/** 소스 타입 */
export type SourceType = 'article' | 'doc' | 'video' | 'memo' | 'paper'

/**
 * 소스 입력
 * URL 또는 수동 입력
 */
export interface SourceInput {
  id: string
  /** URL 또는 식별자 */
  url: string
  /** 제목 (수동 입력) */
  title?: string
  /** 소스 타입 */
  type: SourceType
  /** 메모/노트 */
  note?: string
  /** 추가 시점 */
  addedAt: string
}

/**
 * 처리된 소스 문서
 * 소스의 내용을 추출/요약한 결과
 */
export interface SourceDocument {
  id: string
  /** 연결된 SourceInput ID */
  sourceId: string
  /** 프로젝트 ID */
  projectId?: string
  /** 소스 유형 */
  type?: SourceType
  /** 소스 제목 */
  title?: string
  /** 소스 URL */
  url?: string
  /** 원본 내용 (사용자 입력 또는 추출) */
  content: string
  /** AI 요약 */
  summary: string
  /** 핵심 포인트 */
  keyPoints: string[]
  /** 인용 가능한 구절 */
  quotable?: string[]
  /** 관련도 점수 (0-1) */
  relevance?: number
  /** 인용 출처 목록 */
  citations?: string[]
  /** 처리 시점 */
  processedAt: string
  /** 추가 시점 */
  addedAt?: string
  /** 수정 시점 */
  updatedAt?: string
  /** 추가 메타데이터 */
  metadata?: Record<string, unknown>
}

/**
 * 키포인트 카테고리
 */
export type KeyPointCategory = 'fact' | 'opinion' | 'statistic' | 'example'

/**
 * 핵심 포인트
 */
export interface KeyPoint {
  id: string
  content: string
  sourceIds: string[]
  category: KeyPointCategory
  extractedAt: string
}

/**
 * 토픽 분석 결과
 */
export interface TopicAnalysis {
  mainKeyword: string
  topicScope: string
  readerPersonas: { type: string; needs: string }[]
  contentGaps: string[]
  differentiation: string
  suggestedStructure: { section: string; focus: string }[]
  analyzedAt: string
}

/**
 * 아웃라인 섹션
 */
export interface OutlineSection {
  /** 섹션 ID */
  id: string
  /** 소제목 */
  heading: string
  /** 핵심 포인트 */
  keyPoints: string[]
  /** 참조 소스 IDs (표준: sourceIds) */
  sourceIds: string[]
  /** 예상 길이 (단어 수) (표준: estimatedWordCount) */
  estimatedWordCount?: number
}

/**
 * 정보성 글 개요
 * 섹션 기반 구조
 */
export interface InformationalOutline {
  /** 글 제목 */
  title: string
  /** 타겟 독자 */
  targetAudience?: string
  /** 섹션 목록 */
  sections: OutlineSection[]
  /** 추천 FAQ */
  suggestedFaqs?: { question: string; answer: string }[]
  /** 생성 시점 */
  generatedAt: string
}

// ───────────────────────────────────────────────
// Draft Settings
// ───────────────────────────────────────────────

export interface InformationalDraftSettings {
  /** 채널 */
  channel: 'blog' | 'threads'
  /** 글 스타일 */
  style: 'explainer' | 'comparison' | 'guide' | 'problem-solving'
  /** FAQ 포함 여부 */
  includeFaq: boolean
  /** 체크리스트 포함 여부 */
  includeChecklist: boolean
  /** 키워드 강조 옵션 */
  keywordHighlight: 'none' | 'bold' | 'heading'
  /** 프롬프트 모드 */
  promptMode: 'auto' | 'custom' | 'preset'
  /** 사용자 커스텀 프롬프트 (promptMode가 'custom'일 때 사용) */
  customPrompt?: string
  /** 선택된 프리셋 ID (promptMode가 'preset'일 때 사용) */
  presetId?: string
}

// ───────────────────────────────────────────────
// Draft Phase
// ───────────────────────────────────────────────

/**
 * 어시스턴트 메시지
 */
export interface InformationalAssistantMessage {
  role: 'assistant'
  type: 'suggestion' | 'improvement' | 'completion_check' | 'quote' | 'source'
  content: string
  suggestions?: { text: string; insertAfter?: string }[]
  missingPoints?: string[]
}

/**
 * 정보성 글쓰기 헬퍼 데이터
 * Draft Edit 페이지의 사이드바에 표시될 정보
 */
export interface InformationalDraftHelperData {
  /** 핵심 키워드 */
  keywords: {
    main: string
    sub: string[]
  }
  /** 소스 요약 */
  sourceSummaries: {
    sourceId: string
    title: string
    summary: string
  }[]
  /** 개요 구조 */
  outline: InformationalOutline
  /** FAQ 후보 */
  faqCandidates?: {
    question: string
    answer: string
  }[]
}

// ───────────────────────────────────────────────
// AI Feature Types
// ───────────────────────────────────────────────

/**
 * @see lib/ai/prompts/informational-research.ts
 */
export interface InformationalResearchInput {
  meta: InformationalProjectMeta
  sources: SourceDocument[]
}

export interface InformationalResearchOutput {
  summary: string
  keyInsights: string[]
  recommendedOutline: InformationalOutline
}

/**
 * @see lib/ai/prompts/informational-outline.ts
 */
export interface InformationalOutlineInput {
  meta: InformationalProjectMeta
  sources: SourceDocument[]
}

/**
 * @see lib/ai/prompts/informational-draft.ts
 */
export interface InformationalDraftInput {
  meta: InformationalProjectMeta
  outline: InformationalOutline
  settings: InformationalDraftSettings
  channel: 'blog' | 'threads'
}

export interface InformationalDraftOutput {
  title: string
  content: string
  sections?: {
    heading: string
    content: string
  }[]
  faq?: { question: string; answer: string }[]
  keywordsUsed?: string[]
  /** 초안 작성에 사용된 소스 ID 목록 */
  usedSourceIds?: string[]
  metadata?: {
    wordCount: number
    estimatedReadTime: number
    tone: string
  }
  usedFallback?: boolean
}

// Re-export common for convenience
export type { ParagraphDraft }
