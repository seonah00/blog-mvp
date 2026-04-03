/**
 * Informational Draft AI Functions
 * 
 * 정보성 글쓰기를 위한 AI 보조 기능들
 * - 사용자 프롬프트 기반 글 생성
 * - Dual AI 지원 (OpenAI + Claude)
 * - Deterministic fallback
 * 
 * @see PROMPT_GUIDE.md - Informational Draft
 * @see lib/ai/client.ts - AI Client
 */

import { generateAiObject, generateWithPurpose, type GenerateAiObjectResult } from './client'
import { isAIProviderAvailable } from '@/lib/integrations/env'
import { applyContentFilter, logFilterResult } from './content-filter'
import { applyQualityFilter, logQualityResult, checkTitleBodyConsistency } from './quality-filter'
import type { 
  InformationalAssistantMessage, 
  InformationalOutline,
  InformationalProjectMeta,
  SourceDocument,
  InformationalDraftSettings,
  InformationalDraftOutput,
} from '@/types'
import { z } from 'zod'

// Pipeline integration
import {
  runInformationalPipeline,
  type InformationalPipelineInput as PipelineInput,
  type PipelineResult,
} from './pipeline'

// Output Schema for validation
const InformationalDraftOutputSchema = z.object({
  title: z.string().min(1).describe('글 제목 (24~42자 권장, 메인 키워드 자연스럽게 포함)'),
  content: z.string().min(100).describe('글 본문 (마크다운 형식)'),
  sections: z.array(z.object({
    heading: z.string(),
    content: z.string(),
  })).optional().describe('섹션별 구분'),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional().describe('FAQ 목록'),
  keywordsUsed: z.array(z.string()).optional().describe('사용된 키워드'),
  metadata: z.object({
    wordCount: z.number().int().min(0).describe('글자 수'),
    estimatedReadTime: z.number().int().min(1).describe('예상 읽기 시간(분)'),
    tone: z.string().describe('사용된 톤'),
    titleQuality: z.object({
      titleKeywordIncluded: z.boolean(),
      titleKeyword: z.string(),
      titleQualityStatus: z.enum(['pass', 'fail']),
      titleQualityReason: z.string(),
      titleValidationSummary: z.string(),
    }).optional(),
    bannedTermsCheck: z.object({
      bannedTermsFound: z.array(z.object({ term: z.string(), context: z.string() })),
      bannedTermsCount: z.number(),
      bannedTermsStatus: z.enum(['pass', 'fail']),
      bannedTermsFixSummary: z.array(z.string()),
    }).optional(),
  }).optional(),
  usedFallback: z.boolean().optional().describe('fallback 사용 여부'),
})

export interface GenerateInformationalDraftInput {
  meta: InformationalProjectMeta
  outline: InformationalOutline
  sources: SourceDocument[]
  settings: InformationalDraftSettings
  projectTitle: string
  projectTopic: string
  /** 사용자 커스텀 프롬프트 */
  customPrompt?: string
  /** 프롬프트 모드: 'auto' | 'custom' | 'preset' */
  promptMode?: 'auto' | 'custom' | 'preset'
  /** 프리셋 ID (promptMode가 'preset'일 때) */
  presetId?: string
}

// ============================================
// 프리셋 프롬프트 정의
// ============================================

export interface PromptPreset {
  id: string
  name: string
  description: string
  systemPrompt: string
  userPromptTemplate: string
}

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'expert-column',
    name: '전문가 칼럼 (조언형)',
    description: '전문가가 직접 조언하는 심층 정보성 글',
    systemPrompt: `당신은 해당 분야의 전문가이자 블로그 작가입니다.

**가장 중요한 작성 규칙 (반드시 준수):**
1. **절대 메모투 금지**: "관련 자료를 본면", "이 내용을 글에 녹이면", "비슷한 흐름이 언급됩니다", "참고하면", "조사 결과" 등의 메모/조사투 문장은 절대 사용하지 마세요.
2. **완성된 블로그 글**: 독자에게 설명하는 완성된 글을 작성하세요. 작성 과정이나 메모가 보이면 안 됩니다.
3. **재서술 의무**: 소스 내용을 그대로 붙여넣지 말고, 작가가 직접 설명하듯이 다시 써야 합니다.
4. **자연스러운 톤**: 전문적이면서도 친근한 어투로, 말하듯이 작성하세요.
5. **과장 표현 금지**: "완벽", "최고의", "무조건", "반드시", "100%", "추천" 등은 사용하지 마세요.

**구조:**
- 서론: 100-150자, 일상 사례로 흥미 유발
- 본론: 5개 소제목, 각론형으로 구체적 사례와 설명
- 결론: 내용 정리 + 독자에게 도움되는 마무리`,
    userPromptTemplate: `[메인키워드]에 대한 블로그 글을 작성해주세요.

<핵심 규칙>
1. 메인 키워드 "{mainKeyword}"는 제목에 반드시 자연스럽게 포함해주세요.
2. 제목은 24~42자 내외로, 키워드 나열형이 아닌 완성된 문장/구 형식으로 작성해주세요.
3. "완벽 가이드", "총정리", "필수" 같은 과장 표현은 피해주세요.
4. 소스 내용을 메모처럼 나열하지 말고, 작가가 설명하듯 재서술해주세요.
5. "관련 자료를 본면", "이 내용을 글에 녹이면" 등 메타 문장은 절대 사용하지 마세요.

<구조>
- 서론: 100-150자, 일상생활 사례로 독자의 흥미 유발
- 본론: 5개 소제목, 각론형으로 구체적 사례와 설명
- 결론: 앞 내용 정리 + 도움되는 마무리 멘트

<키워드>
- 메인 키워드: {mainKeyword} (본문 6회 자연스럽게 반복)
- 서브 키워드: {subKeywords} (각 3-4회 반복)

<참고 정보>
주제: {topic}
아웃라인: {outline}
소스 핵심: {sources}`,
  },
  {
    id: 'blog-standard',
    name: '표준 블로그',
    description: '일반적인 블로그 글 스타일',
    systemPrompt: `당신은 친근하고 전문적인 블로그 작가입니다.

**핵심 규칙:**
1. 메모투/메타 문장 금지 ("관련 자료를 본면", "이 내용을 녹이면" 등)
2. 소스를 그대로 붙여넣지 말고 재서술
3. 자연스러운 대화체
4. 과장 표현 금지`,
    userPromptTemplate: `주제: {topic}
키워드: {keywords}

자연스러운 블로그 글을 작성해주세요. 메모투 문장 없이, 독자에게 설명하듯 작성해주세요.`,
  },
  {
    id: 'beginner-friendly',
    name: '입문자 친화',
    description: '초보자도 쉽게 이해하는 쉬운 설명',
    systemPrompt: `당신은 복잡한 개념을 쉽게 설명하는 전문 작가입니다.

**핵심 규칙:**
1. 메모투/메타 문장 금지
2. 비유와 예시 적극 활용
3. 어려운 용어는 괄호 안에 풀이
4. 차근차근 설명`,
    userPromptTemplate: `주제: {topic}
키워드: {keywords}

초보자도 쉽게 이해할 수 있게 설명해주세요. 메모투 문장 없이 작성해주세요.`,
  },
]

// ============================================
// 프롬프트 빌더
// ============================================

function buildSystemPrompt(
  domain?: string,
  customPrompt?: string,
  preset?: PromptPreset
): string {
  // 도메인별 추가 안전 규칙
  const domainSpecificRules: Record<string, string> = {
    medical: `
**의료/건강 도메인 추가 규칙:**
- 질병 진단, 약물 처방, 치료 방법에 대한 확정적 표현 절대 금지
- "~하면 치유된다", "~가 완치된다", "효과가 입증되었다" 등 단정 표현 금지
- 대신 "~으로 알려져 있다", "연구 결과 ~한 경향이 있다" 등 사용`,
    finance: `
**금융/투자 도메인 추가 규칙:**
- "무조건 수익", "확실한 수익", "X% 수익 보장", "안전한 투자" 등 표현 절대 금지
- 특정 금융 상품의 추천이나 권유로 읽히는 표현 금지`,
    education: `
**교육/학습 도메인 추가 규칙:**
- "~하면 합격한다", "성적이 X% 향상된다", "취업이 확실하다" 등 결과 보장 표현 금지`,
  }

  const domainRule = domain && domainSpecificRules[domain] ? domainSpecificRules[domain] : ''

  // 기본 시스템 프롬프트
  const basePrompt = `당신은 정보성 글을 작성하는 전문 작가입니다.

**가장 중요한 작성 규칙 (반드시 준수):**
1. **절대 메모투 금지**: 다음과 같은 표현은 절대 사용하지 마세요:
   - "관련 자료를 본면"
   - "이 내용을 실제 글에 녹이면"
   - "비슷한 흐름이 언급됩니다"
   - "참고하면"
   - "조사 결과를 본면"
   - "다음과 같이 정리할 수 있습니다"
   - "실제 글에 녹일 때는"
   - "feat."
   
2. **완성된 블로그 글**: 독자가 읽기 편한, 자연스럽게 이어지는 하나의 글을 작성하세요. 작성 과정이나 메모가 보이면 안 됩니다.

3. **재서술 의무**: 모든 정보는 원문을 인용하지 않고, 작가가 직접 설명하듯이 다시 써야 합니다.

4. **구조 준수**:
   - 서론: 100-150자, 일상생활 사례로 독자의 흥미 유발
   - 본론: 5개 소제목, 각론형으로 구체적 사례와 설명
   - 결론: 앞 내용 정리 + 독자에게 도움되는 마무리 멘트

5. **키워드 배분** (자연스럽게):
   - 메인 키워드: 본문에서 6회 반복
   - 서브 키워드: 각각 3-4회 반복
   - 나머지는 대체어로 표현

6. **문장 연결**: 문단 간 자연스러운 전환, 사례와 설명의 균형

7. **독자 친화**: 어려운 용어는 쉽게 풀어 설명, "~입니다" 체 사용

**글 톤 및 스타일:**
- 전문적이면서도 친근한 어투
- 말하듯이 자연스럽게 작성
- AI가 쓴 것처럼 보이는 기계적 표현 금지 ("첫째, 둘째", "결론적으로" 등)

**민감 도메인 안전 규칙:**
의료/건강:
- 진단, 처방, 치료 확정 표현 금지
- 효과 보장/효능 단정 금지 ("반드시", "100%", "완치" 등)
- 개인 맞춤 의료 조언 금지

금융/투자:
- 투자 수익 보장 금지 ("확실한 수익", "무조건 상승" 등)
- 개인 맞춤 투자 조언 금지
- 리스크 누락 금지

교육/학습:
- 성적/합격/취업 결과 보장 금지
- 특정 방법이 모두에게 동일하게 효과적이라고 단정 금지
${domainRule}

**작성 원칙:**
1. 제공된 데이터만 사용 - 없는 정보는 꾸며내지 않기
2. 과장 표현 금지 - "무조건", "최고", "완벽", "추천", "보장" 등의 표현 사용 금지
3. 자연스러운 톤 - AI가 쓴 것처럼 보이지 않게 인간적인 표현 사용
4. 구조화된 내용 - 아웃라인 섹션별로 논리적으로 구성

**금지 표현:**
- "반드시 ~된다"
- "100% 효과적이다"
- "완벽한 방법"
- "모든 사람에게 효과적이다"
- "전문가들이 인정한"
- "입증된 방법"
- "최고의"
- "무조건"
- "추천"
- "보장"`

  // 프리셋 프롬프트가 있으면 병합
  if (preset) {
    return `${preset.systemPrompt}\n\n${domainRule}\n\n**기술적 제약:**\n${basePrompt.split('**작성 원칙:**')[1]}`
  }

  // 커스텀 프롬프트가 있으면 병합
  if (customPrompt) {
    return `${customPrompt}\n\n${domainRule}\n\n**추가 기술적 제약:**\n- 제공되지 않은 정보는 추측하지 마세요.\n- 과장 표현을 피하고 사실에 기반하여 작성하세요.\n- 메모투 문장(\"관련 자료를 본면\", \"이 내용을 녹이면\" 등)은 절대 사용하지 마세요.`
  }

  return basePrompt
}

function buildUserPrompt(
  input: GenerateInformationalDraftInput,
  preset?: PromptPreset
): string {
  const { meta, outline, sources, settings, projectTitle, projectTopic } = input

  // 소스 가공: 나열형이 아닌 핵심 사실만 추출
  const processedSources = sources.map((s, i) => {
    const keyFacts = s.keyPoints?.slice(0, 3) || []
    const shortSummary = s.summary?.split('.')[0] || ''
    
    return {
      index: i + 1,
      title: s.title || `참고자료 ${i + 1}`,
      facts: keyFacts,
      context: shortSummary,
    }
  })

  // 중복 제거 및 통합된 핵심 주장 생성
  const allKeyPoints = processedSources.flatMap(s => s.facts)
  const uniqueKeyPoints = [...new Set(allKeyPoints)].slice(0, 10)

  const styleGuide = {
    explainer: '설명형: 개념과 원리를 명확하게 설명하되, 독자가 공감할 수 있는 예시 포함',
    comparison: '비교형: 여러 옵션을 객관적으로 비교하되, 장단점을 구체적 사례로 설명',
    guide: '가이드형: 단계별 방법을 상세히 안내하되, 실제 적용 사례를 함께 제시',
    'problem-solving': '해결형: 문제 해결책을 제시하되, 독자의 상황을 고려한 조언 포함',
  }

  // 도메인 감지
  const keyword = meta.mainKeyword.toLowerCase()
  let detectedDomain = 'general'
  if (keyword.match(/의료|건강|병원|치료|질병|증상|약물/)) detectedDomain = 'medical'
  else if (keyword.match(/금융|투자|주식|보험|펀드|대출|이자/)) detectedDomain = 'finance'
  else if (keyword.match(/교육|학원|학습|시험|합격|성적|취업/)) detectedDomain = 'education'
  
  // 가공된 소스 정보 포맷팅 (나열형 지양)
  const sourcesContext = processedSources.length > 0 
    ? `\n[참고한 핵심 정보]\n${processedSources.map(s => 
      `- ${s.title}: ${s.facts.join('; ')}`
    ).join('\n')}`
    : ''
  
  const keyPointsContext = uniqueKeyPoints.length > 0
    ? `\n[본문에 반영할 핵심 주장]\n${uniqueKeyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
    : ''

  // 프리셋 템플릿 사용
  if (preset) {
    const sourcesSummary = sources.map((s, i) => 
      `- ${s.title || `참고${i + 1}`}: ${s.keyPoints.slice(0, 2).join('; ')}`
    ).join('\n')
    
    return preset.userPromptTemplate
      .replace(/{topic}/g, projectTopic)
      .replace(/{keywords}/g, `${meta.mainKeyword}, ${meta.subKeywords.join(', ')}`)
      .replace(/{sources}/g, sourcesSummary)
      .replace(/{outline}/g, outline.sections.map(s => s.heading).join('\n'))
      .replace(/{mainKeyword}/g, meta.mainKeyword)
      .replace(/{subKeywords}/g, meta.subKeywords.join(', '))
  }

  // 기본 사용자 프롬프트
  return `
[프로젝트 정보]
제목: ${projectTitle}
주제: ${projectTopic}
메인 키워드: ${meta.mainKeyword} (본문에서 6회 자연스럽게 반복, 제목에도 자연스럽게 포함)
서브 키워드: ${meta.subKeywords.join(', ')} (각각 3-4회 자연스럽게 반복)
검색 의도: ${meta.searchIntent}
독자층: ${meta.audienceLevel}
글 목표: ${meta.goal}
감지된 도메인: ${detectedDomain}

[글 구조 지침]
1. 서론 (100-150자):
   - 일상생활에서 일어날 수 있는 사례 제시
   - 독자의 흥미를 유발하는 도입
   - ${meta.mainKeyword}와 관련된 공감대 형성

2. 본론 (5개 소제목):
   - 각 소제목은 구체적인 사례와 설명 포함
   - ${styleGuide[settings.style]}
   - 문단 간 자연스러운 연결

3. 결론:
   - 앞서 다룬 내용을 한 번 더 정리
   - 독자가 이해하기 쉽게 요약
   - 도움이 되는 마무리 멘트

[아웃라인 참고]
제안 제목: ${outline.title}
타겟 독자: ${outline.targetAudience || '일반'}

섹션 구성:
${outline.sections.map((s, i) => `
- 소제목 ${i + 1}: ${s.heading}
  * 다룰 내용: ${s.keyPoints.slice(0, 2).join(', ')}
`).join('')}

${sourcesContext}
${keyPointsContext}

[설정]
스타일: ${styleGuide[settings.style]}
FAQ 포함: ${settings.includeFaq ? '예' : '아니오'}
체크리스트 포함: ${settings.includeChecklist ? '예' : '아니오'}

[제목 작성 가이드라인 - 중요]
1. 메인 키워드 "${meta.mainKeyword}"를 반드시 포함하되, 자연스럽게 녹이세요.
2. 24~42자 내외로 작성하세요.
3. "완벽 가이드", "총정리", "필수", "추천", "보장" 같은 표현은 피하세요.
4. 키워드 나열형이 아닌 완성된 문장/구 형식으로 작성하세요.
5. 예시) ❌ "${meta.mainKeyword} 완벽 가이드" → ✅ "${meta.mainKeyword}, 왜 지금 시작해야 하는지 쉽게 정리했어요"

[작성 시 주의사항 - 매우 중요]
- 소스의 내용을 그대로 복사하지 말고, 작가가 직접 설명하듯이 재서술하세요.
- "관련 자료를 본면", "이 내용을 글에 녹이면", "비슷한 흐름이 언급됩니다" 등 메모투 문장은 절대 사용하지 마세요.
- "첫째, 둘째, 셋째" 같은 기계적 나열은 금지합니다. 자연스러운 문단 전환을 사용하세요.
- 1800자 이상으로 작성하되, filler 없이 충실한 내용으로 채우세요.
${settings.includeFaq ? '- 글 마무리에 FAQ 섹션 포함' : ''}
${settings.includeChecklist ? '- 필요한 경우 체크리스트 형식 활용' : ''}

${detectedDomain !== 'general' ? `⚠️ [${detectedDomain} 도메인 주의사항]
- 민감 도메인으로 판단됩니다. 보수적으로 작성해주세요.
- 과장이나 단정적 표현을 피하고, 가능성과 경향성을 표현해주세요.` : ''}

주의: 제공된 데이터만 사용하고, 없는 정보는 추측하지 마세요.
`
}

// ============================================
// Smart Title Generation (강화된 제목 생성)
// ============================================

function generateSmartTitle(
  meta: InformationalProjectMeta,
  sections: { heading: string; keyPoints: string[] }[]
): { title: string; titleQuality: NonNullable<InformationalDraftOutput['metadata']>['titleQuality'] } {
  const mainKeyword = meta.mainKeyword
  const subKeywords = meta.subKeywords
  
  // 섹션 헬딩에서 핵심 테마 추출
  const sectionThemes = sections.map(s => s.heading).join(' ')
  
  // 자연스러운 제목 패턴 (과장 표현 제거)
  const titlePatterns = [
    // 패턴 1: 메인 키워드 + 실용적 접근
    `${mainKeyword}, 왜 지금 중요한지 쉽게 정리했어요`,
    
    // 패턴 2: 시작하는 사람을 위한
    subKeywords.length > 0 
      ? `${mainKeyword}를 시작할 때 ${subKeywords[0]}부터 알아보기`
      : `${mainKeyword}를 시작할 때 먼저 알아둘 핵심 포인트`,
    
    // 패턴 3: 실제 사례 기반
    `${mainKeyword}가 필요한 이유를 실제 사례로 풀어보기`,
    
    // 패턴 4: 방법 중심
    sectionThemes.includes('방법') || sectionThemes.includes('팁')
      ? `${mainKeyword}를 효과적으로 활용하는 방법`
      : `${mainKeyword}를 제대로 이해하는 방법`,
    
    // 패턴 5: 비교/선택 (검색 의도가 comparison인 경우)
    subKeywords.length > 1 && meta.searchIntent === 'comparison'
      ? `${subKeywords[0]}와 ${subKeywords[1]} 사이에서 ${mainKeyword} 선택하기`
      : `${mainKeyword}, 어떤 방식이 나에게 맞을지 살펴보기`,
    
    // 패턴 6: 경험 공유형
    `${mainKeyword}를 경험하고 알게 된 점을 공유합니다`,
  ]
  
  // 검색 의도에 따라 제목 선택
  let selectedTitle: string
  let selectionReason: string
  
  if (meta.searchIntent === 'comparison' && subKeywords.length > 1) {
    selectedTitle = titlePatterns[4]
    selectionReason = '비교 검색 의도에 맞는 선택형 제목'
  } else if (meta.searchIntent === 'guide' || meta.audienceLevel === 'beginner') {
    selectedTitle = titlePatterns[1]
    selectionReason = '입문자를 위한 시작 가이드형 제목'
  } else if (sectionThemes.includes('방법') || sectionThemes.includes('팁')) {
    selectedTitle = titlePatterns[3]
    selectionReason = '방법/팁 중심의 실용적 제목'
  } else {
    // 기본값: 가장 자연스러운 패턴 1
    selectedTitle = titlePatterns[0]
    selectionReason = '메인 키워드를 자연스럽게 포함한 정보 제공형 제목'
  }
  
  // 제목 품질 검사
  const titleKeywordIncluded = selectedTitle.includes(mainKeyword)
  const titleLength = selectedTitle.length
  const hasForbiddenWords = /완벽|최고의|무조건|반드시|100%|추천|보장|총정리|필수/.test(selectedTitle)
  const isNatural = !/(가이드|총정리|완벽)/.test(selectedTitle) || titleLength <= 42
  
  const titleQualityStatus = titleKeywordIncluded && !hasForbiddenWords && isNatural ? 'pass' : 'fail'
  
  const validationSummary = [
    `메인 키워드 포함: ${titleKeywordIncluded ? 'O' : 'X'}`,
    `제목 길이: ${titleLength}자 ${titleLength >= 24 && titleLength <= 42 ? '(적정)' : '(주의)'}`,
    `금지어 포함: ${hasForbiddenWords ? 'O (있음)' : 'X (없음)'}`,
    `자연스러움: ${isNatural ? 'O' : 'X'}`,
  ].join(' / ')
  
  return {
    title: selectedTitle,
    titleQuality: {
      titleKeywordIncluded,
      titleKeyword: mainKeyword,
      titleQualityStatus,
      titleQualityReason: selectionReason,
      titleValidationSummary: validationSummary,
    },
  }
}

// ============================================
// Deterministic Fallback (메모투 문장 제거)
// ============================================

function generateDeterministicDraft(
  input: GenerateInformationalDraftInput
): InformationalDraftOutput {
  const { meta, outline, settings, sources } = input

  const safeSources = sources ?? []

  // 콘텐츠와 키워드를 바탕으로 제목 자동 생성
  const { title: generatedTitle, titleQuality } = generateSmartTitle(meta, outline.sections)

  // 소스에서 실제 인용구 추출 시도
  const sourceQuotes = safeSources.slice(0, 3).map((s, i) => ({
    text:
      s.keyPoints?.[0] ||
      s.summary?.slice(0, 100) ||
      `${meta.mainKeyword}와 관련된 내용입니다.`,
    source: s.title || `참고 ${i + 1}`,
  }))

  // 자연스러운 문단 시작 패턴 (메모투 제거)
  const openers = [
    (topic: string) => `${topic}에 대해 궁금해하시는 분들이 많은데요, 오늘은 실제 사례를 바탕으로 쉽게 설명드리겠습니다.`,
    (topic: string) => `최근 ${topic}에 대한 관심이 늘고 있습니다. 어떤 점을 먼저 챙기면 좋을지 살펴보겠습니다.`,
    (topic: string) => `${topic}를 처음 접하시는 분들도 쉽게 이해하실 수 있도록 핵심 내용을 정리했습니다.`,
    (topic: string) => `이번 글에서는 ${topic}를 실무 관점에서 어떻게 활용하면 좋을지 알아보겠습니다.`,
  ]

  // 아웃라인 섹션 기반으로 개선된 fallback draft 생성 (메모투 문장 제거)
  const sections = outline.sections.map((section, idx) => {
    const opener = openers[idx % openers.length](section.heading)
    const sourceQuote =
      sourceQuotes.length > 0 ? sourceQuotes[idx % sourceQuotes.length] : null

    const paragraphBody = section.keyPoints
      .map((point, pidx) => {
        const transitions = ['먼저 ', '이어서 ', '또한 ', '그리고 ']
        const transition = transitions[pidx % transitions.length]

        // 메모투 문장 제거, 실제 설명만 포함
        return `${transition}${point}는 중요한 부분입니다.${
          sourceQuote && pidx === 0
            ? ` 실제 사례를 보면 이런 맥락에서 적용할 수 있습니다.`
            : ''
        } 구체적인 예시를 통해 살펴보겠습니다.`
      })
      .join('\n\n')

    const quotedBlock = sourceQuote
      ? `\n\n> "${sourceQuote.text}"`
      : ''

    return {
      heading: section.heading,
      content: `${opener}\n\n${paragraphBody}${quotedBlock}`,
    }
  })

  const content = sections.map((s) => `# ${s.heading}\n\n${s.content}`).join('\n\n')
  const wordCount = content.length

  // 실제 사용한 소스 ID (최대 3개)
  const actuallyUsedSourceIds = safeSources.slice(0, 3).map((s) => s.sourceId)

  return {
    title: generatedTitle,
    content,
    sections,
    faq: settings.includeFaq
      ? outline.suggestedFaqs?.slice(0, 3) || [
          {
            question: `${meta.mainKeyword}에 대해 더 알고 싶으신가요?`,
            answer: '위에서 설명드린 내용을 참고하시면 도움이 될 것입니다.',
          },
        ]
      : undefined,
    keywordsUsed: [meta.mainKeyword, ...meta.subKeywords],
    metadata: {
      wordCount,
      estimatedReadTime: Math.ceil(wordCount / 500),
      tone: settings.style,
      titleQuality,
    },
    usedFallback: true,
    usedSourceIds: actuallyUsedSourceIds,
  }
}

// ============================================
// Main Draft Generation
// ============================================

/**
 * Main: Generate Informational Draft (8단계 Pipeline)
 */
export async function generateInformationalDraft(
  input: GenerateInformationalDraftInput,
  onProgress?: (status: { stage: string; progress: number; message: string }) => void
): Promise<InformationalDraftOutput> {
  console.log('[Informational Draft] Starting 8-stage pipeline:', {
    topic: input.projectTopic,
    mainKeyword: input.meta.mainKeyword,
    sources: input.sources.length,
  })

  // Pipeline 기반 생성 (8단계)
  const pipelineInput: PipelineInput = {
    projectId: input.projectTitle || input.meta.mainKeyword,
    meta: input.meta,
    sources: input.sources,
    settings: input.settings,
    existingOutline: input.outline,
  }

  const result = await runInformationalPipeline(
    pipelineInput,
    (status) => {
      onProgress?.({
        stage: status.currentStage,
        progress: status.overallProgress,
        message: status.stageMessage,
      })
    }
  )

  if (result.success && result.draft) {
    console.log('[Informational Draft] Pipeline completed successfully')
    return {
      title: result.draft.title,
      content: result.draft.content,
      sections: result.draft.sections.map(s => ({
        heading: s.heading,
        content: s.content,
      })),
      faq: [],
      keywordsUsed: Object.keys(result.draft.keywordUsage),
      metadata: {
        ...result.draft.metadata,
        titleQuality: result.draft.titleResult,
        bannedTermsCheck: {
          bannedTermsFound: result.draft.qualityReport?.bannedTermsCheck.found ?? 0,
          bannedTermsCount: result.draft.qualityReport?.bannedTermsCheck.found ?? 0,
          bannedTermsStatus: result.draft.qualityReport?.bannedTermsCheck.status === 'pass' ? 'pass' : 'fail',
          bannedTermsFixSummary: result.draft.qualityReport?.bannedTermsCheck.summary ?? [],
        },
      },
      usedFallback: false,
    }
  }

  // Pipeline 실패 시 기존 방식으로 fallback
  console.warn('[Informational Draft] Pipeline failed, using legacy:', result.error)
  return generateLegacyDraft(input)
}

/**
 * Legacy Draft Generation (Fallback)
 */
async function generateLegacyDraft(
  input: GenerateInformationalDraftInput
): Promise<InformationalDraftOutput> {
  console.log('[Informational Draft] Using legacy generation')

  // 도메인 감지
  const keyword = input.meta.mainKeyword.toLowerCase()
  let domain: string | undefined = undefined
  if (keyword.match(/의료|건강|병원|치료|질병|증상|약물/)) domain = 'medical'
  else if (keyword.match(/금융|투자|주식|보험|펀드|대출|이자/)) domain = 'finance'
  else if (keyword.match(/교육|학원|학습|시험|합격|성적|취업/)) domain = 'education'

  // 프리셋 선택
  let preset: PromptPreset | undefined
  if (input.promptMode === 'preset' && input.presetId) {
    preset = PROMPT_PRESETS.find(p => p.id === input.presetId)
  }

  // AI Provider가 설정되지 않은 경우 즉시 fallback
  if (!isAIProviderAvailable()) {
    console.log('[Informational Draft] AI provider not available, using deterministic fallback')
    const fallbackResult = generateDeterministicDraft(input)
    
    // 품질 필터 적용
    const qualityResult = applyQualityFilter(fallbackResult.content)
    logQualityResult(qualityResult)
    
    return {
      ...fallbackResult,
      content: qualityResult.fixedContent,
    }
  }

  // 프롬프트 빌드
  const systemPrompt = buildSystemPrompt(domain, input.customPrompt, preset)
  const userPrompt = buildUserPrompt(input, preset)

  // AI 호출 시도
  const result = await generateWithPurpose('draft', {
    systemPrompt,
    userPrompt,
    schema: InformationalDraftOutputSchema,
    temperature: 0.7,
    maxTokens: 4000,
  })

  // 성공 시 AI 결과 반환
  if (result.ok && result.data) {
    console.log('[Informational Draft] AI generation successful:', {
      title: result.data.title,
      wordCount: result.data.metadata?.wordCount,
      provider: result.provider,
    })
    
    // 금지어 검사 및 자동 수정
    const filtered = applyContentFilter(result.data)
    logFilterResult(filtered.filterResult)
    
    // 품질 필터 적용 (placeholder/template/meta 문장 제거)
    const qualityResult = applyQualityFilter(filtered.content)
    logQualityResult(qualityResult)
    
    // 제목-본문 정합성 검사
    const consistencyIssues = checkTitleBodyConsistency(
      filtered.title,
      qualityResult.fixedContent,
      input.meta.mainKeyword
    )
    if (consistencyIssues.length > 0) {
      console.warn('[Informational Draft] Title-body consistency issues:', consistencyIssues)
    }
    
    // 제목 품질 검사 (AI가 생성한 제목)
    const { title: smartTitle, titleQuality } = generateSmartTitle(input.meta, input.outline.sections)
    const finalTitle = result.data.title.includes(input.meta.mainKeyword) 
      ? result.data.title 
      : titleQuality?.titleKeywordIncluded 
        ? result.data.title
        : smartTitle // 메인 키워드가 없으면 생성된 제목 사용
    
    return {
      title: finalTitle,
      content: qualityResult.fixedContent,
      sections: filtered.sections?.map(s => ({
        ...s,
        content: applyQualityFilter(s.content).fixedContent
      })),
      faq: filtered.faq,
      keywordsUsed: filtered.keywordsUsed,
      metadata: {
        ...filtered.metadata,
        titleQuality,
        bannedTermsCheck: {
          bannedTermsFound: filtered.filterResult.bannedTermsFound,
          bannedTermsCount: filtered.filterResult.bannedTermsCount,
          bannedTermsStatus: filtered.filterResult.bannedTermsStatus,
          bannedTermsFixSummary: filtered.filterResult.bannedTermsFixSummary,
        },
      },
      usedFallback: false,
    }
  }

  // 실패 시 fallback
  console.warn('[Informational Draft] AI generation failed, using fallback:', {
    error: result.error?.code,
    message: result.error?.message,
  })

  const fallbackResult = generateDeterministicDraft(input)
  
  // fallback 결과도 금지어 및 품질 검사
  const filteredFallback = applyContentFilter(fallbackResult)
  logFilterResult(filteredFallback.filterResult)
  
  const qualityResult = applyQualityFilter(filteredFallback.content)
  logQualityResult(qualityResult)
  
  return {
    title: fallbackResult.title,
    content: qualityResult.fixedContent,
    sections: fallbackResult.sections?.map(s => ({
      ...s,
      content: applyQualityFilter(s.content).fixedContent
    })),
    faq: fallbackResult.faq,
    keywordsUsed: fallbackResult.keywordsUsed,
    metadata: {
      ...fallbackResult.metadata,
      bannedTermsCheck: {
        bannedTermsFound: filteredFallback.filterResult.bannedTermsFound,
        bannedTermsCount: filteredFallback.filterResult.bannedTermsCount,
        bannedTermsStatus: filteredFallback.filterResult.bannedTermsStatus,
        bannedTermsFixSummary: filteredFallback.filterResult.bannedTermsFixSummary,
      },
    },
    usedFallback: true,
  }
}

// ============================================
// Preset Management
// ============================================

export function getPromptPresets(): PromptPreset[] {
  return PROMPT_PRESETS
}

export function getPromptPresetById(id: string): PromptPreset | undefined {
  return PROMPT_PRESETS.find(p => p.id === id)
}

// ============================================
// Additional Helper Functions
// ============================================

/**
 * 인용구 제안
 */
export async function suggestInformationalQuote(
  context: string,
  availableQuotes: { text: string; source: string; relevance?: number }[]
): Promise<{ text: string; source: string; insertionPoint?: string } | null> {
  if (availableQuotes.length === 0) return null
  
  return {
    text: availableQuotes[0].text,
    source: availableQuotes[0].source,
    insertionPoint: '현재 주장을 뒷받침하는 위치',
  }
}

/**
 * 섹션 완성도 검사
 */
export async function checkSectionCompletion(
  sectionHeading: string,
  writtenContent: string,
  targetKeyPoints: string[]
): Promise<InformationalAssistantMessage> {
  const missingPoints = targetKeyPoints.filter((_, i) => i > 1)
  
  return {
    role: 'assistant',
    type: 'completion_check',
    content: missingPoints.length > 0
      ? `다음 키포인트가 아직 다지지 않았습니다: ${missingPoints.join(', ')}`
      : '모든 핵심 포인트가 잘 다졌습니다.',
    missingPoints: missingPoints.length > 0 ? missingPoints : undefined,
  }
}

/**
 * 문단 개선
 */
export async function improveInformationalParagraph(
  paragraph: string,
  context: {
    targetAudience: string
    tone: string
    sectionType: 'introduction' | 'body' | 'conclusion'
  }
): Promise<string> {
  return paragraph
}

/**
 * FAQ 생성
 */
export async function generateFAQ(
  topic: string,
  keyPoints: string[],
  count: number = 5
): Promise<{ question: string; answer: string }[]> {
  return [
    { question: `${topic}란 무엇인가요?`, answer: '기본적인 개념 설명이 여기에 들어갑니다.' },
    { question: '초보자도 시작할 수 있나요?', answer: '네, 기초부터 차근차근 시작할 수 있습니다.' },
  ]
}

/**
 * SEO 메타데이터 생성
 */
export async function generateSEOMeta(
  mainKeyword: string,
  content: string,
  targetLength: 'short' | 'medium' | 'long' = 'medium'
): Promise<{
  title: string
  description: string
  keywords: string[]
}> {
  return {
    title: `${mainKeyword} - 완벽 가이드`,
    description: `${mainKeyword}에 대한 상세한 가이드입니다.`,
    keywords: [mainKeyword, '가이드', '튜토리얼'],
  }
}

/**
 * 콘텐츠 개선 - AI를 사용하여 글을 개선합니다
 */
export async function improveInformationalContent(
  content: string,
  context: {
    tone: string
    targetAudience: string
    style: string
    instruction?: string
  }
): Promise<string> {
  const systemPrompt = `당신은 전문 글쓰기 코치입니다. 제공된 글을 개선하여 더 자연스럽고 읽기 쉽게 만드세요.

**개선 원칙:**
1. 문장 길이를 다양하게 조정 (너무 긴 문장 나누기)
2. 반복되는 표현 제거
3. 전환사(그리고, 하지만, 따라서 등)를 자연스럽게 사용
4. 독자가 공감할 수 있는 구체적인 표현 추가
5. AI 느낌 나는 표현(상투어) 제거

**금지 표현:**
- "~입니다니다" 같은 중복 어미
- "매우", "정말", "굉장히" 같은 과장된 부사 남용
- "첫째, 둘째, 셋째" 같은 기계적인 나열
- "결론적으로, 요약하자면" 같은 AI식 마무리

**작성 톤:** ${context.tone}
**타겟 독자:** ${context.targetAudience}`

  const userPrompt = context.instruction 
    ? `다음 글을 개선해주세요:\n\n${content}\n\n**특별 지시사항:** ${context.instruction}`
    : `다음 글을 개선해주세요:\n\n${content}`

  // AI 호출이 가능한 경우에만 AI 사용, 아니면 원문 반환
  if (!isAIProviderAvailable()) {
    return content
  }

  try {
    const result = await generateWithPurpose('refine', {
      systemPrompt,
      userPrompt,
      schema: z.object({ improvedContent: z.string() }),
      temperature: 0.6,
      maxTokens: 4000,
    })

    if (result.ok && result.data) {
      return result.data.improvedContent || content
    }
  } catch (error) {
    console.warn('[improveInformationalContent] Failed:', error)
  }

  return content
}
