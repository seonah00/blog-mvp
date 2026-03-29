/**
 * Perplexity Research Server Actions
 * 
 * 정보성 글쓰기를 위한 Perplexity 리서치 기능
 * - 키워드 기반 자동 리서치
 * - 검색 결과를 SourceDocument로 변환
 * - 사실 확인 기능
 */

'use server'

import { 
  researchWithPerplexity, 
  searchWithPerplexity,
  runAgentTask,
  factCheckWithPerplexity,
  quickSearch,
} from '@/lib/integrations/perplexity'
import { isPerplexityAvailable } from '@/lib/integrations/perplexity'
import type { SourceDocument, SourceType } from '@/types'
import { createId } from '@/lib/utils'

// ============================================
// Types
// ============================================

export interface PerplexityResearchResult {
  success: boolean
  sources: SourceDocument[]
  error?: string
  query: string
}

export interface PerplexityResearchInput {
  query: string
  projectId: string
  maxResults?: number
  sourceType?: SourceType
}

export interface FactCheckResult {
  success: boolean
  claim: string
  verdict: 'supported' | 'partially_supported' | 'unsupported' | 'uncertain'
  explanation: string
  sources: string[]
  error?: string
}

// ============================================
// Main Research Functions
// ============================================

/**
 * Perplexity로 키워드 기반 리서치 수행
 * 
 * @param input - 리서치 입력 (쿼리, 프로젝트 ID 등)
 * @returns 변환된 SourceDocument 목록
 */
export async function researchWithPerplexityAction(
  input: PerplexityResearchInput
): Promise<PerplexityResearchResult> {
  try {
    // Perplexity 사용 가능 여부 확인
    if (!isPerplexityAvailable()) {
      return {
        success: false,
        query: input.query,
        sources: [],
        error: 'Perplexity API가 설정되지 않았습니다.',
      }
    }

    const { query, maxResults = 5, sourceType = 'article' } = input

    // Perplexity Search API로 리서치
    const searchResult = await searchWithPerplexity(query, {
      maxResults,
      maxTokensPerPage: 1000,
      recencyDays: 365, // 최근 1년 내 자료
    })

    // 검색 결과를 SourceDocument로 변환
    const now = new Date().toISOString()
    const sources: SourceDocument[] = searchResult.results.map((result, index) => {
      return {
        id: createId('source'),
        sourceId: createId('source'),
        projectId: input.projectId,
        type: sourceType,
        title: result.title || `${query} - 검색 결과 ${index + 1}`,
        url: result.url,
        content: result.snippet || '',
        summary: result.snippet || '',
        keyPoints: extractKeyPoints(result.snippet || ''),
        relevance: 0.8 - (index * 0.1),
        citations: [result.url],
        processedAt: now,
        addedAt: now,
        updatedAt: now,
        quotable: [],
      }
    })

    // 검색 결과 요약이 있으면 첫 번째 소스에 추가
    if (searchResult.answer && sources.length > 0) {
      sources[0].summary = searchResult.answer
      sources[0].keyPoints = [
        ...sources[0].keyPoints,
        ...extractKeyPoints(searchResult.answer),
      ].slice(0, 5)
    }

    return {
      success: true,
      query,
      sources,
    }

  } catch (error) {
    console.error('[Perplexity Research] Error:', error)
    return {
      success: false,
      query: input.query,
      sources: [],
      error: error instanceof Error ? error.message : '리서치 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 심층 리서치 (Agent API 사용)
 * 
 * 더 복잡한 리서치 태스크에 사용
 */
export async function deepResearchWithPerplexityAction(
  input: PerplexityResearchInput & { context?: string }
): Promise<PerplexityResearchResult> {
  try {
    if (!isPerplexityAvailable()) {
      return {
        success: false,
        query: input.query,
        sources: [],
        error: 'Perplexity API가 설정되지 않았습니다.',
      }
    }

    const { query, context, sourceType = 'article' } = input

    // Agent API로 심층 리서치
    const agentResult = await runAgentTask(query, {
      preset: 'comprehensive-research',
      context,
    })

    const now = new Date().toISOString()

    // 결과를 하나의 종합 소스로 변환
    const source: SourceDocument = {
      id: createId('source'),
      sourceId: createId('source'),
      projectId: input.projectId,
      type: sourceType,
      title: `${query} - 심층 리서치`,
      url: agentResult.sources[0] || 'https://perplexity.ai',
      content: agentResult.output,
      summary: agentResult.output.slice(0, 500) + '...',
      keyPoints: extractKeyPoints(agentResult.output),
      relevance: 0.95,
      citations: agentResult.sources,
      processedAt: now,
      addedAt: now,
      updatedAt: now,
      quotable: [],
    }

    return {
      success: true,
      query,
      sources: [source],
    }

  } catch (error) {
    console.error('[Perplexity Deep Research] Error:', error)
    return {
      success: false,
      query: input.query,
      sources: [],
      error: error instanceof Error ? error.message : '심층 리서치 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 빠른 팩트 체크
 * 
 * 특정 주장이나 문장의 사실 여부 확인
 */
export async function factCheckAction(claim: string): Promise<FactCheckResult> {
  try {
    if (!isPerplexityAvailable()) {
      return {
        success: false,
        claim,
        verdict: 'uncertain',
        explanation: 'Perplexity API가 설정되지 않았습니다.',
        sources: [],
        error: 'Perplexity API가 설정되지 않았습니다.',
      }
    }

    const result = await factCheckWithPerplexity(claim)

    return {
      success: true,
      claim,
      verdict: result.verdict,
      explanation: result.explanation,
      sources: result.sources,
    }

  } catch (error) {
    console.error('[Fact Check] Error:', error)
    return {
      success: false,
      claim,
      verdict: 'uncertain',
      explanation: '사실 확인 중 오류가 발생했습니다.',
      sources: [],
      error: error instanceof Error ? error.message : '오류가 발생했습니다.',
    }
  }
}

/**
 * 키워드 관련 질문 생성
 * 
 * 블로그 주제에 대한 FAQ 스타일 질문 자동 생성
 */
export async function generateRelatedQuestionsAction(
  keyword: string,
  count: number = 5
): Promise<{ success: boolean; questions: string[]; error?: string }> {
  try {
    if (!isPerplexityAvailable()) {
      return {
        success: false,
        questions: [],
        error: 'Perplexity API가 설정되지 않았습니다.',
      }
    }

    const prompt = `"${keyword}"에 대해 독자들이 가장 궁금해할 만한 질문 ${count}개를 생성해주세요.
각 질문은 블로그 검색 의도를 반영해야 합니다.
형식: 번호 없이 한 줄에 질문 하나씩`

    const result = await quickSearch(prompt)

    // 응답에서 질문 추출 (간단한 파싱)
    const questions = result.answer
      .split('\n')
      .map(line => line.replace(/^\d+[.\)]\s*/, '').trim())
      .filter(line => line.length > 10 && line.includes('?'))
      .slice(0, count)

    return {
      success: true,
      questions: questions.length > 0 ? questions : [`${keyword}란 무엇인가요?`],
    }

  } catch (error) {
    console.error('[Generate Questions] Error:', error)
    return {
      success: false,
      questions: [],
      error: error instanceof Error ? error.message : '질문 생성 중 오류가 발생했습니다.',
    }
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * 텍스트에서 핵심 키포인트 추출
 */
function extractKeyPoints(text: string): string[] {
  if (!text || text.length < 20) return []

  const points: string[] = []
  
  // 문장 단위로 분리
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200)

  // 중요해보이는 문장 선택 (키워드 기반)
  const importantKeywords = ['중요', '핵심', '결과', '발견', '의미', '영향', '장점', '단점', '방법', '이유']
  
  for (const sentence of sentences) {
    if (importantKeywords.some(kw => sentence.includes(kw))) {
      points.push(sentence.slice(0, 150))
    }
    if (points.length >= 5) break
  }

  // 부족하면 앞에서부터 채우기
  for (let i = 0; points.length < 3 && i < sentences.length; i++) {
    if (!points.includes(sentences[i])) {
      points.push(sentences[i].slice(0, 150))
    }
  }

  return points
}
