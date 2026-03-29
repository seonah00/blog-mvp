/**
 * Image Prompts
 * 
 * @see PROMPT_GUIDE.md Section 4 - Image Prompt 생성
 */

import type { ImagePromptInput, ImagePromptOutput, ImageStyle, ImagePurpose } from '../types'

// ───────────────────────────────────────────────
// 시스템 프롬프트
// ───────────────────────────────────────────────

const IMAGE_PROMPT_SYSTEM = `
당신은 AI 이미지 프롬프트 엔지니어입니다. 블로그 콘텐츠에 어울리는 고품질 이미지 생성 프롬프트를 작성하세요.

## 출력 형식 (JSON)
{
  "prompts": [
    {
      "purpose": "hero|section|detail|thumbnail",
      "prompt": "이미지 생성용 긍정 프롬프트 (영어)",
      "negativePrompt": "제외할 요소 (영어)",
      "aspectRatio": "16:9",
      "recommendedModel": "dall-e-3"
    }
  ],
  "colorPalette": ["#FF5733", "#33FF57"],
  "composition": "구도 설명"
}

## 프롬프트 작성 원칙
1. 구체적이고 묘사적인 형용사 사용
2. 조명, 색감, 구도 명시
3. 브랜드 일관성을 위한 스타일 키워드 포함
4. 부정적 프롬프트도 함께 제공
5. 이미지 목적 고려 (hero/section/detail/thumbnail)

## 톤별 스타일 키워드
- professional: clean, corporate, polished, sophisticated
- friendly: warm, inviting, approachable, soft lighting
- casual: candid, lifestyle, natural, authentic
- expert: technical, detailed, precise, high-tech
- persuasive: bold, dynamic, impactful, vibrant
`

// ───────────────────────────────────────────────
// 사용자 프롬프트 빌더
// ───────────────────────────────────────────────

function buildUserPrompt(input: ImagePromptInput): string {
  return `
# 프로젝트 정보
주제: ${input.project.topic}
톤: ${input.project.tone}

# 섹션 내용
제목: ${input.section.heading}
내용: ${input.section.content}

# 이미지 설정
스타일: ${input.imageStyle}
비율: ${input.aspectRatio}
목적: ${input.variant}

위 내용을 바탕으로 이미지 생성 프롬프트를 작성해주세요.
`
}

// ───────────────────────────────────────────────
// Style별 추가 키워드
// ───────────────────────────────────────────────

export const STYLE_KEYWORDS: Record<ImageStyle, string> = {
  realistic: 'photorealistic, highly detailed, professional photography, 8k',
  illustration: 'digital illustration, artistic, stylized, creative interpretation',
  minimal: 'minimalist, clean lines, simple composition, ample white space',
  '3d': '3d render, isometric, depth, modern aesthetic',
}

// ───────────────────────────────────────────────
// Purpose별 프롬프트 가이드
// ───────────────────────────────────────────────

export const PURPOSE_GUIDE: Record<ImagePurpose, string> = {
  hero: '대표 이미지: 주제의 핵심을 담은 강렬한 시각적 임팩트',
  section: '섹션 일러스트: 내용을 보조하는 설명적 이미지',
  detail: '세부 설명용: 구체적인 개념이나 과정 시각화',
  thumbnail: '썸네일용: 작은 크기에서도 임팩트 있는 구도',
}

// ───────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────

export interface ImagePromptsResult {
  system: string
  user: string
  styleKeywords: string
  purposeGuide: string
}

/**
 * ImagePromptInput을 기반으로 프롬프트 생성
 */
export function buildImagePrompts(input: ImagePromptInput): ImagePromptsResult {
  return {
    system: IMAGE_PROMPT_SYSTEM,
    user: buildUserPrompt(input),
    styleKeywords: STYLE_KEYWORDS[input.imageStyle],
    purposeGuide: PURPOSE_GUIDE[input.variant],
  }
}
