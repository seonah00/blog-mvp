/**
 * Karrot (당근) Content Domain Types
 * 
 * 당근마켓 동네생활 콘텐츠 작성을 위한 타입 정의
 * @see PROMPT_GUIDE.md - Karrot Draft 섹션
 * 
 * Import Rule: types/common.ts 만 import 가능
 */

import type { ProjectTone, ParagraphDraft } from './common'

// ───────────────────────────────────────────────
// Project Meta
// ───────────────────────────────────────────────

export interface KarrotProjectMeta {
  /** 하위 목적: 광고형 / 맛집형 / 동네소통형 */
  purpose: 'ad' | 'food' | 'community'
  /** 동네 (예: 역삼동, 홍대) */
  region: string
  /** 타겟 독자 */
  targetAudience: string
  /** 업종 (광고형일 때) */
  businessType?: string
  /** 주제/키워드 */
  topic: string
}

// ───────────────────────────────────────────────
// Research Phase
// ───────────────────────────────────────────────

/**
 * 당근글 리서치 입력
 */
export interface KarrotResearchInput {
  meta: KarrotProjectMeta
  /** 참고할 소스 (선택) */
  sources?: {
    title: string
    content: string
    url?: string
  }[]
}

/**
 * 당근글 리서치 출력
 */
export interface KarrotResearchOutput {
  /** 핵심 포인트 */
  keyPoints: string[]
  /** 동네 관련 키워드 */
  localKeywords: string[]
  /** 추천 제목 */
  suggestedTitles: string[]
  /** 이모지 추천 */
  suggestedEmojis?: string[]
}

// ───────────────────────────────────────────────
// Draft Settings
// ───────────────────────────────────────────────

export interface KarrotDraftSettings {
  /** 하위 목적 */
  purpose: 'ad' | 'food' | 'community'
  /** 가격 정보 포함 */
  includePrice: boolean
  /** 위치 정보 포함 */
  includeLocation: boolean
  /** 연락처 포함 */
  includeContact: boolean
  /** 이모지 레벨 */
  emojiLevel: 'none' | 'minimal' | 'moderate'
  /** 마감 임박 표현 */
  urgency: 'none' | 'soft' | 'strong'
  /** 사진 포함 여부 */
  includeImages: boolean
}

// ───────────────────────────────────────────────
// Draft Phase
// ───────────────────────────────────────────────

/**
 * 당근글 초안 출력
 */
export interface KarrotDraftOutput {
  /** 제목 */
  title: string
  /** 본문 내용 */
  content: string
  /** 해시태그 */
  hashtags: string[]
  /** 메타데이터 */
  metadata: {
    wordCount: number
    estimatedReadTime: number
    emojiCount: number
    tone: string
  }
  /** fallback 사용 여부 */
  usedFallback?: boolean
}

/**
 * 당근글 초안 입력
 */
export interface KarrotDraftInput {
  meta: KarrotProjectMeta
  research: KarrotResearchOutput
  settings: KarrotDraftSettings
}

/**
 * 어시스턴트 메시지
 */
export interface KarrotAssistantMessage {
  role: 'assistant'
  type: 'suggestion' | 'improvement' | 'completion_check' | 'title_idea'
  content: string
  suggestions?: { text: string; type?: string }[]
}

/**
 * 당근글 작성 헬퍼 데이터
 */
export interface KarrotDraftHelperData {
  /** 핵심 포인트 */
  keyPoints: string[]
  /** 동네 키워드 */
  localKeywords: string[]
  /** 추천 제목 */
  suggestedTitles: string[]
}

// ───────────────────────────────────────────────
// Version Management
// ───────────────────────────────────────────────

export interface KarrotDraftVersion {
  id: string
  versionNumber: number
  title: string
  content: string
  hashtags: string[]
  createdAt: string
}
