/**
 * Correction Zod Schemas + Mock Output Generator
 * 
 * 런타임 타입 검증 및 품질 있는 Mock 응답 생성
 */

import { z } from 'zod'
import type { CorrectionInput, CorrectionOutput, CorrectionChange, CorrectionType } from '../types'

// ───────────────────────────────────────────────
// Zod Schemas
// ───────────────────────────────────────────────

export const correctionTypeSchema = z.enum(['grammar', 'style', 'rewrite'])

export const correctionChangeSchema = z.object({
  type: z.enum(['grammar', 'wording', 'structure', 'content']),
  original: z.string(),
  suggestion: z.string(),
  reason: z.string(),
}) satisfies z.ZodType<CorrectionChange>

export const correctionOutputSchema = z.object({
  correctedText: z.string().min(1, '교정된 텍스트는 비어있을 수 없습니다'),
  changes: z.array(correctionChangeSchema),
  confidence: z.number().min(0).max(1),
}) satisfies z.ZodType<CorrectionOutput>

export const correctionInputSchema = z.object({
  originalText: z.string().min(1, '원본 텍스트는 비어있을 수 없습니다'),
  correctionType: correctionTypeSchema,
  context: z.object({
    sectionHeading: z.string().optional(),
    targetAudience: z.string(),
    tone: z.string(),
  }),
  instruction: z.string().optional(),
})

// ───────────────────────────────────────────────
// 파싱 유틸리티
// ───────────────────────────────────────────────

export function parseCorrectionOutput(rawResponse: string): CorrectionOutput {
  let cleaned = rawResponse.trim()
  
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim()
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch (error) {
    throw new Error(`Failed to parse correction output as JSON`)
  }

  const result = correctionOutputSchema.safeParse(parsed)
  
  if (!result.success) {
    throw new Error(`Invalid correction output format`)
  }

  return result.data
}

// ───────────────────────────────────────────────
// 품질 있는 Mock Output Generator
// 실제 AI처럼 보이는 텍스트 변환
// ───────────────────────────────────────────────

/**
 * Grammar 교정 Mock
 * 실제 AI처럼 보이는 문법/어법 개선
 */
function generateGrammarMock(input: CorrectionInput): CorrectionOutput {
  const { originalText } = input
  const changes: CorrectionChange[] = []
  let correctedText = originalText

  // 1. 종결어미 교정 (~이다 → ~입니다)
  if (originalText.match(/[가-힣]다[.\s]*$/)) {
    const newText = originalText.replace(/([가-힣])다([.\s]*)$/, '$1습니다$2')
    if (newText !== correctedText) {
      changes.push({
        type: 'grammar',
        original: originalText.slice(-10),
        suggestion: newText.slice(-12),
        reason: '격식체 문장은 ~습니다로 종결하는 것이 적절합니다',
      })
      correctedText = newText
    }
  }

  // 2. 수동태 → 능동태
  if (correctedText.includes('에 의해') || correctedText.includes('에 의하여')) {
    const before = correctedText
    correctedText = correctedText
      .replace(/에 의해/g, '이/가')
      .replace(/에 의하여/g, '이/가')
    if (correctedText !== before) {
      changes.push({
        type: 'wording',
        original: before.slice(0, 30) + '...',
        suggestion: correctedText.slice(0, 30) + '...',
        reason: '능동태는 수동태보다 직접적이고 명확한 표현입니다',
      })
    }
  }

  // 3. 중복 표현 제거
  const dupPatterns = [
    { pattern: /(?:매우|굉장히|정말|매우) (?:매우|굉장히|정말)/g, desc: '중복된 부사' },
    { pattern: /(?:다양한|여러) (?:다양한|여러)/g, desc: '중복된 수식어' },
  ]
  
  dupPatterns.forEach(({ pattern, desc }) => {
    if (pattern.test(correctedText)) {
      const before = correctedText
      correctedText = correctedText.replace(pattern, (match) => match.split(' ')[0])
      if (correctedText !== before) {
        changes.push({
          type: 'wording',
          original: before.match(pattern)?.[0] || desc,
          suggestion: '중복 제거',
          reason: `${desc}는 하나만 사용하는 것이 간결합니다`,
        })
      }
    }
  })

  // 변경 사항이 없으면 기본 메시지
  if (changes.length === 0) {
    changes.push({
      type: 'grammar',
      original: '전체 문장',
      suggestion: '문법적으로 큰 문제가 없습니다. 미세한 표현만 조정했습니다.',
      reason: '원문의 품질이 양호하여 최소한의 수정만 적용했습니다',
    })
  }

  return {
    correctedText: correctedText || originalText,
    changes,
    confidence: changes.length > 0 ? 0.92 : 0.98,
  }
}

/**
 * Style 개선 Mock
 * 가독성과 설득력 향상
 */
function generateStyleMock(input: CorrectionInput): CorrectionOutput {
  const { originalText } = input
  const changes: CorrectionChange[] = []

  // 원본 분석
  const sentenceCount = originalText.split(/[.!?]+/).filter(s => s.trim()).length
  const avgSentenceLength = originalText.length / (sentenceCount || 1)

  let correctedText = originalText

  // 1. 긴 문장 분리 (50자 이상)
  if (avgSentenceLength > 50) {
    changes.push({
      type: 'structure',
      original: `평균 ${Math.round(avgSentenceLength)}자의 긴 문장`,
      suggestion: '30-40자 단위로 문장 분리',
      reason: '적절한 문장 길이는 가독성을 높입니다',
    })
    correctedText = correctedText
      .replace(/([가-힣]{30,50}[^.]*?),\s*/g, '$1. ')
      .replace(/([가-힣]{50,}[^.]*?)(고|며|서|지만|그러나|따라서)\s+/g, '$1. $2 ')
  }

  // 2. 추상적 표현 구체화
  const abstractPatterns = [
    { from: /많은/g, to: '수많은', example: '많은' },
    { from: /좋은/g, to: '효과적인', example: '좋은' },
    { from: /중요한/g, to: '핵심적인', example: '중요한' },
  ]

  abstractPatterns.forEach(({ from, to, example }) => {
    if (from.test(correctedText)) {
      correctedText = correctedText.replace(from, to)
      changes.push({
        type: 'wording',
        original: example,
        suggestion: to,
        reason: '구체적인 표현은 독자의 이해를 돕습니다',
      })
    }
  })

  // 3. 훅 추가 (첫 문장)
  const firstSentence = correctedText.split(/[.!?]/)[0]
  if (firstSentence && firstSentence.length < 20 && !firstSentence.includes('?')) {
    correctedText = `"${firstSentence}"에 대해 말씀드리겠습니다. ` + correctedText
    changes.push({
      type: 'content',
      original: firstSentence,
      suggestion: '"' + firstSentence + '"에 대해 말씀드리겠습니다.',
      reason: '독자의 관심을 끄는 훅(hook)으로 시작합니다',
    })
  }

  return {
    correctedText: correctedText || originalText,
    changes: changes.length > 0 ? changes : [{
      type: 'wording',
      original: '전체 문장',
      suggestion: '문장을 더 간결하고 명확하게 개선했습니다',
      reason: '가독성 향상을 위해 표현을 다듬었습니다',
    }],
    confidence: 0.88,
  }
}

/**
 * Rewrite Mock
 * 내용 유지하되 새로운 표현
 */
function generateRewriteMock(input: CorrectionInput): CorrectionOutput {
  const { originalText, context, instruction } = input

  // 핵심 내용 추출 (처음 50자)
  const keyContent = originalText.slice(0, 50)

  // 재작성 프리픽스 (실제 AI처럼 보이게)
  const prefixes = [
    `${context.targetAudience}를 위한 조언입니다. `,
    `${context.tone}한 톤으로 말씀드리자면, `,
    `이 부분은 이렇게 접근해보시면 좋겠습니다. `,
  ]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]

  // instruction 반영
  const suffix = instruction 
    ? ` (${instruction} 관점에서 재구성)` 
    : ''

  const correctedText = prefix + originalText + suffix

  const changes: CorrectionChange[] = [
    {
      type: 'structure',
      original: keyContent + '...',
      suggestion: prefix + keyContent + '...',
      reason: `${context.targetAudience} 관점에서 더 효과적인 접근 방식 적용`,
    },
  ]

  if (instruction) {
    changes.push({
      type: 'content',
      original: '기존 내용',
      suggestion: instruction + ' 관점 추가',
      reason: `추가 지시사항("${instruction}") 반영`,
    })
  }

  return {
    correctedText,
    changes,
    confidence: 0.85,
  }
}

// ───────────────────────────────────────────────
// 메인 Mock Generator
// ───────────────────────────────────────────────

/**
 * 품질 있는 Mock Correction Output 생성
 * 
 * @param input - CorrectionInput
 * @returns CorrectionOutput - 실제 AI처럼 보이는 응답
 */
export function createMockCorrectionOutput(input: CorrectionInput): CorrectionOutput {
  // 입력 검증
  const validated = correctionInputSchema.parse(input)

  switch (validated.correctionType) {
    case 'grammar':
      return generateGrammarMock(validated)
    case 'style':
      return generateStyleMock(validated)
    case 'rewrite':
      return generateRewriteMock(validated)
    default:
      // 향후 확장용 (shorten, expand, tone)
      throw new Error(`Unsupported correction type: ${validated.correctionType}`)
  }
}

/**
 * 안전한 Mock 생성 - 실패 시 fallback 반환
 */
export function safeCreateMockCorrectionOutput(
  input: CorrectionInput
): CorrectionOutput {
  try {
    return createMockCorrectionOutput(input)
  } catch {
    return {
      correctedText: input.originalText,
      changes: [{
        type: 'content',
        original: '처리 실패',
        suggestion: '원문 유지',
        reason: 'Mock 생성 중 오류가 발생했습니다',
      }],
      confidence: 0,
    }
  }
}
