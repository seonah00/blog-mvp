/**
 * Correction Prompts
 * 
 * @see PROMPT_GUIDE.md Section 3 - Draft Correction
 * 
 * 구현 범위:
 * - grammar: 문법 교정 (Section 3.1)
 * - style: 스타일 개선 (Section 3.2)
 * - rewrite: 섹션 재작성 (Section 3.3)
 * 
 * TODO: shorten, expand, tone 향후 확장
 */

import type { CorrectionInput, CorrectionType } from '../types'

// ───────────────────────────────────────────────
// 공통 시스템 프롬프트 기본 구조
// ───────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `
당신은 전문 콘텐츠 에디터입니다. 제공된 텍스트를 지시사항에 따라 교정/개선하세요.

## 출력 형식 (JSON)
반드시 다음 JSON 형식으로 응답하세요:
{
  "correctedText": "교정된 전체 텍스트",
  "changes": [
    {
      "type": "grammar|wording|structure|content",
      "original": "원본 텍스트",
      "suggestion": "변경 제안",
      "reason": "변경 이유"
    }
  ],
  "confidence": 0.95
}

## 규칙
1. 원문의 의도와 핵심 메시지는 유지하세요
2. 자연스러운 한국어 표현을 사용하세요
3. 변경 사항과 이유를 구체적으로 설명하세요
4. confidence는 0-1 사이 값으로 변경 확신도를 표현하세요
5. JSON 외의 추가 설명은 포함하지 마세요
`

// ───────────────────────────────────────────────
// CorrectionType별 시스템 프롬프트
// @see PROMPT_GUIDE.md Section 3.1, 3.2, 3.3
// ───────────────────────────────────────────────

const TYPE_SYSTEM_PROMPTS: Record<CorrectionType, string> = {
  grammar: `
## 문법 교정 원칙 (Section 3.1)
- 문법, 맞춤법, 문장 구조 오류를 교정하세요
- 능동태를 우선적으로 사용하세요
- 불필요한 수동태를 능동태로 변경하세요
- 자연스러운 한국어 표현으로 개선하세요
- 어려운 한자어나 외래어는 쉬운 표현으로 바꾸세요
- 문장 부호 사용을 교정하세요
`,

  style: `
## 스타일 개선 원칙 (Section 3.2)
- 문장을 더 간결하고 명확하게 만드세요
- 전문 용어는 적절히 설명을 덧붙이세요
- 긴 문장은 2-3개의 짧은 문장으로 나누세요
- bullet point 사용을 고려하세요
- 독자의 관심을 끄는 훅(hook)을 추가하세요
- 불필요한 반복과 수식어를 제거하세요
`,

  rewrite: `
## 섹션 재작성 원칙 (Section 3.3)
- 원문의 핵심 메시지는 유지하되 표현을 새롭게 하세요
- 타겟 독자에게 더 효과적인 접근 방식을 사용하세요
- 구체적인 예시와 데이터를 포함하세요
- 설정된 톤을 일관되게 적용하세요
- 섹션의 목적에 맞게 구조를 재구성하세요
`,
}

// ───────────────────────────────────────────────
// User Prompt 템플릿 빌더
// ───────────────────────────────────────────────

function buildUserPrompt(input: CorrectionInput): string {
  const parts: string[] = []

  // 원문
  parts.push(`[원문]\n${input.originalText}`)

  // 컨텍스트
  if (input.context.sectionHeading) {
    parts.push(`\n[섹션 제목]\n${input.context.sectionHeading}`)
  }
  parts.push(`\n[타겟 독자]\n${input.context.targetAudience}`)
  parts.push(`\n[현재 톤]\n${input.context.tone}`)

  // 추가 지시사항
  if (input.instruction) {
    parts.push(`\n[추가 지시사항]\n${input.instruction}`)
  }

  return parts.join('')
}

// ───────────────────────────────────────────────
// Prompt Builder
// ───────────────────────────────────────────────

export interface CorrectionPrompts {
  /** 시스템 프롬프트 (역할/규칙 정의) */
  system: string
  /** 사용자 프롬프트 (실제 입력 데이터) */
  user: string
}

/**
 * CorrectionInput을 기반으로 시스템/유저 프롬프트 생성
 * 
 * @param input - CorrectionInput
 * @returns CorrectionPrompts { system, user }
 * 
 * @example
 * const prompts = buildCorrectionPrompts({
 *   originalText: '이것은 예시 문장입니다.',
 *   correctionType: 'grammar',
 *   context: { targetAudience: '개발자', tone: 'professional' }
 * })
 * 
 * // prompts.system: 문법 교정 역할 정의
 * // prompts.user: 원문 + 컨텍스트 정보
 */
export function buildCorrectionPrompts(input: CorrectionInput): CorrectionPrompts {
  const typeSpecificPrompt = TYPE_SYSTEM_PROMPTS[input.correctionType]
  const systemPrompt = `${BASE_SYSTEM_PROMPT}\n${typeSpecificPrompt}`.trim()
  const userPrompt = buildUserPrompt(input)

  return {
    system: systemPrompt,
    user: userPrompt,
  }
}

// ───────────────────────────────────────────────
// CorrectionType 메타데이터
// ───────────────────────────────────────────────

export interface CorrectionTypeMeta {
  /** 한글 이름 */
  name: string
  /** 설명 */
  description: string
  /** 예시 */
  example: string
  /** 아이콘 (Lucide 아이콘명) */
  icon: string
}

/**
 * CorrectionType별 메타데이터
 * UI 표시용
 */
export const CORRECTION_TYPE_META: Record<CorrectionType, CorrectionTypeMeta> = {
  grammar: {
    name: '문법 교정',
    description: '문법, 맞춤법, 문장 구조를 교정합니다',
    example: '"이것은 좋은 예시이다." → "이것은 좋은 예시입니다."',
    icon: 'CheckCircle',
  },
  style: {
    name: '스타일 개선',
    description: '가독성과 설득력을 높입니다',
    example: '긴 문장 분리, 불필요한 수식어 제거',
    icon: 'Sparkles',
  },
  rewrite: {
    name: '다시 쓰기',
    description: '내용은 유지하되 새롭게 작성합니다',
    example: '다른 각도에서 접근, 구체적 예시 포함',
    icon: 'RefreshCw',
  },
}

// ───────────────────────────────────────────────
// 향후 확장용 (TODO)
// ───────────────────────────────────────────────

/**
 * TODO: 향후 추가될 CorrectionType
 * - shorten: 내용 축약 (핵심만 남기고 간결하게)
 * - expand: 내용 확장 (상세 설명 및 예시 추가)
 * - tone: 톤 조정 (formal/casual 전환)
 */
export type FutureCorrectionType = 'shorten' | 'expand' | 'tone'
