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
  type RestaurantDraftOutput,
} from './schemas/restaurant-draft'
import { isAIProviderAvailable } from '@/lib/integrations/env'
import { applyQualityFilter, logQualityResult } from './quality-filter'
import { validateAndFixContent, logFilterResult } from './content-filter'
import type {
  RestaurantAssistantMessage,
  ParagraphDraft,
  ReviewDigest,
  NormalizedPlaceProfile,
  RestaurantDraftSettings,
  CanonicalPlace,
  WebEvidence,
} from '@/types'

// Pipeline integration
import {
  runRestaurantPipeline,
  type RestaurantPipelineInput as PipelineInput,
} from './pipeline'

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
  /** 정규화된 장소 정보 (canonical) */
  canonicalPlace?: CanonicalPlace
  /** 웹 검색 증거 데이터 */
  webEvidence?: WebEvidence[]
}

/**
 * System Prompt for Restaurant Draft Generation
 */
function buildSystemPrompt(): string {
  return `당신은 맛집 블로그 글을 작성하는 전문 작가입니다.

**가장 중요한 작성 규칙 (반드시 준수):**
1. **템플릿 마커 절대 금지**: "---", "**기본 정보**", "📍" (주소 없이), "📞" (전화번호 없이) 등의 마커는 절대 사용하지 마세요.
2. **메모투 문장 금지**: "관련 자료를 본면", "리뷰를 본면", "이 내용을 녹이면" 등의 메타 문장은 절대 사용하지 마세요.
3. **완성된 블로그 글**: 독자가 읽기 편한, 자연스럽게 이어지는 하나의 글을 작성하세요. 작성 과정이나 메모가 보이면 안 됩니다.
4. **자연스러운 톤**: AI가 쓴 것처럼 보이지 않게 인간적인 표현 사용
5. **과장 표현 금지**: "무조건", "최고", "맛집 인증", "줄 서서라도 꼭", "추천", "보장" 등의 표현 사용 금지
6. **주소/정보 반복 금지**: 같은 주소나 기본 정보를 여러 번 반복하지 마세요. 한 번만 자연스럽게 언급하세요.

**작성 원칙:**
1. 제공된 데이터만 사용 - 없는 정보는 꾸며내지 않기
2. 자연스러운 톤 - 방문한 사람의 실제 경험을 바탕으로 작성
3. 구조화된 내용 - 제목, 도입, 본론(선택한 포인트별), 마무리로 구성

**출력 형식:**
JSON 형식으로 다음 필드를 포함하여 응답:
- title: 글 제목 (24~42자 권장, 매장명 자연스럽게 포함)
- content: 전체 내용 (마크다운 형식, 템플릿 마커 없이)
- sections: 섹션별 구분 (heading, content)
- recommendedImages: 추천 이미지 설명 (최대 10개)
- hashtags: 해시태그 목록 (최대 15개, # 접두사 포함)
- metadata: { wordCount, estimatedReadTime, tone }

**주의사항:**
- 리뷰 인용구는 원문을 정확히 인용하되, 맥락을 왜곡하지 마세요.
- 메뉴 설명은 "~했다", "~였다" 등 체험형 표현을 사용하세요.
- 방문객의 실제 후기를 바탕으로 작성하세요.
- **---, **기본 정보**, 내용을 입력하세요 등의 템플릿 문자열은 절대 포함하지 마세요.**`
}

/**
 * User Prompt for Restaurant Draft Generation
 */
function buildUserPrompt(input: GenerateRestaurantDraftInput): string {
  const { placeProfile, reviewDigest, settings, projectTitle, projectTopic } = input

  const channelGuide = {
    blog: '블로그 포스트 형식: 전체 구조(도입-본론-결론), 800-2000자, 기본 정보는 자연스러운 문장으로 한 번만 언급',
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
    location: '위치: 주소는 자연스러운 문장으로 한 번만 언급, 주변 환경, 접근성',
    price: '가격: 가성비, 가격대, 할인 정보',
    waiting: '웨이팅: 대기 시간, 예약 필요 여부, 붐비는 시간대',
    parking: '주차: 주차장 여부, 발렛, 대중교통',
  }

  // 리뷰 인용구 정제 (메모투 제거)
  const cleanQuotes = reviewDigest.quotes
    .slice(0, 2)
    .map(q => q.replace(/^(리뷰|후기|방문객)\s*[:\-]?\s*/gi, ''))

  return `[매장 정보]
- 이름: ${placeProfile.name}
- 카테고리: ${placeProfile.category}
- 주소: ${placeProfile.address} (본문에서 한 번만 자연스럽게 언급)
${placeProfile.phone ? `- 전화번호: ${placeProfile.phone} (필요시 한 번만 언급)` : ''}
${placeProfile.hours ? `- 영업시간: ${placeProfile.hours.join(', ')}` : ''}

[리뷰 요약]
- 전체 요약: ${reviewDigest.summary}
- 감성: ${reviewDigest.sentiment}
- 핵심 포인트:
${reviewDigest.highlights.map(h => `  • ${h}`).join('\n')}
${cleanQuotes.length > 0 ? `- 인용구:
${cleanQuotes.map(q => `  • "${q}"`).join('\n')}` : ''}

[프로젝트 정보]
- 제목: ${projectTitle}
- 주제: ${projectTopic}

[작성 설정]
- 채널: ${settings.channel} (${channelGuide[settings.channel]})
- 톤: ${settings.tone} (${toneGuide[settings.tone]})
- 강조 포인트: ${settings.focusPoints.map(p => `${p}(${focusGuide[p]})`).join(', ')}

[매우 중요한 작성 규칙]
1. "---", "**기본 정보**", "📍" (주소 없이), "📞" (전화번호 없이) 등의 템플릿 마커는 절대 사용하지 마세요.
2. "내용을 입력하세요", "TODO", "FIXME" 등의 placeholder는 절대 사용하지 마세요.
3. "관련 자료를 본면", "리뷰를 본면", "이 내용을 녹이면" 등 메모투 문장은 절대 사용하지 마세요.
4. 주소는 본문에서 한 번만 자연스러운 문장으로 언급하세요. 반복하지 마세요.
5. "에서 즐거운 식사 되세요!" 같은 템플릿 문구는 사용하지 마세요.
6. 완성된 블로그 글 형식으로 작성하세요. 메모나 지시문이 보이면 안 됩니다.

[제목 작성 규칙]
1. 매장명 "${placeProfile.name}"을 자연스럽게 포함하세요.
2. 24~42자 내외로 작성하세요.
3. "완벽", "최고", "추천", "보장", "총정리", "필수" 등의 과장 표현은 피하세요.
4. 예시) ❌ "${placeProfile.name} 완벽 가이드" → ✅ "${placeProfile.name}, ${placeProfile.category} 맛집으로 손꼽히는 이유"

[주의사항]
1. 위 데이터만 사용하여 글을 작성하세요.
2. 과장된 표현 없이 방문객의 실제 경험을 바탕으로 작성하세요.
3. ${settings.channel} 채널에 맞는 형식과 길이를 준수하세요.
4. JSON 형식으로만 응답하세요.
5. 템플릿 마커(---, **기본 정보** 등)는 절대 포함하지 마세요.`
}

/**
 * Deterministic Fallback Draft Generation (템플릿 누수 수정)
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
                 `${reviewDigest.highlights.find(h => h.includes('메뉴') || h.includes('맛')) || '음식의 퀄리티가 좋았어요.'}`,
      },
      atmosphere: {
        title: '분위기',
        content: `매장의 분위기는 ${reviewDigest.sentiment === 'positive' 
          ? '방문객들이 특히 만족하는 포인트예요. 사진 찍기에도 좋은 공간이에요.' 
          : '한 번쯤 경험해볼 만한 매력이 있어요.'}`,
      },
      location: {
        title: '위치와 접근성',
        content: `${placeProfile.address}에 위치한 ${placeProfile.name}는 찾아가기 편리해요. ` +
                 `주변 교통도 편리한 편이라 방문하시기 좋습니다.`,
      },
      price: {
        title: '가격대',
        content: `${placeProfile.category} 치고는 적당한 가격대를 형성하고 있어요. ` +
                 `${reviewDigest.highlights.find(h => h.includes('가성비') || h.includes('가격')) || '가격 대비 만족스러웠어요.'}`,
      },
      waiting: {
        title: '웨이팅 정보',
        content: `${reviewDigest.highlights.find(h => h.includes('웨이팅') || h.includes('대기')) 
          ? '피크타임에는 웨이팅이 있을 수 있어요. 방문 전 예약을 권장합니다.' 
          : '평일에는 비교적 여유롭게 이용할 수 있어요.'}`,
      },
      parking: {
        title: '주차 정보',
        content: `${reviewDigest.highlights.find(h => h.includes('주차')) 
          ? '주차 공간이 마련되어 있어 차량 방문도 가능해요.' 
          : '주차 공간이 제한적이니 대중교통 이용을 권장해요.'}`,
      },
    }
    return sectionMap[point] || { title: point, content: '' }
  }).filter(s => s.content)

  // 콘텐츠 조립 (템플릿 마커 제거)
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
        const cleanQuote = quote.replace(/^(리뷰|후기|방문객)\s*[:\-]?\s*/gi, '')
        parts.push(`> "${cleanQuote}"\n`)
      })
    }

    // 템플릿 마커 제거, 자연스러운 마무리
    parts.push(`\n${placeProfile.name}에서 좋은 시간 보내시길 바랍니다.`)

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
/**
 * Main: Generate Restaurant Draft (8단계 Pipeline)
 */
export async function generateRestaurantDraft(
  input: GenerateRestaurantDraftInput,
  onProgress?: (status: { stage: string; progress: number; message: string }) => void
): Promise<RestaurantDraftOutput> {
  console.log('[Restaurant Draft] Starting 8-stage pipeline:', {
    place: input.placeProfile.name,
    channel: input.settings.channel,
  })

  // Pipeline 기반 생성 (8단계)
  const pipelineInput: PipelineInput = {
    projectId: input.projectTitle || input.placeProfile.name,
    placeProfile: input.placeProfile,
    reviewDigest: input.reviewDigest,
    settings: input.settings,
    webEvidence: input.webEvidence?.map(e => ({
      url: e.citations?.[0] || '',
      title: e.placeName || '',
      snippet: e.summary || '',
      relevance: 0.5,
    })),
  }

  const result = await runRestaurantPipeline(
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
    console.log('[Restaurant Draft] Pipeline completed successfully')
    return {
      title: result.draft.title,
      content: result.draft.content,
      sections: result.draft.sections.map(s => ({
        heading: s.heading,
        content: s.content,
      })),
      recommendedImages: [],
      hashtags: [],
      metadata: {
        wordCount: result.draft.metadata.wordCount,
        estimatedReadTime: result.draft.metadata.estimatedReadTime,
        tone: input.settings.tone,
      },
      usedFallback: false,
    }
  }

  // Pipeline 실패 시 기존 방식으로 fallback
  console.warn('[Restaurant Draft] Pipeline failed, using legacy:', result.error)
  return generateLegacyRestaurantDraft(input)
}

/**
 * Legacy Restaurant Draft Generation (Fallback)
 */
async function generateLegacyRestaurantDraft(
  input: GenerateRestaurantDraftInput
): Promise<RestaurantDraftOutput> {
  console.log('[Restaurant Draft] Using legacy generation')

  if (!isAIProviderAvailable()) {
    const fallbackResult = generateDeterministicDraft(input)
    const contentFilterResult = validateAndFixContent(fallbackResult.content)
    const qualityResult = applyQualityFilter(contentFilterResult.fixedContent)
    
    return {
      ...fallbackResult,
      content: qualityResult.fixedContent,
      sections: fallbackResult.sections?.map(s => {
        const sectionFiltered = validateAndFixContent(s.content)
        const sectionQuality = applyQualityFilter(sectionFiltered.fixedContent)
        return { ...s, content: sectionQuality.fixedContent }
      }),
      usedFallback: true,
    }
  }

  const result = await generateAiObject({
    systemPrompt: buildSystemPrompt(),
    userPrompt: buildUserPrompt(input),
    schema: RestaurantDraftOutputSchema,
    temperature: 0.7,
    maxTokens: 3000,
  })

  if (result.ok && result.data) {
    const contentFilterResult = validateAndFixContent(result.data.content)
    const qualityResult = applyQualityFilter(contentFilterResult.fixedContent)
    
    return {
      ...result.data,
      content: qualityResult.fixedContent,
      sections: result.data.sections?.map(s => {
        const sectionFiltered = validateAndFixContent(s.content)
        const sectionQuality = applyQualityFilter(sectionFiltered.fixedContent)
        return { ...s, content: sectionQuality.fixedContent }
      }),
      usedFallback: false,
    }
  }

  const fallbackResult = generateDeterministicDraft(input)
  const contentFilterResult = validateAndFixContent(fallbackResult.content)
  const qualityResult = applyQualityFilter(contentFilterResult.fixedContent)
  
  return {
    ...fallbackResult,
    content: qualityResult.fixedContent,
    sections: fallbackResult.sections?.map(s => {
      const sectionFiltered = validateAndFixContent(s.content)
      const sectionQuality = applyQualityFilter(sectionFiltered.fixedContent)
      return { ...s, content: sectionQuality.fixedContent }
    }),
    usedFallback: true,
  }
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
  console.log('[AI] Suggesting quote...')
  
  if (availableQuotes.length === 0) return null
  
  // 인용구 정제 (메모투 제거)
  const cleanQuote = availableQuotes[0].replace(/^(리뷰|후기|방문객)\s*[:\-]?\s*/gi, '')
  
  return {
    quote: cleanQuote,
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
  console.log('[AI] Generating menu description for:', menuName)
  return `${menuName}는 ${category}의 대표 메뉴로, 특유의 풍미가 인상적입니다.`
}
