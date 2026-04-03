/**
 * Stage 3: Outline Generation
 * 
 * 최종 글 구조 설계
 * 소제목, 각 섹션 핵심 포인트, 서론 역할, 결론 요약 포인트 생성
 * 본문 생성 전에 반드시 거쳐야 하는 단계
 */

import { generateAiObject } from '../client'
import { z } from 'zod'
import type { StructuredOutline, DistilledFacts } from './types'
import type { InformationalPipelineInput, RestaurantPipelineInput } from './types'

/**
 * 정보성 글용 아웃라인 생성
 */
export async function generateOutline(
  distilled: DistilledFacts | undefined,
  input: InformationalPipelineInput,
  onProgress?: (progress: number) => void
): Promise<StructuredOutline> {
  onProgress?.(10)

  const { meta, settings } = input
  const targetLength = calculateTargetLength(settings)
  
  // 이미 아웃라인이 존재하면 재사용
  if (input.existingOutline && input.existingOutline.sections.length > 0) {
    console.log('[Stage 3] 기존 아웃라인 재사용')
    return convertExistingOutline(input.existingOutline, targetLength)
  }

  onProgress?.(30)

  // AI로 아웃라인 생성
  const systemPrompt = `당신은 블로그 기획자입니다. 제공된 핵심 정보를 바탕으로 글의 구조를 설계하세요.

**구조 설계 원칙:**
1. 서론(인트로): 독자의 관심을 끄는 훅 + 글의 목표
2. 본론: 4-6개 섹션으로 구성, 각 섹션은 하나의 주제를 다룸
3. 결론: 핵심 요약 + 독자가 얻어갈 인사이트

**섹션 구성:**
- 정보성 글: 문제 인식 → 해결책 → 사례 → 팁 → 정리
- 가이드형: 준비 → 단계별 방법 → 주의사항 → 마무리

**출력 형식 (JSON):**
{
  "intro": { "hook": "도입 문장", "goal": "서론 목표", "targetLength": 150 },
  "sections": [
    { "heading": "소제목", "goal": "섹션 목표", "keyPoints": ["포인트1", "포인트2"], "targetLength": 300, "order": 1 }
  ],
  "conclusion": { "summary": "요약 내용", "takeaway": "인사이트", "targetLength": 150 }
}`

  const userPrompt = `
메인 키워드: ${meta.mainKeyword}
서브 키워드: ${meta.subKeywords.join(', ')}
타겟 독자: ${meta.targetAudience}
글 스타일: ${settings.style || 'guide'}

핵심 정보:
${distilled?.keyPoints.map(p => `- ${p}`).join('\n') || '기본 정본만으로 구성'}

목표 길이: ${targetLength}자
`.trim()

  onProgress?.(60)

  try {
    const OutlineSchema = z.object({
      intro: z.object({ hook: z.string(), goal: z.string(), targetLength: z.number() }),
      sections: z.array(z.object({
        heading: z.string(),
        goal: z.string(),
        keyPoints: z.array(z.string()),
        targetLength: z.number(),
        order: z.number(),
      })),
      conclusion: z.object({ summary: z.string(), takeaway: z.string(), targetLength: z.number() }),
    })

    const result = await generateAiObject({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      schema: OutlineSchema,
    })

    onProgress?.(80)

    if (result.ok && result.data) {
      const outline = parseOutlineResult(JSON.stringify(result.data), targetLength)
      console.log(`[Stage 3] 아웃라인 생성 완료: ${outline.sections.length}개 섹션`)
      onProgress?.(100)
      return outline
    }
  } catch (error) {
    console.warn('[Stage 3] AI 아웃라인 생성 실패, fallback 사용:', error)
  }

  // Fallback
  onProgress?.(100)
  return createFallbackOutline(meta, targetLength)
}

/**
 * 맛집 글용 아웃라인 생성
 */
export async function generateRestaurantOutline(
  distilled: DistilledFacts | undefined,
  input: RestaurantPipelineInput
): Promise<StructuredOutline> {
  const targetLength = input.settings.channel === 'threads' ? 800 : 1500
  
  // 맛집은 정형화된 구조 사용
  const outline: StructuredOutline = {
    intro: {
      hook: `${input.placeProfile.name}에 대한 첫인상`,
      goal: '매장 소개 및 방문 계기',
      targetLength: 150,
    },
    sections: [
      {
        heading: '매장 분위기와 위치',
        goal: '위치와 분위기 소개',
        keyPoints: ['주소', '분위기', '인테리어'],
        targetLength: 250,
        order: 1,
      },
      {
        heading: '대표 메뉴 살펴 보기',
        goal: '메뉴와 맛 소개',
        keyPoints: ['시그니처 메뉴', '맛 평가'],
        targetLength: 350,
        order: 2,
      },
      {
        heading: '방문 팁',
        goal: '실용적인 정보',
        keyPoints: ['예약', '주차', '웨이팅'],
        targetLength: 200,
        order: 3,
      },
    ],
    conclusion: {
      summary: '전반적인 방문 후기',
      takeaway: '추천 포인트',
      targetLength: 150,
    },
    totalTargetLength: targetLength,
    estimatedReadTime: Math.ceil(targetLength / 500),
  }

  // 강조 포인트에 따라 섹션 조정
  if (input.settings.focusPoints.includes('atmosphere')) {
    outline.sections[0].targetLength += 100
  }
  if (input.settings.focusPoints.includes('menu')) {
    outline.sections[1].targetLength += 100
  }

  console.log(`[Stage 3] 맛집 아웃라인 생성 완료: ${outline.sections.length}개 섹션`)
  return outline
}

// ============================================
// Helper Functions
// ============================================

function calculateTargetLength(settings: { channel?: string; length?: string }): number {
  const baseLength = settings.channel === 'threads' ? 1000 : 2000
  
  switch (settings.length) {
    case 'short': return Math.floor(baseLength * 0.7)
    case 'long': return Math.floor(baseLength * 1.5)
    default: return baseLength
  }
}

function parseOutlineResult(content: string, targetLength: number): StructuredOutline {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    const jsonStr = jsonMatch ? jsonMatch[1] : content
    const parsed = JSON.parse(jsonStr.trim())

    const outline: StructuredOutline = {
      intro: {
        hook: parsed.intro?.hook || '글이 시작됩니다.',
        goal: parsed.intro?.goal || '주제 소개',
        targetLength: parsed.intro?.targetLength || 150,
      },
      sections: (parsed.sections || []).map((s: unknown, i: number) => ({
        heading: (s as { heading?: string }).heading || `섹션 ${i + 1}`,
        goal: (s as { goal?: string }).goal || '',
        keyPoints: (s as { keyPoints?: string[] }).keyPoints || [],
        targetLength: (s as { targetLength?: number }).targetLength || 300,
        order: (s as { order?: number }).order || i + 1,
      })),
      conclusion: {
        summary: parsed.conclusion?.summary || '정리하자면',
        takeaway: parsed.conclusion?.takeaway || '핵심 인사이트',
        targetLength: parsed.conclusion?.targetLength || 150,
      },
      totalTargetLength: targetLength,
      estimatedReadTime: Math.ceil(targetLength / 500),
    }

    return outline
  } catch (error) {
    console.warn('[Stage 3] JSON 파싱 실패, fallback 사용:', error)
    return createFallbackOutline({ mainKeyword: '', subKeywords: [], searchIntent: 'information', audienceLevel: 'beginner', goal: '' } as unknown as InformationalPipelineInput['meta'], targetLength)
  }
}

function convertExistingOutline(
  existing: InformationalPipelineInput['existingOutline'],
  targetLength: number
): StructuredOutline {
  return {
    intro: {
      hook: existing?.intro?.hook || '시작합니다.',
      goal: '서론',
      targetLength: 150,
    },
    sections: (existing?.sections || []).map((s, i) => ({
      heading: s.heading,
      goal: (s as { goal?: string }).goal || '',
      keyPoints: (s as { keyPoints?: string[] }).keyPoints || [],
      targetLength: Math.floor((targetLength - 300) / (existing?.sections?.length || 5)),
      order: i + 1,
    })),
    conclusion: {
      summary: '정리',
      takeaway: '인사이트',
      targetLength: 150,
    },
    totalTargetLength: targetLength,
    estimatedReadTime: Math.ceil(targetLength / 500),
  }
}

function createFallbackOutline(
  meta: InformationalPipelineInput['meta'],
  targetLength: number
): StructuredOutline {
  return {
    intro: {
      hook: `${meta.mainKeyword}에 대해 알아보겠습니다.`,
      goal: '주제 소개 및 독자 관심 유도',
      targetLength: 150,
    },
    sections: [
      {
        heading: `${meta.mainKeyword}란?`,
        goal: '기본 개념 설명',
        keyPoints: ['정의', '핵심 특징'],
        targetLength: 300,
        order: 1,
      },
      {
        heading: '왜 중요한가?',
        goal: '중요성 및 효과',
        keyPoints: ['장점', '효과'],
        targetLength: 300,
        order: 2,
      },
      {
        heading: '실제 적용 사례',
        goal: '구체적인 예시',
        keyPoints: ['사례1', '사례2'],
        targetLength: 300,
        order: 3,
      },
      {
        heading: '시작하는 방법',
        goal: '실천 방법',
        keyPoints: ['준비', '단계'],
        targetLength: 300,
        order: 4,
      },
      {
        heading: '주의사항',
        goal: '주의할 점',
        keyPoints: ['팁', '주의사항'],
        targetLength: 250,
        order: 5,
      },
    ],
    conclusion: {
      summary: `${meta.mainKeyword}의 핵심을 정리합니다.`,
      takeaway: '오늘 배운 내용을 실천해보세요.',
      targetLength: 150,
    },
    totalTargetLength: targetLength,
    estimatedReadTime: Math.ceil(targetLength / 500),
  }
}
