/**
 * Draft Edit Server Actions - Correction
 * 
 * @see PROMPT_GUIDE.md Section 3 - Draft Correction
 * 
 * "use server" 지시어로 서버에서만 실행됨
 * lib/ai 계층을 통해 AI 기능 호출
 */

'use server'

import { ai, correctionInputSchema } from '@/lib/ai'
import type { 
  CorrectionInput, 
  CorrectionOutput, 
  CorrectionType,
  AIResponse 
} from '@/lib/ai'
import { ZodError } from 'zod'

// ───────────────────────────────────────────────
// 에러 메시지 상수
// ───────────────────────────────────────────────

const ERROR_MESSAGES = {
  EMPTY_TEXT: '교정할 텍스트를 입력해주세요.',
  TEXT_TOO_SHORT: '텍스트가 너무 짧습니다. (최소 5자 이상)',
  TEXT_TOO_LONG: '텍스트가 너무 깁니다. (최대 5000자)',
  INVALID_TYPE: '지원하지 않는 교정 유형입니다.',
  MISSING_CONTEXT: '프로젝트 컨텍스트(타겟 독자, 톤)가 필요합니다.',
  VALIDATION_FAILED: '입력 데이터 검증에 실패했습니다.',
  AI_PROCESSING_ERROR: 'AI 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
} as const

// ───────────────────────────────────────────────
// 입력 검증 유틸리티
// ───────────────────────────────────────────────

function validateInput(input: CorrectionInput): { valid: true } | { valid: false; message: string } {
  // 빈 텍스트 체크
  if (!input.originalText || input.originalText.trim().length === 0) {
    return { valid: false, message: ERROR_MESSAGES.EMPTY_TEXT }
  }

  // 최소 길이 체크
  if (input.originalText.trim().length < 5) {
    return { valid: false, message: ERROR_MESSAGES.TEXT_TOO_SHORT }
  }

  // 최대 길이 체크
  if (input.originalText.length > 5000) {
    return { valid: false, message: ERROR_MESSAGES.TEXT_TOO_LONG }
  }

  // correctionType 검증
  const validTypes: CorrectionType[] = ['grammar', 'style', 'rewrite']
  if (!validTypes.includes(input.correctionType)) {
    return { valid: false, message: ERROR_MESSAGES.INVALID_TYPE }
  }

  // context 검증
  if (!input.context?.targetAudience || !input.context?.tone) {
    return { valid: false, message: ERROR_MESSAGES.MISSING_CONTEXT }
  }

  return { valid: true }
}

function formatZodError(error: ZodError): string {
  const issues = error.issues
  if (issues.length === 0) return ERROR_MESSAGES.VALIDATION_FAILED

  const firstIssue = issues[0]
  const path = firstIssue.path.join('.')
  
  // 사용자 친화적인 메시지 매핑
  const messageMap: Record<string, string> = {
    'originalText': '교정할 텍스트가 올바르지 않습니다.',
    'correctionType': '교정 유형을 선택해주세요.',
    'context.targetAudience': '타겟 독자 정보가 필요합니다.',
    'context.tone': '글 톤 정보가 필요합니다.',
  }

  return messageMap[path] || firstIssue.message || ERROR_MESSAGES.VALIDATION_FAILED
}

// ───────────────────────────────────────────────
// Correction Actions
// ───────────────────────────────────────────────

/**
 * 텍스트 교정 요청
 * 
 * CorrectionPanel, FloatingToolbar에서 호출됨
 * 
 * @param input - CorrectionInput
 * @returns AIResponse<CorrectionOutput>
 * 
 * @example
 * ```typescript
 * // CorrectionPanel.tsx
 * const response = await correctText({
 *   originalText: selectedText,
 *   correctionType: 'grammar',
 *   context: {
 *     sectionHeading: '소개',
 *     targetAudience: '개발자',
 *     tone: 'professional'
 *   }
 * })
 * 
 * if (response.success) {
 *   setCorrectedText(response.data.correctedText)
 * }
 * ```
 */
export async function correctText(
  input: CorrectionInput
): Promise<AIResponse<CorrectionOutput>> {
  // 1. 사전 검증 (사용자 친화적 에러 메시지)
  const preValidation = validateInput(input)
  if (!preValidation.valid) {
    return {
      success: false,
      error: {
        code: 'PREVALIDATION_ERROR',
        message: preValidation.message,
        retryable: false,
      },
      metadata: {
        model: 'error',
        latencyMs: 0,
        cached: false,
      },
    }
  }

  try {
    // 2. Zod 스키마 검증
    const validated = correctionInputSchema.parse(input)
    
    // 3. AI 요청
    const response = await ai.correction.correct(validated)
    
    // 4. 응답 검증
    if (!response.success) {
      return {
        success: false,
        error: {
          code: response.error?.code || 'AI_ERROR',
          message: response.error?.message || ERROR_MESSAGES.AI_PROCESSING_ERROR,
          retryable: response.error?.retryable ?? true,
        },
        metadata: response.metadata,
      }
    }

    // 5. 결과 데이터 검증
    if (!response.data || !response.data.correctedText) {
      return {
        success: false,
        error: {
          code: 'EMPTY_RESULT',
          message: ERROR_MESSAGES.AI_PROCESSING_ERROR,
          retryable: true,
        },
        metadata: response.metadata,
      }
    }

    return response
  } catch (error) {
    // Zod 검증 오류
    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: formatZodError(error),
          retryable: false,
        },
        metadata: {
          model: 'error',
          latencyMs: 0,
          cached: false,
        },
      }
    }

    // 기타 오류
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        retryable: true,
      },
      metadata: {
        model: 'error',
        latencyMs: 0,
        cached: false,
      },
    }
  }
}

/**
 * 간편 교정 - 최소한의 파라미터로 호출
 * 
 * FloatingToolbar의 quick action용
 * 
 * @param originalText - 원본 텍스트
 * @param correctionType - 교정 유형
 * @param targetAudience - 타겟 독자 (기본값: '일반 독자')
 * @param tone - 글 톤 (기본값: 'friendly')
 * @returns AIResponse<CorrectionOutput>
 */
export async function quickCorrect(
  originalText: string,
  correctionType: CorrectionType,
  targetAudience: string = '일반 독자',
  tone: string = 'friendly'
): Promise<AIResponse<CorrectionOutput>> {
  return correctText({
    originalText,
    correctionType,
    context: {
      targetAudience,
      tone,
    },
  })
}

// ───────────────────────────────────────────────
// 향후 확장 (TODO)
// ───────────────────────────────────────────────

/**
 * TODO: shorten - 내용 축약
 * 원문의 핵심만 남기고 간결하게
 */
// export async function shortenText(input: CorrectionInput) { ... }

/**
 * TODO: expand - 내용 확장
 * 상세 설명과 예시 추가
 */
// export async function expandText(input: CorrectionInput) { ... }

/**
 * TODO: tone - 톤 조정
 * formal/casual 전환
 */
// export async function adjustTone(input: CorrectionInput, targetTone: string) { ... }
