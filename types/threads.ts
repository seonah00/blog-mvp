/**
 * Threads Content Domain Types
 * 
 * 스레드(Threads) 콘텐츠 작성을 위한 타입 정의
 * @see PROMPT_GUIDE.md - Threads Draft 섹션
 * 
 * Import Rule: types/common.ts 만 import 가능
 */

import type { ProjectTone, ParagraphDraft } from './common'

// ───────────────────────────────────────────────
// Project Meta
// ───────────────────────────────────────────────

/** 전개 전략 타입 */
export type ThreadsStrategyType = 'story' | 'tip' | 'engage'

/** 비즈니스/브랜드 정보 */
export interface ThreadsBusinessInfo {
  /** 브랜드명 */
  brandName?: string
  /** 한 줄 소개 (Brand One-liner) */
  oneLiner?: string
  /** 핵심 가치 (Core Value) */
  coreValue?: string
  /** 타겟 고객 페르소나 */
  targetAudience?: string
  /** 차별화 포인트 (Differentiation) */
  differentiation?: string
  /** 스토리 - Before (문제 상황) */
  storyBefore?: string
  /** 스토리 - Turning Point (전환점) */
  turningPoint?: string
  /** 스토리 - After (해결/성과) */
  storyAfter?: string
  /** 콘텐츠 목표 */
  goals?: string
  /** 보유 콘텐츠 자산 */
  contentAssets?: string
}

export interface ThreadsProjectMeta {
  /** 하위 목적: 맛집형 / 정보형 / 브랜딩형 (Content Topic Type) */
  purpose: 'food' | 'info' | 'branding'
  /** 전개 전략: 스토리형 / 꿀팁형 / 공감형 (Strategy Type) */
  strategyType?: ThreadsStrategyType
  /** 타겟 독자 */
  targetAudience: string
  /** 톤: 캐주얼 / 친근한 / 프로페셔널 (ProjectTone과 호환) */
  tone: 'casual' | 'friendly' | 'professional'
  /** 첫 문장 훅 (선택) */
  hook?: string
  /** 주제/키워드 */
  topic: string
  /** 벤치마크 링크 (선택) */
  benchmarkLinks?: string
  /** 비즈니스/브랜드 정보 (선택) */
  businessInfo?: ThreadsBusinessInfo
}

// ───────────────────────────────────────────────
// Research Phase
// ───────────────────────────────────────────────

/**
 * 스레드 리서치 입력
 */
export interface ThreadsResearchInput {
  meta: ThreadsProjectMeta
  /** 참고할 소스 (선택) */
  sources?: {
    title: string
    content: string
    url?: string
  }[]
}

/**
 * 스레드 리서치 출력
 */
export interface ThreadsResearchOutput {
  /** 핵심 포인트 (스레드 각각의 핵심) */
  keyPoints: string[]
  /** 추천 훅 (첫 문장 아이디어) */
  suggestedHooks: string[]
  /** 관련 해시태그 */
  suggestedHashtags: string[]
  /** 참고 이미지 설명 */
  imageIdeas?: string[]
}

// ───────────────────────────────────────────────
// Draft Settings
// ───────────────────────────────────────────────

export interface ThreadsDraftSettings {
  /** 하위 목적 (Content Topic Type) */
  purpose: 'food' | 'info' | 'branding'
  /** 전개 전략 (Strategy Type) */
  strategyType?: ThreadsStrategyType
  /** 스레드 개수 (3-10) */
  threadCount: number
  /** 이미지 포함 여부 */
  includeImages: boolean
  /** 이미지 위치 */
  imagePosition: 'top' | 'middle' | 'bottom'
  /** 해시태그 스타일 */
  hashtagStyle: 'minimal' | 'moderate' | 'full'
  /** CTA 타입 */
  ctaType: 'question' | 'link' | 'follow' | 'none'
  /** 커스텀 CTA 문구 (선택) */
  customCta?: string
  /** 벤치마크 링크 요약 (AI가 분석한 결과) */
  benchmarkSummary?: string
  /** 비즈니스/브랜드 정보 */
  businessInfo?: ThreadsBusinessInfo
}

// ───────────────────────────────────────────────
// Draft Phase
// ───────────────────────────────────────────────

/**
 * 개별 스레드 아이템
 */
export interface ThreadItem {
  /** 순서 (1-based) */
  order: number
  /** 내용 (짧은 문장) */
  content: string
  /** 이미지 설명 (선택) */
  imageDescription?: string
  /** 구분선 여부 (다음 아이템과의 구분) */
  hasSeparator?: boolean
}

/**
 * 스레드 초안 출력
 */
export interface ThreadsDraftOutput {
  /** 전체 제목 */
  title: string
  /** 스레드 아이템 목록 */
  threads: ThreadItem[]
  /** 해시태그 */
  hashtags: string[]
  /** 메타데이터 */
  metadata: {
    wordCount: number
    estimatedReadTime: number
    threadCount: number
    tone: string
  }
  /** fallback 사용 여부 */
  usedFallback?: boolean
}

/**
 * 스레드 초안 입력
 */
export interface ThreadsDraftInput {
  meta: ThreadsProjectMeta
  research: ThreadsResearchOutput
  settings: ThreadsDraftSettings
}

/**
 * 어시스턴트 메시지
 */
export interface ThreadsAssistantMessage {
  role: 'assistant'
  type: 'suggestion' | 'improvement' | 'completion_check' | 'hook_idea'
  content: string
  suggestions?: { text: string; replaceIndex?: number }[]
}

/**
 * 스레드 작성 헬퍼 데이터
 */
export interface ThreadsDraftHelperData {
  /** 핵심 포인트 */
  keyPoints: string[]
  /** 추천 훅 */
  suggestedHooks: string[]
  /** 해시태그 */
  suggestedHashtags: string[]
}

// ───────────────────────────────────────────────
// Version Management
// ───────────────────────────────────────────────

export interface ThreadsDraftVersion {
  id: string
  versionNumber: number
  title: string
  threads: ThreadItem[]
  hashtags: string[]
  createdAt: string
  /** 변형 프리셋 (있는 경우) */
  preset?: string
}
