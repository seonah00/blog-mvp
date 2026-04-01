/**
 * Public Environment Helpers (Client-safe)
 * 
 * 클라이언트에서 안전하게 사용할 수 있는 환경변수 유틸리티
 * NEXT_PUBLIC_ 접두사가 붙은 변수만 사용
 * 
 * ⚠️ 주의: 이 파일에는 server-only 변수를 절대 포함하지 마세요
 */

// Public flags (safe to expose to client)
const publicEnv = {
  USE_MOCK_PLACES: process.env.NEXT_PUBLIC_USE_MOCK_PLACES === 'true',
}

/**
 * Client-side에서 mock 모드 여부 확인 (UI 표시용)
 * 
 * ⚠️ 이 함수는 클라이언트 컴포넌트에서만 사용하세요
 * 서버 컴포넌트에서는 @/lib/integrations/env의 shouldUseMockPlaces()를 사용하세요
 */
export function isMockModeEnabled(): boolean {
  return publicEnv.USE_MOCK_PLACES
}
