/**
 * Integration Environment Helpers (Server-only)
 * 
 * 외부 API 연동을 위한 환경변수 및 설정
 * 
 * ⚠️ Security Notice:
 * - 이 파일의 모든 함수는 server-side에서만 사용 가능
 * - GOOGLE_MAPS_API_KEY, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET는
 *   절대 NEXT_PUBLIC_ 접두사 없이 server-side에서만 사용
 * - 클라이언트에 노출되면 API 키 도용/남용 위험
 * 
 * 클라이언트에서 mock 모드 확인이 필요하면 @/lib/env-public의 
 * isMockModeEnabled()를 사용하세요
 */

// Server-side only API keys (NEVER expose to client)
const serverEnv = {
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET,
  
  // Kakao Local API (NEW)
  KAKAO_REST_API_KEY: process.env.KAKAO_REST_API_KEY,
  
  // AI Provider Settings
  AI_PROVIDER: process.env.AI_PROVIDER || 'mock',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
  AI_TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS || '30000', 10),
  
  // Perplexity API
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
  
  // Restaurant Research Feature Flags (NEW)
  RESTAURANT_PRIMARY_PROVIDER: process.env.RESTAURANT_PRIMARY_PROVIDER || 'naver',
  RESTAURANT_SECONDARY_PROVIDER: process.env.RESTAURANT_SECONDARY_PROVIDER || 'kakao',
  RESTAURANT_ENABLE_WEB_RESEARCH: process.env.RESTAURANT_ENABLE_WEB_RESEARCH === 'true',
  RESTAURANT_WEB_RESEARCH_PROVIDER: process.env.RESTAURANT_WEB_RESEARCH_PROVIDER || 'perplexity',
  
  // Kakao Local API 활성화 여부 (선택사항)
  // Kakao API가 403 Forbidden 등으로 비활성화된 경우 false로 설정
  RESTAURANT_ENABLE_KAKAO: process.env.RESTAURANT_ENABLE_KAKAO !== 'false', // 기본값: true (하위호환)
  
  // Restaurant Draft AI Configuration (NEW)
  RESTAURANT_DRAFT_PROVIDER: (process.env.RESTAURANT_DRAFT_PROVIDER || 'openai_then_claude') as 'openai' | 'anthropic' | 'openai_then_claude',
  RESTAURANT_ENABLE_CLAUDE_REWRITE: process.env.RESTAURANT_ENABLE_CLAUDE_REWRITE !== 'false',
  RESTAURANT_OPENAI_MODEL: process.env.RESTAURANT_OPENAI_MODEL,
  RESTAURANT_CLAUDE_MODEL: process.env.RESTAURANT_CLAUDE_MODEL,
}

/**
 * Mock 사용 여부 결정 (server-side)
 * - 명시적 USE_MOCK_PLACES 설정
 * - 또는 API key가 하나도 없는 경우
 * 
 * ⚠️ 클라이언트 컴포넌트에서는 @/lib/env-public의 isMockModeEnabled()를 사용하세요
 */
export function shouldUseMockPlaces(): boolean {
  const useMockPlaces = process.env.NEXT_PUBLIC_USE_MOCK_PLACES === 'true'
  return useMockPlaces || 
         (!serverEnv.GOOGLE_MAPS_API_KEY && !serverEnv.NAVER_CLIENT_ID)
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

/**
 * Kakao Local API 사용 가능 여부 (NEW)
 * 
 * 주의: RESTAURANT_ENABLE_KAKAO=false이거나 키가 없으면 false 반환
 */
export function isKakaoLocalAvailable(): boolean {
  return serverEnv.RESTAURANT_ENABLE_KAKAO && !!serverEnv.KAKAO_REST_API_KEY
}

/**
 * Kakao Local API 명시적 비활성화 여부
 * 403 Forbidden 등으로 인해 완전히 비활성화해야 할 때 사용
 */
export function isKakaoExplicitlyDisabled(): boolean {
  return !serverEnv.RESTAURANT_ENABLE_KAKAO
}

// ───────────────────────────────────────────────
// Restaurant Research Configuration (NEW)
// ───────────────────────────────────────────────

export type RestaurantProvider = 'naver' | 'kakao' | 'google' | 'manual'

/**
 * Primary provider 조회
 */
export function getRestaurantPrimaryProvider(): RestaurantProvider {
  const provider = serverEnv.RESTAURANT_PRIMARY_PROVIDER
  if (provider === 'naver' || provider === 'kakao' || provider === 'google') {
    // 실제 API 키가 있을 때만 해당 provider 반환
    if (provider === 'naver' && isNaverLocalAvailable()) return 'naver'
    if (provider === 'kakao' && isKakaoLocalAvailable()) return 'kakao'
    if (provider === 'google' && isGooglePlacesAvailable()) return 'google'
  }
  // Fallback: 사용 가능한 provider 중 하나 선택
  if (isNaverLocalAvailable()) return 'naver'
  if (isKakaoLocalAvailable()) return 'kakao'
  if (isGooglePlacesAvailable()) return 'google'
  return 'manual'
}

/**
 * Secondary provider 조회
 */
export function getRestaurantSecondaryProvider(): RestaurantProvider | null {
  const provider = serverEnv.RESTAURANT_SECONDARY_PROVIDER
  const primary = getRestaurantPrimaryProvider()
  
  if (provider === primary) return null
  
  if (provider === 'naver' && isNaverLocalAvailable()) return 'naver'
  if (provider === 'kakao' && isKakaoLocalAvailable()) return 'kakao'
  if (provider === 'google' && isGooglePlacesAvailable()) return 'google'
  
  return null
}

/**
 * Perplexity API 사용 가능 여부
 */
export function isPerplexityAvailable(): boolean {
  return !!serverEnv.PERPLEXITY_API_KEY
}

/**
 * Web Research (Perplexity) 활성화 여부
 */
export function isRestaurantWebResearchEnabled(): boolean {
  return serverEnv.RESTAURANT_ENABLE_WEB_RESEARCH && isPerplexityAvailable()
}

/**
 * Web Research Provider 조회
 */
export function getRestaurantWebResearchProvider(): 'perplexity' | null {
  if (!isRestaurantWebResearchEnabled()) return null
  return serverEnv.RESTAURANT_WEB_RESEARCH_PROVIDER === 'perplexity' ? 'perplexity' : null
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

// ───────────────────────────────────────────────
// Restaurant Draft AI Configuration (NEW)
// ───────────────────────────────────────────────

export type RestaurantDraftProvider = 'openai' | 'anthropic' | 'openai_then_claude'

/**
 * Restaurant Draft Provider 설정 조회
 * 
 * - 'openai': OpenAI만 사용 (1단계)
 * - 'anthropic': Claude만 사용 (1단계)
 * - 'openai_then_claude': OpenAI 초안 → Claude 리라이팅 (2단계, 권장)
 */
export function getRestaurantDraftProvider(): RestaurantDraftProvider {
  const provider = serverEnv.RESTAURANT_DRAFT_PROVIDER
  if (provider === 'openai' || provider === 'anthropic' || provider === 'openai_then_claude') {
    return provider
  }
  return 'openai_then_claude' // default
}

/**
 * Claude Rewriting 활성화 여부
 * 
 * 2단계 파이프라인에서 Claude 리라이팅을 사용할지 여부
 */
export function isClaudeRewriteEnabled(): boolean {
  return serverEnv.RESTAURANT_ENABLE_CLAUDE_REWRITE && !!serverEnv.ANTHROPIC_API_KEY
}

/**
 * Restaurant Draft용 OpenAI Model 조회
 * 
 * RESTAURANT_OPENAI_MODEL이 설정되지 않으면 기본 OPENAI_MODEL 사용
 */
export function getRestaurantDraftOpenAIModel(): string {
  return serverEnv.RESTAURANT_OPENAI_MODEL || serverEnv.OPENAI_MODEL
}

/**
 * Restaurant Draft용 Claude Model 조회
 * 
 * RESTAURANT_CLAUDE_MODEL이 설정되지 않으면 기본 ANTHROPIC_MODEL 사용
 */
export function getRestaurantDraftClaudeModel(): string {
  return serverEnv.RESTAURANT_CLAUDE_MODEL || serverEnv.ANTHROPIC_MODEL
}

/**
 * Server-side env getter (internal use only)
 */
export function getServerEnv() {
  return serverEnv
}
