/**
 * Common Types
 * 
 * 모든 도메인 타입이 참조하는 공통 타입 정의
 * 순환 의존 방지를 위해 leaf 타입 파일들만 이 파일을 import
 */

// ───────────────────────────────────────────────
// Project Core
// ───────────────────────────────────────────────

/** 콘텐츠 타입 */
export type ProjectType = 'restaurant' | 'informational'

/** 글 톤 */
export type ProjectTone =
  | 'professional'
  | 'friendly'
  | 'casual'
  | 'expert'
  | 'persuasive'

/** 글 길이 */
export type DraftLength = 'short' | 'medium' | 'long'

/** 프로젝트 상태 */
export type ProjectStatus =
  | 'draft'
  | 'researching'
  | 'writing'
  | 'image-generating'
  | 'ready-to-export'

// ───────────────────────────────────────────────
// Research Core
// ───────────────────────────────────────────────

/** 리서치 아이템 */
export interface ResearchItem {
  id: string
  projectId: string
  title: string
  sourceUrl: string
  domain: string
  summary: string
  excerpt: string
  relevanceScore: number
}

// ───────────────────────────────────────────────
// Draft Core
// ───────────────────────────────────────────────

/** 초안 설정 */
export interface DraftSettings {
  category: string
  goal: string
  tone: ProjectTone
  length: DraftLength
  cta: string
  customPrompt: string
  includeFaq: boolean
}

/** 초안 */
export interface Draft {
  projectId: string
  title: string
  content: string
  version: number
  wordCount: number
  updatedAt: string
  lastSavedAt?: string
  usedSourceIds?: string[] // 정보성 글쓰기: 인용한 소스 ID 목록
}

// ───────────────────────────────────────────────
// Image Core
// ───────────────────────────────────────────────

/** 생성된 이미지 */
export interface GeneratedImage {
  id: string
  url: string
  createdAt: string
}

/** 이미지 프롬프트 */
export interface ImagePrompt {
  id: string
  projectId: string
  blockId?: string
  prompt: string
  style: 'realistic' | 'illustration' | 'infographic' | 'minimal'
  ratio: '16:9' | '1:1' | '9:16'
  status: 'pending' | 'generating' | 'completed'
  generatedImages: GeneratedImage[]
  selectedImageId?: string
  createdAt: string
}

/** 썸네일 설정 */
export interface ThumbnailSettings {
  projectId: string
  title: string
  subtitle: string
  selectedImageId?: string
  style: string
  brightness: number
}

// ───────────────────────────────────────────────
// AI Feature Common
// ───────────────────────────────────────────────

/** 문단 초안 (공통) */
export interface ParagraphDraft {
  id: string
  content: string
  suggestedNext?: string
  toneCheck?: string
  citationsUsed?: string[]
  generatedAt: string
}
