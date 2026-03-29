/**
 * Integration Environment Helpers
 * 
 * 외부 API 연동을 위한 환경변수 및 설정
 * 
 * ⚠️ Security Notice:
 * - GOOGLE_MAPS_API_KEY, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET는
 *   절대 NEXT_PUBLIC_ 접두사 없이 server-side에서만 사용
 * - 클라이언트에 노출되면 API 키 도용/남용 위험
 */

// Server-side only API keys (NEVER expose to client)
const serverEnv = {
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET,
  
  // AI Provider Settings
  AI_PROVIDER: process.env.AI_PROVIDER || 'mock',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
  AI_TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS || '30000', 10),
  
  // Perplexity API (NEW)
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
}

// Public flags (safe to expose)
const publicEnv = {
  USE_MOCK_PLACES: process.env.NEXT_PUBLIC_USE_MOCK_PLACES === 'true',
}

/**
 * Mock 사용 여부 결정 (server-side)
 * - 명시적 USE_MOCK_PLACES 설정
 * - 또는 API key가 하나도 없는 경우
 */
export function shouldUseMockPlaces(): boolean {
  return publicEnv.USE_MOCK_PLACES || 
         (!serverEnv.GOOGLE_MAPS_API_KEY && !serverEnv.NAVER_CLIENT_ID)
}

/**
 * Client-side에서 mock 모드 여부 확인 (UI 표시용)
 */
export function isMockModeEnabled(): boolean {
  return publicEnv.USE_MOCK_PLACES
}

/**
 * Google Places API 사용 가능 여부
 */
export function isGooglePlacesAvailable(): boolean {
  return !!serverEnv.GOOGLE_MAPS_API_KEY
}

/**
 * Naver Local API 사용 가능 여부
 */
export function isNaverLocalAvailable(): boolean {
  return !!(serverEnv.NAVER_CLIENT_ID && serverEnv.NAVER_CLIENT_SECRET)
}

// ───────────────────────────────────────────────
// AI Provider Configuration (NEW)
// ───────────────────────────────────────────────

export type AIProvider = 'mock' | 'openai' | 'anthropic' | 'dual'

/**
 * AI Provider 설정 조회
 * 두 API 모두 있으면 'dual' 반환
 */
export function getAIProvider(): AIProvider {
  const hasOpenAI = !!serverEnv.OPENAI_API_KEY
  const hasAnthropic = !!serverEnv.ANTHROPIC_API_KEY
  
  // 두 API 모두 있으면 dual 모드
  if (hasOpenAI && hasAnthropic) {
    return 'dual'
  }
  
  // 환경변수 설정 확인
  const provider = serverEnv.AI_PROVIDER as AIProvider
  if (provider === 'openai' && hasOpenAI) return 'openai'
  if (provider === 'anthropic' && hasAnthropic) return 'anthropic'
  
  // 자동 감지
  if (hasOpenAI) return 'openai'
  if (hasAnthropic) return 'anthropic'
  
  return 'mock'
}

/**
 * AI Provider 사용 가능 여부 확인
 */
export function isAIProviderAvailable(): boolean {
  const provider = getAIProvider()
  
  if (provider === 'mock') {
    return true
  }
  
  if (provider === 'openai') {
    return !!serverEnv.OPENAI_API_KEY
  }
  
  if (provider === 'anthropic') {
    return !!serverEnv.ANTHROPIC_API_KEY
  }
  
  if (provider === 'dual') {
    return !!serverEnv.OPENAI_API_KEY && !!serverEnv.ANTHROPIC_API_KEY
  }
  
  return false
}

/**
 * Dual AI 모드 확인 (두 API 모두 사용 가능)
 */
export function isDualAIEnabled(): boolean {
  return getAIProvider() === 'dual'
}

/**
 * OpenAI 설정 조회
 */
export function getOpenAIConfig(): {
  apiKey: string | undefined
  model: string
  timeoutMs: number
} {
  return {
    apiKey: serverEnv.OPENAI_API_KEY,
    model: serverEnv.OPENAI_MODEL,
    timeoutMs: serverEnv.AI_TIMEOUT_MS,
  }
}

/**
 * Anthropic 설정 조회
 */
export function getAnthropicConfig(): {
  apiKey: string | undefined
  model: string
  timeoutMs: number
} {
  return {
    apiKey: serverEnv.ANTHROPIC_API_KEY,
    model: serverEnv.ANTHROPIC_MODEL,
    timeoutMs: serverEnv.AI_TIMEOUT_MS,
  }
}

/**
 * AI Timeout 설정 조회
 */
export function getAITimeoutMs(): number {
  return serverEnv.AI_TIMEOUT_MS
}

/**
 * Server-side env getter (internal use only)
 */
export function getServerEnv() {
  return serverEnv
}
