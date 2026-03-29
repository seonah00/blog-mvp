/**
 * AI Client - Provider 교체 가능한 인터페이스
 * 
 * ⚠️ 이 파일은 Server-side에서만 사용해야 합니다.
 * 클라이언트에서 직접 import하지 마세요.
 * 
 * @feature Dual AI Support (OpenAI + Claude)
 * - 번갈아가며 사용 (load balancing)
 * - 상황별 최적 선택 (domain-based routing)
 * - 결과 비교/통합 (ensemble)
 */

import { z, type ZodSchema } from 'zod'
import {
  getAIProvider,
  isAIProviderAvailable,
  getOpenAIConfig,
  getAnthropicConfig,
  getAITimeoutMs,
} from '@/lib/integrations/env'

// Re-export types
export type { AIConfig, AIProvider, AIFeature } from './types'

// ───────────────────────────────────────────────
// Error Types
// ───────────────────────────────────────────────

export type AIErrorCode =
  | 'MISSING_CONFIG'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'AUTH'
  | 'BAD_RESPONSE'
  | 'SCHEMA_INVALID'
  | 'UNKNOWN'

export interface AIError {
  code: AIErrorCode
  message: string
  retryable: boolean
}

// ───────────────────────────────────────────────
// Generate Object Types
// ───────────────────────────────────────────────

export interface GenerateAiObjectParams<T> {
  systemPrompt: string
  userPrompt: string
  schema: ZodSchema<T>
  model?: string
  temperature?: number
  maxTokens?: number
  /** 특정 provider 강제 사용 */
  preferredProvider?: 'openai' | 'anthropic' | 'auto'
  /** 사용 목적 (provider 선택에 참고) */
  purpose?: 'draft' | 'refine' | 'research' | 'outline' | 'image'
}

export interface GenerateAiObjectResult<T> {
  ok: boolean
  data?: T
  rawText?: string
  error?: AIError
  warnings?: string[]
  /** 사용된 provider */
  provider?: 'openai' | 'anthropic' | 'mock'
}

/** 두 AI 결과를 모두 반환 */
export interface DualAIResult<T> {
  openai?: GenerateAiObjectResult<T>
  anthropic?: GenerateAiObjectResult<T>
  /** 추천 결과 (품질 기반 선택) */
  recommended: GenerateAiObjectResult<T>
  /** 두 결과를 모두 사용할 수 있는지 */
  bothAvailable: boolean
}

// ───────────────────────────────────────────────
// Provider Availability
// ───────────────────────────────────────────────

export interface AvailableProviders {
  openai: boolean
  anthropic: boolean
  mock: boolean
}

export function getAvailableProviders(): AvailableProviders {
  const openaiConfig = getOpenAIConfig()
  const anthropicConfig = getAnthropicConfig()
  
  return {
    openai: !!openaiConfig.apiKey,
    anthropic: !!anthropicConfig.apiKey,
    mock: true, // mock은 항상 사용 가능
  }
}

export function isDualAIEnabled(): boolean {
  const providers = getAvailableProviders()
  return providers.openai && providers.anthropic
}

// ───────────────────────────────────────────────
// Smart Provider Selection
// ───────────────────────────────────────────────

function selectBestProvider(
  purpose?: GenerateAiObjectParams<unknown>['purpose'],
  preferred?: 'openai' | 'anthropic' | 'auto'
): 'openai' | 'anthropic' | 'mock' {
  const providers = getAvailableProviders()
  
  // 강제 선택
  if (preferred === 'openai' && providers.openai) return 'openai'
  if (preferred === 'anthropic' && providers.anthropic) return 'anthropic'
  
  // 용도별 최적 선택
  switch (purpose) {
    case 'draft':
      // 초안 작성: Claude가 더 자연스러운 문체
      return providers.anthropic ? 'anthropic' : providers.openai ? 'openai' : 'mock'
    
    case 'refine':
      // 문장 다듬기: Claude가 더 나은 개선 능력
      return providers.anthropic ? 'anthropic' : providers.openai ? 'openai' : 'mock'
    
    case 'outline':
      // 아웃라인: OpenAI가 더 구조화된 출력
      return providers.openai ? 'openai' : providers.anthropic ? 'anthropic' : 'mock'
    
    case 'research':
      // 리서치: 빠른 처리가 중요 → OpenAI
      return providers.openai ? 'openai' : providers.anthropic ? 'anthropic' : 'mock'
    
    case 'image':
      // 이미지 생성 관련: OpenAI (DALL-E)
      return providers.openai ? 'openai' : providers.anthropic ? 'anthropic' : 'mock'
    
    default:
      // 기본: OpenAI 우선 (더 안정적)
      return providers.openai ? 'openai' : providers.anthropic ? 'anthropic' : 'mock'
  }
}

// ───────────────────────────────────────────────
// OpenAI Client
// ───────────────────────────────────────────────

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  error?: {
    message: string
    type: string
    code?: string
  }
}

async function callOpenAI<T>(
  params: GenerateAiObjectParams<T>
): Promise<GenerateAiObjectResult<T>> {
  const config = getOpenAIConfig()
  
  if (!config.apiKey) {
    return {
      ok: false,
      error: {
        code: 'MISSING_CONFIG',
        message: 'OpenAI API key is not configured',
        retryable: false,
      },
    }
  }

  const timeoutMs = getAITimeoutMs()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model || config.model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data: OpenAIResponse = await response.json()

    // API 에러 처리
    if (!response.ok || data.error) {
      const errorCode = data.error?.code || response.status.toString()
      return {
        ok: false,
        error: {
          code: errorCode === '401' ? 'AUTH' : 
                errorCode === '429' ? 'RATE_LIMIT' : 'BAD_RESPONSE',
          message: data.error?.message || `API error: ${response.status}`,
          retryable: errorCode === '429' || response.status >= 500,
        },
      }
    }

    const rawText = data.choices[0]?.message?.content
    
    if (!rawText) {
      return {
        ok: false,
        error: {
          code: 'BAD_RESPONSE',
          message: 'Empty response from OpenAI',
          retryable: true,
        },
      }
    }

    // JSON 파싱
    let parsed: unknown
    try {
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       rawText.match(/```\s*([\s\S]*?)\s*```/) ||
                       rawText.match(/(\{[\s\S]*\})/)
      
      const jsonStr = jsonMatch ? jsonMatch[1] : rawText
      parsed = JSON.parse(jsonStr)
    } catch {
      return {
        ok: false,
        rawText,
        error: {
          code: 'BAD_RESPONSE',
          message: 'Failed to parse JSON from response',
          retryable: true,
        },
      }
    }

    // Schema 검증
    const validationResult = params.schema.safeParse(parsed)
    
    if (!validationResult.success) {
      return {
        ok: false,
        rawText,
        error: {
          code: 'SCHEMA_INVALID',
          message: `Schema validation failed: ${validationResult.error.message}`,
          retryable: false,
        },
      }
    }

    return {
      ok: true,
      data: validationResult.data,
      provider: 'openai',
    }

  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        error: {
          code: 'TIMEOUT',
          message: `Request timed out after ${timeoutMs}ms`,
          retryable: true,
        },
      }
    }

    return {
      ok: false,
      error: {
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        retryable: true,
      },
    }
  }
}

// ───────────────────────────────────────────────
// Anthropic (Claude) Client
// ───────────────────────────────────────────────

interface AnthropicResponse {
  content: Array<{
    type: string
    text: string
  }>
  error?: {
    message: string
    type: string
  }
}

async function callAnthropic<T>(
  params: GenerateAiObjectParams<T>
): Promise<GenerateAiObjectResult<T>> {
  const config = getAnthropicConfig()
  
  if (!config.apiKey) {
    return {
      ok: false,
      error: {
        code: 'MISSING_CONFIG',
        message: 'Anthropic API key is not configured',
        retryable: false,
      },
    }
  }

  const timeoutMs = getAITimeoutMs()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: params.model || config.model,
        max_tokens: params.maxTokens ?? 2000,
        temperature: params.temperature ?? 0.7,
        system: params.systemPrompt,
        messages: [
          { role: 'user', content: params.userPrompt },
        ],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data: AnthropicResponse = await response.json()

    if (!response.ok || data.error) {
      return {
        ok: false,
        error: {
          code: response.status === 401 ? 'AUTH' : 
                response.status === 429 ? 'RATE_LIMIT' : 'BAD_RESPONSE',
          message: data.error?.message || `API error: ${response.status}`,
          retryable: response.status === 429 || response.status >= 500,
        },
      }
    }

    const rawText = data.content?.[0]?.text
    
    if (!rawText) {
      return {
        ok: false,
        error: {
          code: 'BAD_RESPONSE',
          message: 'Empty response from Anthropic',
          retryable: true,
        },
      }
    }

    // JSON 파싱
    let parsed: unknown
    try {
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       rawText.match(/```\s*([\s\S]*?)\s*```/) ||
                       rawText.match(/(\{[\s\S]*\})/)
      
      const jsonStr = jsonMatch ? jsonMatch[1] : rawText
      parsed = JSON.parse(jsonStr)
    } catch {
      return {
        ok: false,
        rawText,
        error: {
          code: 'BAD_RESPONSE',
          message: 'Failed to parse JSON from response',
          retryable: true,
        },
      }
    }

    // Schema 검증
    const validationResult = params.schema.safeParse(parsed)
    
    if (!validationResult.success) {
      return {
        ok: false,
        rawText,
        error: {
          code: 'SCHEMA_INVALID',
          message: `Schema validation failed: ${validationResult.error.message}`,
          retryable: false,
        },
      }
    }

    return {
      ok: true,
      data: validationResult.data,
      provider: 'anthropic',
    }

  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        error: {
          code: 'TIMEOUT',
          message: `Request timed out after ${timeoutMs}ms`,
          retryable: true,
        },
      }
    }

    return {
      ok: false,
      error: {
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        retryable: true,
      },
    }
  }
}

// ───────────────────────────────────────────────
// Main Generate Function (Smart Selection)
// ───────────────────────────────────────────────

/**
 * AI 객체 생성 (Structured Output)
 * 
 * 자동으로 최적의 provider를 선택하거나 지정된 provider 사용
 * 
 * @param params 생성 파라미터
 * @returns 생성 결과
 */
export async function generateAiObject<T>(
  params: GenerateAiObjectParams<T>
): Promise<GenerateAiObjectResult<T>> {
  const provider = selectBestProvider(params.purpose, params.preferredProvider)
  
  // 설정 확인
  if (provider === 'mock') {
    return {
      ok: false,
      error: {
        code: 'MISSING_CONFIG',
        message: 'No AI provider is configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.',
        retryable: false,
      },
    }
  }

  // Provider별 호출
  switch (provider) {
    case 'openai':
      return callOpenAI(params)
    
    case 'anthropic':
      return callAnthropic(params)
    
    default:
      return {
        ok: false,
        error: {
          code: 'MISSING_CONFIG',
          message: 'Unknown provider selected',
          retryable: false,
        },
      }
  }
}

// ───────────────────────────────────────────────
// Dual AI Functions
// ───────────────────────────────────────────────

/**
 * 두 AI 모두에 동일한 요청을 보내고 결과 비교
 * 
 * @param params 생성 파라미터
 * @returns 두 AI의 결과 및 추천 결과
 */
export async function generateWithDualAI<T>(
  params: GenerateAiObjectParams<T>
): Promise<DualAIResult<T>> {
  const providers = getAvailableProviders()
  
  // 병렬 호출
  const [openaiResult, anthropicResult] = await Promise.all([
    providers.openai ? callOpenAI(params) : Promise.resolve({ ok: false, error: { code: 'MISSING_CONFIG', message: 'OpenAI not available', retryable: false } } as GenerateAiObjectResult<T>),
    providers.anthropic ? callAnthropic(params) : Promise.resolve({ ok: false, error: { code: 'MISSING_CONFIG', message: 'Anthropic not available', retryable: false } } as GenerateAiObjectResult<T>),
  ])

  const bothAvailable = openaiResult.ok && anthropicResult.ok

  // 추천 결과 선택 (간단한 휴리스틱)
  let recommended: GenerateAiObjectResult<T>
  
  if (openaiResult.ok && anthropicResult.ok) {
    // 둘 다 성공: 용도에 따라 선택
    recommended = params.purpose === 'refine' || params.purpose === 'draft' 
      ? anthropicResult  // Claude가 문체가 더 자연스러움
      : openaiResult
  } else if (openaiResult.ok) {
    recommended = openaiResult
  } else if (anthropicResult.ok) {
    recommended = anthropicResult
  } else {
    // 둘 다 실패: OpenAI 에러 우선 반환
    recommended = openaiResult
  }

  return {
    openai: openaiResult,
    anthropic: anthropicResult,
    recommended,
    bothAvailable,
  }
}

/**
 * 초안 작성 → 문장 개선 (Two-Stage Pipeline)
 * 
 * 1. GPT-4o로 초안 작성
 * 2. Claude로 문장 자연스럽게 다듬기
 */
export async function generateAndRefine<T>(
  draftParams: GenerateAiObjectParams<T>,
  refinePrompt: (draft: T) => string
): Promise<GenerateAiObjectResult<T>> {
  // 1단계: 초안 작성 (GPT-4o)
  const draftResult = await callOpenAI({
    ...draftParams,
    purpose: 'draft',
    preferredProvider: 'openai',
  })

  if (!draftResult.ok || !draftResult.data) {
    return draftResult
  }

  // 2단계: 문장 개선 (Claude)
  const refineResult = await callAnthropic({
    ...draftParams,
    userPrompt: refinePrompt(draftResult.data),
    purpose: 'refine',
    preferredProvider: 'anthropic',
  })

  // Claude 실패 시 초안 반환
  if (!refineResult.ok) {
    return {
      ...draftResult,
      warnings: [...(draftResult.warnings || []), 'Refinement step failed, returning draft'],
    }
  }

  return refineResult
}

/**
 * 특정 용도에 맞는 AI 선택 생성
 */
export async function generateWithPurpose<T>(
  purpose: GenerateAiObjectParams<T>['purpose'],
  params: Omit<GenerateAiObjectParams<T>, 'purpose' | 'preferredProvider'>
): Promise<GenerateAiObjectResult<T>> {
  return generateAiObject({
    ...params,
    purpose,
    preferredProvider: 'auto',
  })
}
