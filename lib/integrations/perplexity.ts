/**
 * Perplexity API Integration
 * 
 * Perplexity AI를 사용한 리서치 및 사실 확인
 * - Search API: 실시간 웹 검색
 * - Agent API: 복잡한 리서치 태스크
 * - Embeddings API: 텍스트 임베딩
 * 
 * @see https://docs.perplexity.ai/
 */

import { getServerEnv } from './env'

// ============================================
// Configuration
// ============================================

const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai'

// Available models
export type PerplexityModel = 
  | 'sonar'              // Lightweight, cost-effective
  | 'sonar-pro'          // Advanced reasoning
  | 'sonar-reasoning'    // Chain of thought reasoning
  | 'sonar-deep-research' // In-depth research

// ============================================
// Types
// ============================================

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  model: PerplexityModel
  messages: PerplexityMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  search_domain_filter?: string[]
  return_images?: boolean
  return_related_questions?: boolean
  search_recency_filter?: 'month' | 'week' | 'day' | 'hour'
  top_k?: number
  presence_penalty?: number
  frequency_penalty?: number
}

export interface ChatCompletionResponse {
  id: string
  model: string
  object: string
  created: number
  citations?: string[]
  choices: {
    index: number
    finish_reason: string
    message: {
      role: string
      content: string
    }
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Search API Types
export interface SearchRequest {
  query: string
  max_results?: number
  max_tokens_per_page?: number
  recency_days?: number
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  published_date?: string
}

export interface SearchResponse {
  results: SearchResult[]
  answer?: string
}

// Agent API Types
export interface AgentRequest {
  preset: 'fast-search' | 'comprehensive-research' | 'code-analysis'
  input: string
  context?: string
}

export interface AgentResponse {
  output: string
  sources: string[]
  reasoning?: string
}

// Embeddings API Types
export interface EmbeddingsRequest {
  input: string[]
  model?: 'pplx-embed-v1-4b'
}

export interface EmbeddingsResponse {
  embeddings: number[][]
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

// ============================================
// Availability Check
// ============================================

export function isPerplexityAvailable(): boolean {
  return !!getServerEnv().PERPLEXITY_API_KEY
}

// ============================================
// 1. Chat Completions API (기본 대화)
// ============================================

export async function researchWithPerplexity(
  query: string,
  options: {
    model?: PerplexityModel
    maxTokens?: number
    recency?: 'month' | 'week' | 'day' | 'hour'
  } = {}
): Promise<{
  content: string
  citations: string[]
  usage: { prompt: number; completion: number; total: number }
}> {
  if (!isPerplexityAvailable()) {
    throw new Error('Perplexity API key not configured')
  }

  const { 
    model = 'sonar', 
    maxTokens = 2000,
    recency = 'month'
  } = options

  const requestBody: ChatCompletionRequest = {
    model,
    messages: [
      {
        role: 'system',
        content: `You are a research assistant. Provide factual, well-sourced information. 
Always cite your sources. Be concise but thorough. 
If information is uncertain, clearly indicate that.`
      },
      {
        role: 'user',
        content: query
      }
    ],
    max_tokens: maxTokens,
    temperature: 0.2,
    search_recency_filter: recency,
    return_related_questions: false,
  }

  const response = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getServerEnv().PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Perplexity API error: ${response.status} - ${error}`)
  }

  const data: ChatCompletionResponse = await response.json()
  
  const choice = data.choices[0]
  if (!choice) {
    throw new Error('No response from Perplexity')
  }

  return {
    content: choice.message.content,
    citations: data.citations || [],
    usage: {
      prompt: data.usage.prompt_tokens,
      completion: data.usage.completion_tokens,
      total: data.usage.total_tokens,
    },
  }
}

// ============================================
// 2. Search API (실시간 웹 검색)
// ============================================

export async function searchWithPerplexity(
  query: string,
  options: {
    maxResults?: number
    maxTokensPerPage?: number
    recencyDays?: number
  } = {}
): Promise<SearchResponse> {
  if (!isPerplexityAvailable()) {
    throw new Error('Perplexity API key not configured')
  }

  const {
    maxResults = 5,
    maxTokensPerPage = 500,
    recencyDays = 30,
  } = options

  const requestBody: SearchRequest = {
    query,
    max_results: maxResults,
    max_tokens_per_page: maxTokensPerPage,
    recency_days: recencyDays,
  }

  const response = await fetch(`${PERPLEXITY_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getServerEnv().PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Perplexity Search API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  
  return {
    results: data.results || [],
    answer: data.answer,
  }
}

// ============================================
// 3. Agent API (복잡한 리서치 태스크)
// ============================================

export async function runAgentTask(
  input: string,
  options: {
    preset?: AgentRequest['preset']
    context?: string
  } = {}
): Promise<AgentResponse> {
  if (!isPerplexityAvailable()) {
    throw new Error('Perplexity API key not configured')
  }

  const { preset = 'comprehensive-research', context } = options

  const requestBody: AgentRequest = {
    preset,
    input,
    ...(context && { context }),
  }

  const response = await fetch(`${PERPLEXITY_BASE_URL}/v1/responses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getServerEnv().PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Perplexity Agent API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  
  return {
    output: data.output || data.text || '',
    sources: data.sources || [],
    reasoning: data.reasoning,
  }
}

// ============================================
// 4. Embeddings API (텍스트 임베딩)
// ============================================

export async function createEmbeddings(
  texts: string[],
  options: {
    model?: EmbeddingsRequest['model']
  } = {}
): Promise<EmbeddingsResponse> {
  if (!isPerplexityAvailable()) {
    throw new Error('Perplexity API key not configured')
  }

  const { model = 'pplx-embed-v1-4b' } = options

  const requestBody: EmbeddingsRequest = {
    input: texts,
    model,
  }

  const response = await fetch(`${PERPLEXITY_BASE_URL}/v1/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getServerEnv().PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Perplexity Embeddings API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  
  return {
    embeddings: data.embeddings || data.data?.map((d: { embedding: number[] }) => d.embedding) || [],
    model: data.model,
    usage: data.usage || { prompt_tokens: 0, total_tokens: 0 },
  }
}

// ============================================
// Helper Functions
// ============================================

export async function factCheckWithPerplexity(
  claim: string
): Promise<{
  verdict: 'supported' | 'partially_supported' | 'unsupported' | 'uncertain'
  explanation: string
  sources: string[]
}> {
  const query = `Fact-check this claim: "${claim}"`
  
  const result = await researchWithPerplexity(query, {
    model: 'sonar-pro',
    maxTokens: 1500,
  })

  const content = result.content.toLowerCase()
  let verdict: 'supported' | 'partially_supported' | 'unsupported' | 'uncertain' = 'uncertain'
  
  if (content.includes('true') || content.includes('correct') || content.includes('accurate')) {
    verdict = 'supported'
  } else if (content.includes('partially') || content.includes('mixture')) {
    verdict = 'partially_supported'
  } else if (content.includes('false') || content.includes('incorrect')) {
    verdict = 'unsupported'
  }

  return {
    verdict,
    explanation: result.content,
    sources: result.citations,
  }
}

export async function generateSourceSummary(
  topic: string,
  keyPoints: string[]
): Promise<{
  summary: string
  keyFindings: { point: string; source: string }[]
  sources: string[]
}> {
  const query = `Topic: ${topic}

Please research and provide a comprehensive summary covering these key points:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

For each key point, provide key facts, data, and source citations.`

  const result = await researchWithPerplexity(query, {
    model: 'sonar-deep-research',
    maxTokens: 4000,
  })

  return {
    summary: result.content,
    keyFindings: keyPoints.map((point, i) => ({
      point,
      source: result.citations[i] || 'Perplexity Research',
    })),
    sources: result.citations,
  }
}

export async function quickSearch(
  query: string
): Promise<{
  answer: string
  sources: string[]
}> {
  const result = await researchWithPerplexity(query, {
    model: 'sonar',
    maxTokens: 1000,
    recency: 'week',
  })

  return {
    answer: result.content,
    sources: result.citations,
  }
}

// ============================================
// Restaurant Research (NEW)
// ============================================

export interface RestaurantResearchQuery {
  /** 매장명 */
  placeName: string
  /** 지역 */
  region?: string
  /** 카테고리 */
  category?: string
}

export interface RestaurantResearchResult {
  /** 검색어 */
  query: string
  /** 요약 결과 */
  summary: string
  /** 발견된 키워드/태그 */
  keywords: string[]
  /** 인용 가능한 구절 */
  quotableTexts: string[]
  /** 출처 링크 */
  citations: string[]
  /** 사용 제안 */
  usageSuggestions: {
    canQuoteDirectly: boolean
    shouldParaphrase: boolean
    requiresFactCheck: boolean
  }
  /** 원본 응답 */
  rawContent: string
}

/**
 * 맛집 장소 웹 조사
 * 
 * Perplexity를 사용하여 특정 장소에 대한 웹 정보를 수집합니다.
 * 주의: 수집된 정보는 보조 자료로만 사용하고, 사실 확인이 필요합니다.
 * 
 * @param query - 조사할 장소 정보
 * @returns 조사 결과
 */
export async function researchRestaurantPlace(
  query: RestaurantResearchQuery
): Promise<RestaurantResearchResult> {
  const searchQuery = query.region
    ? `${query.region} ${query.placeName} 후기 정보`
    : `${query.placeName} 후기 정보`

  console.log('[Perplexity] Researching restaurant:', searchQuery)

  const result = await researchWithPerplexity(searchQuery, {
    model: 'sonar-pro',
    maxTokens: 2000,
    recency: 'month',
  })

  // 결과 파싱 및 정제
  const keywords = extractKeywords(result.content)
  const quotableTexts = extractQuotableTexts(result.content)
  
  // 사용 제안 분석
  const canQuoteDirectly = result.citations.length >= 2
  const requiresFactCheck = result.content.toLowerCase().includes('확인 필요') ||
                            result.content.toLowerCase().includes('추측') ||
                            result.content.toLowerCase().includes('아마도')

  return {
    query: searchQuery,
    summary: result.content,
    keywords,
    quotableTexts,
    citations: result.citations,
    usageSuggestions: {
      canQuoteDirectly,
      shouldParaphrase: !canQuoteDirectly,
      requiresFactCheck,
    },
    rawContent: result.content,
  }
}

/**
 * 장소 비교 조사
 * 
 * 두 장소를 비교하여 차이점과 특징을 파악합니다.
 */
export async function compareRestaurantPlaces(
  placeA: { name: string; region?: string },
  placeB: { name: string; region?: string }
): Promise<{
  comparison: string
  uniquePointsA: string[]
  uniquePointsB: string[]
  citations: string[]
}> {
  const queryA = placeA.region ? `${placeA.region} ${placeA.name}` : placeA.name
  const queryB = placeB.region ? `${placeB.region} ${placeB.name}` : placeB.name
  
  const searchQuery = `"${queryA}"와 "${queryB}" 차이점 비교`

  const result = await researchWithPerplexity(searchQuery, {
    model: 'sonar-pro',
    maxTokens: 2000,
    recency: 'month',
  })

  // 간단한 파싱
  const lines = result.content.split('\n').filter(l => l.trim())
  const uniquePointsA: string[] = []
  const uniquePointsB: string[] = []
  
  let currentSection: 'a' | 'b' | null = null
  
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes(placeA.name) && (lower.includes('차이') || lower.includes('특징'))) {
      currentSection = 'a'
    } else if (lower.includes(placeB.name) && (lower.includes('차이') || lower.includes('특징'))) {
      currentSection = 'b'
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      const point = line.slice(2).trim()
      if (currentSection === 'a') uniquePointsA.push(point)
      if (currentSection === 'b') uniquePointsB.push(point)
    }
  }

  return {
    comparison: result.content,
    uniquePointsA,
    uniquePointsB,
    citations: result.citations,
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * 키워드 추출 (간단한 구현)
 */
function extractKeywords(content: string): string[] {
  const keywords: string[] = []
  const commonFoodKeywords = [
    '맛집', '분위기', '가성비', '데이트', '혼밥', '단체',
    '웨이팅', '예약', '주차', '포장', '배달'
  ]
  
  for (const kw of commonFoodKeywords) {
    if (content.includes(kw)) {
      keywords.push(kw)
    }
  }
  
  return keywords.slice(0, 5)
}

/**
 * 인용 가능한 텍스트 추출
 */
function extractQuotableTexts(content: string): string[] {
  const quotes: string[] = []
  
  // 따옴표로 둘러싸인 구절 추출
  const quoteRegex = /"([^"]{20,100})"/g
  let match
  while ((match = quoteRegex.exec(content)) !== null && quotes.length < 3) {
    quotes.push(match[1])
  }
  
  // 번호 없는 문장 추출 (20-80자)
  if (quotes.length === 0) {
    const sentences = content
      .split(/[.!?]/)
      .map(s => s.trim())
      .filter(s => s.length >= 20 && s.length <= 80)
    
    return sentences.slice(0, 3)
  }
  
  return quotes
}
