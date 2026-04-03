/**
 * Environment variables and availability checks
 * 
 * Server-side only - do not import in client components
 */

// ============================================
// Server Environment (raw values)
// ============================================

const serverEnv = {
  // AI Providers
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  AI_PROVIDER: process.env.AI_PROVIDER as 'openai' | 'anthropic' | undefined,
  AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS,
  AI_MAX_TOKENS: process.env.AI_MAX_TOKENS,
  
  // Search APIs
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET,
  KAKAO_REST_API_KEY: process.env.KAKAO_REST_API_KEY,
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
  
  // Feature Flags
  USE_MOCK_PLACES: process.env.USE_MOCK_PLACES,
  USE_NEW_RESTAURANT_SEARCH: process.env.USE_NEW_RESTAURANT_SEARCH,
  RESTAURANT_ENABLE_WEB_RESEARCH: process.env.RESTAURANT_ENABLE_WEB_RESEARCH,
  RESTAURANT_ENABLE_KAKAO: process.env.RESTAURANT_ENABLE_KAKAO,
}

// ============================================
// Safe Environment Access
// ============================================

export function getServerEnv() {
  return serverEnv
}

// ============================================
// AI Provider Configuration
// ============================================

export function getAIProvider(): 'openai' | 'anthropic' | 'openai-fallback' {
  const provider = serverEnv.AI_PROVIDER
  
  if (provider === 'anthropic' && serverEnv.ANTHROPIC_API_KEY) {
    return 'anthropic'
  }
  
  if (provider === 'openai' && serverEnv.OPENAI_API_KEY) {
    return 'openai'
  }
  
  // Auto-detect with fallback priority: OpenAI > Anthropic
  if (serverEnv.OPENAI_API_KEY) {
    return 'openai'
  }
  
  if (serverEnv.ANTHROPIC_API_KEY) {
    return 'anthropic'
  }
  
  return 'openai-fallback'
}

export function isAIProviderAvailable(): boolean {
  return !!(serverEnv.OPENAI_API_KEY || serverEnv.ANTHROPIC_API_KEY)
}

export function getOpenAIConfig() {
  return {
    apiKey: serverEnv.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    timeoutMs: parseInt(serverEnv.AI_TIMEOUT_MS || '60000', 10),
    maxTokens: parseInt(serverEnv.AI_MAX_TOKENS || '4000', 10),
  }
}

export function getAnthropicConfig() {
  return {
    apiKey: serverEnv.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    timeoutMs: parseInt(serverEnv.AI_TIMEOUT_MS || '60000', 10),
    maxTokens: parseInt(serverEnv.AI_MAX_TOKENS || '4000', 10),
  }
}

export function getAITimeoutMs(): number {
  return parseInt(serverEnv.AI_TIMEOUT_MS || '60000', 10)
}

// ============================================
// Places / Search APIs
// ============================================

export function isGooglePlacesAvailable(): boolean {
  return !!serverEnv.GOOGLE_MAPS_API_KEY
}

export function isNaverLocalAvailable(): boolean {
  return !!(serverEnv.NAVER_CLIENT_ID && serverEnv.NAVER_CLIENT_SECRET)
}

export function isKakaoLocalAvailable(): boolean {
  return !!serverEnv.KAKAO_REST_API_KEY
}

export function shouldUseMockPlaces(): boolean {
  return serverEnv.USE_MOCK_PLACES === 'true'
}

// ============================================
// Restaurant Search Feature Flags
// ============================================

/**
 * 새로운 Restaurant Search API 사용 여부
 * true: lib/server/* 기반 새 로직 사용
 * false: 기존 lib/integrations/* 로직 사용 (하위 호환)
 */
export function isNewRestaurantSearchEnabled(): boolean {
  return serverEnv.USE_NEW_RESTAURANT_SEARCH === 'true'
}

export function isRestaurantWebResearchEnabled(): boolean {
  return serverEnv.RESTAURANT_ENABLE_WEB_RESEARCH === 'true' && !!serverEnv.PERPLEXITY_API_KEY
}

// ============================================
// Raw Exports (for direct access)
// ============================================

export const {
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  AI_PROVIDER,
  AI_TIMEOUT_MS,
  AI_MAX_TOKENS,
  GOOGLE_MAPS_API_KEY,
  NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET,
  KAKAO_REST_API_KEY,
  PERPLEXITY_API_KEY,
} = serverEnv
