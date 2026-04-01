/**
 * Karrot (당근) Draft Prompts & Generation
 * 
 * 당근마켓 동네생활 콘텐츠 작성을 위한 프롬프트 및 AI 생성
 * @see PROMPT_GUIDE.md - Karrot Draft 섹션
 */

import type { KarrotDraftInput, KarrotDraftOutput, KarrotDraftSettings } from '@/types'
import { KarrotDraftOutputSchema } from '@/lib/ai/schemas/karrot-draft'
import { generateAiObject } from '@/lib/ai/client'
import { isAIProviderAvailable } from '@/lib/integrations/env'

/**
 * System Prompt - 공통 기반
 */
export function buildKarrotSystemPrompt(): string {
  return `당신은 당근마켓 동네생활 콘텐츠 작성 전문가입니다.

**핵심 원칙:**
1. 동네 친구처럼 - "우리 동네", "근처에" 등 지역감 표현
2. 구체적인 정보 - 가격, 위치, 시간 정확히
3. 진정성 - 과장하지 않은 실제 경험
4. 소통 유도 - 질문, 제안으로 대화 열기
5. 이모지 적절히 - 너무 많지 않게

**금지:**
- 전문 광고 문구 ("최저가", "한정판매")
- 타 지역 언급 (특정 동네에 특화되어야 함)
- 가짜 긴급성 ("오늘만", "급하게")
- 복사붙여넣기 느낌의 템플릿

**출력 형식:**
JSON 형식으로 응답:
- title: 글 제목 (30자 이내)
- content: 본문 내용 (마크다운 형식)
- hashtags: string[] (최대 5개)
- metadata: { wordCount, estimatedReadTime, emojiCount }`
}

/**
 * Purpose별 System Prompt 추가 지침
 */
export function buildKarrotPurposePrompt(purpose: KarrotDraftSettings['purpose']): string {
  switch (purpose) {
    case 'ad':
      return `
**광고형 지침:**
- 업종과 서비스를 명확히 소개
- 가격 정보 투명하게 (할인율 포함)
- 위치 구체적으로 (지하철역 기준 도보 시간)
- 연락처/예약 방법 필수
- 영업시간 명시
- 첫 문장에 핵심 혜택 ("역삼동에서 가장 저렴한")
- 너무 광고 같지 않게, 친구 추천 느낌으로

**필수 포함:**
- 정확한 가격 또는 할인 정보
- 위치 (지번 또는 도로명)
- 연락 방법
- 영업 시간

**예시 톤:**
"역삼동에서 네일샵 찾으시는 분들, 가격 먼저 알려드릴게요."
"이번 주 오픈 기념으로 30% 할인하고 있어요."`

    case 'food':
      return `
**맛집형 지침:**
- 직접 방문한 경험 위주
- 메뉴 이름과 가격 정확히
- 위치 설명 (동네 기준)
- 분위기/인테리어 간단히
- "누구랑 가면 좋을지" 추천
- 사진 촬영 포인트 언급 (선택)

**필수 포함:**
- 가게 이름
- 대표 메뉴와 가격
- 대략적인 위치
- 개인적 소감

**예시 톤:**
"우리 동네에 이런 곳이 있었다니!"
"점심으로 먹었는데 양도 많고 맛있었어요."
"엄마랑 가기 좋아요. 조용하고 편안해요."`

    case 'community':
      return `
**동네소통형 지침:**
- 질문 또는 정보 공유 중심
- "~하신 분 있나요?" 체제 사용
- 동네 특화 정보 (주차, 상권, 공사 등)
- 함께하면 좋을 것 제안 (번개, 공구 등)
- 정중한 부탁 또는 제안
- 감사 인사 또는 환영

**금지:**
- 민감한 주제 (정치, 종교)
- 타인 비난
- 불법/편법 언급

**예시 톤:**
"혹시 우리 동네 애견동반 카페 아시는 분 계신가요?"
"이번 주말에 동네 정원사 분들 번개 어떠세요?"
"우리 아파트 근처에 이런 가게 생겼더라고요!"`

    default:
      return ''
  }
}

/**
 * User Prompt Builder
 */
export function buildKarrotUserPrompt(input: KarrotDraftInput): string {
  const { meta, research, settings } = input

  const purposeLabels: Record<string, string> = {
    ad: '가게 홍보/광고',
    food: '맛집 소개',
    community: '동네 소통/정보',
  }

  const urgencyLabels: Record<string, string> = {
    none: '없음',
    soft: '부드럽게 (예: 조금 서둘러 주세요)',
    strong: '강하게 (예: 오늘 마감)',
  }

  return `**프로젝트 정보:**
- 주제: ${meta.topic}
- 목적: ${purposeLabels[meta.purpose]}
- 동네: ${meta.region}
- 타겟: ${meta.targetAudience || '동네 주민'}
${meta.businessType ? `- 업종: ${meta.businessType}` : ''}

**설정:**
- 이모지 레벨: ${settings.emojiLevel}
- 마감 임박: ${urgencyLabels[settings.urgency]}
- 가격 정보: ${settings.includePrice ? '포함' : '미포함'}
- 위치 정보: ${settings.includeLocation ? '포함' : '미포함'}
- 연락처: ${settings.includeContact ? '포함' : '미포함'}

**리서치 데이터:**
${research.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

**동네 키워드:**
${research.localKeywords.join(', ')}

**요구사항:**
1. "${meta.region}" 지역감이 느껴지는 표현 사용
2. ${settings.includePrice && meta.purpose === 'ad' ? '가격/할인 정보 명확히' : '가격 언급은 자연스럽게'}
3. ${settings.includeLocation ? '위치 설명 구체적으로' : ''}
4. ${settings.includeContact && meta.purpose === 'ad' ? '연락처/예약 방법 포함' : ''}
5. 이모지 ${settings.emojiLevel === 'none' ? '사용하지 않음' : settings.emojiLevel === 'minimal' ? '최소한으로' : '적절히'}
6. ${settings.urgency !== 'none' && meta.purpose === 'ad' ? '마감 임박 표현 자연스럽게' : ''}

JSON 형식으로 출력:`
}

// ============================================
// AI Generation
// ============================================

/**
 * Deterministic Fallback for Karrot
 */
function generateDeterministicKarrotDraft(input: KarrotDraftInput): KarrotDraftOutput {
  const { meta, settings } = input
  const purpose = settings.purpose
  const region = meta.region

  const getEmoji = () => {
    if (settings.emojiLevel === 'none') return ''
    if (settings.emojiLevel === 'minimal') return '🌿'
    return '🌿✨'
  }

  // Build content based on purpose
  let title = ''
  let content = ''
  let hashtags: string[] = []

  if (purpose === 'ad') {
    title = `${region} 새로 오픈했어요`
    content = `${getEmoji()} ${region}에 새로 오픈한 ${meta.businessType || '가게'}예요.\n\n`
    
    if (settings.includePrice) {
      content += '오픈 기념으로 할인하고 있어요.\n\n💅 기본 메뉴: 35,000원 → 24,500원\n'
    } else {
      content += '좋은 서비스로 모시겠습니다.\n'
    }
    
    if (settings.includeLocation) {
      content += `\n📍 위치: ${region} 주민센터 도보 3분`
    }
    if (settings.includeContact) {
      content += '\n📞 예약: 010-XXXX-XXXX (카톡도 가능)'
    }
    if (settings.urgency !== 'none') {
      content += '\n⏰ 할인은 한정된 기간동안이에요!'
    }
    
    content += `\n\n${region} 주민분들 많이 찾아와 주세요!`
    hashtags = [`#${region}`, '#동네가게', '#오픈소식', '#할인이벤트']
  } else if (purpose === 'food') {
    title = `${region} 숨은 맛집 찾았어요`
    content = `${getEmoji()} ${region}에 숨은 맛집 찾았어요.\n\n`
    content += '점심으로 파스타 먹었는데 진짜 맛있었어요.\n\n'
    content += '🍝 알리오올리오: 13,000원\n'
    content += '🍝 봉골레 파스타: 15,000원\n\n'
    content += '분위기도 조용하고 직원분들 친절하셔서\n'
    content += '엄마랑 가기 좋아요.\n'
    
    if (settings.includeLocation) {
      content += `\n📍 ${region} 이마트 뒷골목에 있어요`
    }
    
    content += '\n\n혼자 가도 편하게 먹을 수 있는 곳이에요. 추천!'
    hashtags = [`#${region}`, '#동네맛집', '#맛집추천', '#혼밥']
  } else {
    // community
    title = `${region} 주민분들 질문 있어요`
    content = `${getEmoji()} ${region} 주민분들 질문 있어요!\n\n`
    content += `혹시 우리 동네에서 ${meta.topic} 아시는 분 계신가요?\n\n`
    content += '작은 푸들 키우고 있는데 데리고 가고 싶어서요.\n\n'
    content += '🐕 테라스 있는 곳이면 더 좋을 것 같아요\n'
    content += '🐕 음료는 당연히 주문할 예정이에요\n\n'
    content += '혹시 아시는 곳 있으면 댓글로 알려주세요!\n'
    content += `${region} 주변에 괜찮은 곳 있다면 정보 공유해요~`
    hashtags = [`#${region}`, '#동네소통', '#정보공유', '#동네친구']
  }

  return {
    title,
    content,
    hashtags: hashtags.slice(0, 5),
    metadata: {
      wordCount: content.length,
      estimatedReadTime: Math.ceil(content.length / 200),
      emojiCount: settings.emojiLevel === 'none' ? 0 : settings.emojiLevel === 'minimal' ? 2 : 5,
      tone: 'casual',
    },
    usedFallback: true,
  }
}

/**
 * Karrot Draft Generation
 * 
 * AI Provider를 사용하여 당근마켓 글 초안을 생성합니다.
 * 실패 시 deterministic fallback을 반환합니다.
 */
export async function generateKarrotDraft(
  input: KarrotDraftInput
): Promise<KarrotDraftOutput> {
  console.log('[Karrot Draft] Starting generation:', {
    topic: input.meta.topic,
    purpose: input.meta.purpose,
    region: input.meta.region,
    provider: isAIProviderAvailable() ? 'ai' : 'fallback',
  })

  // AI Provider가 설정되지 않은 경우 즉시 fallback
  if (!isAIProviderAvailable()) {
    console.log('[Karrot Draft] AI provider not available, using deterministic fallback')
    return generateDeterministicKarrotDraft(input)
  }

  // AI 호출 시도
  const result = await generateAiObject({
    systemPrompt: buildKarrotSystemPrompt() + buildKarrotPurposePrompt(input.settings.purpose),
    userPrompt: buildKarrotUserPrompt(input),
    schema: KarrotDraftOutputSchema,
    temperature: 0.7,
    maxTokens: 1500,
    purpose: 'draft',
  })

  // 성공 시 AI 결과 반환
  if (result.ok && result.data) {
    console.log('[Karrot Draft] AI generation successful:', {
      title: result.data.title,
      wordCount: result.data.metadata.wordCount,
    })
    return { ...result.data, usedFallback: false }
  }

  // 실패 시 fallback
  console.warn('[Karrot Draft] AI generation failed, using fallback:', {
    error: result.error?.code,
    message: result.error?.message,
  })

  return generateDeterministicKarrotDraft(input)
}

/**
 * Research System Prompt
 */
export function buildKarrotResearchSystemPrompt(): string {
  return `당신은 당근마켓 동네생활 콘텐츠 기획 전문가입니다.

**역할:**
- 동네 특화 키워드를 추출합니다.
- 주제에 맞는 핵심 포인트를 정리합니다.
- 동네 주민들이 공감할만한 요소를 파악합니다.

**출력 형식:**
JSON 형식:
- keyPoints: string[] (글에 담을 핵심 내용)
- localKeywords: string[] (동네 관련 키워드)
- suggestedTitles: string[] (제목 아이디어 3개)
- suggestedEmojis?: string[] (추천 이모지)`
}

/**
 * Research User Prompt
 */
export function buildKarrotResearchUserPrompt(
  topic: string,
  purpose: 'ad' | 'food' | 'community',
  region: string,
  businessType?: string
): string {
  const purposeLabels: Record<string, string> = {
    ad: '가게 홍보/광고',
    food: '맛집 소개',
    community: '동네 소통/정보',
  }

  return `**주제:** ${topic}
**목적:** ${purposeLabels[purpose]}
**동네:** ${region}
${businessType ? `**업종:** ${businessType}` : ''}

위 정보로 당근마켓 동네생활 글을 작성하려고 합니다.
- ${region} 지역 특화 키워드 추출
- 주민들이 공감할 핵심 포인트 3-5개
- 제목 아이디어 3개

JSON 형식으로 출력:`
}
