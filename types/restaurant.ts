/**
 * Restaurant Content Domain Types
 * 
 * 맛집 콘텐츠 작성을 위한 타입 정의
 * @see PROMPT_GUIDE.md - Restaurant Research & Draft 섹션 (향후 추가)
 * 
 * Import Rule: types/common.ts 만 import 가능
 */

import type { ProjectTone, ParagraphDraft } from './common'

// ───────────────────────────────────────────────
// Project Meta
// ───────────────────────────────────────────────

export interface RestaurantProjectMeta {
  /** 매장명 또는 주제명 */
  placeName: string
  /** 지역 (예: 강남, 홍대, 부산 해울대) */
  region: string
  /** 음식 카테고리 (예: 한식, 일식, 카페) */
  category: string
  /** 방문 목적 (예: 데이트, 회식, 혼밥) */
  visitPurpose: string
  /** 타겟 독자 */
  targetAudience: string
}

// ───────────────────────────────────────────────
// Research Phase
// ───────────────────────────────────────────────

/** 
 * 장소 검색 후보 
 * Google Places API, Naver Local Search API 결과 정규화
 * 
 * ⚠️ Policy: 웹 크롤링 금지. 공식 API만 사용.
 */
export interface PlaceCandidate {
  id: string
  /** 검색 출처 */
  source: 'google_places_api' | 'naver_local_api' | 'manual'
  /** 외부 API의 원본 ID */
  externalId: string
  /** 매장명 */
  name: string
  /** 카테고리 */
  category?: string
  /** 지번 주소 */
  address: string
  /** 도로명 주소 */
  roadAddress?: string
  /** 위도 */
  latitude?: number
  /** 경도 */
  longitude?: number
  /** 평점 (1-5) */
  rating?: number
  /** 리뷰 수 */
  reviewCount?: number
  /** 전화번호 */
  phone?: string
  /** 웹사이트 URL */
  websiteUrl?: string
  /** 설명 */
  description?: string
  /** 지도 링크 */
  mapUrl?: string
}

/**
 * 정규화된 장소 프로필
 * 여러 소스의 데이터를 통합한 표준 형식
 */
export interface NormalizedPlaceProfile {
  /** 매장명 */
  name: string
  /** 주소 */
  address: string
  /** 카테고리 */
  category: string
  /** 전화번호 */
  phone?: string
  /** 영업시간 */
  hours?: string[]
  /** 좌표 (위도/경도) */
  coordinates?: { lat: number; lng: number }
  /** 소스 출처 (표준: google | naver | manual) */
  sources: ('google' | 'naver' | 'manual')[]
  /** 정규화 시점 */
  normalizedAt: string
}

/**
 * 리뷰 입력 소스 타입
 * 정책: 자동 크롤링 금지, 허용된 입력만 사용
 */
export type ReviewSourceType = 'direct' | 'owner' | 'permitted'

/**
 * 사용자 입력 리뷰
 * 실제 방문 후기 또는 허용된 소스의 리뷰
 */
export interface UserReviewInput {
  id: string
  /** 입력 소스 */
  source: ReviewSourceType
  /** 리뷰 내용 */
  content: string
  /** 태그 (메뉴, 분위기, 서비스 등) */
  tags: string[]
  /** 별점 (선택적) */
  rating?: number
  /** 입력자 */
  author?: string
  /** 입력 시점 */
  createdAt: string
}

/**
 * 리뷰 다이제스트
 * 여러 리뷰를 AI가 요약/분석한 결과
 */
export interface ReviewDigest {
  /** 전체 요약 */
  summary: string
  /** 핵심 포인트 */
  highlights: string[]
  /** 인용구 */
  quotes: string[]
  /** 감성 분석 (optional) */
  sentiment?: 'positive' | 'neutral' | 'mixed'
  /** 생성 시점 */
  generatedAt: string
}

/**
 * 장소 정규화 입력
 * 여러 소스의 데이터를 통합할 때 사용
 */
export interface PlaceNormalizationInput {
  googleData?: Partial<NormalizedPlaceProfile>
  naverData?: Partial<NormalizedPlaceProfile>
  manualInputs?: Partial<NormalizedPlaceProfile>
}

// ───────────────────────────────────────────────
// Draft Settings
// ───────────────────────────────────────────────

export interface RestaurantDraftSettings {
  /** 채널 */
  channel: 'blog' | 'threads' | 'daangn'
  /** 글 톤 */
  tone: 'friendly' | 'informative' | 'recommendation'
  /** 강조 포인트 */
  focusPoints: ('menu' | 'atmosphere' | 'location' | 'price' | 'waiting' | 'parking')[]
  /** 금지 표현 */
  prohibitedExpressions?: string[]
}

// ───────────────────────────────────────────────
// Draft Phase
// ───────────────────────────────────────────────

/**
 * 어시스턴트 메시지
 */
export interface RestaurantAssistantMessage {
  role: 'assistant'
  type: 'suggestion' | 'improvement' | 'completion_check' | 'quote'
  content: string
  suggestions?: { text: string; insertAfter?: string }[]
  missingPoints?: string[]
}

/**
 * 맛집 글쓰기 헬퍼 데이터
 * Draft Edit 페이지의 사이드바에 표시될 정보
 */
export interface RestaurantDraftHelperData {
  /** 매장 기본 정보 카드 */
  placeProfile: NormalizedPlaceProfile
  /** 리뷰 요약 */
  reviewDigest: ReviewDigest
  /** 추천 포인트 */
  recommendationPoints: string[]
  /** 방문 팁 */
  visitTips?: string[]
}

// ───────────────────────────────────────────────
// AI Feature Types
// ───────────────────────────────────────────────

/**
 * @see lib/ai/prompts/restaurant-research.ts
 */
export interface RestaurantResearchInput {
  placeProfile: NormalizedPlaceProfile
  reviews: UserReviewInput[]
}

export interface RestaurantResearchOutput {
  summary: string
  keyPoints: string[]
  recommendedTags: string[]
}

/**
 * @see lib/ai/prompts/restaurant-draft.ts
 */
export interface RestaurantDraftInput {
  placeProfile: NormalizedPlaceProfile
  reviewDigest: ReviewDigest
  settings: RestaurantDraftSettings
  channel: 'blog' | 'threads' | 'daangn'
}

export interface RestaurantDraftOutput {
  title: string
  content: string
  recommendedImages: string[]
  hashtags: string[]
}

// ───────────────────────────────────────────────
// Draft Version Management (NEW)
// ───────────────────────────────────────────────

/**
 * 초안 생성 모드
 */
export type RestaurantDraftGenerationMode =
  | 'initial'      // 최초 생성
  | 'regenerate'   // 같은 설정으로 재생성
  | 'variation'    // 변형 생성

/**
 * Variation 프리셋
 * 기존 초안을 기준으로 다른 스타일의 버전 생성
 */
export type RestaurantDraftVariationPreset =
  | 'same_but_fresher'       // 같은 내용, 다른 표현
  | 'shorter'                // 더 짧게
  | 'more_informative'       // 더 정보형
  | 'more_friendly'          // 더 친근하게
  | 'menu_focus'             // 메뉴 강조
  | 'atmosphere_focus'       // 분위기 강조
  | 'location_price_focus'   // 위치/가격 강조
  | 'daangn_local'           // 당근마켓 스타일
  | 'threads_punchy'         // 스레드 임팩트 스타일

/**
 * 초안 버전
 * 각 생성 결과를 히스토리로 관리
 */
export interface RestaurantDraftVersion {
  /** 버전 고유 ID */
  id: string
  /** 프로젝트 ID */
  projectId: string
  /** 부모 버전 ID (regenerate/variation 시) */
  parentVersionId?: string
  /** 생성 모드 */
  mode: RestaurantDraftGenerationMode
  /** variation 프리셋 (mode가 'variation'일 때) */
  preset?: RestaurantDraftVariationPreset
  /** 게시 채널 */
  channel: 'blog' | 'threads' | 'daangn'
  /** 글 톤 */
  tone: string
  /** 글 제목 */
  title: string
  /** 글 본문 */
  content: string
  /** 요약 */
  summary: string
  /** 해시태그 */
  hashtags: string[]
  /** CTA */
  cta?: string
  /** 생성 시점 */
  generatedAt: string
  /** 글자 수 */
  wordCount: number
  /** fallback 사용 여부 */
  usedFallback: boolean
  /** 생성 소스 */
  source: 'ai' | 'deterministic'
  /** 사용자 라벨 */
  label?: string
  /** 강조 포인트 */
  focusPoints: string[]
}

/**
 * 버전 생성 입력
 */
export interface CreateDraftVersionInput {
  projectId: string
  mode: RestaurantDraftGenerationMode
  preset?: RestaurantDraftVariationPreset
  label?: string
}

// Re-export common for convenience
export type { ParagraphDraft }
