/**
 * Karrot Draft Schema
 * 
 * AI 응답 검증을 위한 Zod 스키마
 * @see lib/ai/prompts/karrot-draft.ts
 */

import { z } from 'zod'

/**
 * Karrot Draft Output Schema
 * AI가 생성할 당근마켓 글 초안의 구조를 정의
 */
export const KarrotDraftOutputSchema = z.object({
  title: z.string().min(1).max(50).describe('글 제목 (30자 이내 권장)'),
  
  content: z.string().min(50).max(2000).describe('본문 내용 (마크다운 형식)'),
  
  hashtags: z.array(z.string().regex(/^#[\w가-힣]+$/)).max(8).describe('해시태그 목록 (# 접두사)'),
  
  metadata: z.object({
    wordCount: z.number().int().min(0).describe('총 글자 수'),
    estimatedReadTime: z.number().int().min(1).describe('예상 읽기 시간(분)'),
    emojiCount: z.number().int().min(0).describe('이모지 개수'),
    tone: z.string().describe('사용된 톤'),
  }),
  
  /** fallback 사용 여부 */
  usedFallback: z.boolean().optional().describe('deterministic fallback 사용 여부'),
})

export type KarrotDraftOutputSchemaType = z.infer<typeof KarrotDraftOutputSchema>

/**
 * Karrot Draft Input Schema
 * AI에 전달할 입력 데이터 구조
 */
export const KarrotDraftInputSchema = z.object({
  meta: z.object({
    purpose: z.enum(['ad', 'food', 'community']).describe('하위 목적'),
    region: z.string().describe('동네 (예: 역삼동)'),
    targetAudience: z.string().describe('타겟 독자'),
    businessType: z.string().optional().describe('업종 (광고형일 때)'),
    topic: z.string().describe('주제'),
  }),
  
  research: z.object({
    keyPoints: z.array(z.string()).describe('핵심 포인트'),
    localKeywords: z.array(z.string()).describe('동네 관련 키워드'),
    suggestedTitles: z.array(z.string()).describe('추천 제목'),
    suggestedEmojis: z.array(z.string()).optional().describe('추천 이모지'),
  }),
  
  settings: z.object({
    purpose: z.enum(['ad', 'food', 'community']).describe('하위 목적'),
    includePrice: z.boolean().describe('가격 정보 포함'),
    includeLocation: z.boolean().describe('위치 정보 포함'),
    includeContact: z.boolean().describe('연락처 포함'),
    emojiLevel: z.enum(['none', 'minimal', 'moderate']).describe('이모지 레벨'),
    urgency: z.enum(['none', 'soft', 'strong']).describe('마감 임박 표현'),
    includeImages: z.boolean().describe('사진 포함 여부'),
  }),
})

export type KarrotDraftInputSchemaType = z.infer<typeof KarrotDraftInputSchema>
