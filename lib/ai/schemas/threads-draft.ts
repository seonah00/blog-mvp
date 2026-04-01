/**
 * Threads Draft Schema
 * 
 * AI 응답 검증을 위한 Zod 스키마
 * @see lib/ai/prompts/threads-draft.ts
 */

import { z } from 'zod'

/**
 * Threads Draft Output Schema
 * AI가 생성할 스레드 초안의 구조를 정의
 */
export const ThreadsDraftOutputSchema = z.object({
  title: z.string().min(1).max(100).describe('전체 제목'),
  
  threads: z.array(z.object({
    order: z.number().int().min(1).describe('스레드 순서 (1-based)'),
    content: z.string().min(10).max(300).describe('스레드 내용 (짧은 문장, 100자 이내 권장)'),
    imageDescription: z.string().optional().describe('이미지 설명 (선택)'),
    hasSeparator: z.boolean().optional().describe('구분선 여부'),
  })).min(3).max(15).describe('스레드 아이템 목록'),
  
  hashtags: z.array(z.string().regex(/^#[\w가-힣]+$/)).max(10).describe('해시태그 목록 (# 접두사)'),
  
  metadata: z.object({
    wordCount: z.number().int().min(0).describe('총 글자 수'),
    estimatedReadTime: z.number().int().min(1).describe('예상 읽기 시간(분)'),
    threadCount: z.number().int().min(1).describe('스레드 개수'),
    tone: z.string().describe('사용된 톤'),
  }),
  
  /** fallback 사용 여부 */
  usedFallback: z.boolean().optional().describe('deterministic fallback 사용 여부'),
})

export type ThreadsDraftOutputSchemaType = z.infer<typeof ThreadsDraftOutputSchema>

/**
 * Threads Draft Input Schema
 * AI에 전달할 입력 데이터 구조
 */
export const ThreadsDraftInputSchema = z.object({
  meta: z.object({
    purpose: z.enum(['food', 'info', 'branding']).describe('하위 목적'),
    targetAudience: z.string().describe('타겟 독자'),
    tone: z.enum(['casual', 'witty', 'professional']).describe('톤'),
    hook: z.string().optional().describe('첫 문장 훅'),
    topic: z.string().describe('주제'),
  }),
  
  research: z.object({
    keyPoints: z.array(z.string()).describe('핵심 포인트'),
    suggestedHooks: z.array(z.string()).describe('추천 훅'),
    suggestedHashtags: z.array(z.string()).describe('추천 해시태그'),
    imageIdeas: z.array(z.string()).optional().describe('이미지 아이디어'),
  }),
  
  settings: z.object({
    purpose: z.enum(['food', 'info', 'branding']).describe('하위 목적'),
    threadCount: z.number().int().min(3).max(10).describe('스레드 개수'),
    includeImages: z.boolean().describe('이미지 포함 여부'),
    imagePosition: z.enum(['top', 'middle', 'bottom']).describe('이미지 위치'),
    hashtagStyle: z.enum(['minimal', 'moderate', 'full']).describe('해시태그 스타일'),
    ctaType: z.enum(['question', 'link', 'follow', 'none']).describe('CTA 타입'),
  }),
})

export type ThreadsDraftInputSchemaType = z.infer<typeof ThreadsDraftInputSchema>
