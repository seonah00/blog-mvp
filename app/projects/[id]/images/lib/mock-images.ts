/**
 * Mock Image Generation
 * 
 * ImagePromptOutput을 기반으로 Mock URL 생성
 * @see PROMPT_GUIDE.md Section 4
 */

import type { ImagePromptOutput, ImagePurpose } from '@/lib/ai'
import type { GeneratedImage } from '@/types'
import { createId, nowIso } from '@/lib/utils'

// ───────────────────────────────────────────────
// Mock 이미지 URL 저장소 (Purpose 기반)
// ───────────────────────────────────────────────

const MOCK_IMAGE_URLS: Record<ImagePurpose, Record<string, string[]>> = {
  hero: {
    '16:9': [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=450&fit=crop',
    ],
    '4:3': [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=600&fit=crop',
    ],
    '1:1': [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&h=600&fit=crop',
    ],
    '9:16': [
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=700&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=700&fit=crop',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=700&fit=crop',
      'https://images.unsplash.com/photo-1434725039720-aaad6dd32dfe?w=400&h=700&fit=crop',
    ],
  },
  section: {
    '16:9': [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&h=450&fit=crop',
    ],
    '4:3': [
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=800&h=600&fit=crop',
    ],
    '1:1': [
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=600&h=600&fit=crop',
    ],
    '9:16': [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=700&fit=crop',
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=700&fit=crop',
      'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400&h=700&fit=crop',
      'https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=700&fit=crop',
    ],
  },
  detail: {
    '16:9': [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop',
    ],
    '4:3': [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop',
    ],
    '1:1': [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=600&fit=crop',
    ],
    '9:16': [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=700&fit=crop',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=700&fit=crop',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=700&fit=crop',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=700&fit=crop',
    ],
  },
  thumbnail: {
    '16:9': [
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=450&fit=crop',
    ],
    '4:3': [
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
    ],
    '1:1': [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=600&h=600&fit=crop',
    ],
    '9:16': [
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=700&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=700&fit=crop',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=700&fit=crop',
      'https://images.unsplash.com/photo-1434725039720-aaad6dd32dfe?w=400&h=700&fit=crop',
    ],
  },
}

// 기본 URL
const DEFAULT_URL = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800'

// Re-export types for convenience
export type { ImagePromptOutput, GeneratedImagePrompt, ImagePurpose } from '@/lib/ai'

// ───────────────────────────────────────────────
// 파라미터 타입
// ───────────────────────────────────────────────

export interface MockImageGenerationParams {
  projectId: string
  promptId: string
  blockId?: string
  promptOutput: ImagePromptOutput
}

export interface GeneratedImageFromPrompt {
  id: string
  projectId: string
  promptId: string
  blockId?: string
  url: string
  promptText: string
  style: string
  aspectRatio: string
  purpose: string
  createdAt: string
}

// ───────────────────────────────────────────────
// Mock 이미지 생성 함수 (신규)
// ───────────────────────────────────────────────

/**
 * ImagePromptOutput을 기반으로 Mock 이미지 생성
 * 
 * @param params - projectId, promptId, blockId?, promptOutput
 * @returns GeneratedImageFromPrompt[]
 */
export function generateMockImagesFromPrompts(
  params: MockImageGenerationParams
): GeneratedImageFromPrompt[] {
  const { projectId, promptId, blockId, promptOutput } = params

  return promptOutput.prompts.flatMap((prompt, index) => {
    // purpose와 ratio에 맞는 URL 목록 선택
    const urlsForPurpose = MOCK_IMAGE_URLS[prompt.purpose] || MOCK_IMAGE_URLS.section
    const urlsForRatio = urlsForPurpose[prompt.aspectRatio] || urlsForPurpose['16:9']
    
    // 4개의 이미지 생성
    return urlsForRatio.map((url, urlIndex) => ({
      id: createId('img'),
      projectId,
      promptId,
      blockId,
      url: `${url}&t=${Date.now()}-${index}-${urlIndex}`,
      promptText: prompt.prompt,
      style: prompt.aspectRatio,  // aspectRatio를 style로 매핑
      aspectRatio: prompt.aspectRatio,
      purpose: prompt.purpose,
      createdAt: nowIso(),
    }))
  })
}

// ───────────────────────────────────────────────
// 레거시 함수 (하위 호환용)
// ───────────────────────────────────────────────

/**
 * @deprecated ImagePromptOutput 기반 generateMockImagesFromPrompts 사용 권장
 * 
 * style/ratio 기반 간단한 mock 이미지 생성
 */
export function generateMockImages(
  _prompt: string,
  style: string,
  ratio: string
): GeneratedImage[] {
  const purpose: ImagePurpose = 'section'
  const urls = MOCK_IMAGE_URLS[purpose]?.[ratio] || [DEFAULT_URL]
  
  return urls.map((url) => ({
    id: createId('img'),
    url,
    createdAt: nowIso(),
  }))
}

/**
 * 단순 모드용 통합 프롬프트 생성
 * 여러 블록의 내용을 하나로 합쳐서 요약
 */
export function generateSimplePrompt(blockContents: string[]): string {
  const combined = blockContents.join(' ')
  return `${combined.slice(0, 150)}...를 시각화하는 대표 이미지`
}
