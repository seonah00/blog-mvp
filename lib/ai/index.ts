/**
 * AI Layer - Public API (Correction Vertical Slice)
 * 
 * 사용 예시:
 * ```typescript
 * import { ai, createAIClient, correctionInputSchema } from '@/lib/ai'
 * 
 * // 클라이언트 생성
 * const client = createAIClient({ provider: 'mock' })
 * 
 * // correction 요청
 * const response = await ai.correction.correct({
 *   originalText: '...',
 *   correctionType: 'grammar',
 *   context: { targetAudience: '개발자', tone: 'professional' }
 * })
 * ```
 */

import { createAIClient, MockAIClient, defaultAIConfig } from './legacy-client'
import type { AIClient } from './legacy-client'
import type { AIConfig } from './types'
import { 
  buildCorrectionPrompts, 
  CORRECTION_TYPE_META,
  type CorrectionPrompts 
} from './prompts/correction'
import {
  correctionInputSchema,
  correctionOutputSchema,
  correctionTypeSchema,
  createMockCorrectionOutput,
  safeCreateMockCorrectionOutput,
} from './schemas/correction'
import {
  buildImagePrompts,
  STYLE_KEYWORDS,
  PURPOSE_GUIDE,
} from './prompts/image'
import {
  imagePromptInputSchema,
  imagePromptOutputSchema,
  imageStyleSchema,
  imageRatioSchema,
  imagePurposeSchema,
  createMockImagePromptOutput,
} from './schemas/image'
import {
  buildSNSPrompts,
  SNS_PLATFORM_META,
  SNS_VARIANT_DESCRIPTIONS,
} from './prompts/sns'
import {
  snsTransformInputSchema,
  snsTransformOutputSchema,
  snsPlatformSchema,
  snsVariantSchema,
  createMockSNSTransformOutput,
} from './schemas/sns'

// ───────────────────────────────────────────────
// Re-exports
// ───────────────────────────────────────────────

// Types
export * from './types'

// Client
export { createAIClient, MockAIClient, defaultAIConfig }
export type { AIClient, AIConfig }

// Correction Prompts
export { 
  buildCorrectionPrompts, 
  CORRECTION_TYPE_META,
  type CorrectionPrompts 
}

// Correction Schemas
export {
  correctionInputSchema,
  correctionOutputSchema,
  correctionTypeSchema,
  createMockCorrectionOutput,
  safeCreateMockCorrectionOutput,
}

// Image Prompts
export {
  buildImagePrompts,
  STYLE_KEYWORDS,
  PURPOSE_GUIDE,
}

// Image Schemas
export {
  imagePromptInputSchema,
  imagePromptOutputSchema,
  imageStyleSchema,
  imageRatioSchema,
  imagePurposeSchema,
  createMockImagePromptOutput,
}

// SNS Prompts
export {
  buildSNSPrompts,
  SNS_PLATFORM_META,
  SNS_VARIANT_DESCRIPTIONS,
}

// SNS Schemas
export {
  snsTransformInputSchema,
  snsTransformOutputSchema,
  snsPlatformSchema,
  snsVariantSchema,
  createMockSNSTransformOutput,
}

// ───────────────────────────────────────────────
// High-level AI API
// ───────────────────────────────────────────────

import type {
  CorrectionInput,
  CorrectionOutput,
  CorrectionType,
  ImagePromptInput,
  ImagePromptOutput,
  SNSTransformInput,
  SNSTransformOutput,
  SNSPlatform,
  AIResponse,
} from './types'

/**
 * 기본 AI 클라이언트 인스턴스
 * 환경변수 AI_PROVIDER로 provider 전환 가능
 */
const defaultClient = createAIClient({
  provider: (process.env.AI_PROVIDER as AIConfig['provider']) || 'mock',
})

/**
 * AI Feature API
 * 
 * 각 메서드는 낶적으로:
 * 1. 입력 검증 (zod)
 * 2. AI 클라이언트 요청
 * 3. 응답 반환
 */
export const ai = {
  /**
   * Draft Correction
   * @see PROMPT_GUIDE.md Section 3
   */
  correction: {
    /**
     * 텍스트 교정 요청
     * 
     * @param input - CorrectionInput
     * @param client - 커스텀 AIClient (기본값: defaultClient)
     * @returns AIResponse<CorrectionOutput>
     * 
     * @example
     * ```typescript
     * const result = await ai.correction.correct({
     *   originalText: '이것은 예시 문장.',
     *   correctionType: 'grammar',
     *   context: { targetAudience: '개발자', tone: 'professional' }
     * })
     * 
     * if (result.success) {
     *   console.log(result.data.correctedText)
     * }
     * ```
     */
    async correct(
      input: CorrectionInput,
      client: AIClient = defaultClient
    ): Promise<AIResponse<CorrectionOutput>> {
      // 입력 검증
      const validated = correctionInputSchema.parse(input)
      
      // AI 요청
      return client.request<CorrectionInput, CorrectionOutput>({
        feature: 'correction',
        input: validated,
      })
    },

    /**
     * 프롬프트만 생성 (디버깅/테스트용)
     * 실제 API 호출 없이 프롬프트 확인
     */
    buildPrompts: buildCorrectionPrompts,

    /**
     * CorrectionType별 메타데이터
     * UI 표시용 (이름, 설명, 아이콘 등)
     */
    meta: CORRECTION_TYPE_META,

    /**
     * Zod 스키마 접근
     * 외부 검증에 사용
     */
    schemas: {
      input: correctionInputSchema,
      output: correctionOutputSchema,
      type: correctionTypeSchema,
    },
  },

  /**
   * Image Prompt Generation
   * @see PROMPT_GUIDE.md Section 4
   */
  image: {
    /**
     * 이미지 프롬프트 생성 요청
     * 
     * @param input - ImagePromptInput
     * @param client - 커스텀 AIClient (기본값: defaultClient)
     * @returns AIResponse<ImagePromptOutput>
     * 
     * @example
     * ```typescript
     * const result = await ai.image.generatePrompts({
     *   section: { heading: '소개', content: '...' },
     *   project: { topic: 'AI', tone: 'friendly' },
     *   imageStyle: 'illustration',
     *   aspectRatio: '16:9',
     *   variant: 'section'
     * })
     * 
     * if (result.success) {
     *   console.log(result.data.prompts[0].prompt)
     * }
     * ```
     */
    async generatePrompts(
      input: ImagePromptInput,
      client: AIClient = defaultClient
    ): Promise<AIResponse<ImagePromptOutput>> {
      // 입력 검증
      const validated = imagePromptInputSchema.parse(input)
      
      // AI 요청
      return client.request<ImagePromptInput, ImagePromptOutput>({
        feature: 'image-prompt',
        input: validated,
      })
    },

    /**
     * 프롬프트만 생성 (디버깅/테스트용)
     */
    buildPrompts: buildImagePrompts,

    /**
     * Zod 스키마 접근
     */
    schemas: {
      input: imagePromptInputSchema,
      output: imagePromptOutputSchema,
      style: imageStyleSchema,
      ratio: imageRatioSchema,
      purpose: imagePurposeSchema,
    },
  },

  /**
   * SNS Transform
   * @see PROMPT_GUIDE.md Section 5
   */
  sns: {
    /**
     * SNS 콘텐츠 변환 요청
     * 
     * @param input - SNSTransformInput
     * @param client - 커스텀 AIClient (기본값: defaultClient)
     * @returns AIResponse<SNSTransformOutput>
     * 
     * @example
     * ```typescript
     * const result = await ai.sns.transform({
     *   originalPost: { title: '...', content: '...', keyPoints: [] },
     *   platform: 'instagram',
     *   variant: 'summary',
     *   options: { includeHashtags: true, includeEmoji: true }
     * })
     * 
     * if (result.success) {
     *   console.log(result.data.posts[0].content)
     * }
     * ```
     */
    async transform(
      input: SNSTransformInput,
      client: AIClient = defaultClient
    ): Promise<AIResponse<SNSTransformOutput>> {
      // 입력 검증
      const validated = snsTransformInputSchema.parse(input)
      
      // AI 요청
      return client.request<SNSTransformInput, SNSTransformOutput>({
        feature: 'sns-transform',
        input: validated,
      })
    },

    /**
     * 프롬프트만 생성 (디버깅/테스트용)
     */
    buildPrompts: buildSNSPrompts,

    /**
     * 플랫폼별 메타데이터
     */
    meta: SNS_PLATFORM_META,

    /**
     * 변환 유형별 설명
     */
    variantDescriptions: SNS_VARIANT_DESCRIPTIONS,

    /**
     * Zod 스키마 접근
     */
    schemas: {
      input: snsTransformInputSchema,
      output: snsTransformOutputSchema,
      platform: snsPlatformSchema,
      variant: snsVariantSchema,
    },
  },
}

/**
 * Correction Type Guard
 * 문자열이 유효한 CorrectionType인지 확인
 */
export function isCorrectionType(value: string): value is CorrectionType {
  return ['grammar', 'style', 'rewrite'].includes(value)
}

/**
 * SNS Platform Type Guard
 * 문자열이 유효한 SNSPlatform인지 확인
 */
export function isSNSPlatform(value: string): value is SNSPlatform {
  return ['threads', 'instagram', 'linkedin', 'twitter', 'facebook', 'daangn'].includes(value)
}
