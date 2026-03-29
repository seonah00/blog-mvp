/**
 * Image Generation Server Actions
 * 
 * @see PROMPT_GUIDE.md Section 4 - Image Prompt 생성
 */

'use server'

import { ai, imagePromptInputSchema } from '@/lib/ai'
import type { 
  ImagePromptInput, 
  ImagePromptOutput,
  ImageStyle,
  ImageRatio,
  ImagePurpose,
  AIResponse 
} from '@/lib/ai'
import { ZodError } from 'zod'

// ───────────────────────────────────────────────
// 에러 메시지
// ───────────────────────────────────────────────

const ERROR_MESSAGES = {
  EMPTY_BLOCKS: '이미지를 생성할 블록을 선택해주세요.',
  NO_CONTENT: '선택된 블록에 내용이 없습니다.',
  INVALID_STYLE: '지원하지 않는 이미지 스타일입니다.',
  INVALID_RATIO: '지원하지 않는 이미지 비율입니다.',
  GENERATION_FAILED: '이미지 프롬프트 생성에 실패했습니다.',
} as const

// ───────────────────────────────────────────────
// 입력 파라미터 타입
// ───────────────────────────────────────────────

export interface GenerateImageBlock {
  id: string
  heading: string
  content: string
}

export interface GenerateImagePromptsParams {
  projectId: string
  blocks: GenerateImageBlock[]
  style: ImageStyle
  ratio: ImageRatio
  purpose?: ImagePurpose
}

// ───────────────────────────────────────────────
// Zod 에러 메시지 포맷터
// ───────────────────────────────────────────────

function formatZodError(error: ZodError): string {
  const issues = error.issues
  if (issues.length === 0) return '입력 데이터 검증에 실패했습니다.'

  const firstIssue = issues[0]
  const path = firstIssue.path.join('.')
  
  const messageMap: Record<string, string> = {
    'section.heading': '섹션 제목이 필요합니다.',
    'section.content': '섹션 내용이 필요합니다.',
    'project.topic': '프로젝트 주제가 필요합니다.',
    'project.tone': '글 톤 정보가 필요합니다.',
    'imageStyle': '이미지 스타일을 선택해주세요.',
    'aspectRatio': '이미지 비율을 선택해주세요.',
    'variant': '이미지 용도를 선택해주세요.',
  }

  return messageMap[path] || firstIssue.message || '입력 데이터가 올바르지 않습니다.'
}

// ───────────────────────────────────────────────
// 블록 기반 이미지 생성 (/images)
// ───────────────────────────────────────────────

/**
 * 선택된 블록들에 대한 이미지 프롬프트 생성
 * 
 * @param params - projectId, blocks, style, ratio, purpose
 * @returns AIResponse<ImagePromptOutput>[] - 블록별 결과
 */
export async function generateImagePrompts(
  params: GenerateImagePromptsParams
): Promise<AIResponse<ImagePromptOutput>[]> {
  // 입력 검증
  if (!params.blocks || params.blocks.length === 0) {
    return [{
      success: false,
      error: { 
        code: 'EMPTY_BLOCKS', 
        message: ERROR_MESSAGES.EMPTY_BLOCKS, 
        retryable: false 
      },
      metadata: { model: 'error', latencyMs: 0, cached: false },
    }]
  }

  // 각 블록별로 프롬프트 생성
  const promises = params.blocks.map(async (block) => {
    // 빈 내용 체크
    if (!block.content.trim()) {
      return {
        success: false,
        error: {
          code: 'NO_CONTENT',
          message: `"${block.heading}" 블록에 내용이 없습니다.`,
          retryable: false,
        },
        metadata: { model: 'error', latencyMs: 0, cached: false },
      } as AIResponse<ImagePromptOutput>
    }

    const input: ImagePromptInput = {
      section: {
        heading: block.heading,
        content: block.content,
      },
      project: {
        topic: '블로그 주제',  // TODO: project store에서 조회
        tone: 'friendly',      // TODO: project store에서 조회
      },
      imageStyle: params.style,
      aspectRatio: params.ratio,
      variant: params.purpose || 'section',
    }

    try {
      const validated = imagePromptInputSchema.parse(input)
      return ai.image.generatePrompts(validated)
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: formatZodError(error),
            retryable: false,
          },
          metadata: { model: 'error', latencyMs: 0, cached: false },
        } as AIResponse<ImagePromptOutput>
      }
      throw error
    }
  })

  return Promise.all(promises)
}

// ───────────────────────────────────────────────
// 단순 모드 이미지 생성 (/images/simple)
// ───────────────────────────────────────────────

/**
 * 모든 블록을 통합한 단일 이미지 프롬프트 생성
 * 
 * /images/simple 페이지용
 * 
 * @param params - projectId, blocks, style, ratio, purpose
 * @returns AIResponse<ImagePromptOutput> - 단일 결과
 */
export async function generateSimpleImagePrompt(
  params: GenerateImagePromptsParams
): Promise<AIResponse<ImagePromptOutput>> {
  // 입력 검증
  if (!params.blocks || params.blocks.length === 0) {
    return {
      success: false,
      error: { 
        code: 'EMPTY_BLOCKS', 
        message: ERROR_MESSAGES.EMPTY_BLOCKS, 
        retryable: false 
      },
      metadata: { model: 'error', latencyMs: 0, cached: false },
    }
  }

  // 모든 블록 내용 통합
  const combinedHeading = params.blocks.map(b => b.heading).join(' / ')
  const combinedContent = params.blocks.map(b => b.content).join('\n\n')

  if (!combinedContent.trim()) {
    return {
      success: false,
      error: {
        code: 'NO_CONTENT',
        message: ERROR_MESSAGES.NO_CONTENT,
        retryable: false,
      },
      metadata: { model: 'error', latencyMs: 0, cached: false },
    }
  }

  const input: ImagePromptInput = {
    section: {
      heading: combinedHeading,
      content: combinedContent,
    },
    project: {
      topic: '블로그 주제',  // TODO: project store에서 조회
      tone: 'friendly',      // TODO: project store에서 조회
    },
    imageStyle: params.style,
    aspectRatio: params.ratio,
    variant: params.purpose || 'hero',
  }

  try {
    const validated = imagePromptInputSchema.parse(input)
    return ai.image.generatePrompts(validated)
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: formatZodError(error),
          retryable: false,
        },
        metadata: { model: 'error', latencyMs: 0, cached: false },
      }
    }
    return {
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: ERROR_MESSAGES.GENERATION_FAILED,
        retryable: true,
      },
      metadata: { model: 'error', latencyMs: 0, cached: false },
    }
  }
}
