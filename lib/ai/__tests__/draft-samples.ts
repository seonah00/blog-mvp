/**
 * Restaurant Draft 테스트 샘플 데이터
 * 
 * OpenAI vs Claude 비교 QA용 실제 입력 샘플
 */

import type { GenerateRestaurantDraftInput } from '../restaurant-draft'
import type { NormalizedPlaceProfile, CanonicalPlace, WebEvidence } from '@/types'

// ============================================
// 공통 Canonical Place (강남 파스타집)
// ============================================
const sampleCanonicalPlace: CanonicalPlace = {
  id: 'place-gangnam-pasta-001',
  name: '트라attoria',
  address: {
    road: '서울특별시 강남구 테헤란로 123',
    full: '서울특별시 강남구 테헤란로 123',
    jibun: '서울특별시 강남구 역삼동 456-78',
    region: '서울특별시 강남구',
  },
  coordinates: { lat: 37.5012, lng: 127.0396, source: 'kakao' },
  category: {
    primary: '음식점',
    secondary: '이탈리안 레스토랑',
    full: '음식점 > 양식 > 이탈리안 레스토랑',
    source: 'naver',
  },
  contact: {
    phone: '02-1234-5678',
    naverLink: 'https://map.naver.com/p/entry/place/12345678',
    kakaoLink: 'https://place.map.kakao.com/87654321',
  },
  confidence: 'high',
  sources: {
    naver: { id: '12345678', link: 'https://map.naver.com/p/entry/place/12345678' },
    kakao: { id: '87654321', placeUrl: 'https://place.map.kakao.com/87654321' },
  },
  normalizedAt: new Date().toISOString(),
}

const samplePlaceProfile: NormalizedPlaceProfile = {
  name: '트라attoria',
  address: '서울특별시 강남구 테헤란로 123',
  category: '이탈리안 레스토랑',
  phone: '02-1234-5678',
  sources: ['naver'],
  normalizedAt: new Date().toISOString(),
}

// ============================================
// 샘플 1: Standard 케이스 (friendly 톤, 인용구 3개)
// ============================================
export const sample1_Standard: GenerateRestaurantDraftInput = {
  placeProfile: samplePlaceProfile,
  canonicalPlace: sampleCanonicalPlace,
  reviewDigest: {
    summary: '강남에서 분위기 좋은 파스타집을 찾는다면 추천해요. 파스타 소스가 정말 진하고 맛있었어요.',
    highlights: [
      '파스타 소스가 진하고 맛있음',
      '분위기가 조용해서 데이트하기 좋음',
      '직원분들이 친절함',
    ],
    quotes: [
      '파스타 소스가 정말 진했어요. 토마토 향이 진하게 났어요.',
      '분위기는 조용해서 데이트하기 좋았어요.',
      '직원분이 추천해주신 와인도 잘 맞았어요.',
    ],
    sentiment: 'positive',
    generatedAt: new Date().toISOString(),
  },
  settings: {
    channel: 'blog',
    tone: 'friendly',
    focusPoints: ['menu', 'atmosphere'],
  },
  projectTitle: '강남 데이트 맛집 트라attoria 방문 후기',
  projectTopic: '강남 파스타 맛집',
}

// ============================================
// 샘플 2: webEvidence 많은 케이스
// ============================================
const sampleWebEvidence: WebEvidence[] = [
  {
    id: 'evidence-001',
    type: 'perplexity_search',
    source: { type: 'perplexity_search', provider: 'perplexity', queriedAt: new Date().toISOString() },
    placeName: '트라attoria',
    query: '강남 트라attoria 웨이팅',
    summary: '평일 저녁에는 웨이팅이 30분 정도 있는 것으로 알려져 있다. 주말에는 더 길 수 있다는 언급이 있다.',
    quotableTexts: ['평일 저녁 웨이팅 30분 정도'],
    citations: ['https://www.google.com/search?q=강남+파스타+웨이팅'],
    confidence: 'mentioned',
    verifiedAt: new Date().toISOString(),
    usagePolicy: { canQuote: false, canParaphrase: true, requiresAttribution: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evidence-002',
    type: 'perplexity_search',
    source: { type: 'perplexity_search', provider: 'perplexity', queriedAt: new Date().toISOString() },
    placeName: '트라attoria',
    query: '트라attoria 주차',
    summary: '발렛 파킹이 가능한 것으로 보인다. 주차 공간은 협소할 수 있다.',
    quotableTexts: [],
    citations: ['https://www.google.com/search?q=강남+레스토랑+주차'],
    confidence: 'uncertain',
    verifiedAt: new Date().toISOString(),
    usagePolicy: { canQuote: false, canParaphrase: true, requiresAttribution: true },
    createdAt: new Date().toISOString(),
  },
]

export const sample2_WithWebEvidence: GenerateRestaurantDraftInput = {
  ...sample1_Standard,
  webEvidence: sampleWebEvidence,
  settings: {
    channel: 'blog',
    tone: 'friendly',
    focusPoints: ['menu', 'atmosphere', 'waiting', 'parking'],
  },
}

// ============================================
// 샘플 3: Threads 채널 (짧은 글)
// ============================================
export const sample3_Threads: GenerateRestaurantDraftInput = {
  placeProfile: samplePlaceProfile,
  canonicalPlace: sampleCanonicalPlace,
  reviewDigest: {
    summary: '강남 파스타 맛집 발견! 분위기도 좋고 맛도 좋았어요.',
    highlights: ['파스타가 맛있음', '분위기 좋음'],
    quotes: ['파스타 소스가 진짜 최고였어요!'],
    sentiment: 'positive',
    generatedAt: new Date().toISOString(),
  },
  settings: {
    channel: 'threads',
    tone: 'friendly',
    focusPoints: ['menu', 'atmosphere'],
  },
  projectTitle: '강남 파스타 맛집 🍝',
  projectTopic: '강남 맛집',
}

// ============================================
// 샘플 4: informative 톤 (객관적)
// ============================================
export const sample4_Informative: GenerateRestaurantDraftInput = {
  placeProfile: samplePlaceProfile,
  canonicalPlace: sampleCanonicalPlace,
  reviewDigest: {
    summary: '강남 테헤란로에 위치한 이탈리안 레스토랑이다. 파스타와 리조또가 주 메뉴이다.',
    highlights: ['파스타 전문', '와인 페어링 가능', '런치 세트 있음'],
    quotes: ['런치 세트 가성비가 좋습니다.', '와인 추천이 전문적이었어요.'],
    sentiment: 'positive',
    generatedAt: new Date().toISOString(),
  },
  settings: {
    channel: 'blog',
    tone: 'informative',
    focusPoints: ['menu', 'price', 'location'],
  },
  projectTitle: '강남 이탈리안 레스토랑 트라attoria 정보',
  projectTopic: '강남 레스토랑 정보',
}

// ============================================
// 샘플 5: 당근마켓 채널 + 인용구 없음
// ============================================
export const sample5_Daangn: GenerateRestaurantDraftInput = {
  placeProfile: samplePlaceProfile,
  canonicalPlace: sampleCanonicalPlace,
  reviewDigest: {
    summary: '강남역 근처 파스타집입니다. 점심에 방문했어요.',
    highlights: ['점심 메뉴 다양', '가격 적당'],
    quotes: [], // 인용구 없음
    sentiment: 'positive',
    generatedAt: new Date().toISOString(),
  },
  settings: {
    channel: 'daangn',
    tone: 'friendly',
    focusPoints: ['menu', 'price'],
  },
  projectTitle: '[강남역] 파스타 맛집 추천',
  projectTopic: '강남역 점심',
}

// ============================================
// 모든 샘플 목록
// ============================================
export const allSamples = [
  { name: 'Standard (friendly, blog)', sample: sample1_Standard },
  { name: 'With WebEvidence', sample: sample2_WithWebEvidence },
  { name: 'Threads 채널', sample: sample3_Threads },
  { name: 'Informative 톤', sample: sample4_Informative },
  { name: '당근마켓 채널', sample: sample5_Daangn },
]
