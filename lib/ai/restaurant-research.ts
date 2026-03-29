/**
 * Restaurant Research AI Functions
 * 
 * 맛집 콘텐츠를 위한 AI 보조 기능들
 * @see PROMPT_GUIDE.md - Restaurant Research
 */

import type { ReviewDigest, PlaceNormalizationInput, NormalizedPlaceProfile, UserReviewInput } from '@/types'

// ───────────────────────────────────────────────
// Deterministic Review Analysis (Mock AI)
// TODO: PROMPT_GUIDE.md restaurant research 섹션 기반 AI summarization 연동
// TODO: 실제 provider 연결 시 lib/ai/client.ts 경유
// ───────────────────────────────────────────────

/**
 * 긍정적 표현 키워드 사전
 */
const POSITIVE_KEYWORDS = [
  '맛있', '좋았', '추천', '훌륭', '최고', '완벽', '만족', '맛집', '강추', '대박',
  '친절', '깔끔', '분위기 좋', '가성비', '적당', '신선', '정성', '푸짐', '넉넉',
  '달콤', '고소', '바삭', '쫄깃', '부드러', '촉촉', '향긋', '진한', '깊은',
  '편안', '아늑', '감성', '데이트', '혼밥', '조용', '깨끗', '청결',
]

/**
 * 주의/부정적 표현 키워드 사전
 */
const CAUTION_KEYWORDS = [
  '비싸', '불친절', '지저분', '웨이팅', '기다리', '불편', '시끄러', '복잡',
  '실망', '그냥', '평범', '별로', '쏘쏘', '줄서', '예약', '냄새', '차가',
  '적어', '부족', '늦게', '오래', '싱거', '짜', '느끼',
]

/**
 * 메뉴 카테고리 키워드
 */
const MENU_KEYWORDS = [
  '파스타', '스테이크', '피자', '리조또', '샐러드', '스프', '빵', '디저트',
  '커피', '와인', '맥주', '칵테일', '파전', '삼겹살', '곱창', '막창',
  '초밥', '회', '덮밥', '우동', '라멘', '칼국수', '냉면', '김치찌개',
  '된장찌개', '국밥', '해장국', '브런치', '샌드위치', '버거', '타코',
]

/**
 * 분위기/상황 키워드
 */
const VIBE_KEYWORDS = [
  { keyword: '조용', category: '분위기' },
  { keyword: '감성', category: '분위기' },
  { keyword: '아늑', category: '분위기' },
  { keyword: '모던', category: '분위기' },
  { keyword: '빈티지', category: '분위기' },
  { keyword: '럭셔리', category: '분위기' },
  { keyword: '캐주얼', category: '분위기' },
  { keyword: '데이트', category: '상황' },
  { keyword: '혼밥', category: '상황' },
  { keyword: '가족', category: '상황' },
  { keyword: '친구', category: '상황' },
  { keyword: '회식', category: '상황' },
  { keyword: '생일', category: '상황' },
  { keyword: '기념일', category: '상황' },
]

/**
 * 태그 분석 결과
 */
interface TagAnalysis {
  tag: string
  count: number
}

/**
 * 리뷰 텍스트에서 키워드 출현 횟수 카운트
 */
function countKeywords(text: string, keywords: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  const lowerText = text.toLowerCase()
  
  for (const keyword of keywords) {
    const regex = new RegExp(keyword, 'gi')
    const matches = lowerText.match(regex)
    if (matches && matches.length > 0) {
      counts.set(keyword, matches.length)
    }
  }
  
  return counts
}

/**
 * 상위 N개 키워드 추출
 */
function getTopKeywords(counts: Map<string, number>, limit: number): string[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword]) => keyword)
}

/**
 * 리뷰 인용구 추출
 * - 20~60자 사이의 의미 있는 문장
 * - 긍정적 키워드가 포함된 문장 우선
 */
function extractQuotes(reviews: UserReviewInput[]): string[] {
  const quotes: string[] = []
  
  for (const review of reviews) {
    const sentences = review.content
      .replace(/[.!?]/g, '|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length >= 15 && s.length <= 60)
    
    for (const sentence of sentences) {
      // 긍정 키워드 포함 여부 확인
      const hasPositive = POSITIVE_KEYWORDS.some(kw => sentence.includes(kw))
      if (hasPositive && !quotes.includes(sentence)) {
        quotes.push(sentence)
        if (quotes.length >= 3) break
      }
    }
    
    if (quotes.length >= 3) break
  }
  
  // 긍정 키워드 문장이 부족하면 일반 문장 추가
  if (quotes.length < 2) {
    for (const review of reviews) {
      const sentences = review.content
        .replace(/[.!?]/g, '|')
        .split('|')
        .map(s => s.trim())
        .filter(s => s.length >= 15 && s.length <= 50)
      
      for (const sentence of sentences) {
        if (!quotes.includes(sentence)) {
          quotes.push(sentence)
          if (quotes.length >= 3) break
        }
      }
      
      if (quotes.length >= 3) break
    }
  }
  
  return quotes.slice(0, 3).map(q => `"${q}"`)
}

/**
 * 감성 분석
 */
function analyzeSentiment(positiveCount: number, cautionCount: number): 'positive' | 'neutral' | 'mixed' {
  if (positiveCount > cautionCount * 2) return 'positive'
  if (cautionCount > positiveCount) return 'mixed'
  return 'positive'
}

/**
 * 리뷰 다이제스트 생성
 * 
 * 여러 소스의 리뷰를 분석하여 핵심 포인트를 추출
 * Deterministic 방식으로 구현 (실제 AI 연동 전 단계)
 * 
 * @param reviews - 사용자 입력 리뷰 배열
 * @param placeInfo - 매장 기본 정보
 * @returns ReviewDigest
 */
export async function generateReviewDigest(
  reviews: UserReviewInput[],
  placeInfo: { name: string; category: string }
): Promise<ReviewDigest> {
  // 모든 리뷰 텍스트 합치기
  const allText = reviews.map(r => r.content).join(' ')
  const allTags = reviews.flatMap(r => r.tags || [])
  
  // 키워드 분석
  const positiveCounts = countKeywords(allText, POSITIVE_KEYWORDS)
  const cautionCounts = countKeywords(allText, CAUTION_KEYWORDS)
  const menuCounts = countKeywords(allText, MENU_KEYWORDS)
  
  // 분위기/상황 분석
  const vibeMatches: { keyword: string; category: string }[] = []
  for (const vibe of VIBE_KEYWORDS) {
    if (allText.includes(vibe.keyword)) {
      vibeMatches.push(vibe)
    }
  }
  
  // 결과 생성
  const highlights: string[] = []
  const cautions: string[] = []
  
  // 긍정 포인트 생성
  const topPositive = getTopKeywords(positiveCounts, 3)
  if (topPositive.length > 0) {
    const point = topPositive[0]
    if (['맛있', '맛집', '추천'].some(k => point.includes(k))) {
      highlights.push('음식 맛에 대한 만족도가 높음')
    } else if (['친절', '서비스'].some(k => point.includes(k))) {
      highlights.push('직원의 친절한 서비스가 인상적')
    } else if (['분위기', '감성', '조용'].some(k => point.includes(k))) {
      highlights.push('분위기가 좋아 방문객들이 만족')
    } else if (['가성비', '가격', '적당'].some(k => point.includes(k))) {
      highlights.push('가격 대비 만족도가 높음')
    } else if (['깔끔', '청결', '위생'].some(k => point.includes(k))) {
      highlights.push('매장 청결 상태가 우수')
    } else {
      highlights.push(`${point}는(은) 방문객들이 긍정적으로 언급하는 포인트`)
    }
  }
  
  // 메뉴 포인트
  const topMenus = getTopKeywords(menuCounts, 2)
  if (topMenus.length > 0) {
    highlights.push(`${topMenus.join(', ')} 등이 대표 메뉴로 인기`)
  }
  
  // 태그 기반 포인트
  const tagCounts = new Map<string, number>()
  for (const tag of allTags) {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
  }
  const topTags = getTopKeywords(tagCounts, 2)
  if (topTags.length > 0) {
    highlights.push(`방문객들이 ${topTags.join(', ')}에 특히 만족`)
  }
  
  // 주의사항 생성
  const topCautions = getTopKeywords(cautionCounts, 2)
  if (topCautions.length > 0) {
    const caution = topCautions[0]
    if (['웨이팅', '기다리', '줄서'].some(k => caution.includes(k))) {
      cautions.push('인기가 많아 웨이팅이 있을 수 있음')
    } else if (['비싸', '가격'].some(k => caution.includes(k))) {
      cautions.push('가격대가 다소 높은 편')
    } else if (['시러', '복잡', '불편'].some(k => caution.includes(k))) {
      cautions.push('매장이 다소 시러울 수 있음')
    }
  }
  
  // 인용구 추출
  const quotes = extractQuotes(reviews)
  
  // 요약 문장 생성
  const sentiment = analyzeSentiment(
    Array.from(positiveCounts.values()).reduce((a, b) => a + b, 0),
    Array.from(cautionCounts.values()).reduce((a, b) => a + b, 0)
  )
  
  const vibeWords = vibeMatches
    .filter(v => v.category === '분위기')
    .map(v => v.keyword)
    .slice(0, 2)
  
  const situationWords = vibeMatches
    .filter(v => v.category === '상황')
    .map(v => v.keyword)
    .slice(0, 2)
  
  let summary = `${placeInfo.name}은(는) ${placeInfo.category}로, `
  
  if (vibeWords.length > 0) {
    summary += `${vibeWords.join(', ')}한 분위기가 특징입니다. `
  } else {
    summary += '방문객들로부터 좋은 평가를 받고 있습니다. '
  }
  
  if (situationWords.length > 0) {
    summary += `${situationWords.join(', ')}에 특히 적합한 장소로 알려져 있습니다.`
  } else {
    summary += '전반적으로 만족도가 높은 곳입니다.'
  }
  
  // highlights에 cautions를 합쳐서 반환 (기존 타입 호환)
  const allHighlights = [...highlights]
  if (cautions.length > 0) {
    allHighlights.push(...cautions.map(c => `[참고] ${c}`))
  }
  
  // 기본 highlights가 없으면 기본값 추가
  if (allHighlights.length === 0) {
    allHighlights.push('방문객들이 전반적으로 만족하는 매장')
  }
  
  return {
    summary,
    highlights: allHighlights,
    quotes: quotes.length > 0 ? quotes : ['"방문 경험이 좋았습니다"'],
    sentiment,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * 리뷰 포인트 추출
 * 
 * 긴 리뷰에서 핵심 포인트만 추출
 * @see PROMPT_GUIDE.md
 */
export async function extractReviewPoints(
  reviewContent: string
): Promise<{ point: string; relevance: 'high' | 'medium' | 'low' }[]> {
  // TODO: AI API 호출
  console.log('[AI] Extracting review points...')
  return [
    { point: '맛있는 음식', relevance: 'high' },
    { point: '깨끗한 위생', relevance: 'medium' },
  ]
}

/**
 * 다중 소스 매장 정보 정규화
 * 
 * Google Places와 Naver Local의 정보를 통합
 */
export async function normalizePlaceProfile(
  inputs: PlaceNormalizationInput
): Promise<NormalizedPlaceProfile> {
  const { googleData, naverData, manualInputs } = inputs
  
  // TODO: AI를 활용한 충돌 해결
  console.log('[AI] Normalizing place profile...')
  
  return {
    name: manualInputs?.name || googleData?.name || naverData?.name || '',
    address: googleData?.address || naverData?.address || '',
    category: googleData?.category || naverData?.category || '음식점',
    phone: googleData?.phone,
    hours: googleData?.hours,
    coordinates: googleData?.coordinates,
    sources: [
      ...(googleData ? ['google' as const] : []),
      ...(naverData ? ['naver' as const] : []),
      ...(manualInputs ? ['manual' as const] : []),
    ],
    normalizedAt: new Date().toISOString(),
  }
}

/**
 * 태그 추천
 * 
 * 리뷰 내용을 분석하여 태그 자동 제안
 */
export async function suggestReviewTags(
  content: string
): Promise<string[]> {
  // TODO: AI API 호출
  console.log('[AI] Suggesting tags for review...')
  return ['맛', '분위기', '가성비']
}
