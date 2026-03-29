/**
 * Perplexity Deep Research with Question Expansion
 * 
 * 1. 초기 리서치로 기본 정보 수집
 * 2. 핵심 주제/키워드 추출
 * 3. 사람들이 궁금해할만한 질문 생성
 * 4. 각 질문에 대해 추가 리서치 수행
 * 5. 모든 정보를 통합하여 상세 소스로 변환
 */

'use server'

import { 
  researchWithPerplexity, 
  searchWithPerplexity,
  runAgentTask,
} from '@/lib/integrations/perplexity'
import { isPerplexityAvailable } from '@/lib/integrations/perplexity'
import type { SourceDocument, SourceType } from '@/types'
import { createId } from '@/lib/utils'

export interface DeepResearchInput {
  topic: string
  projectId: string
  mainKeyword: string
  subKeywords?: string[]
  maxDepth?: number // 리서치 깊이 (1-3)
}

export interface ResearchQuestion {
  question: string
  category: 'basic' | 'deep' | 'practical' | 'trend'
  priority: number
}

export interface ExpandedResearchResult {
  success: boolean
  topic: string
  mainSource: SourceDocument
  expandedSources: SourceDocument[]
  questions: ResearchQuestion[]
  error?: string
}

// ============================================
// Main Deep Research Function
// ============================================

export async function performDeepResearchWithExpansion(
  input: DeepResearchInput
): Promise<ExpandedResearchResult> {
  try {
    if (!isPerplexityAvailable()) {
      return {
        success: false,
        topic: input.topic,
        mainSource: {} as SourceDocument,
        expandedSources: [],
        questions: [],
        error: 'Perplexity API가 설정되지 않았습니다.',
      }
    }

    const { topic, projectId, mainKeyword, subKeywords = [], maxDepth = 2 } = input
    const now = new Date().toISOString()

    console.log('[Deep Research] Starting research for:', topic)

    // Step 1: 초기 리서치 - 기본 정보 수집
    const initialResearch = await searchWithPerplexity(topic, {
      maxResults: 5,
      maxTokensPerPage: 1000,
      recencyDays: 365,
    })

    if (!initialResearch.results.length && !initialResearch.answer) {
      return {
        success: false,
        topic,
        mainSource: {} as SourceDocument,
        expandedSources: [],
        questions: [],
        error: '초기 리서치 결과가 없습니다.',
      }
    }

    // Step 2: 초기 결과에서 핵심 내용 추출
    const initialContent = initialResearch.answer || initialResearch.results.map(r => r.snippet).join('\n\n')
    const initialKeyPoints = extractKeyPoints(initialContent)
    const initialSources = initialResearch.results.map(r => r.url).filter(Boolean)

    console.log('[Deep Research] Initial key points:', initialKeyPoints.length)

    // Step 3: 궁금한 질문 생성 (AI 기반)
    const questions = await generateCuriousQuestions({
      topic,
      mainKeyword,
      subKeywords,
      initialContent,
      initialKeyPoints,
    })

    console.log('[Deep Research] Generated questions:', questions.length)

    // Step 4: 각 질문에 대해 추가 리서치 (우선순위 높은 것만)
    const priorityQuestions = questions
      .filter(q => q.priority >= 7)
      .slice(0, maxDepth === 3 ? 8 : maxDepth === 2 ? 5 : 3)

    const expandedSources: SourceDocument[] = []

    for (const question of priorityQuestions) {
      try {
        console.log('[Deep Research] Researching:', question.question)
        
        // 각 질문에 대해 추가 검색
        const questionResult = await searchWithPerplexity(question.question, {
          maxResults: 3,
          maxTokensPerPage: 800,
          recencyDays: 180, // 더 최근 정보
        })

        if (questionResult.results.length > 0) {
          const questionContent = questionResult.answer || questionResult.results.map(r => r.snippet).join('\n\n')
          const questionKeyPoints = extractKeyPoints(questionContent)

          const expandedSource: SourceDocument = {
            id: createId('source'),
            sourceId: createId('source'),
            projectId,
            type: 'article' as SourceType,
            title: `${question.question} - 심층 분석`,
            url: questionResult.results[0]?.url || 'https://perplexity.ai',
            content: questionContent,
            summary: questionContent.slice(0, 300) + '...',
            keyPoints: questionKeyPoints,
            relevance: question.priority / 10,
            citations: questionResult.results.map(r => r.url).filter(Boolean),
            processedAt: now,
            addedAt: now,
            updatedAt: now,
            quotable: [],
            metadata: {
              researchQuestion: question.question,
              category: question.category,
              parentTopic: topic,
            },
          }

          expandedSources.push(expandedSource)
        }
      } catch (error) {
        console.error('[Deep Research] Error researching question:', question.question, error)
      }
    }

    // Step 5: 모든 정보를 통합한 메인 소스 생성
    const allContent = [
      `## ${topic} - 기본 정보`,
      initialContent,
      '',
      '## 심층 분석',
      ...expandedSources.map(s => `### ${s.title}\n${s.summary}`),
    ].join('\n\n')

    const allKeyPoints = [
      ...initialKeyPoints,
      ...expandedSources.flatMap(s => s.keyPoints),
    ].slice(0, 15)

    const allCitations = [
      ...initialSources,
      ...expandedSources.flatMap(s => s.citations || []),
    ]

    const mainSource: SourceDocument = {
      id: createId('source'),
      sourceId: createId('source'),
      projectId,
      type: 'article',
      title: `${topic} - 종합 리서치 보고서`,
      url: initialSources[0] || 'https://perplexity.ai',
      content: allContent,
      summary: initialContent.slice(0, 500) + `\n\n(심층 분석 ${expandedSources.length}개 포함)`,
      keyPoints: allKeyPoints,
      relevance: 0.95,
      citations: Array.from(new Set(allCitations)),
      processedAt: now,
      addedAt: now,
      updatedAt: now,
      quotable: [],
      metadata: {
        researchMethod: 'deep-expansion',
        expandedCount: expandedSources.length,
        questionsResearched: priorityQuestions.map(q => q.question),
        mainKeyword,
        subKeywords,
      },
    }

    console.log('[Deep Research] Completed:', {
      topic,
      questionsGenerated: questions.length,
      expandedSources: expandedSources.length,
    })

    return {
      success: true,
      topic,
      mainSource,
      expandedSources,
      questions,
    }

  } catch (error) {
    console.error('[Deep Research] Error:', error)
    return {
      success: false,
      topic: input.topic,
      mainSource: {} as SourceDocument,
      expandedSources: [],
      questions: [],
      error: error instanceof Error ? error.message : '심층 리서치 중 오류가 발생했습니다.',
    }
  }
}

// ============================================
// Question Generation
// ============================================

interface QuestionGenerationInput {
  topic: string
  mainKeyword: string
  subKeywords: string[]
  initialContent: string
  initialKeyPoints: string[]
}

async function generateCuriousQuestions(
  input: QuestionGenerationInput
): Promise<ResearchQuestion[]> {
  const { topic, mainKeyword, subKeywords, initialContent, initialKeyPoints } = input

  // Perplexity로 궁금한 질문 생성 요청
  const prompt = `주제: "${topic}"
메인 키워드: ${mainKeyword}
서브 키워드: ${subKeywords.join(', ')}

초기 리서치 내용:
${initialContent.slice(0, 1000)}

핵심 포인트:
${initialKeyPoints.slice(0, 5).join('\n')}

위 내용을 바탕으로, 이 주제에 대해 독자들이 가장 궁금해할 만한 질문 10개를 생성해주세요.

각 질문은 다음 카테고리 중 하나로 분류해주세요:
- basic: 기본 개념 이해 (왜 필요한가? 무엇인가?)
- deep: 심층 분석 (작동 원리, 배경, 영향)
- practical: 실용적 적용 (어떻게 사용하나? 팁은?)
- trend: 최신 동향 (2024년/2025년 변화, 미래 전망)

우선순위는 1-10 사이로, 독자들이 가장 궁금해할수록 높은 점수를 주세요.

형식:
1. [카테고리] 질문 (우선순위: X점)
2. [카테고리] 질문 (우선순위: X점)
...`

  try {
    const result = await researchWithPerplexity(prompt, {
      model: 'sonar-pro',
      maxTokens: 2000,
    })

    return parseQuestionsFromResponse(result.content)
  } catch (error) {
    console.error('[Question Generation] Error:', error)
    // Fallback: 기본 질문 생성
    return generateFallbackQuestions(topic, mainKeyword, subKeywords)
  }
}

function parseQuestionsFromResponse(content: string): ResearchQuestion[] {
  const questions: ResearchQuestion[] = []
  const lines = content.split('\n').filter(line => line.trim())

  for (const line of lines) {
    // 패턴: "1. [basic] 이것은 무엇인가요? (우선순위: 9점)"
    const match = line.match(/^\d+\.\s*\[(basic|deep|practical|trend)\]\s*(.+?)\s*(?:\(우선순위[:\s]*(\d+)점?\))?$/i)
    
    if (match) {
      const category = match[1] as ResearchQuestion['category']
      const question = match[2].trim()
      const priority = parseInt(match[3] || '5', 10)

      questions.push({
        question,
        category,
        priority: Math.min(Math.max(priority, 1), 10), // 1-10 범위로 제한
      })
    }
  }

  return questions
}

function generateFallbackQuestions(
  topic: string,
  mainKeyword: string,
  subKeywords: string[]
): ResearchQuestion[] {
  const questions: ResearchQuestion[] = [
    { question: `${mainKeyword}란 정확히 무엇인가요?`, category: 'basic', priority: 10 },
    { question: `${mainKeyword}는 왜 중요한가요?`, category: 'basic', priority: 9 },
    { question: `${mainKeyword}를 시작하는 방법은?`, category: 'practical', priority: 9 },
    { question: `2024년 ${mainKeyword} 트렌드는?`, category: 'trend', priority: 8 },
    { question: `${mainKeyword}의 장단점은?`, category: 'deep', priority: 8 },
    { question: `초보자가 ${mainKeyword}를 할 때 주의할 점은?`, category: 'practical', priority: 7 },
    { question: `${mainKeyword}의 미래 전망은?`, category: 'trend', priority: 7 },
    { question: `${mainKeyword} 관련 전문가들의 조언은?`, category: 'deep', priority: 6 },
  ]

  // 서브 키워드 기반 추가 질문
  subKeywords.forEach((keyword, i) => {
    questions.push({
      question: `${mainKeyword}와 ${keyword}의 차이점은?`,
      category: 'deep',
      priority: 7 - i,
    })
    questions.push({
      question: `${keyword}를 활용한 ${mainKeyword} 방법은?`,
      category: 'practical',
      priority: 6 - i,
    })
  })

  return questions.slice(0, 10)
}

// ============================================
// Helper Functions
// ============================================

function extractKeyPoints(text: string): string[] {
  if (!text || text.length < 20) return []

  const points: string[] = []
  
  // 문장 단위로 분리
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200)

  // 중요해보이는 문장 선택
  const importantPatterns = [
    /중요|핵심|결과|발견|의미|영향/,
    /장점|단점|방법|이유|효과/,
    /2024|2025|최신|최근|트렌드/,
    /차이|비교|선택|추천/,
  ]
  
  for (const sentence of sentences) {
    if (importantPatterns.some(pattern => pattern.test(sentence))) {
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

// ============================================
// Utility Functions
// ============================================

export async function analyzeContentGaps(
  existingSources: SourceDocument[],
  topic: string
): Promise<ResearchQuestion[]> {
  const existingContent = existingSources.map(s => s.content).join('\n\n')
  const existingKeyPoints = existingSources.flatMap(s => s.keyPoints)

  return generateCuriousQuestions({
    topic,
    mainKeyword: topic,
    subKeywords: [],
    initialContent: existingContent,
    initialKeyPoints: existingKeyPoints,
  })
}

export async function expandSpecificQuestion(
  question: string,
  projectId: string,
  context?: string
): Promise<SourceDocument | null> {
  try {
    if (!isPerplexityAvailable()) return null

    const now = new Date().toISOString()

    const result = await searchWithPerplexity(question, {
      maxResults: 5,
      maxTokensPerPage: 1000,
    })

    if (!result.results.length) return null

    const content = result.answer || result.results.map(r => r.snippet).join('\n\n')

    return {
      id: createId('source'),
      sourceId: createId('source'),
      projectId,
      type: 'article',
      title: `${question} - 상세 분석`,
      url: result.results[0]?.url || 'https://perplexity.ai',
      content,
      summary: content.slice(0, 400) + '...',
      keyPoints: extractKeyPoints(content),
      relevance: 0.9,
      citations: result.results.map(r => r.url).filter(Boolean),
      processedAt: now,
      addedAt: now,
      updatedAt: now,
      quotable: [],
      metadata: {
        researchQuestion: question,
        context,
      },
    }
  } catch (error) {
    console.error('[Expand Question] Error:', error)
    return null
  }
}
