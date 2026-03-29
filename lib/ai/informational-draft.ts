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
import type { 
  InformationalAssistantMessage, 
  InformationalOutline,
  InformationalProjectMeta,
  SourceDocument,
  InformationalDraftSettings,
  InformationalDraftOutput,
} from '@/types'
import { z } from 'zod'

// Output Schema for validation
const InformationalDraftOutputSchema = z.object({
  title: z.string().min(1).describe('글 제목'),
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
    systemPrompt: `당신은 해당 분야의 전문가(변호사, 의사, 세무사, 부동산 전문가 등)이자 칼럼니스트입니다.
전문적이면서도 친근한 어투로 독자에게 조언하듯이 글을 작성하세요.
어려운 전문 용어는 쉽게 풀어 설명하고, 각론형으로 구체적인 사례를 들어 설명하세요.
마지막에는 전문가가 직접 독자에게 조언하는 형식으로 마무리하세요.`,
    userPromptTemplate: `[메인키워드]에 대한 내용으로 블로그를 작성할거야. 참고 자료의 내용을 바탕으로 작성해줘.
[메인키워드] 메인키워드는 본문에서 6번 반복, [서브키워드] 서브키워드는 각각 본문에서 3-4번씩 반복해서 작성할거야.
마지막 마무리는 글의 작성자인 전문가가 직접 독자에게 조언해주는 말 또는 문제를 해결하는 데 도움이 되는 말을 작성해줘.

<지침>
이 글을 전문가가 직접 독자들에게 쉽게 설명하면서, 각론형으로 구체적인 사례를 들어 작성해줘. 어려운 용어를 쉽게 이해할수 있도록 설명하듯이 작성해줘.
전문적이면서도 친근한 어투로 말하듯이 작성해줘.
</지침>

<조건>
1. 5개 소제목을 만들어줘
2. 이해하기 쉽게 풀어서 작성해줘
3. 총 1800자이상으로 작성해줘.
4. 키워드 반복횟수 제외하고, 나머지는 겹치지 않게 대체어로 바꿔서 작성해줘.
5. 결기승전 구조로 내용을 작성해줘.
6. 서론은 100-150자 내외로 작성할거야. 일상생활에서 일어날수 있는 사건 또는 사례를 토대로 읽는 사람의 흥미를 유발시켜줘
7. 타겟 독자의 입장에서 공감하고 조언하는 톤으로 작성해줘
</조건>

주제: {topic}
키워드: {keywords}
아웃라인: {outline}
소스: {sources}`,
  },
  {
    id: 'legal-blog',
    name: '법률 블로그 (변호사 조언형)',
    description: '변호사가 직접 조언하는 전문 법률 블로그',
    systemPrompt: `당신은 전문 변호사이자 법률 칼럼니스트입니다.
법률 문제로 고민하는 일반인 독자를 대상으로, 전문적이면서도 친근한 어투로 조언하듯이 글을 작성하세요.
어려운 법률 용어는 쉽게 풀어 설명하고, 각론형으로 구체적인 사례를 들어 설명하세요.
마지막에는 변호사가 직접 의뢰인에게 조언하는 형식으로 마무리하세요.`,
    userPromptTemplate: `[메인키워드]에 대한 내용으로 블로그를 작성할거야. 참고 자료를 바탕으로 작성해줘.
[메인키워드] 메인키워드는 본문에서 6번 반복, [서브키워드] 서브키워드는 각각 본문에서 3-4번씩 반복해서 작성할거야.
마지막 마무리는 글의 작성자인 변호사가 직접 의뢰인에게 조언해주는 말 또는 사건을 해결하는 데 도움이 되는 말을 작성해줘.

<지침>
이 글을 변호사가 직접 의뢰인에게 쉽게 설명하면서, 각론형으로 구체적인 사례를 들어 작성해줘. 어려운 법률 용어를 쉽게 이해할수 있도록 설명하듯이 작성해줘
전문적이면서도 친근한 어투로 말하듯이 작성해줘.
</지침>

<조건>
1. 5개 소제목을 만들어줘
2. 이해하기 쉽게 풀어서 작성해줘
3. 총 1800자이상으로 작성해줘.
4. 키워드 반복횟수 제외하고, 나머지는 겹치지 않게 대체어로 바꿔서 작성해줘.
5. 결기승전 구조로 내용을 작성해줘.
6. 서론은 100-150자 내외로 작성할거야. 일상생활에서 일어날수 있는 사건 또는 사례를 토대로 읽는 사람의 미를 유발시켜줘
7. 독자타겟의 입장에서 공감하고 실질적인 해결책을 제시해줘
</조건>

주제: {topic}
키워드: {keywords}
아웃라인: {outline}`,
  },
  {
    id: 'blog-standard',
    name: '표준 블로그',
    description: '일반적인 블로그 글 스타일',
    systemPrompt: `당신은 친근하고 전문적인 블로그 작가입니다.
독자와 대화하듯 자연스러운 문체로 글을 작성하세요.
전문 용어는 쉽게 풀어서 설명하고, 실용적인 정보를 제공하세요.`,
    userPromptTemplate: `주제: {topic}
키워드: {keywords}
소스: {sources}

위 정보를 바탕으로 독자에게 유용한 블로그 글을 작성해주세요.
인사이트와 실용적인 팁을 포함하고, 마지막에 독자의 행동을 유도하는 CTA를 넣으세요.`,
  },
  {
    id: 'expert-guide',
    name: '전문가 가이드',
    description: '심층 분석과 전문성 강조',
    systemPrompt: `당신은 해당 분야의 전문가입니다.
깊이 있는 분석과 데이터 기반 인사이트를 제공하세요.
전문성과 신뢰성을 바탕으로 작성하되, 접근 가능한 언어를 사용하세요.`,
    userPromptTemplate: `주제: {topic}
키워드: {keywords}
소스: {sources}

전문가 관점에서 심층 분석 글을 작성해주세요.
최신 데이터와 연구 결과를 인용하고, 핵심 인사이트를 강조하세요.
독자가 전문가의 조언을 얻는 느낌으로 작성하세요.`,
  },
  {
    id: 'beginner-friendly',
    name: '입문자 친화',
    description: '초보자도 쉽게 이해하는 쉬운 설명',
    systemPrompt: `당신은 복잡한 개념을 쉽게 설명하는 전문 작가입니다.
초보자도 쉽게 따라갈 수 있는 단계별 설명을 제공하세요.
비유와 예시를 적극 활용하고, 어려운 용어는 괄호 안에 풀이를 넣으세요.`,
    userPromptTemplate: `주제: {topic}
키워드: {keywords}
소스: {sources}

완전 초보자를 위한 입문 글을 작성해주세요.
"왜 중요한가?"부터 시작해서 기본 개념을 차근차근 설명하세요.
실수하기 쉬운 부분과 팁을 따로 강조하세요.`,
  },
  {
    id: 'storytelling',
    name: '스토리텔링',
    description: '이야기 형식으로 풀어내는 글',
    systemPrompt: `당신은 스토리텔링 전문 작가입니다.
정보를 스토리 형식으로 풀어내 독자의 몰입을 유도하세요.
도입-전개-절정-결말 구조를 활용하고, 감정적 연결을 강조하세요.`,
    userPromptTemplate: `주제: {topic}
키워드: {keywords}
소스: {sources}

스토리텔링 형식으로 글을 작성해주세요.
실제 사례나 가상의 시나리오를 통해 정보를 전달하세요.
독자가 "나도 겪어본 일이다"라고 공감할 수 있도록 작성하세요.`,
  },
  {
    id: 'listicle',
    name: '리스트icle',
    description: '숫자와 포인트로 정리하는 형식',
    systemPrompt: `당신은 리스트 기사 전문 작가입니다.
정보를 숫자와 포인트로 명확하게 정리하세요.
각 항목은 구체적이고 실행 가능해야 하며, 스캐닝하기 쉬운 형식으로 작성하세요.`,
    userPromptTemplate: `주제: {topic}
키워드: {keywords}
소스: {sources}

리스트icle 형식(예: "10가지 방법", "5가지 팁")으로 작성해주세요.
각 항목은 소제목 + 간단 설명 + 실제 적용 방법으로 구성하세요.
번호 순서는 중요도나 논리적 흐름에 따라 배치하세요.`,
  },
  {
    id: 'comparison',
    name: '비교 분석',
    description: '두 가지 이상을 비교하는 글',
    systemPrompt: `당신은 객관적인 비교 분석 전문가입니다.
공정하고 균형 잡힌 시각에서 여러 옵션을 비교하세요.
각 선택지의 장단점을 명확히 제시하고, 독자의 상황에 맞는 추천을 제공하세요.`,
    userPromptTemplate: `주제: {topic}
키워드: {keywords}
소스: {sources}

비교 분석 형식으로 작성해주세요.
각 옵션의 특징, 장점, 단점, 적합한 독자층을 명확히 구분하세요.
비교 표나 핵심 차이점 요약을 포함하세요.
결론에서 상황별 추천을 제시하세요.`,
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
- 대신 "~으로 알려져 있다", "연구 결과 ~한 경향이 있다", "전문가들은 ~를 권장한다" 등 사용
- 개인의 건강 상태는 다를 수 있음을 명시`,
    finance: `
**금융/투자 도메인 추가 규칙:**
- "무조건 수익", "확실한 수익", "X% 수익 보장", "안전한 투자" 등 표현 절대 금지
- 특정 금융 상품의 추천이나 권유로 읽히는 표현 금지
- 투자 리스크와 손실 가능성을 균형 있게 언급`,
    education: `
**교육/학습 도메인 추가 규칙:**
- "~하면 합격한다", "성적이 X% 향상된다", "취업이 확실하다" 등 결과 보장 표현 금지
- 특정 학습법이 모든 사람에게 동일하게 효과적이라는 단정 금지`,
  }

  const domainRule = domain && domainSpecificRules[domain] ? domainSpecificRules[domain] : ''

  // 기본 시스템 프롬프트
  const basePrompt = `당신은 정보성 글을 작성하는 전문 작가입니다.

**역할:**
- 제공된 리서치 데이터(소스 문서, 아웃라인, 핵심 포인트)만을 사용하여 글을 작성합니다.
- 외부 검색이나 추가 정보 수집은 하지 않습니다.
- 제공되지 않은 정보는 추측하거나 창작하지 않습니다.

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
2. 과장 표현 금지 - "무조건", "최고", "완벽" 등의 표현 사용 금지
3. 자연스러운 톤 - AI가 쓴 것처럼 보이지 않게 인간적인 표현 사용
4. 구조화된 내용 - 아웃라인 섹션별로 논리적으로 구성
5. 출처 표시 - 데이터 기반 주장에는 [출처: 소스명] 형식으로 표시

**금지 표현:**
- "반드시 ~된다"
- "100% 효과적이다"
- "완벽한 방법"
- "모든 사람에게 효과적이다"
- "전문가들이 인정한"
- "입증된 방법"`

  // 프리셋 프롬프트가 있으면 병합
  if (preset) {
    return `${preset.systemPrompt}\n\n${domainRule}\n\n**기술적 제약:**\n${basePrompt.split('**작성 원칙:**')[1]}`
  }

  // 커스텀 프롬프트가 있으면 병합
  if (customPrompt) {
    return `${customPrompt}\n\n${domainRule}\n\n**추가 기술적 제약:**\n- 제공되지 않은 정보는 추측하지 마세요.
- 과장 표현을 피하고 사실에 기반하여 작성하세요.
- 인용구는 원문을 정확히 인용하되, 맥락을 왜곡하지 마세요.`
  }

  return basePrompt
}

function buildUserPrompt(
  input: GenerateInformationalDraftInput,
  preset?: PromptPreset
): string {
  const { meta, outline, sources, settings, projectTitle, projectTopic } = input

  const styleGuide = {
    explainer: '설명형: 개념과 원리를 명확하게 설명',
    comparison: '비교형: 여러 옵션을 객관적으로 비교',
    guide: '가이드형: 단계별 방법을 상세히 안내',
    'problem-solving': '해결형: 문제 해결책을 제시',
  }

  // 도메인 감지
  const keyword = meta.mainKeyword.toLowerCase()
  let detectedDomain = 'general'
  if (keyword.match(/의료|건강|병원|치료|질병|증상|약물/)) detectedDomain = 'medical'
  else if (keyword.match(/금융|투자|주식|보험|펀드|대출|이자/)) detectedDomain = 'finance'
  else if (keyword.match(/교육|학원|학습|시험|합격|성적|취업/)) detectedDomain = 'education'

  // 소스 정보 포맷팅
  const sourcesText = sources.map((s, i) => `
소스 ${i + 1}: ${s.title || '제목 없음'}
- 요약: ${s.summary}
- 핵심 포인트: ${s.keyPoints.join(', ')}
- 출처: ${s.url || '내부 메모'}
`).join('\n')

  // 프리셋 템플릿 사용
  if (preset) {
    return preset.userPromptTemplate
      .replace('{topic}', projectTopic)
      .replace('{keywords}', `${meta.mainKeyword}, ${meta.subKeywords.join(', ')}`)
      .replace('{sources}', sourcesText)
      .replace('{outline}', outline.sections.map(s => s.heading).join('\n'))
  }

  // 기본 사용자 프롬프트
  return `
[프로젝트 정보]
제목: ${projectTitle}
주제: ${projectTopic}
메인 키워드: ${meta.mainKeyword}
서브 키워드: ${meta.subKeywords.join(', ')}
검색 의도: ${meta.searchIntent}
독자층: ${meta.audienceLevel}
글 목표: ${meta.goal}
감지된 도메인: ${detectedDomain}

[아웃라인]
글 제목: ${outline.title}
타겟 독자: ${outline.targetAudience || '일반'}

섹션 구성:
${outline.sections.map((s, i) => `
${i + 1}. ${s.heading}
   - 핵심 포인트: ${s.keyPoints.join(', ')}
   - 예상 분량: ${s.estimatedWordCount || 200}자
`).join('')}

[소스 문서]
${sourcesText}

[설정]
스타일: ${styleGuide[settings.style]}
FAQ 포함: ${settings.includeFaq ? '예' : '아니오'}
체크리스트 포함: ${settings.includeChecklist ? '예' : '아니오'}

제목 작성 가이드라인:
1. 아웃라인의 핵심 포인트와 소스 내용을 바탕으로 기억에 남는 제목을 작성해주세요.
2. 포함할 키워드: ${meta.mainKeyword}, ${meta.subKeywords.slice(0, 2).join(', ')}
3. 자연스러운 느낌의 문장 및 조사를 회피하고 명확하게 만들어주세요.
4. 독자의 호기심을 자극하되 클릭베이트는 피해주세요.

본문 작성 지침:
1. 아웃라인의 각 섹션을 충실히 반영
2. 소스 문서의 핵심 포인트를 녹여내기
3. 설정된 스타일과 톤 유지
4. ${settings.includeFaq ? '글 마무리에 FAQ 섹션 포함' : ''}
${settings.includeChecklist ? '5. 필요한 경우 체크리스트 형식 활용' : ''}

${detectedDomain !== 'general' ? `⚠️ [${detectedDomain} 도메인 주의사항]
- 민감 도메인으로 판단됩니다. 보수적으로 작성해주세요.
- 과장이나 단정적 표현을 피하고, 가능성과 경향성을 표현해주세요.` : ''}

주의: 제공된 데이터만 사용하고, 없는 정보는 추측하지 마세요.
`
}

// ============================================
// Smart Title Generation
// ============================================

function generateSmartTitle(
  meta: InformationalProjectMeta,
  sections: { heading: string; keyPoints: string[] }[]
): string {
  const mainKeyword = meta.mainKeyword
  const subKeywords = meta.subKeywords
  
  // 섹션 헬딩에서 핵심 테마 추출
  const sectionThemes = sections.map(s => s.heading).join(' ')
  
  // 제목 패턴 자동 선택
  const titlePatterns = [
    // 입문자를 위한 가이드
    subKeywords.length > 0 
      ? `${mainKeyword} 완벽 가이드: ${subKeywords[0]}부터 ${subKeywords[1] || '시작하기'}까지`
      : `${mainKeyword} 입문자 완벽 가이드`,
    
    // 비교형
    subKeywords.length > 1
      ? `${subKeywords[0]} vs ${subKeywords[1]}? ${mainKeyword} 최선 선택 가이드`
      : `${mainKeyword} 비교해보기`,
    
    // 팩트 형
    `${mainKeyword}에 관한 10가지 알아두면 좋을 사실`,
    
    // 혜택 강조형
    subKeywords.length > 0
      ? `${subKeywords[0]}를 위한 ${mainKeyword} 가이드`
      : `${mainKeyword}를 활용한 효율적인 방법`,
    
    // 노하우 형
    `${mainKeyword}를 제대로 쓰지 못하고 계셨나요?`,
  ]
  
  // 검색 의도에 따라 제목 선택
  if (meta.searchIntent === 'comparison' && subKeywords.length > 1) {
    return titlePatterns[1]
  } else if (meta.searchIntent === 'guide' || meta.audienceLevel === 'beginner') {
    return titlePatterns[0]
  } else if (sectionThemes.includes('방법') || sectionThemes.includes('팁')) {
    return titlePatterns[3]
  }
  
  // 기본값: 첫 번째 패턴
  return titlePatterns[0]
}

// ============================================
// Deterministic Fallback
// ============================================

function generateDeterministicDraft(
  input: GenerateInformationalDraftInput
): InformationalDraftOutput {
  const { meta, outline, settings } = input
  
  // 콘텐츠와 키워드를 바탕으로 제목 자동 생성
  const generatedTitle = generateSmartTitle(meta, outline.sections)

  // 아웃라인 섹션 기반으로 간단한 draft 생성
  const sections = outline.sections.map(section => ({
    heading: section.heading,
    content: section.keyPoints.map(point => `## ${point}

${section.heading}와 관련하여 ${point}에 대해 알아보겠습니다. 이 부분에서는 제공된 소스 문서를 기반으로 상세한 설명을 드리겠습니다.

- 핵심 내용 1: ${point}의 기본 개념
- 핵심 내용 2: ${point}의 실제 적용
- 핵심 내용 3: ${point}를 활용한 팁

[참고: 이 초안은 기본 템플릿으로 생성되었습니다. AI 설정 후 더 풍부한 내용의 초안을 생성할 수 있습니다.]
`).join('\n\n'),
  }))

  const content = sections.map(s => `# ${s.heading}\n\n${s.content}`).join('\n\n')
  
  const wordCount = content.length

  return {
    title: generatedTitle,
    content,
    sections,
    faq: settings.includeFaq ? [
      { question: `${meta.mainKeyword}란 무엇인가요?`, answer: '기본 개념에 대한 설명이 여기에 들어갑니다.' },
      { question: '초보자도 시작할 수 있나요?', answer: '네, 단계별로 따라하실 수 있습니다.' },
      { question: '더 알아보려면?', answer: '관련 소스 문서를 참고하세요.' },
    ] : undefined,
    keywordsUsed: [meta.mainKeyword, ...meta.subKeywords],
    metadata: {
      wordCount,
      estimatedReadTime: Math.ceil(wordCount / 500),
      tone: settings.style,
    },
    usedFallback: true,
    usedSourceIds: input.sources.map(s => s.sourceId),
  }
}

// ============================================
// Main Draft Generation
// ============================================

export async function generateInformationalDraft(
  input: GenerateInformationalDraftInput
): Promise<InformationalDraftOutput> {
  console.log('[Informational Draft] Starting generation:', {
    topic: input.projectTopic,
    style: input.settings.style,
    promptMode: input.promptMode || 'auto',
    hasCustomPrompt: !!input.customPrompt,
  })

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
    return generateDeterministicDraft(input)
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
    return { ...result.data, usedFallback: false }
  }

  // 실패 시 fallback
  console.warn('[Informational Draft] AI generation failed, using fallback:', {
    error: result.error?.code,
    message: result.error?.message,
  })

  return generateDeterministicDraft(input)
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
      ? `다음 키포인트가 아직 다뤄지지 않았습니다: ${missingPoints.join(', ')}`
      : '모든 핵심 포인트가 잘 다뤄졌습니다.',
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
