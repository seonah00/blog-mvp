/**
 * Restaurant Draft Schema
 * 
 * AI 응답 검증을 위한 Zod 스키마
 * @see lib/ai/restaurant-draft.ts
 */

import { z } from 'zod'

/**
 * Restaurant Draft Output Schema
 * AI가 생성할 초안의 구조를 정의
 */
export const RestaurantDraftOutputSchema = z.object({
  title: z.string().min(1).max(200).describe('글 제목'),
  
  content: z.string().min(100).describe('글 본문 (마크다운 형식)'),
  
  /** 한 줄 요약 (선택적) */
  summary: z.string().max(200).optional().describe('글 요약 (50자 이내)'),
  
  sections: z.array(z.object({
    heading: z.string().describe('섹션 제목'),
    content: z.string().describe('섹션 내용'),
  })).optional().describe('섹션별 구분 (선택적)'),
  
  recommendedImages: z.array(z.string()).max(10).describe('추천 이미지 설명'),
  
  hashtags: z.array(z.string().regex(/^#[\w가-힣]+$/)).max(15).describe('해시태그 목록'),
  
  metadata: z.object({
    wordCount: z.number().int().min(0).describe('예상 글자 수'),
    estimatedReadTime: z.number().int().min(1).describe('예상 읽기 시간(분)'),
    tone: z.enum(['friendly', 'informative', 'recommendation']).describe('사용된 톤'),
  }).optional(),
  
  /** fallback 사용 여부 */
  usedFallback: z.boolean().optional().describe('deterministic fallback 사용 여부'),
})

export type RestaurantDraftOutput = z.infer<typeof RestaurantDraftOutputSchema>

/**
 * Restaurant Draft Input Schema
 * AI에 전달할 입력 데이터 구조
 */
export const RestaurantDraftInputSchema = z.object({
  placeProfile: z.object({
    name: z.string().describe('매장명'),
    address: z.string().describe('주소'),
    category: z.string().describe('카테고리'),
    phone: z.string().optional().describe('전화번호'),
    hours: z.array(z.string()).optional().describe('영업시간'),
  }),
  
  reviewDigest: z.object({
    summary: z.string().describe('리뷰 요약'),
    highlights: z.array(z.string()).describe('핵심 포인트'),
    quotes: z.array(z.string()).describe('인용구'),
    sentiment: z.enum(['positive', 'neutral', 'mixed']).describe('감성 분석'),
  }),
  
  settings: z.object({
    channel: z.enum(['blog', 'threads', 'daangn']).describe('게시 채널'),
    tone: z.enum(['friendly', 'informative', 'recommendation']).describe('글 톤'),
    focusPoints: z.array(z.enum(['menu', 'atmosphere', 'location', 'price', 'waiting', 'parking'])).describe('강조 포인트'),
  }),
  
  projectTitle: z.string().describe('프로젝트 제목'),
  projectTopic: z.string().describe('프로젝트 주제'),
})

export type RestaurantDraftInput = z.infer<typeof RestaurantDraftInputSchema>

/**
 * Mock 데이터 생성 (fallback용)
 */
export function createMockRestaurantDraftOutput(
  input: RestaurantDraftInput
): RestaurantDraftOutput {
  const { placeProfile, reviewDigest, settings, projectTitle } = input
  
  // 채널별 기본 길이 설정
  const lengthByChannel = {
    blog: { min: 800, target: 1500 },
    threads: { min: 400, target: 800 },
    daangn: { min: 200, target: 400 },
  }
  
  const length = lengthByChannel[settings.channel]
  
  // 강조 포인트별 섹션 생성
  const focusSections = settings.focusPoints.map(point => {
    const sectionMap: Record<string, { title: string; content: string }> = {
      menu: {
        title: '대표 메뉴',
        content: `${placeProfile.name}의 시그니처 메뉴는 리뷰에서도 꾸준히 호평받는 부분이에요.`,
      },
      atmosphere: {
        title: '분위기',
        content: `매장의 분위기는 ${reviewDigest.sentiment === 'positive' ? '방문객들이 특히 만족하는 포인트' : '한 번쯤 경험핼볼 만한 매력'}이에요.`,
      },
      location: {
        title: '위치와 접근성',
        content: `${placeProfile.address}에 위치하고 있어 찾아가기 편리해요.`,
      },
      price: {
        title: '가격대',
        content: `가격은 ${placeProfile.category} 치고는 적당한 편이에요.`,
      },
      waiting: {
        title: '웨이팅 정보',
        content: `인기가 많은 만큼 피크타임에는 웨이팅이 있을 수 있어요.`,
      },
      parking: {
        title: '주차 정보',
        content: `주차 공간이 마련되어 있어 차량 방문도 가능해요.`,
      },
    }
    return sectionMap[point] || { title: point, content: '' }
  })
  
  // 콘텐츠 조립
  const contentParts: string[] = []
  
  if (settings.channel === 'blog') {
    contentParts.push(`# ${projectTitle}\n`)
    contentParts.push(`${reviewDigest.summary}\n`)
    
    focusSections.forEach(section => {
      contentParts.push(`## ${section.title}\n${section.content}\n`)
    })
    
    if (reviewDigest.quotes.length > 0) {
      contentParts.push(`## 방문객 후기\n`)
      reviewDigest.quotes.slice(0, 2).forEach(quote => {
        contentParts.push(`> ${quote}\n`)
      })
    }
    
    contentParts.push(`---\n**기본 정보**\n📍 ${placeProfile.address}${placeProfile.phone ? ` | 📞 ${placeProfile.phone}` : ''}\n\n${placeProfile.name}에서 즐거운 식사 되세요!`)
  } else if (settings.channel === 'threads') {
    contentParts.push(`🍽️ ${placeProfile.name}\n\n`)
    contentParts.push(`${reviewDigest.summary.slice(0, 100)}...\n\n`)
    contentParts.push(focusSections.slice(0, 2).map(s => `• ${s.title}: ${s.content.slice(0, 50)}...`).join('\n'))
    contentParts.push(`\n\n📍 ${placeProfile.address.split(' ').slice(0, 3).join(' ')}`)
  } else {
    contentParts.push(`[${placeProfile.category}] ${placeProfile.name}\n\n`)
    contentParts.push(`${reviewDigest.summary.slice(0, 80)}\n\n`)
    contentParts.push(focusSections.slice(0, 2).map(s => `${s.title}: ${s.content.slice(0, 40)}...`).join('\n'))
    contentParts.push(`\n\n📍 ${placeProfile.address.split(' ').slice(0, 3).join(' ')}`)
  }
  
  const content = contentParts.join('\n')
  
  // 해시태그 생성
  const baseTags = ['#맛집', `#${placeProfile.category.replace(/\s/g, '')}`]
  const focusTags = settings.focusPoints.slice(0, 2).map(p => {
    const tagMap: Record<string, string> = {
      menu: '#맛집추천',
      atmosphere: '#감성맛집',
      location: '#서울맛집',
      price: '#가성비맛집',
      waiting: '#핫플',
      parking: '#주차가능',
    }
    return tagMap[p]
  }).filter(Boolean)
  const placeTag = `#${placeProfile.name.replace(/\s/g, '')}`
  
  return {
    title: projectTitle,
    content,
    sections: focusSections.map(s => ({ heading: s.title, content: s.content })),
    recommendedImages: ['매장 전경', '대표 메뉴', '인테리어', '시그니처 디시'],
    hashtags: [...baseTags, ...focusTags, placeTag].slice(0, 10),
    metadata: {
      wordCount: content.length,
      estimatedReadTime: Math.ceil(content.length / 500),
      tone: settings.tone,
    },
  }
}
