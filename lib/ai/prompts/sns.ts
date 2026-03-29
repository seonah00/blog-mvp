/**
 * SNS Prompts
 * 
 * @see PROMPT_GUIDE.md Section 5 - Export Studio용 SNS 변환
 */

import type { SNSTransformInput, SNSTransformOutput, SNSPlatform, SNSVariant } from '../types'

// ───────────────────────────────────────────────
// 플랫폼별 시스템 프롬프트
// ───────────────────────────────────────────────

const PLATFORM_SYSTEM_PROMPTS: Record<SNSPlatform, string> = {
  threads: `
당신은 Threads 콘텐츠 전문가입니다. 블로그 글을 Threads에 최적화된 형식으로 변환하세요.

## Threads 특성
- 500자 제한 (더 길게 쓸 수 있지만 300자 내외가 최적)
- 대화형, 친근한 톤
- 연속된 생각의 흐름을 선호
- 전문적이면서도 가벼운 분위기

## 규칙
1. 첫 문장은 독자의 호기심을 자극하는 hook으로 시작
2. 문단마다 줄바꿈으로 가독성 확보
3. 개인적인 경험이나 통찰을 공유하는 톤
4. 마지막은 질문이나 다음 글 예고로 마무리
5. 해시태그는 3-5개만 사용 (오버플로우 방지)
`,

  instagram: `
당신은 Instagram 콘텐츠 크리에이터입니다. 블로그 글을 Instagram 캡션으로 변환하세요.

## Instagram 특성
- 시각적 플랫폼 (이미지 중심)
- 친근하고 개인적인 톤
- 첫 줄이 매우 중요 (fold 위치)

## 규칙
1. 첫 줄은 강력한 hook으로 시작 (1초 내 주목)
2. 이모지를 적절히 사용해 시각적 흥미 추가
3. 줄바꿈을 적극 활용해 가독성 확보
4. 해시태그는 10-15개 (인기태그 + 니치태그 조합)
5. CTA는 명확하고 실행 가능하게
6. 스토리나 릴스 연동을 언급
`,

  linkedin: `
당신은 LinkedIn 콘텐츠 전략가입니다. 전문가 네트워크에 적합한 형식으로 변환하세요.

## LinkedIn 특성
- 전문적 네트워크
- 긴 형식도 가능하지만 1300자가 최적
- 업무 관련 인사이트 중심

## 규칙
1. 전문적이면서도 대화체 톤 사용
2. 개인적 경험이나 스토리를 포함
3. actionable한 인사이트 제공
4. 문단마다 줄바꿈으로 가독성 확보
5. 3-5개의 관련 해시태그 포함
6. 댓글을 유도하는 질문으로 마무리
7. 전문성과 친근함의 균형 유지
`,

  twitter: `
당신은 Twitter 콘텐츠 전문가입니다. 블로그 글을 Twitter에 최적화된 형식으로 변환하세요.

## Twitter 특성
- 280자 제한 (초과 시 thread 형식)
- 실시간, 빠른 소비
- 핵심 메시지 압축

## 규칙
1. 280자 제한을 준수 (초과 시 thread 형식 사용)
2. hook이 강력한 첫 문장으로 시작
3. 핵심 가치를 앞부분에 배치
4. 2-3개의 관련 해시태그 포함
5. 질문이나 CTA로 마무리
6. 줄바꿈으로 가독성을 높이세요
7. link preview를 고려한 길이 조정
`,

  daangn: `
당신은 당근마켓 소식 작성자입니다. 동네 이웃에게 정보를 전달하는 톤으로 변환하세요.

## 당근 특성
- 지역 기반 커뮤니티
- 신뢰성 중시
- 친근하고 구어체 톤

## 규칙
1. 동네 친근한 톤 사용 ("우리 동네", "이웃님들")
2. 지역 기반 해시태그 포함 (#강남동 #역삼동)
3. 신뢰성 있는 정보 전달
4. 질문이나 제안으로 소통 유도
5. 가독성 좋은 짧은 문단 사용
6. 이모지는 적절히 (과하지 않게)
`,

  facebook: `
당신은 Facebook 콘텐츠 매니저입니다. 다양한 연령층에게 맞는 형식으로 변환하세요.

## Facebook 특성
- 다양한 연령층
- 그룹 기능 활용
- 공유 중심

## 규칙
1. 공유를 유도하는 내용 구성
2. 친근하고 따뜻한 톤
3. 질문으로 engagement 유도
4. 해시태그는 3-5개 적절히
5. 그룹 게시물 최적화 고려
6. 더 자세한 내용은 댓글로 유도
`,
}

// ───────────────────────────────────────────────
// 출력 형식 프롬프트
// ───────────────────────────────────────────────

const OUTPUT_FORMAT_PROMPT = `
## 출력 형식 (JSON)
다음 JSON 형식으로 응답하세요:
{
  "posts": [
    {
      "content": "게시물 내용",
      "characterCount": 245,
      "hashtags": ["#태그1", "#태그2"],
      "suggestedImage": "이미지 설명",
      "bestPostingTime": "18:00"
    }
  ],
  "hashtags": ["#공통태그1", "#공통태그2"],
  "mentions": [],
  "engagementTips": [
    "첫 30분 내 답글로 알고리즘 호응↑",
    "스토리로 공유 시 도달률 2배"
  ]
}

## 규칙
1. content는 플랫폼 특성에 맞게 최적화
2. characterCount는 실제 글자 수 계산
3. hashtags는 요청 시에만 포함
4. engagementTips는 2-3개 실용적 팁
`

// ───────────────────────────────────────────────
// 사용자 프롬프트 빌더
// ───────────────────────────────────────────────

function buildUserPrompt(input: SNSTransformInput): string {
  const parts: string[] = []

  parts.push(`# 원문 블로그 글`)
  parts.push(`제목: ${input.originalPost.title}`)
  parts.push(`내용: ${input.originalPost.content.slice(0, 1000)}...`)
  
  if (input.originalPost.keyPoints.length > 0) {
    parts.push(`\n# 핵심 포인트`)
    input.originalPost.keyPoints.forEach((point, i) => {
      parts.push(`${i + 1}. ${point}`)
    })
  }

  parts.push(`\n# 변환 요구사항`)
  parts.push(`플랫폼: ${input.platform}`)
  parts.push(`형식: ${input.variant}`)
  parts.push(`해시태그 포함: ${input.options.includeHashtags ? '예' : '아니오'}`)
  parts.push(`이모지 포함: ${input.options.includeEmoji ? '예' : '아니오'}`)
  
  if (input.options.cta) {
    parts.push(`CTA: ${input.options.cta}`)
  }

  return parts.join('\n')
}

// ───────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────

export interface SNSPromptsResult {
  system: string
  user: string
}

/**
 * SNSTransformInput을 기반으로 프롬프트 생성
 */
export function buildSNSPrompts(input: SNSTransformInput): SNSPromptsResult {
  const platformPrompt = PLATFORM_SYSTEM_PROMPTS[input.platform]
  const systemPrompt = `${platformPrompt}\n${OUTPUT_FORMAT_PROMPT}`
  const userPrompt = buildUserPrompt(input)

  return {
    system: systemPrompt,
    user: userPrompt,
  }
}

// ───────────────────────────────────────────────
// 플랫폼별 메타데이터 (UI 표시용)
// ───────────────────────────────────────────────

export interface SNSPlatformMeta {
  name: string
  description: string
  maxChars: number
  supportsThread: boolean
  idealHashtags: number
}

export const SNS_PLATFORM_META: Record<SNSPlatform, SNSPlatformMeta> = {
  threads: {
    name: 'Threads',
    description: '대화형 콘텐츠, 연속된 생각 공유',
    maxChars: 500,
    supportsThread: true,
    idealHashtags: 3,
  },
  instagram: {
    name: 'Instagram',
    description: '시각적 캡션, 해시태그 중심',
    maxChars: 2200,
    supportsThread: false,
    idealHashtags: 15,
  },
  linkedin: {
    name: 'LinkedIn',
    description: '전문가 인사이트, 네트워킹',
    maxChars: 3000,
    supportsThread: false,
    idealHashtags: 5,
  },
  twitter: {
    name: 'Twitter/X',
    description: '짧은 메시지, thread 지원',
    maxChars: 280,
    supportsThread: true,
    idealHashtags: 3,
  },
  daangn: {
    name: '당근 소식',
    description: '동네 기반, 신뢰성 중시',
    maxChars: 1000,
    supportsThread: false,
    idealHashtags: 5,
  },
  facebook: {
    name: 'Facebook',
    description: '다양한 연령층, 공유 중심',
    maxChars: 63206,
    supportsThread: false,
    idealHashtags: 5,
  },
}

// ───────────────────────────────────────────────
// 변환 유형별 설명
// ───────────────────────────────────────────────

export const SNS_VARIANT_DESCRIPTIONS: Record<SNSVariant, string> = {
  summary: '핵심 내용을 간결하게 요약',
  thread: '연속된 게시물로 스토리텔링',
  quote: '인용구 중심의 공유형',
  question: '질문으로 engagement 유도',
  carousel: '카드 뉴스용 다단 콘텐츠',
}
