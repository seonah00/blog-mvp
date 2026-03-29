/**
 * Restaurant Draft AI Functions
 * 
 * 맛집 글쓰기를 위한 AI 보조 기능들
 * - 실제 AI Provider (OpenAI/Anthropic) 연동
 * - Deterministic fallback (API 실패/미설정 시)
 * 
 * @see PROMPT_GUIDE.md - Restaurant Draft
 * @see lib/ai/client.ts - AI Client
 */

import { generateAiObject } from './client'
import {
  RestaurantDraftOutputSchema,
  RestaurantDraftInputSchema,
  createMockRestaurantDraftOutput,
  type RestaurantDraftOutput,
  type RestaurantDraftInput,
} from './schemas/restaurant-draft'
import { isAIProviderAvailable } from '@/lib/integrations/env'
import type {
  RestaurantAssistantMessage,
  ParagraphDraft,
  ReviewDigest,
  NormalizedPlaceProfile,
  RestaurantDraftSettings,
} from '@/types'

export interface DraftGenerationInput {
  placeProfile: {
    name: string
    address: string
    category: string
    phone?: string
    hours?: string[]
  }
  reviewDigest: {
    summary: string
    highlights: string[]
    quotes: string[]
  }
  tone: 'casual' | 'formal' | 'expert'
  previousParagraphs?: string[]
  currentSection?: string
}

// ───────────────────────────────────────────────
// AI Provider 기반 Restaurant Draft Generation
// ───────────────────────────────────────────────

export interface GenerateRestaurantDraftInput {
  placeProfile: NormalizedPlaceProfile
  reviewDigest: ReviewDigest
  settings: RestaurantDraftSettings
  projectTitle: string
  projectTopic: string
  /** 생성 모드: initial(초기), regenerate(재생성), variation(변형) */
  mode?: 'initial' | 'regenerate' | 'variation'
  /** 변형 프리셋 (mode='variation'일 때 사용) */
  preset?: import('@/types').RestaurantDraftVariationPreset
}

/**
 * System Prompt for Restaurant Draft Generation
 */
function buildSystemPrompt(): string {
  return `당신은 맛집 블로그 글을 작성하는 전문 작가입니다.

**역할:**
- 제공된 리서치 데이터(매장 정보, 리뷰 요약)만을 사용하여 글을 작성합니다.
- 외부 검색이나 추가 정보 수집은 하지 않습니다.
- 제공되지 않은 정보(정확한 가격, 영업시간 등)는 추측하지 않습니다.

**작성 원칙:**
1. 제공된 데이터만 사용 - 없는 정보는 꾸며내지 않기
2. 과장 표현 금지 - "무조건", "최고", "맛집 인증", "줄 서서라도 꼭" 등의 표현 사용 금지
3. 자연스러운 톤 - AI가 쓴 것처럼 보이지 않게 인간적인 표현 사용
4. 구조화된 내용 - 제목, 도입, 본론(선택한 포인트별), 마무리로 구성

**출력 형식:**
JSON 형식으로 다음 필드를 포함하여 응답:
- title: 글 제목 (50자 이내)
- content: 전체 내용 (마크다운 형식)
- sections: 섹션별 구분 (heading, content)
- recommendedImages: 추천 이미지 설명 (최대 10개)
- hashtags: 해시태그 목록 (최대 15개, # 접두사 포함)
- metadata: { wordCount, estimatedReadTime, tone }

**주의사항:**
- 리뷰 인용구는 원문을 정확히 인용하되, 맥락을 왜곡하지 마세요.
- 메뉴 설명은 "~했다", "~였다" 등 체험형 표현을 사용하세요.
- 방문객의 실제 후기를 바탕으로 작성하세요.`
}

/**
 * User Prompt for Restaurant Draft Generation
 */
function buildUserPrompt(input: GenerateRestaurantDraftInput): string {
  const { placeProfile, reviewDigest, settings, projectTitle, projectTopic } = input

  const channelGuide = {
    blog: '블로그 포스트 형식: 전체 구조(도입-본론-결론), 800-2000자, 기본 정보 섹션 포함',
    threads: '스레드 형식: 짧고 임팩트 있는 내용, 400-800자, 해시태그 중심',
    daangn: '당근마켓 형식: 간결한 정보 중심, 200-500자, 가격/위치 강조',
  }

  const toneGuide = {
    friendly: '친근한 블로거 톤: "~였어요", "~더라고요" 등 경험 공유형',
    informative: '정보 전달 톤: "~입니다", "~합니다" 등 객관적 설명형',
    recommendation: '추천 톤: "~추천해요", "~드려요" 등 팬심 가득한 체',
  }

  const focusGuide: Record<string, string> = {
    menu: '메뉴: 대표 메뉴 설명, 맛 평가, 가격대 언급',
    atmosphere: '분위기: 인테리어, 조명, 전체적인 느낌',
    location: '위치: 주소, 주변 환경, 접근성',
    price: '가격: 가성비, 가격대, 할인 정보',
    waiting: '웨이팅: 대기 시간, 예약 필요 여부, 붐비는 시간대',
    parking: '주차: 주차장 여부, 발렛, 대중교통',
  }

  return `[매장 정보]
- 이름: ${placeProfile.name}
- 카테고리: ${placeProfile.category}
- 주소: ${placeProfile.address}
${placeProfile.phone ? `- 전화번호: ${placeProfile.phone}` : ''}
${placeProfile.hours ? `- 영업시간: ${placeProfile.hours.join(', ')}` : ''}

[리뷰 요약]
- 전체 요약: ${reviewDigest.summary}
- 감성: ${reviewDigest.sentiment}
- 핵심 포인트:
${reviewDigest.highlights.map(h => `  • ${h}`).join('\n')}
${reviewDigest.quotes.length > 0 ? `- 인용구:\n${reviewDigest.quotes.map(q => `  • ${q}`).join('\n')}` : ''}

[프로젝트 정보]
- 제목: ${projectTitle}
- 주제: ${projectTopic}

[작성 설정]
- 채널: ${settings.channel} (${channelGuide[settings.channel]})
- 톤: ${settings.tone} (${toneGuide[settings.tone]})
- 강조 포인트: ${settings.focusPoints.map(p => `${p}(${focusGuide[p]})`).join(', ')}

[추가 지시사항]
1. 위 데이터만 사용하여 글을 작성하세요.
2. 과장된 표현 없이 방문객의 실제 경험을 바탕으로 작성하세요.
3. ${settings.channel} 채널에 맞는 형식과 길이를 준수하세요.
4. JSON 형식으로만 응답하세요.`
}

/**
 * Deterministic Fallback Draft Generation
 * AI 호출 실패 시 사용
 */
function generateDeterministicDraft(
  input: GenerateRestaurantDraftInput
): RestaurantDraftOutput {
  const { placeProfile, reviewDigest, settings, projectTitle } = input

  // 채널별 기본 길이
  const lengthByChannel = {
    blog: { target: 1500 },
    threads: { target: 800 },
    daangn: { target: 400 },
  }

  // 강조 포인트별 섹션 생성
  const focusSections = settings.focusPoints.map(point => {
    const sectionMap: Record<string, { title: string; content: string }> = {
      menu: {
        title: '대표 메뉴',
        content: `${placeProfile.name}의 시그니처 메뉴는 리뷰에서 꾸준히 호평받는 부분이에요. ` +
                 `${reviewDigest.highlights.find(h => h.includes('메뉴') || h.includes('맛')) || '음식의 퀄리티가 좋아요.'}`,
      },
      atmosphere: {
        title: '분위기',
        content: `매장의 분위기는 ${reviewDigest.sentiment === 'positive' 
          ? '방문객들이 특히 만족하는 포인트예요. 사진 찍기에도 좋은 공간이에요.' 
          : '한 번쯤 경험해볼 만한 매력이 있어요.'}`,
      },
      location: {
        title: '위치와 접근성',
        content: `${placeProfile.address}에 위치하고 있어 찾아가기 편리해요. ` +
                 `주변 교통도 편리한 편이에요.`,
      },
      price: {
        title: '가격대',
        content: `${placeProfile.category} 치고는 적당한 가격대를 형성하고 있어요. ` +
                 `${reviewDigest.highlights.find(h => h.includes('가성비') || h.includes('가격')) || '가격 대비 만족스러웠어요.'}`,
      },
      waiting: {
        title: '웨이팅 정보',
        content: `${reviewDigest.highlights.find(h => h.includes('웨이팅') || h.includes('대기')) 
          ? '피크타임에는 웨이팅이 있을 수 있어요.' 
          : '평일에는 비교적 여유롭게 이용할 수 있어요.'}`,
      },
      parking: {
        title: '주차 정보',
        content: `주차 공간이 ${reviewDigest.highlights.find(h => h.includes('주차')) 
          ? '마련되어 있어 차량 방문도 가능해요.' 
          : '제한적이니 대중교통 이용을 권장해요.'}`,
      },
    }
    return sectionMap[point] || { title: point, content: '' }
  }).filter(s => s.content)

  // 콘텐츠 조립
  let content = ''

  if (settings.channel === 'blog') {
    const parts = [
      `# ${projectTitle}\n`,
      `${reviewDigest.summary}\n`,
      ...focusSections.map(s => `## ${s.title}\n${s.content}\n`),
    ]

    if (reviewDigest.quotes.length > 0) {
      parts.push(`## 방문객 후기\n`)
      reviewDigest.quotes.slice(0, 2).forEach(quote => {
        parts.push(`> ${quote}\n`)
      })
    }

    parts.push(`---\n**기본 정보**\n📍 ${placeProfile.address}${placeProfile.phone ? ` | 📞 ${placeProfile.phone}` : ''}\n\n${placeProfile.name}에서 즐거운 식사 되세요!`)

    content = parts.join('\n')
  } else if (settings.channel === 'threads') {
    content = [
      `🍽️ ${placeProfile.name}\n`,
      `${reviewDigest.summary.slice(0, 100)}...\n`,
      focusSections.slice(0, 2).map(s => `• ${s.title}: ${s.content.slice(0, 50)}...`).join('\n'),
      ``,
      `📍 ${placeProfile.address.split(' ').slice(0, 3).join(' ')}`,
    ].join('\n')
  } else {
    content = [
      `[${placeProfile.category}] ${placeProfile.name}\n`,
      `${reviewDigest.summary.slice(0, 80)}\n`,
      focusSections.slice(0, 2).map(s => `${s.title}: ${s.content.slice(0, 40)}...`).join('\n'),
      ``,
      `📍 ${placeProfile.address.split(' ').slice(0, 3).join(' ')}`,
    ].join('\n')
  }

  // 해시태그 생성
  const baseTags = ['#맛집', `#${placeProfile.category.replace(/\s/g, '')}`]
  const focusTags = settings.focusPoints.slice(0, 2).map(p => {
    const tagMap: Record<string, string> = {
      menu: '#맛집추천',
      atmosphere: '#감성맛집',
      location: '#서울맛집',
      price: '#가성비맛집',
      waiting: '#핫플',
      parking: '#주차가능',
    }
    return tagMap[p]
  }).filter(Boolean)
  const placeTag = `#${placeProfile.name.replace(/\s/g, '')}`

  return {
    title: projectTitle,
    content,
    sections: focusSections.map(s => ({ heading: s.title, content: s.content })),
    recommendedImages: ['매장 전경', '대표 메뉴', '인테리어', '시그니처 디시'],
    hashtags: [...baseTags, ...focusTags, placeTag].slice(0, 10),
    metadata: {
      wordCount: content.length,
      estimatedReadTime: Math.ceil(content.length / 500),
      tone: settings.tone,
    },
  }
}

/**
 * Restaurant Draft Generation
 * 
 * AI Provider를 사용하여 초안을 생성합니다.
 * 실패 시 deterministic fallback을 반환합니다.
 * 
 * @param input 초안 생성 입력 데이터
 * @returns 생성된 초안 (AI 또는 fallback)
 */
export async function generateRestaurantDraft(
  input: GenerateRestaurantDraftInput
): Promise<RestaurantDraftOutput> {
  console.log('[Restaurant Draft] Starting generation:', {
    place: input.placeProfile.name,
    channel: input.settings.channel,
    provider: isAIProviderAvailable() ? 'ai' : 'fallback',
  })

  // AI Provider가 설정되지 않은 경우 즉시 fallback
  if (!isAIProviderAvailable()) {
    console.log('[Restaurant Draft] AI provider not available, using deterministic fallback')
    const fallbackResult = generateDeterministicDraft(input)
    return { ...fallbackResult, usedFallback: true }
  }

  // AI 호출 시도
  const result = await generateAiObject({
    systemPrompt: buildSystemPrompt(),
    userPrompt: buildUserPrompt(input),
    schema: RestaurantDraftOutputSchema,
    temperature: 0.7,
    maxTokens: 3000,
  })

  // 성공 시 AI 결과 반환
  if (result.ok && result.data) {
    console.log('[Restaurant Draft] AI generation successful:', {
      title: result.data.title,
      wordCount: result.data.metadata?.wordCount,
    })
    return { ...result.data, usedFallback: false }
  }

  // 실패 시 fallback
  console.warn('[Restaurant Draft] AI generation failed, using fallback:', {
    error: result.error?.code,
    message: result.error?.message,
  })

  const fallbackResult = generateDeterministicDraft(input)
  return { ...fallbackResult, usedFallback: true }
}

// ───────────────────────────────────────────────
// Legacy Functions (for backward compatibility)
// ───────────────────────────────────────────────

/**
 * 다음 문단 생성
 * 
 * 리서치 데이터를 기반으로 다음 문단 제안
 */
export async function generateNextParagraph(
  input: DraftGenerationInput
): Promise<ParagraphDraft> {
  const { placeProfile, reviewDigest, tone, previousParagraphs, currentSection } = input
  
  const toneGuide = {
    casual: '친근하고 편안한 블로그 톤. "~였어요", "~더라고요" 등 사용.',
    formal: '정중하고 객관적인 매거진 톤. "~입니다", "~합니다" 등 사용.',
    expert: '전문적이고 심도있는 리뷰 톤. 맛 평가, 요리 분석 포함.',
  }

  // TODO: 실제 AI API 호출
  console.log('[AI] Generating next paragraph for:', placeProfile.name)
  
  return {
    id: `draft-${Date.now()}`,
    content: `${placeProfile.name}는 ${placeProfile.category}로, ${reviewDigest.highlights[0] || '좋은 평가를 받고 있습니다'}. ` +
             `특히 ${reviewDigest.highlights[1] || '분위기'}가 인상적이었어요.`,
    suggestedNext: '메뉴 소개나 가격대에 대해 이어서 작성해보세요.',
    toneCheck: tone === 'casual' ? 'OK' : '조정 필요',
    generatedAt: new Date().toISOString(),
  }
}

/**
 * 문단 개선 제안
 * 
 * 작성된 문단의 톤, 표현, 정보 누락 검사
 */
export async function improveParagraph(
  paragraph: string,
  reviewDigest: { highlights: string[] },
  tone: 'casual' | 'formal' | 'expert'
): Promise<RestaurantAssistantMessage> {
  // TODO: AI API 호출
  console.log('[AI] Improving paragraph...')
  
  return {
    role: 'assistant',
    type: 'improvement',
    content: '이 문단은 좋지만, 리서치에서 언급된 "분위기"에 대한 언급이 추가되면 좋을 것 같아요.',
    suggestions: [
      { text: '분위기가 좋았고', insertAfter: '음식도' },
    ],
  }
}

/**
 * 인용구 제안
 * 
 * 리서치 데이터에서 적절한 인용구 추천
 */
export async function suggestQuote(
  context: string,
  availableQuotes: string[]
): Promise<{ quote: string; context: string } | null> {
  // TODO: AI API 호출
  console.log('[AI] Suggesting quote...')
  
  if (availableQuotes.length === 0) return null
  
  return {
    quote: availableQuotes[0],
    context: '현재 문맥에 잘 어울리는 인용구입니다.',
  }
}

/**
 * 메뉴 설명 생성
 * 
 * 메뉴명과 기본 정보로 설명 문단 생성
 */
export async function generateMenuDescription(
  menuName: string,
  category: string
): Promise<string> {
  // TODO: AI API 호출
  console.log('[AI] Generating menu description for:', menuName)
  return `${menuName}는 ${category}의 대표 메뉴로, 특유의 풍미가 인상적입니다.`
}
