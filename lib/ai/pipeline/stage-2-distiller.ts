/**
 * Stage 2: Research Distillation
 * 
 * raw source에서 핵심 사실/주장/비교 포인트/사례/분위기 포인트만 추출
 * 중복 제거, 광고성/메모성/출처요약투 제거
 * "메모장 정리 단계"를 코드로 복원
 */

import { generateAiObject } from '../client'
import type { PipelineSource, DistilledFacts } from './types'
import type { InformationalPipelineInput, RestaurantPipelineInput } from './types'

/**
 * 정보성 글용 리서치 정제
 */
export async function distillResearch(
  sources: PipelineSource[],
  input: InformationalPipelineInput,
  onProgress?: (progress: number) => void
): Promise<DistilledFacts> {
  if (sources.length === 0) {
    console.warn('[Stage 2] 소스가 없습니다. 메타 정볼만으로 진행합니다.')
    return createFallbackDistillation(input)
  }

  onProgress?.(10)

  // 1. 소스 내용 합치기 (중복 가능성 있음)
  const combinedContent = sources
    .map(s => `[${s.type}] ${s.metadata.title || 'Untitled'}\n${s.rawContent}`)
    .join('\n\n---\n\n')

  onProgress?.(30)

  // 2. AI로 정제 (핵심 사실/주장/사례 추출)
  const systemPrompt = `당신은 리서치 어시스턴트입니다. 제공된 원문에서 블로그 글 작성에 필요한 핵심 정볧만 추출하세요.

**매우 중요한 규칙:**
1. 원문을 그대로 복사하지 마세요. 반드시 재서술하세요.
2. "관련 자료를 본면", "조사 결과", "참고하면" 같은 메모투 문장은 절대 포함하지 마세요.
3. 광고성 표현이나 과장된 주장은 제외하세요.
4. 사실, 데이터, 사례, 비교 포인트 위주로 추출하세요.

**출력 형식 (JSON):**
{
  "keyClaims": [{ "claim": "주장", "evidence": "근거", "confidence": "high/medium/low" }],
  "keyPoints": ["핵심 포인트1", "핵심 포인트2"],
  "examples": [{ "scenario": "상황", "detail": "설명" }],
  "comparisons": [{ "point": "비교 포인트", "items": [{"name": "항목", "description": "설명"}] }],
  "warnings": ["제거한 내용1", "제거한 내용2"]
}`

  const userPrompt = `다음 원문을 정제해주세요.\n\n원문:\n${combinedContent.substring(0, 8000)}\n\n메인 키워드: ${input.meta.mainKeyword}\n서브 키워드: ${input.meta.subKeywords.join(', ')}`

  onProgress?.(50)

  try {
    const { z } = await import('zod')
    const DistillationSchema = z.object({
      keyClaims: z.array(z.object({ claim: z.string(), evidence: z.string().optional(), confidence: z.enum(['high', 'medium', 'low']) })),
      keyPoints: z.array(z.string()),
      examples: z.array(z.object({ scenario: z.string(), detail: z.string() })),
      comparisons: z.array(z.object({ point: z.string(), items: z.array(z.object({ name: z.string(), description: z.string() })) })),
      warnings: z.array(z.string()),
    })

    const result = await generateAiObject({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      schema: DistillationSchema,
    })

    onProgress?.(80)

    if (result.ok && result.data) {
      // Parse the result
      const parsed = parseDistillationResult(JSON.stringify(result.data))
      
      // Add keyword context
      parsed.keywordContext = extractKeywordContext(
        combinedContent,
        [input.meta.mainKeyword, ...input.meta.subKeywords]
      )
      
      onProgress?.(100)
      console.log(`[Stage 2] 정제 완료: ${parsed.keyClaims.length}개 주장, ${parsed.keyPoints.length}개 포인트`)
      return parsed
    }
  } catch (error) {
    console.warn('[Stage 2] AI 정제 실패, fallback 사용:', error)
  }

  // Fallback
  onProgress?.(100)
  return createFallbackDistillation(input, sources)
}

/**
 * 맛집 글용 리서치 정제
 */
export async function distillRestaurantResearch(
  sources: PipelineSource[],
  input: RestaurantPipelineInput
): Promise<DistilledFacts> {
  // 맛집은 이미 structured data이므로 간단한 변환만
  const facts: DistilledFacts = {
    keyClaims: [],
    comparisons: [],
    examples: [],
    keyPoints: [],
    warnings: [],
    keywordContext: {},
  }

  for (const source of sources) {
    if (source.type === 'place') {
      facts.keyPoints.push(`매장: ${source.metadata.title}`)
      facts.keyPoints.push(`주소: ${source.metadata.title}`)
    }
    if (source.type === 'review') {
      facts.examples.push({
        scenario: '방문객 리뷰',
        detail: source.rawContent.substring(0, 500),
        source: source.metadata.title || '리뷰',
      })
    }
  }

  console.log(`[Stage 2] 맛집 정제 완료: ${facts.keyPoints.length}개 포인트`)
  return facts
}

// ============================================
// Helper Functions
// ============================================

function parseDistillationResult(content: string): DistilledFacts {
  try {
    // Try to extract JSON from markdown code block
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    const jsonStr = jsonMatch ? jsonMatch[1] : content
    
    const parsed = JSON.parse(jsonStr.trim())
    
    return {
      keyClaims: parsed.keyClaims || [],
      keyPoints: parsed.keyPoints || [],
      examples: parsed.examples || [],
      comparisons: parsed.comparisons || [],
      warnings: parsed.warnings || [],
      keywordContext: parsed.keywordContext || {},
      stats: parsed.stats,
    }
  } catch (error) {
    console.warn('[Stage 2] JSON 파싱 실패, 텍스트 파싱 시도:', error)
    
    // Fallback: manual parsing from text
    return {
      keyClaims: extractKeyClaims(content),
      keyPoints: extractKeyPoints(content),
      examples: [],
      comparisons: [],
      warnings: ['JSON 파싱 실패, 텍스트에서 추출'],
      keywordContext: {},
    }
  }
}

function extractKeyClaims(text: string): DistilledFacts['keyClaims'] {
  const claims: DistilledFacts['keyClaims'] = []
  const lines = text.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const claim = trimmed.replace(/^[-•]\s*/, '')
      if (claim.length > 10 && claim.length < 200) {
        claims.push({
          claim,
          source: 'extracted',
          confidence: 'medium',
        })
      }
    }
  }
  
  return claims
}

function extractKeyPoints(text: string): string[] {
  const points: string[] = []
  const lines = text.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || /^\d+\./.test(trimmed)) {
      const point = trimmed.replace(/^[-•\d.\s]*/, '')
      if (point.length > 5 && point.length < 150) {
        points.push(point)
      }
    }
  }
  
  return points.slice(0, 20) // Limit to 20 points
}

function extractKeywordContext(
  content: string,
  keywords: string[]
): Record<string, string[]> {
  const context: Record<string, string[]> = {}
  const sentences = content.split(/[.!?。！？]+/)
  
  for (const keyword of keywords) {
    context[keyword] = []
    
    for (const sentence of sentences) {
      if (sentence.includes(keyword) && sentence.length > 10) {
        context[keyword].push(sentence.trim())
        if (context[keyword].length >= 5) break // Max 5 contexts per keyword
      }
    }
  }
  
  return context
}

function createFallbackDistillation(
  input: InformationalPipelineInput,
  sources?: PipelineSource[]
): DistilledFacts {
  const facts: DistilledFacts = {
    keyClaims: [
      { claim: `${input.meta.mainKeyword}에 대한 정보`, source: 'fallback', confidence: 'high' },
    ],
    keyPoints: [
      `주제: ${input.meta.mainKeyword}`,
      `타겟: ${input.meta.goal || '일반'}`,
      `검색 의도: ${input.meta.searchIntent}`,
    ],
    examples: [],
    comparisons: [],
    warnings: sources ? [] : ['소스 없음, 메타 정보로만 생성'],
    keywordContext: {},
  }

  if (sources) {
    for (const source of sources) {
      facts.keyPoints.push(`[${source.type}] ${source.metadata.title || '소스'}`)
    }
  }

  return facts
}
