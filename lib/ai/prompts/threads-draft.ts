/**
 * Threads Draft Prompts & Generation
 * 
 * 스레드(Threads) 콘텐츠 작성을 위한 프롬프트 및 AI 생성
 * @see PROMPT_GUIDE.md - Threads Draft 섹션
 */

import type { 
  ThreadsDraftInput, 
  ThreadsDraftOutput, 
  ThreadsDraftSettings,
  ThreadsStrategyType,
  ThreadsBusinessInfo 
} from '@/types'
import { ThreadsDraftOutputSchema } from '@/lib/ai/schemas/threads-draft'
import { generateAiObject } from '@/lib/ai/client'
import { isAIProviderAvailable } from '@/lib/integrations/env'

// ============================================
// 1단계: Planning Prompt (전략 수립)
// ============================================

/**
 * Strategy Planning System Prompt
 * 전략 유형에 따른 구조 설계
 */
export function buildStrategyPlanningPrompt(
  strategyType: ThreadsStrategyType,
  businessInfo?: ThreadsBusinessInfo
): string {
  const basePrompt = `당신은 Threads 콘텐츠 전략 기획 전문가입니다.

**역할:**
- 주어진 전략 유형에 맞는 스레드 구조를 설계합니다.
- 각 스레드의 핵심 메시지와 흐름을规划합니다.
- 브랜드/비즈니스 정보가 있다면 자연스럽게 녹여냅니다.

**출력 형식:**
JSON 형식:
- strategyName: 전략 이름
- threadStructure: { order, focus, keyMessage, emotion/tone }[]
- recommendedHooks: string[] (훅 아이디어 3개)
- storyArc?: { setup, conflict, resolution } (story 전략용)
- valuePoints?: string[] (value 전략용)
- dailyMoments?: string[] (daily 전략용)
`

  const strategySpecific: Record<ThreadsStrategyType, string> = {
    story: `
**스토리형 (Story Arc 구조):**
- Before: 문제 상황, 고통, 갈망 (공감 유도)
- Turning Point: 변화의 계기, 깨달음, 도전 (긴장감)
- After: 성과, 변화, 브랜드 가치 (영감)
- 각 스레드가 스토리의 한 장면처럼 연결되어야 함
- 비즈니스 정보(brandName, oneLiner, storyBefore/turningPoint/storyAfter) 활용
`,
    tip: `
**꿀팁형 (Value Stack 구조):**
- Problem: 독자의 고민/문제 공감
- Promise: 해결 후 기대되는 결과
- Proof: 사례, 데이터, 경험 (선택)
- Proposal: 구체적 실행 방법/팁
- 각 스레드는 실용적이고 즉시 적용 가능해야 함
`,
    engage: `
**공감형 (Relatable Moment 구조):**
- Observation: 일상적 순간 관찰
- Reaction: 감정 반응, 생각
- Connection: 독자와의 공통점/공감대
- Twist (선택): 유머, 반전, 인사이트
- 친구와 대화하듯 편안한 톤
`
  }

  return basePrompt + strategySpecific[strategyType]
}

// ============================================
// 2단계: Draft Generation Prompt
// ============================================

/**
 * System Prompt - 공통 기반
 */
export function buildThreadsSystemPrompt(): string {
  return `당신은 Threads(스레드) 콘텐츠 작성 전문가입니다.

**핵심 원칙:**
1. 짧은 문장 - 한 스레드는 1-2문장, 100자 이내
2. 시각적 여백 - 줄바꿈으로 가독성 확보
3. 이모지 적절히 - 과하지 않게
4. 흥미로운 훅 - 첫 문장이 핵심
5. 대화형 톤 - 친근하고 자연스럽게

**금지:**
- 긴 문단 (3문장 이상 연속)
- 과도한 해시태그 (본문에 # 사용 금지)
- 마케팅 어휘 ("최고", "무조건", "꼭")
- AI 같은 딱딱한 표현

**출력 형식:**
JSON 형식으로 응답:
- title: 전체 제목
- threads: { order, content, imageDescription? }[]
- hashtags: string[] (최대 5개)
- metadata: { wordCount, estimatedReadTime, threadCount }`
}

/**
 * Strategy별 Draft Generation Prompt
 */
export function buildStrategyDraftPrompt(
  strategyType: ThreadsStrategyType,
  topicType: ThreadsDraftSettings['purpose'],
  businessInfo?: ThreadsBusinessInfo
): string {
  const strategyGuides: Record<ThreadsStrategyType, string> = {
    story: `
**스토리 브랜딩형 작성 지침:**
${businessInfo?.storyBefore ? `- Before: ${businessInfo.storyBefore} (공감 유도)` : '- Before: 문제 상황, 어려움을 있는 그대로'}
${businessInfo?.turningPoint ? `- Turning Point: ${businessInfo.turningPoint} (전환점)` : '- Turning Point: 변화의 계기, 결심'}
${businessInfo?.storyAfter ? `- After: ${businessInfo.storyAfter} (성과/현재)` : '- After: 지금의 변화, 성과'}
- 스토리텔링 구조: 고통 → 변화 → 성장
${businessInfo?.brandName ? `- 브랜드명 "${businessInfo.brandName}" 자연스럽게 1-2회 언급` : ''}
${businessInfo?.oneLiner ? `- 핵심 메시지: ${businessInfo.oneLiner}` : ''}
- "나는", "우리는" 1인칭 시점 사용
- 구체적 에피소드와 감정 묘사
`,
    tip: `
**꿀팁형 작성 지침:**
- 문제 해결 중심: "이런 고민 있으시죠?"
- 구체적 방법/팁 제공
- 번호 구분 (1️⃣, 2️⃣, 3️⃣)으로 가독성 확보
${businessInfo?.coreValue ? `- 핵심 가치 반영: ${businessInfo.coreValue}` : ''}
${businessInfo?.differentiation ? `- 차별점: ${businessInfo.differentiation}` : ''}
- 즉시 적용 가능한 액션 아이템
- 결과/효과에 대한 기대감 제시
`,
    engage: `
**공감형 작성 지침:**
- 일상적 순간 묘사 (장소, 시간, 상황)
- "~하신 분들 있나요?" 공감 유도
${businessInfo?.brandName ? `- ${businessInfo.brandName}의 일상적 모습` : ''}
- 편안한 친구 대화 톤
- 유머 또는 반전 (선택)
- 과장되지 않은 자연스러움
`
  }

  const topicGuides: Record<ThreadsDraftSettings['purpose'], string> = {
    food: `
**맛집/음식 특화:**
- 감각적 표현 ("촉촉한", "바삭한", "향긋한")
- 개인 경험: "나는 ~했어요"
- 분위기/인테리어 간단 언급
`,
    info: `
**정보/팁 특화:**
- 문제 → 해결 순서
- 구체적 단계 제시
- 실용성 강조
`,
    branding: `
**브랜딩 특화:**
- 브랜드 가치 녹이기
- 비하인드 스토리
- 차별화 포인트
`
  }

  return strategyGuides[strategyType] + topicGuides[topicType]
}

/**
 * User Prompt Builder
 */
export function buildThreadsUserPrompt(input: ThreadsDraftInput): string {
  const { meta, research, settings } = input

  const purposeLabels: Record<string, string> = {
    food: '맛집 소개',
    info: '정보 공유',
    branding: '브랜딩',
  }

  const strategyLabels: Record<string, string> = {
    story: '스토리 브랜딩형',
    tip: '꿀팁형',
    engage: '공감형',
  }

  const toneLabels: Record<string, string> = {
    casual: '캐주얼하고 편안한',
    friendly: '친근하고 편안한',
    professional: '전문적이지만 친근한',
  }

  // 비즈니스 정보 요약
  const businessSummary = meta.businessInfo ? `
**브랜드 정보:**
- 브랜드명: ${meta.businessInfo.brandName || '미지정'}
- 한 줄 소개: ${meta.businessInfo.oneLiner || '미지정'}
- 핵심 가치: ${meta.businessInfo.coreValue || '미지정'}
- 차별화: ${meta.businessInfo.differentiation || '미지정'}
- 콘텐츠 목표: ${meta.businessInfo.goals || '미지정'}
` : ''

  // 벤치마크 요약
  const benchmarkSummary = meta.benchmarkLinks ? `
**참고 벤치마크:**
${meta.benchmarkLinks}
` : ''

  return `**프로젝트 정보:**
- 주제: ${meta.topic}
- 콘텐츠 유형: ${purposeLabels[meta.purpose]}
- 전개 전략: ${strategyLabels[meta.strategyType || 'tip']}
- 톤: ${toneLabels[meta.tone] || '캐주얼'}
- 타겟: ${meta.targetAudience || '일반 독자'}
- 스레드 개수: ${settings.threadCount}개

**리서치 데이터:**
${research.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

${research.suggestedHooks.length > 0 ? `**추천 훅:**
${research.suggestedHooks.join('\n')}` : ''}

${meta.hook ? `**훅 아이디어 (참고):**
${meta.hook}` : ''}
${businessSummary}${benchmarkSummary}
**요구사항:**
1. 전략(${strategyLabels[meta.strategyType || 'tip']})에 맞는 구조로 작성
2. 첫 스레드는 반드시 주목을 끄는 훅으로 시작
3. 각 스레드는 1-2문장으로 짧게
4. ${settings.threadCount}개의 스레드 작성
5. 이미지가 필요한 부분에 [이미지: 설명] 표시
6. 해시태그는 마지막에 별도로 3-5개

JSON 형식으로 출력:`
}

// ============================================
// AI Generation
// ============================================

/**
 * Deterministic Fallback for Threads
 * Strategy와 TopicType 조합별 최적화된 템플릿
 */
function generateDeterministicThreadsDraft(input: ThreadsDraftInput): ThreadsDraftOutput {
  const { meta, settings } = input
  const purpose = settings.purpose
  const strategy = settings.strategyType || 'tip'
  const business = meta.businessInfo

  // Strategy + Purpose 조합별 템플릿
  const templates: Record<string, Record<string, { title: string; threads: { order: number; content: string; imageDescription?: string; hasSeparator?: boolean }[]; hashtags: string[] }>> = {
    story: {
      food: {
        title: `${business?.brandName || '이 곳'}의 시작은 이랬어요`,
        threads: [
          { order: 1, content: `🍽️ ${business?.brandName || '이 식당'}의 시작은 특별했어요`, imageDescription: '매장 전경' },
          { order: 2, content: `${business?.storyBefore || '처음엔 아무것도 몰랐죠. 맛있는 음식만 만들고 싶었어요.'}`, hasSeparator: true },
          { order: 3, content: `${business?.turningPoint || '그런데 손님 한 분이 말씀하셨어요. "여기 음식에 정성이 느껴져요."'}`, hasSeparator: true },
          { order: 4, content: `${business?.storyAfter || '그 말씀이 큰 힘이 되었어요. 지금은 매일 정성껏 요리합니다.'}`, imageDescription: '요리하는 모습' },
          { order: 5, content: `${business?.oneLiner || '정성 가득한 한 '}

${business?.brandName || '우리'}에서 따뜻한 식사하세요 💛`, hasSeparator: true },
        ],
        hashtags: ['#맛집추천', '#스토리', '#정성가득', '#푸드스토리'],
      },
      info: {
        title: `3년 전 오늘, 저는 ${meta.topic}를 시작했어요`,
        threads: [
          { order: 1, content: `📚 ${meta.topic}를 시작했던 3년 전이 생각나요`, imageDescription: '책상 위 노트북' },
          { order: 2, content: '처음엔 아무것도 몰랐어요. 맨땅에 헤딩하며 배웠죠.', hasSeparator: true },
          { order: 3, content: '실패도 많았어요. 그때마다 "왜 시작했지?" 생각했어요.', hasSeparator: true },
          { order: 4, content: '그런데 포기하지 않았더니, 어느새 성장했더라고요.', imageDescription: '성장 그래프' },
          { order: 5, content: '지금 도전하시는 분들, 꾸준함이 답이에요. 화이팅! 💪', hasSeparator: true },
        ],
        hashtags: ['#성장스토리', '#도전', '#꾸준함', '#인사이트'],
      },
      branding: {
        title: business?.storyBefore ? `${business.brandName}는 이렇게 탄생했어요` : '우리 브랜드의 시작',
        threads: [
          { order: 1, content: `🌱 ${business?.brandName || '우리'}의 이야기를 들려드릴게요`, imageDescription: '브랜드 로고' },
          { order: 2, content: `${business?.storyBefore || '시작은 미약했어요. 작은 공간에서 시작했죠.'}`, hasSeparator: true },
          { order: 3, content: `${business?.turningPoint || '그러던 중 만난 한 고객님. "정말 필요했어요" 그 한마디.'}`, hasSeparator: true },
          { order: 4, content: `${business?.storyAfter || '그래서 더 잘하고 싶었어요. 지금은 많은 분들께 사랑받고 있어요.'}`, imageDescription: '팀 사진' },
          { order: 5, content: `${business?.coreValue || '고객 한 분 한 분의 소중한 시간'}

${business?.oneLiner || '특별한 가치를 전합니다'} ✨`, hasSeparator: true },
        ],
        hashtags: ['#브랜드스토리', '#창업이야기', '#비하인드', '#브랜딩'],
      },
    },
    tip: {
      food: {
        title: `맛집 찾을 때 이것만 확인하세요`,
        threads: [
          { order: 1, content: `🍽️ 맛집 고르기 어려우시죠? 이 3가지만 확인하세요`, imageDescription: '맛집 검색' },
          { order: 2, content: '1️⃣ 리뷰 수보다 최근 리뷰 확인\n최근 1개월 리뷰가 진짜 실력', hasSeparator: true },
          { order: 3, content: '2️⃣ 메뉴 사진보다 실제 방문 후기\n음식 모양보다 맛 평가 중요', imageDescription: '음식 사진' },
          { order: 4, content: '3️⃣ 웨이팅 시간 체크\n인기있는 맛집은 미리 예약 필수', hasSeparator: true },
          { order: 5, content: '이 방법으로 실패 확률 80% 줄일 수 있어요! 👍', hasSeparator: true },
        ],
        hashtags: ['#맛집꿀팁', '#정보공유', '#생활팁', '#맛집선정법'],
      },
      info: {
        title: `${meta.topic} 완벽 정리`,
        threads: [
          { order: 1, content: `💡 ${meta.topic}, 한 번에 정리해드릴게요`, imageDescription: '정리된 노트' },
          { order: 2, content: '✅ 핵심 포인트 1\n기본기부터 탄탄하게', hasSeparator: true },
          { order: 3, content: '✅ 핵심 포인트 2\n꾸준한 연습이 답입니다', imageDescription: '연습하는 모습' },
          { order: 4, content: '✅ 핵심 포인트 3\n작은 성공을 쌓아가세요', hasSeparator: true },
          { order: 5, content: '즉시 적용 가능한 팁이에요. 오늘부터 시작해보세요! 🚀', hasSeparator: true },
        ],
        hashtags: ['#정보정리', '#완벽가이드', '#실용팁', '#초보자추천'],
      },
      branding: {
        title: `${business?.differentiation || '우리만의 차별화'}`,
        threads: [
          { order: 1, content: `🎯 ${business?.brandName || '우리'}가 특별한 이유`, imageDescription: '브랜드 대표 이미지' },
          { order: 2, content: `${business?.differentiation || '다른 곳과 다른 점은 바로 이것'}`, hasSeparator: true },
          { order: 3, content: `${business?.coreValue || '우리가 추구하는 가치'}를 담았어요`, hasSeparator: true },
          { order: 4, content: `고객님들이 자주 해주시는 말씀:\n"여기만큼 ${meta.topic} 잘하는 곳 없어요"`, imageDescription: '고객 후기' },
          { order: 5, content: `${business?.oneLiner || '차별화된 가치를 경험해보세요'} ✨`, hasSeparator: true },
        ],
        hashtags: ['#차별화', '#브랜드가치', '#전문성', '#추천'],
      },
    },
    engage: {
      food: {
        title: `오늘 점심 뭐 먹지? 🤔`,
        threads: [
          { order: 1, content: `점심 메뉴 고민하다가 ${meta.topic} 발견!`, imageDescription: '점심 메뉴' },
          { order: 2, content: '혼자 가도 편안한 분위기가 좋았어요', hasSeparator: true },
          { order: 3, content: '맛은 기대 이상! 가성비도 좋았어요 👍', imageDescription: '음식 사진' },
          { order: 4, content: '혼밥하기 딱 좋은 곳이에요. 추천!', hasSeparator: true },
        ],
        hashtags: ['#혼밥', '#점심메뉴', '#일상', '#맛집탐방'],
      },
      info: {
        title: `이런 경험 다들 있으시죠?`,
        threads: [
          { order: 1, content: `${meta.topic} 하다가 자주 하는 실수... 😅`, imageDescription: '당황하는 표정' },
          { order: 2, content: '나만 이런 줄 알았는데, 다들 비슷하시더라고요', hasSeparator: true },
          { order: 3, content: '그래서 작은 팁 하나 공유합니다', hasSeparator: true },
          { order: 4, content: '알고 보면 간단한데, 모르면 계속 헤매요 ㅎㅎ', imageDescription: '해결책' },
          { order: 5, content: '도움 되셨나요? 비슷한 경험 있으신 분? 👇', hasSeparator: true },
        ],
        hashtags: ['#공감', '#일상팁', '#경험공유', '#댓글환영'],
      },
      branding: {
        title: `월요일 아침, ${business?.brandName || '우리 매장'} 풍경`,
        threads: [
          { order: 1, content: `월요일 아침 ${business?.brandName || '매장'} 풍경 📸`, imageDescription: '아침 준비 모습' },
          { order: 2, content: '오픈 전 준비하는 직원들 모습', hasSeparator: true },
          { order: 3, content: '열심히 준비하는 이유? 곧 찾아오실 고객님들 때문이죠 💛', imageDescription: '준비된 매장' },
          { order: 4, content: '오늘도 최선을 다해서 모시겠습니다!', hasSeparator: true },
        ],
        hashtags: ['#일상', '#브랜드일상', '#월요일', '#열일중'],
      },
    },
  }

  const template = templates[strategy]?.[purpose] || templates.value.info
  const threadCount = Math.min(settings.threadCount, template.threads.length)
  const selectedThreads = template.threads.slice(0, threadCount)

  // CTA 추가
  if (settings.ctaType === 'question') {
    selectedThreads.push({
      order: selectedThreads.length + 1,
      content: '여러분도 비슷한 경험 있으신가요? 댓글로 공유해주세요! 👇',
      hasSeparator: true,
    })
  } else if (settings.ctaType === 'follow') {
    selectedThreads.push({
      order: selectedThreads.length + 1,
      content: '매일 이런 이야기를 전해드려요. 팔로우하고 함께해요! 🔔',
      hasSeparator: true,
    })
  }

  const content = selectedThreads.map(t => t.content).join('\n\n')

  return {
    title: template.title,
    threads: selectedThreads.map(t => ({
      order: t.order,
      content: t.content,
      imageDescription: settings.includeImages ? t.imageDescription : undefined,
      hasSeparator: t.hasSeparator,
    })),
    hashtags: settings.hashtagStyle === 'minimal' 
      ? template.hashtags.slice(0, 3) 
      : template.hashtags.slice(0, 5),
    metadata: {
      wordCount: content.length,
      estimatedReadTime: Math.ceil(selectedThreads.length * 0.3),
      threadCount: selectedThreads.length,
      tone: meta.tone,
    },
    usedFallback: true,
  }
}

/**
 * Threads Draft Generation
 * 
 * 2단계 프롬프트 전략:
 * 1. Planning: 전략 구조 설계 (생략 - 간결함을 위해 바로 Generation)
 * 2. Generation: 실제 스레드 작성
 */
export async function generateThreadsDraft(
  input: ThreadsDraftInput
): Promise<ThreadsDraftOutput> {
  console.log('[Threads Draft] Starting generation:', {
    topic: input.meta.topic,
    purpose: input.meta.purpose,
    strategy: input.meta.strategyType || 'tip',
    provider: isAIProviderAvailable() ? 'ai' : 'fallback',
  })

  // AI Provider가 설정되지 않은 경우 즉시 fallback
  if (!isAIProviderAvailable()) {
    console.log('[Threads Draft] AI provider not available, using deterministic fallback')
    return generateDeterministicThreadsDraft(input)
  }

  // AI 호출 시도 - 전략별 프롬프트 조합
  const systemPrompt = buildThreadsSystemPrompt() + 
    buildStrategyDraftPrompt(input.meta.strategyType || 'tip', input.meta.purpose, input.meta.businessInfo)

  const result = await generateAiObject({
    systemPrompt,
    userPrompt: buildThreadsUserPrompt(input),
    schema: ThreadsDraftOutputSchema,
    temperature: 0.8,
    maxTokens: 2000,
    purpose: 'draft',
  })

  // 성공 시 AI 결과 반환
  if (result.ok && result.data) {
    console.log('[Threads Draft] AI generation successful:', {
      title: result.data.title,
      threadCount: result.data.threads.length,
    })
    return { ...result.data, usedFallback: false }
  }

  // 실패 시 fallback
  console.warn('[Threads Draft] AI generation failed, using fallback:', {
    error: result.error?.code,
    message: result.error?.message,
  })

  return generateDeterministicThreadsDraft(input)
}

// ============================================
// Legacy Functions (for compatibility)
// ============================================

/**
 * @deprecated Use generateThreadsDraft instead
 */
export function buildThreadsPurposePrompt(purpose: ThreadsDraftSettings['purpose']): string {
  return buildStrategyDraftPrompt('tip', purpose)
}

/**
 * @deprecated Use generateThreadsDraft instead
 */
export function buildThreadsResearchSystemPrompt(): string {
  return buildStrategyPlanningPrompt('tip')
}

/**
 * @deprecated Use generateThreadsDraft instead
 */
export function buildThreadsResearchUserPrompt(
  topic: string,
  purpose: 'food' | 'info' | 'branding',
  targetAudience?: string
): string {
  return `**주제:** ${topic}
**목적:** ${purpose}
${targetAudience ? `**타겟 독자:** ${targetAudience}` : ''}

위 주제로 Threads 스레드를 작성하려고 합니다.
- 5-7개의 스레드 구조로 핵심 포인트 추출
- 첫 문장(훅) 아이디어 3개 제안
- 관련 해시태그 5개 추천

JSON 형식으로 출력:`
}
