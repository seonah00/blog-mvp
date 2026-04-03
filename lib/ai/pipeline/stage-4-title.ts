/**
 * Stage 4: Title Generation
 * 
 * 본문과 별도 단계로 제목 생성
 * 사용자가 입력한 메인 키워드를 반드시 자연스럽게 포함
 * 본문 핵심 내용과 정합성 검증
 * 기계적인 제목, 키워드 나열형 제목, 과장형 제목 금지
 */

import { generateAiObject } from '../client'
import { z } from 'zod'
import type { StructuredOutline, TitleGenerationResult, TitleCandidate } from './types'
import type { InformationalPipelineInput, RestaurantPipelineInput } from './types'

// 금지 패턴
const FORBIDDEN_PATTERNS = [
  /완벽\s*가이드/,
  /총정리/,
  /무조건/,
  /반드시/,
  /100%/,
  /최고의/,
  /추천/,
  /보장/,
  /필수/,
  /대박/,
]

// 자연스러운 제목 패턴 (정보성 글)
const INFORMATIONAL_TITLE_PATTERNS = [
  (keyword: string, sub: string[]) => `${keyword}, 왜 지금 중요한지 쉽게 정리했어요`,
  (keyword: string, sub: string[]) => sub.length > 0 
    ? `${keyword}를 시작할 때 ${sub[0]}부터 알아보기`
    : `${keyword}를 시작할 때 먼저 알아둘 핵심 포인트`,
  (keyword: string, sub: string[]) => `${keyword}가 필요한 이유를 실제 사례로 풀어보기`,
  (keyword: string, sub: string[]) => `${keyword}를 제대로 이해하는 방법`,
  (keyword: string, sub: string[]) => sub.length > 1
    ? `${sub[0]}와 ${sub[1]} 사이에서 ${keyword} 선택하기`
    : `${keyword}, 어떤 방식이 나에게 맞을지 살펴 보기`,
  (keyword: string, sub: string[]) => `${keyword}를 경험하고 알게 된 점을 공유합니다`,
]

// 자연스러운 제목 패턴 (맛집 글)
const RESTAURANT_TITLE_PATTERNS = [
  (name: string, category: string) => `${name}, ${category} 맛집으로 손꼽히는 이유`,
  (name: string, category: string) => `${name}에서 특별한 식사를 즐기는 방법`,
  (name: string, category: string) => `${category} 찾는다면 ${name} 어떨까요`,
  (name: string, category: string) => `${name} 방문 후기와 주요 포인트`,
]

/**
 * 제목 생성 (정보성 글)
 */
export async function generateTitle(
  outline: StructuredOutline,
  input: InformationalPipelineInput | RestaurantPipelineInput,
  projectType: 'informational' | 'restaurant'
): Promise<TitleGenerationResult> {
  const mainKeyword = projectType === 'informational' 
    ? (input as InformationalPipelineInput).meta.mainKeyword
    : (input as RestaurantPipelineInput).placeProfile.name
  
  const subKeywords = projectType === 'informational'
    ? (input as InformationalPipelineInput).meta.subKeywords
    : [(input as RestaurantPipelineInput).placeProfile.category]

  // 1. AI로 제목 후보 생성
  const candidates = await generateTitleCandidates(outline, mainKeyword, subKeywords, projectType)
  
  // 2. 규칙 기반 후보 추가 (fallback)
  const patternTitles = projectType === 'informational'
    ? INFORMATIONAL_TITLE_PATTERNS.map(p => p(mainKeyword, subKeywords))
    : RESTAURANT_TITLE_PATTERNS.map(p => p(mainKeyword, subKeywords[0] || '맛집'))
  
  const allCandidates: TitleCandidate[] = [
    ...candidates,
    ...patternTitles.map((title, i) => ({
      title,
      score: 70 - i * 5,
      reason: '자연스러운 패턴 제목',
      includesKeyword: title.includes(mainKeyword),
    })),
  ]

  // 3. 품질 검증 및 선택
  const validatedCandidates = allCandidates.map(c => validateTitle(c, mainKeyword, outline))
  
  // 가장 높은 점수의 제목 선택
  const selected = validatedCandidates.sort((a, b) => b.score - a.score)[0]
  
  // 4. 최종 품질 검사
  const checks = performQualityChecks(selected.title, mainKeyword, outline)
  
  // 통과하지 못하면 키워드를 앞에 자연스럽게 추가
  let finalTitle = selected.title
  let qualityStatus: TitleGenerationResult['titleQualityStatus'] = checks.keywordIncluded && checks.noForbiddenWords ? 'pass' : 'fail'
  
  if (!checks.keywordIncluded) {
    finalTitle = `${mainKeyword}, ${selected.title}`
    qualityStatus = 'fixed'
  }

  const result: TitleGenerationResult = {
    candidates: validatedCandidates.map(c => ({ title: c.title, score: c.score, reason: c.reason, includesKeyword: c.includesKeyword })),
    selectedTitle: finalTitle,
    titleKeywordIncluded: finalTitle.includes(mainKeyword),
    titleKeyword: mainKeyword,
    titleQualityStatus: qualityStatus,
    titleQualityReason: selected.reason,
    titleValidationSummary: [
      `메인 키워드 포함: ${finalTitle.includes(mainKeyword) ? 'O' : 'X'}`,
      `제목 길이: ${finalTitle.length}자`,
      `금지어 포함: ${checks.hasForbiddenWords ? 'O (있음)' : 'X (없음)'}`,
      `자연스러움: ${checks.isNatural ? 'O' : 'X'}`,
    ],
    checks: {
      keywordIncluded: checks.keywordIncluded,
      naturalPhrasing: checks.isNatural,
      noForbiddenWords: checks.noForbiddenWords,
      appropriateLength: checks.appropriateLength,
    },
  }

  console.log(`[Stage 4] 제목 생성 완료: "${finalTitle}" (품질: ${qualityStatus})`)
  return result
}

// ============================================
// Helper Functions
// ============================================

async function generateTitleCandidates(
  outline: StructuredOutline,
  mainKeyword: string,
  subKeywords: string[],
  projectType: 'informational' | 'restaurant'
): Promise<Array<TitleCandidate>> {
  const systemPrompt = `당신은 블로그 제목 전문가입니다. 다음 원칙을 반드시 따르세요:

**절대 금지:**
- "완벽 가이드", "총정리", "무조건", "반드시", "추천", "100%", "최고의" 등 과장 표현
- 키워드 나열형 제목 (예: "A B C 모든 것")
- 기계적이거나 어색한 문장

**원칙:**
1. 메인 키워드는 반드시 포함
2. 자연스러운 문장/구 형태
3. 24~42자 권장
4. 독자의 호기심을 자극하되 과장하지 않기

**출력:**
5개의 제목 후보를 JSON 배열로 출력하세요.
[
  { "title": "제목1", "reason": "선택 이유" },
  ...
]`

  const userPrompt = `
메인 키워드: ${mainKeyword}
${subKeywords.length > 0 ? `서브 키워드: ${subKeywords.join(', ')}` : ''}

글 구조:
- 서론: ${outline.intro.goal}
- 본론: ${outline.sections.map(s => s.heading).join(' → ')}
- 결론: ${outline.conclusion.takeaway}

5개의 자연스러운 제목 후보를 만들어주세요.
`.trim()

  try {
    const TitleSchema = z.array(z.object({
      title: z.string(),
      reason: z.string().optional(),
    }))

    const result = await generateAiObject({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      schema: TitleSchema,
    })

    if (result.ok && result.data) {
      const parsed = result.data as Array<{ title: string; reason?: string }>
      return parsed.map((item) => ({
        title: item.title,
        score: 80,
        reason: item.reason || 'AI 생성 제목',
        includesKeyword: item.title.includes(mainKeyword),
      }))
    }
  } catch (error) {
    console.warn('[Stage 4] AI 제목 생성 실패:', error)
  }

  return []
}

function validateTitle(
  candidate: Omit<TitleCandidate, 'includesKeyword'>,
  mainKeyword: string,
  outline: StructuredOutline
): TitleCandidate {
  let score = candidate.score
  const includesKeyword = candidate.title.includes(mainKeyword)
  
  // 키워드 포함 시 보너스
  if (includesKeyword) score += 10
  
  // 길이 검사
  if (candidate.title.length >= 24 && candidate.title.length <= 42) {
    score += 5
  } else if (candidate.title.length > 50) {
    score -= 10
  }
  
  // 금지어 검사
  if (FORBIDDEN_PATTERNS.some(p => p.test(candidate.title))) {
    score -= 20
  }
  
  // 아웃라인과의 연관성
  const outlineText = `${outline.intro.goal} ${outline.sections.map(s => s.heading).join(' ')}`
  const relevanceScore = calculateRelevance(candidate.title, outlineText)
  score += relevanceScore * 10

  return {
    ...candidate,
    score: Math.max(0, Math.min(100, score)),
    includesKeyword,
  }
}

function performQualityChecks(
  title: string,
  mainKeyword: string,
  outline: StructuredOutline
): {
  keywordIncluded: boolean
  isNatural: boolean
  hasForbiddenWords: boolean
  noForbiddenWords: boolean
  appropriateLength: boolean
} {
  const keywordIncluded = title.includes(mainKeyword)
  
  // 자연스러움 체크 (과장 표현 패턴)
  const hasForbiddenWords = FORBIDDEN_PATTERNS.some(p => p.test(title))
  const isNatural = !/(가이드|총정리|완벽)/.test(title) || title.length <= 42
  
  return {
    keywordIncluded,
    isNatural,
    hasForbiddenWords,
    noForbiddenWords: !hasForbiddenWords,
    appropriateLength: title.length >= 20 && title.length <= 50,
  }
}

function calculateRelevance(title: string, text: string): number {
  const titleWords = title.split(/\s+/)
  const matchCount = titleWords.filter(word => 
    word.length > 1 && text.includes(word)
  ).length
  return matchCount / titleWords.length
}
