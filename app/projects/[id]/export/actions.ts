/**
 * Export Server Actions - SNS Transform
 * 
 * @see PROMPT_GUIDE.md Section 5 - Export Studio용 SNS 변환
 */

'use server'

import { ai, snsTransformInputSchema } from '@/lib/ai'
import type { 
  SNSTransformInput, 
  SNSTransformOutput,
  SNSPlatform,
  SNSVariant,
  AIResponse 
} from '@/lib/ai'
import { ZodError } from 'zod'

// ───────────────────────────────────────────────
// 에러 메시지
// ───────────────────────────────────────────────

const ERROR_MESSAGES = {
  NO_PLATFORMS: '변환할 SNS 플랫폼을 선택해주세요.',
  NO_CONTENT: '변환할 콘텐츠가 없습니다.',
  INVALID_PLATFORM: '지원하지 않는 플랫폼입니다.',
  TRANSFORM_FAILED: 'SNS 변환에 실패했습니다.',
} as const

// ───────────────────────────────────────────────
// 입력 파라미터 타입
// ───────────────────────────────────────────────

export interface TransformForSNSParams {
  projectId: string
  draft: {
    title: string
    content: string
  }
  platforms: SNSPlatform[]
  variant: SNSVariant
  options: {
    includeHashtags: boolean
    includeEmoji: boolean
    cta?: string
  }
}

// ───────────────────────────────────────────────
// Zod 에러 포맷터
// ───────────────────────────────────────────────

function formatZodError(error: ZodError): string {
  const issues = error.issues
  if (issues.length === 0) return '입력 데이터 검증에 실패했습니다.'

  const firstIssue = issues[0]
  const path = firstIssue.path.join('.')
  
  const messageMap: Record<string, string> = {
    'originalPost.title': '제목이 필요합니다.',
    'originalPost.content': '내용이 필요합니다.',
    'platform': '플랫폼을 선택해주세요.',
    'variant': '변환 유형을 선택해주세요.',
    'options.includeHashtags': '해시태그 옵션이 필요합니다.',
    'options.includeEmoji': '이모지 옵션이 필요합니다.',
  }

  return messageMap[path] || firstIssue.message || '입력 데이터가 올바르지 않습니다.'
}

// ───────────────────────────────────────────────
// 다중 플랫폼 변환
// ───────────────────────────────────────────────

/**
 * 블로그 글을 여러 SNS 플랫폼용 콘텐츠로 변환
 * 
 * @param params - projectId, draft, platforms, variant, options
 * @returns AIResponse<SNSTransformOutput>[] - 플랫폼별 결과
 * 
 * @example
 * ```typescript
 * const results = await transformForSNS({
 *   projectId: 'proj_123',
 *   draft: { title: '...', content: '...' },
 *   platforms: ['instagram', 'threads'],
 *   variant: 'summary',
 *   options: { includeHashtags: true, includeEmoji: true }
 * })
 * 
 * // results[0] = Instagram 결과
 * // results[1] = Threads 결과
 * ```
 */
export async function transformForSNS(
  params: TransformForSNSParams
): Promise<AIResponse<SNSTransformOutput>[]> {
  // 입력 검증
  if (!params.platforms || params.platforms.length === 0) {
    return [{
      success: false,
      error: { 
        code: 'NO_PLATFORMS', 
        message: ERROR_MESSAGES.NO_PLATFORMS, 
        retryable: false 
      },
      metadata: { model: 'error', latencyMs: 0, cached: false },
    }]
  }

  if (!params.draft.content.trim()) {
    return [{
      success: false,
      error: { 
        code: 'NO_CONTENT', 
        message: ERROR_MESSAGES.NO_CONTENT, 
        retryable: false 
      },
      metadata: { model: 'error', latencyMs: 0, cached: false },
    }]
  }

  // 키 포인트 추출 (간단한 구현 - 향후 AI로 개선 가능)
  const keyPoints = extractKeyPoints(params.draft.content)

  // 각 플랫폼별로 변환
  const promises = params.platforms.map(async (platform) => {
    const input: SNSTransformInput = {
      originalPost: {
        title: params.draft.title,
        content: params.draft.content,
        keyPoints,
      },
      platform,
      variant: params.variant,
      options: params.options,
    }

    try {
      const validated = snsTransformInputSchema.parse(input)
      return ai.sns.transform(validated)
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
        } as AIResponse<SNSTransformOutput>
      }
      throw error
    }
  })

  return Promise.all(promises)
}

// ───────────────────────────────────────────────
// 단일 플랫폼 변환
// ───────────────────────────────────────────────

/**
 * 단일 플랫폼 변환 (간편용)
 * 
 * @param projectId - 프로젝트 ID
 * @param draft - 원문 (title, content)
 * @param platform - 대상 플랫폼
 * @param variant - 변환 유형
 * @param options - 옵션 (hashtags, emoji, cta)
 * @returns AIResponse<SNSTransformOutput>
 */
export async function transformForSinglePlatform(
  projectId: string,
  draft: { title: string; content: string },
  platform: SNSPlatform,
  variant: SNSVariant,
  options: { includeHashtags: boolean; includeEmoji: boolean; cta?: string }
): Promise<AIResponse<SNSTransformOutput>> {
  const results = await transformForSNS({
    projectId,
    draft,
    platforms: [platform],
    variant,
    options,
  })

  return results[0]
}

// ───────────────────────────────────────────────
// 유틸리티 함수
// ───────────────────────────────────────────────

/**
 * 간단한 키 포인트 추출 (Mock)
 * 향후 AI 기반 키 포인트 추출로 개선 가능
 */
function extractKeyPoints(content: string): string[] {
  // 문장 단위로 분리 후 중요도 판단 (간단한 휴리스틱)
  const sentences = content
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200)

  // 처음 3개 문장을 키 포인트로 사용
  return sentences.slice(0, 3).map(s => s.trim())
}

// ───────────────────────────────────────────────
// 향후 확장
// ───────────────────────────────────────────────

/**
 * TODO: AI 기반 키 포인트 추출
 * import { extractKeyPointsWithAI } from '@/lib/ai'
 * 
 * const keyPoints = await extractKeyPointsWithAI(content)
 */

/**
 * TODO: 스케줄링 정보 생성
 * 각 플랫폼별 최적 포스팅 시간 계산
 */
// export async function calculateOptimalPostingTimes(platforms: SNSPlatform[]): Promise<Record<SNSPlatform, string>> { ... }
