/**
 * AI 계층 타입 정의 - Correction Vertical Slice
 * 
 * @see PROMPT_GUIDE.md Section 3 - Draft Correction
 * 
 * 1차 구현 범위: grammar, style, rewrite
 * TODO: shorten, expand, tone 향후 확장
 */

// ───────────────────────────────────────────────
// AI Provider / Config
// ───────────────────────────────────────────────

export type AIProvider = 'mock' | 'openai' | 'anthropic' | 'google'

export interface AIConfig {
  provider: AIProvider
  model: string
  temperature: number
  maxTokens: number
  timeout: number
  retryCount: number
}

// ───────────────────────────────────────────────
// 공통 요청/응답 타입
// ───────────────────────────────────────────────

export type AIFeature = 'correction' | 'image-prompt' | 'sns-transform' | 'restaurant-draft' | 'informational-draft'

export interface AIRequest<TInput> {
  feature: AIFeature
  input: TInput
  config?: Partial<AIConfig>
}

export interface AIResponse<TOutput> {
  success: boolean
  data?: TOutput
  error?: AIError
  metadata: {
    model: string
    tokensUsed?: number
    latencyMs: number
    cached: boolean
  }
}

export interface AIError {
  code: string
  message: string
  retryable: boolean
}

// ───────────────────────────────────────────────
// Section 3: Correction (Draft 수정)
// @see PROMPT_GUIDE.md Section 3
// ───────────────────────────────────────────────

/**
 * 1차 구현: grammar, style, rewrite
 * TODO: 향후 'shorten' | 'expand' | 'tone' 확장
 */
export type CorrectionType = 'grammar' | 'style' | 'rewrite'

/**
 * @see PROMPT_GUIDE.md Section 3 - Correction Input
 */
export interface CorrectionInput {
  /** 교정할 원본 텍스트 */
  originalText: string
  /** 교정 유형 */
  correctionType: CorrectionType
  /** 컨텍스트 정보 */
  context: {
    /** 소제목 (rewrite 시 유용) */
    sectionHeading?: string
    /** 타겟 독자 */
    targetAudience: string
    /** 현재 글 톤 */
    tone: string
  }
  /** 추가 지시사항 (rewrite 시 사용) */
  instruction?: string
}

/**
 * 개별 변경 사항
 */
export interface CorrectionChange {
  /** 변경 유형 */
  type: 'grammar' | 'wording' | 'structure' | 'content'
  /** 원본 텍스트 */
  original: string
  /** 제안 내용 */
  suggestion: string
  /** 변경 이유 */
  reason: string
}

/**
 * @see PROMPT_GUIDE.md Section 3 - Correction Output
 */
export interface CorrectionOutput {
  /** 교정된 전체 텍스트 */
  correctedText: string
  /** 변경 사항 목록 */
  changes: CorrectionChange[]
  /** 신뢰도 (0-1) */
  confidence: number
}

// ───────────────────────────────────────────────
// Section 4: Image Prompt 생성
// @see PROMPT_GUIDE.md Section 4
// ───────────────────────────────────────────────

/** 이미지 스타일 */
export type ImageStyle = 'realistic' | 'illustration' | 'minimal' | '3d'

/** 이미지 비율 */
export type ImageRatio = '16:9' | '4:3' | '1:1' | '9:16'

/** 이미지 용도 */
export type ImagePurpose = 'hero' | 'section' | 'detail' | 'thumbnail'

/**
 * @see PROMPT_GUIDE.md Section 4 - Image Prompt Input
 */
export interface ImagePromptInput {
  /** 블록/섹션 정보 */
  section: {
    heading: string
    content: string
  }
  /** 프로젝트 컨텍스트 */
  project: {
    topic: string
    tone: string
  }
  /** 이미지 설정 */
  imageStyle: ImageStyle
  aspectRatio: ImageRatio
  /** 생성할 이미지 목적 */
  variant: ImagePurpose
}

/**
 * 개별 이미지 생성 프롬프트
 */
export interface GeneratedImagePrompt {
  purpose: ImagePurpose
  prompt: string
  negativePrompt: string
  aspectRatio: string
  recommendedModel: string
}

/**
 * @see PROMPT_GUIDE.md Section 4 - Image Prompt Output
 */
export interface ImagePromptOutput {
  prompts: GeneratedImagePrompt[]
  colorPalette: string[]
  composition: string
}

// ───────────────────────────────────────────────
// Section 5: SNS Transform (Export)
// @see PROMPT_GUIDE.md Section 5
// ───────────────────────────────────────────────

/** SNS 플랫폼 타입 */
export type SNSPlatform = 'threads' | 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'daangn'

/** SNS 변환 유형 */
export type SNSVariant = 'summary' | 'thread' | 'quote' | 'question' | 'carousel'

/**
 * @see PROMPT_GUIDE.md Section 5 - SNS Conversion Input
 */
export interface SNSTransformInput {
  /** 원본 블로그 포스트 */
  originalPost: {
    title: string
    content: string
    keyPoints: string[]
  }
  /** 대상 플랫폼 */
  platform: SNSPlatform
  /** 변환 유형 */
  variant: SNSVariant
  /** 옵션 */
  options: {
    includeHashtags: boolean
    includeEmoji: boolean
    cta?: string
  }
}

/** 개별 SNS 게시물 */
export interface SNSSinglePost {
  content: string
  characterCount: number
  hashtags?: string[]
  suggestedImage?: string
  bestPostingTime?: string
}

/**
 * @see PROMPT_GUIDE.md Section 5 - SNS Conversion Output
 */
export interface SNSTransformOutput {
  posts: SNSSinglePost[]
  hashtags: string[]
  mentions: string[]
  engagementTips: string[]
}
