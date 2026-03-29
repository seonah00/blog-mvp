/**
 * Image Prompt Zod Schemas
 * 
 * 런타임 타입 검증 및 Mock 응답 생성
 */

import { z } from 'zod'
import type { ImagePromptInput, ImagePromptOutput, ImagePurpose } from '../types'
import { STYLE_KEYWORDS, PURPOSE_GUIDE } from '../prompts/image'

// ───────────────────────────────────────────────
// Enum Schemas
// ───────────────────────────────────────────────

export const imageStyleSchema = z.enum(['realistic', 'illustration', 'minimal', '3d'])
export const imageRatioSchema = z.enum(['16:9', '4:3', '1:1', '9:16'])
export const imagePurposeSchema = z.enum(['hero', 'section', 'detail', 'thumbnail'])

// ───────────────────────────────────────────────
// Input Schema
// ───────────────────────────────────────────────

export const imagePromptInputSchema = z.object({
  section: z.object({
    heading: z.string().min(1, '섹션 제목이 필요합니다'),
    content: z.string().min(1, '섹션 내용이 필요합니다'),
  }),
  project: z.object({
    topic: z.string().min(1, '프로젝트 주제가 필요합니다'),
    tone: z.string().min(1, '톤 설정이 필요합니다'),
  }),
  imageStyle: imageStyleSchema,
  aspectRatio: imageRatioSchema,
  variant: imagePurposeSchema,
})

// ───────────────────────────────────────────────
// Output Schemas
// ───────────────────────────────────────────────

export const generatedImagePromptSchema = z.object({
  purpose: imagePurposeSchema,
  prompt: z.string().min(10, '프롬프트는 10자 이상이어야 합니다'),
  negativePrompt: z.string(),
  aspectRatio: z.string(),
  recommendedModel: z.string(),
})

export const imagePromptOutputSchema = z.object({
  prompts: z.array(generatedImagePromptSchema).min(1),
  colorPalette: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/, '유효한 HEX 색상')),
  composition: z.string(),
})

// ───────────────────────────────────────────────
// Mock Generator
// ───────────────────────────────────────────────

/**
 * ImagePromptInput을 기반으로 Mock Output 생성
 */
export function createMockImagePromptOutput(input: ImagePromptInput): ImagePromptOutput {
  const { section, project, imageStyle, aspectRatio, variant } = input

  // 색상 팔레트 (프로젝트 톤에 따라 다양하게)
  const palettes: Record<string, string[]> = {
    professional: ['#2563EB', '#1E40AF', '#F8FAFC', '#64748B'],
    friendly: ['#F59E0B', '#10B981', '#FEF3C7', '#D1FAE5'],
    casual: ['#8B5CF6', '#EC4899', '#F3E8FF', '#FCE7F3'],
    expert: ['#0F172A', '#334155', '#94A3B8', '#E2E8F0'],
    persuasive: ['#DC2626', '#EA580C', '#FEE2E2', '#FFEDD5'],
  }

  const palette = palettes[project.tone] || palettes.professional

  // 구도 설명
  const compositionGuides: Record<ImagePurpose, string> = {
    hero: 'centered subject, dramatic lighting, wide angle, strong visual impact',
    section: 'balanced composition, clear focal point, supporting visual',
    detail: 'close-up view, high detail, technical precision, explanatory',
    thumbnail: 'bold composition, high contrast, eye-catching, small-scale optimized',
  }

  return {
    prompts: [
      {
        purpose: variant,
        prompt: `${STYLE_KEYWORDS[imageStyle]}, ${section.heading}, ${project.topic}, ${project.tone} tone, high quality, blog illustration`,
        negativePrompt: 'blurry, low quality, distorted, amateur, watermark, text, letters, ugly, deformed',
        aspectRatio,
        recommendedModel: 'dall-e-3',
      },
    ],
    colorPalette: palette,
    composition: compositionGuides[variant],
  }
}
