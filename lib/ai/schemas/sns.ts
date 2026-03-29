/**
 * SNS Zod Schemas
 * 
 * 런타임 타입 검증 및 Mock 응답 생성
 */

import { z } from 'zod'
import type { SNSTransformInput, SNSTransformOutput, SNSPlatform } from '../types'

// ───────────────────────────────────────────────
// Enum Schemas
// ───────────────────────────────────────────────

export const snsPlatformSchema = z.enum([
  'threads', 'instagram', 'linkedin', 'twitter', 'facebook', 'daangn'
])

export const snsVariantSchema = z.enum([
  'summary', 'thread', 'quote', 'question', 'carousel'
])

// ───────────────────────────────────────────────
// Input Schema
// ───────────────────────────────────────────────

export const snsTransformInputSchema = z.object({
  originalPost: z.object({
    title: z.string().min(1, '제목이 필요합니다'),
    content: z.string().min(1, '내용이 필요합니다'),
    keyPoints: z.array(z.string()),
  }),
  platform: snsPlatformSchema,
  variant: snsVariantSchema,
  options: z.object({
    includeHashtags: z.boolean(),
    includeEmoji: z.boolean(),
    cta: z.string().optional(),
  }),
})

// ───────────────────────────────────────────────
// Output Schemas
// ───────────────────────────────────────────────

export const snsSinglePostSchema = z.object({
  content: z.string().min(1, '게시물 내용이 비어있습니다'),
  characterCount: z.number().min(0),
  hashtags: z.array(z.string()).optional(),
  suggestedImage: z.string().optional(),
  bestPostingTime: z.string().optional(),
})

export const snsTransformOutputSchema = z.object({
  posts: z.array(snsSinglePostSchema).min(1),
  hashtags: z.array(z.string()),
  mentions: z.array(z.string()),
  engagementTips: z.array(z.string()),
})

// ───────────────────────────────────────────────
// Mock Generator
// ───────────────────────────────────────────────

/**
 * 플랫폼별 Mock 응답 생성
 */
export function createMockSNSTransformOutput(
  input: SNSTransformInput
): SNSTransformOutput {
  const { platform, variant, originalPost, options } = input

  // 플랫폼별 기본 응답 템플릿
  const platformTemplates: Record<SNSPlatform, () => SNSTransformOutput> = {
    threads: () => ({
      posts: [
        {
          content: `${originalPost.title}\n\n${originalPost.content.slice(0, 200)}...\n\n더 알아보기 👇`,
          characterCount: 250,
          hashtags: options.includeHashtags ? ['#스레드', '#블로그'] : undefined,
          suggestedImage: '미니멀한 인포그래픽',
          bestPostingTime: '09:00',
        },
      ],
      hashtags: ['#스레드', '#블로그', '#콘텐츠'],
      mentions: [],
      engagementTips: [
        '첫 30분 내 답글로 알고리즘 호응↑',
        '연속 글로 스토리텔링하면 도달률 상승',
      ],
    }),

    instagram: () => ({
      posts: [
        {
          content: `${options.includeEmoji ? '✨ ' : ''}${originalPost.title}\n\n${originalPost.content.slice(0, 300)}...\n\n${options.cta || '자세히 보기 👆'}`,
          characterCount: 350,
          hashtags: options.includeHashtags
            ? ['#인스타그램', '#블로그', '#콘텐츠마케팅', '#디지털노마드', '#크리에이터', '#글쓰기', '#콘텐츠', '#마케팅', '#sns', '#블로그스타그램']
            : undefined,
          suggestedImage: '세로형 카드뉴스',
          bestPostingTime: '18:00',
        },
      ],
      hashtags: ['#인스타그램', '#블로그', '#콘텐츠마케팅', '#디지털노마드', '#크리에이터'],
      mentions: [],
      engagementTips: [
        '스토리로 공유 시 도달률 2배 상승',
        '첫 1시간 내 좋아요/댓글 10개 이상 목표',
      ],
    }),

    linkedin: () => ({
      posts: [
        {
          content: `최근 ${originalPost.title}에 대해 글을 썼습니다.\n\n핵심 인사이트:\n${originalPost.keyPoints.slice(0, 3).map(p => `• ${p}`).join('\n')}\n\n더 자세한 내용은 댓글에 링크를 남겼습니다. 여러분의 생각은 어떠신가요?`,
          characterCount: 450,
          hashtags: options.includeHashtags ? ['#LinkedIn', '#Professional'] : undefined,
          suggestedImage: '전문가 이미지 또는 차트',
          bestPostingTime: '08:00',
        },
      ],
      hashtags: ['#LinkedIn', '#Professional', '#Insight', '#Career'],
      mentions: [],
      engagementTips: [
        '출근 시간(08-09시) 게시 시 조회수 상승',
        '댓글에 원문 링크 공유로 트래픽 유도',
      ],
    }),

    twitter: () => ({
      posts: [
        {
          content: `${originalPost.title}\n\n${originalPost.content.slice(0, 150)}...\n\n🧵 1/3`,
          characterCount: 200,
          hashtags: options.includeHashtags ? ['#Twitter'] : undefined,
        },
        {
          content: `핵심 포인트:\n${originalPost.keyPoints.slice(0, 2).map(p => `• ${p}`).join('\n')}\n\n🧵 2/3`,
          characterCount: 180,
        },
        {
          content: `${options.cta || '전체 글 읽기'}\n\n🧵 3/3`,
          characterCount: 100,
        },
      ],
      hashtags: ['#Twitter', '#Thread', '#Blog'],
      mentions: [],
      engagementTips: [
        'Thread 첫 트윗이 전체 성과의 80% 결정',
        '마지막 트윗에 CTA 넣어 클릭 유도',
      ],
    }),

    daangn: () => ({
      posts: [
        {
          content: `이웃님들! ${originalPost.title}에 대해 공유드려요~\n\n${originalPost.content.slice(0, 250)}...\n\n${options.cta || '의견 남겨주세요!'}`,
          characterCount: 300,
          hashtags: options.includeHashtags ? ['#우리동네', '#동네소식'] : undefined,
          suggestedImage: '친근한 생활 사진',
          bestPostingTime: '19:00',
        },
      ],
      hashtags: ['#우리동네', '#동네소식', '#정보공유'],
      mentions: [],
      engagementTips: [
        '저녁 시간(19-21시) 게시 시 참여율 상승',
        '지역 행사/정보 연동 시 신뢰도↑',
      ],
    }),

    facebook: () => ({
      posts: [
        {
          content: `${originalPost.title}\n\n${originalPost.content.slice(0, 400)}...\n\n${options.cta || '생각을 댓글로 알려주세요!'} ${options.includeEmoji ? '👍' : ''}`,
          characterCount: 450,
          hashtags: options.includeHashtags ? ['#Facebook'] : undefined,
          suggestedImage: '가로형 이미지',
          bestPostingTime: '13:00',
        },
      ],
      hashtags: ['#Facebook', '#Blog', '#Content'],
      mentions: [],
      engagementTips: [
        '점심 시간(12-14시) 게시 시 도달률 최고',
        '친구 태그하기 유도로 확산 효과',
      ],
    }),
  }

  return platformTemplates[platform]()
}
