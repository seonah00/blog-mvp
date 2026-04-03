/**
 * Stage 5: Body Generation
 * 
 * outline + distilled data만 가지고 초안 생성
 * raw research / raw review / raw place snippets 직접 삽입 금지
 * 정보성 글은 설명형, 맛집 글은 실제 소개글/방문기형으로 분리
 */

import { generateAiObject, generateWithPurpose } from '../client'
import { z } from 'zod'
import type { 
  StructuredOutline, 
  DistilledFacts, 
  TitleGenerationResult, 
  RawDraft,
  DraftSection 
} from './types'
import type { InformationalPipelineInput, RestaurantPipelineInput } from './types'

/**
 * 본문 생성 (정보성 글)
 */
export async function generateBody(
  outline: StructuredOutline,
  distilled: DistilledFacts | undefined,
  titleResult: TitleGenerationResult,
  input: InformationalPipelineInput,
  onProgress?: (progress: number) => void
): Promise<RawDraft> {
  onProgress?.(10)

  const { meta, settings } = input
  const sections: DraftSection[] = []

  // 1. 서론 생성
  onProgress?.(20)
  const intro = await generateIntroduction(outline.intro, meta, titleResult)
  sections.push({
    heading: '', // 서론은 헤딩 없음
    content: intro,
    wordCount: intro.length,
  })

  // 2. 본론 섹션 생성
  const totalSections = outline.sections.length
  for (let i = 0; i < totalSections; i++) {
    const section = outline.sections[i]
    onProgress?.(20 + Math.floor((i / totalSections) * 60))
    
    const sectionContent = await generateSection(
      section,
      distilled,
      meta,
      i === 0, // 첫 섹션 여부
      i === totalSections - 1 // 마지막 섹션 여부
    )
    
    sections.push({
      heading: section.heading,
      content: sectionContent,
      wordCount: sectionContent.length,
    })
  }

  // 3. 결론 생성
  onProgress?.(85)
  const conclusion = await generateConclusion(outline.conclusion, meta, distilled)
  sections.push({
    heading: '', // 결론은 헤딩 없음
    content: conclusion,
    wordCount: conclusion.length,
  })

  onProgress?.(100)

  // 전체 내용 조합
  const content = sections.map(s => 
    s.heading ? `## ${s.heading}\n\n${s.content}` : s.content
  ).join('\n\n')

  const result: RawDraft = {
    content,
    sections,
    keywordUsage: countKeywordUsage(content, [meta.mainKeyword, ...meta.subKeywords]),
    sourcesReferenced: [],
    metadata: {
      wordCount: content.length,
      estimatedReadTime: outline.estimatedReadTime,
      tone: settings.tone || 'professional',
    },
  }

  console.log(`[Stage 5] 본문 생성 완료: ${result.metadata.wordCount}자, ${sections.length}개 섹션`)
  return result
}

/**
 * 본문 생성 (맛집 글)
 */
export async function generateRestaurantBody(
  outline: StructuredOutline,
  input: RestaurantPipelineInput,
  titleResult: TitleGenerationResult
): Promise<RawDraft> {
  const { placeProfile, reviewDigest, settings } = input
  const sections: DraftSection[] = []

  // 서론
  const intro = `${placeProfile.name}에 다녀왔습니다. ${placeProfile.category}으로 입소문이 자자한 이곳, ${reviewDigest.summary.substring(0, 100)}...`
  sections.push({ heading: '', content: intro, wordCount: intro.length })

  // 각 섹션
  for (const section of outline.sections) {
    let content = ''
    
    if (section.heading.includes('분위기') || section.heading.includes('위치')) {
      content = `${placeProfile.address}에 위치한 ${placeProfile.name}는 ${reviewDigest.highlights.find(h => h.includes('분위기')) || '분위기가 좋은'} 곳입니다.`
    } else if (section.heading.includes('메뉴') || section.heading.includes('맛')) {
      content = `대표 메뉴는 리뷰에서 꾸준히 호평받고 있습니다. ${reviewDigest.highlights.find(h => h.includes('메뉴') || h.includes('맛')) || '맛이 좋았습니다.'}`
    } else {
      content = `${section.goal}에 대해 살펴 보겠습니다.`
    }

    sections.push({
      heading: section.heading,
      content,
      wordCount: content.length,
    })
  }

  // 결론
  const conclusion = `전반적으로 ${placeProfile.name}는 만족스러운 방문이었습니다.`
  sections.push({ heading: '', content: conclusion, wordCount: conclusion.length })

  const fullContent = sections.map(s => 
    s.heading ? `## ${s.heading}\n\n${s.content}` : s.content
  ).join('\n\n')

  return {
    content: fullContent,
    sections,
    keywordUsage: { [placeProfile.name]: 3 },
    sourcesReferenced: [],
    metadata: {
      wordCount: fullContent.length,
      estimatedReadTime: Math.ceil(fullContent.length / 500),
      tone: settings.tone,
    },
  }
}

// ============================================
// Section Generators
// ============================================

async function generateIntroduction(
  intro: StructuredOutline['intro'],
  meta: InformationalPipelineInput['meta'],
  titleResult: TitleGenerationResult
): Promise<string> {
  const systemPrompt = `당신은 블로그 작가입니다. 서론을 작성하세요.

**중요 규칙:**
1. "관련 자료를 본면", "이 내용을 글에 녹이면" 같은 메모투 금지
2. 독자에게 직접 말하듯이 작성
3. 훅(hook)으로 시작하여 주제 소개
4. ${intro.targetLength}자 내외로 작성`

  const userPrompt = `
제목: ${titleResult.selectedTitle}
주제: ${meta.topic}
타겟: ${meta.targetAudience}
훅: ${intro.hook}
목표: ${intro.goal}

서론을 작성해주세요.
`.trim()

  try {
    const result = await generateWithPurpose('draft', {
      systemPrompt,
      userPrompt,
      temperature: 0.6,
    } as any)  // eslint-disable-line @typescript-eslint/no-explicit-any

    if (result.ok && result.data) {
      return result.data as string
    }
  } catch (error) {
    console.warn('[Stage 5] 서론 생성 실패, fallback:', error)
  }

  // Fallback
  return `${meta.topic}에 대해 많은 분들이 궁금해하시는데요. 오늘은 ${meta.mainKeyword}에 대해 자세히 알아보겠습니다.`
}

async function generateSection(
  section: StructuredOutline['sections'][0],
  distilled: DistilledFacts | undefined,
  meta: InformationalPipelineInput['meta'],
  isFirst: boolean,
  isLast: boolean
): Promise<string> {
  const systemPrompt = `당신은 블로그 작가입니다. 본론 섹션을 작성하세요.

**중요 규칙:**
1. 원문을 그대로 복사하지 말고 재서술
2. "관련 자료를 본면", "참고하면" 같은 표현 금지
3. 독자에게 설명하듯 자연스럽게 작성
4. 소제목과 연결되는 내용
5. ${section.targetLength}자 내외`

  const keyPoints = section.keyPoints.length > 0 
    ? section.keyPoints.join('\n') 
    : '핵심 포인트'

  const distilledPoints = distilled?.keyPoints.slice(0, 5).join('\n') || ''

  const userPrompt = `
소제목: ${section.heading}
목표: ${section.goal}
반드시 다룰 포인트:
${keyPoints}

참고할 정보:
${distilledPoints}

${section.targetLength}자 내외로 작성해주세요.
`.trim()

  try {
    const result = await generateWithPurpose('draft', {
      systemPrompt,
      userPrompt,
      temperature: 0.5,
    } as any)  // eslint-disable-line @typescript-eslint/no-explicit-any

    if (result.ok && result.data) {
      return result.data as string
    }
  } catch (error) {
    console.warn('[Stage 5] 섹션 생성 실패, fallback:', error)
  }

  // Fallback
  return `${section.heading}에 대해 살펴 보겠습니다. ${section.goal}는 중요한 부분입니다.`
}

async function generateConclusion(
  conclusion: StructuredOutline['conclusion'],
  meta: InformationalPipelineInput['meta'],
  distilled: DistilledFacts | undefined
): Promise<string> {
  const systemPrompt = `당신은 블로그 작가입니다. 결론을 작성하세요.

**중요 규칙:**
1. 핵심 내용 요약
2. 독자가 얻어갈 인사이트 제시
3. 자연스러운 마무리
4. ${conclusion.targetLength}자 내외`

  const userPrompt = `
주제: ${meta.topic}
요약할 내용: ${conclusion.summary}
인사이트: ${conclusion.takeaway}

결론을 작성해주세요.
`.trim()

  try {
    const result = await generateWithPurpose('draft', {
      systemPrompt,
      userPrompt,
      temperature: 0.5,
    } as any)  // eslint-disable-line @typescript-eslint/no-explicit-any

    if (result.ok && result.data) {
      return result.data as string
    }
  } catch (error) {
    console.warn('[Stage 5] 결론 생성 실패, fallback:', error)
  }

  // Fallback
  return `지금까지 ${meta.mainKeyword}에 대해 알아보았습니다. ${conclusion.takeaway}`
}

// ============================================
// Utility Functions
// ============================================

function countKeywordUsage(content: string, keywords: string[]): Record<string, number> {
  const usage: Record<string, number> = {}
  
  for (const keyword of keywords) {
    const regex = new RegExp(keyword, 'gi')
    const matches = content.match(regex)
    usage[keyword] = matches ? matches.length : 0
  }
  
  return usage
}
