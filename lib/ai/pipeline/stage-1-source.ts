/**
 * Stage 1: Source Collection
 * 
 * 외부 검색/리서치/플레이스/리뷰/사용자 입력/첨부 데이터 수집
 * raw source는 raw source로만 저장, 절대 최종 본문에 바로 삽입하지 않음
 */

import type { PipelineSource } from './types'
import type { InformationalPipelineInput, RestaurantPipelineInput } from './types'

/**
 * 정보성 글용 소스 수집
 */
export async function collectSources(
  input: InformationalPipelineInput
): Promise<PipelineSource[]> {
  const sources: PipelineSource[] = []
  
  // 1. Source Documents (from research phase)
  if (input.sources && input.sources.length > 0) {
    for (const doc of input.sources) {
      sources.push({
        id: doc.id || `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: inferSourceType(doc),
        rawContent: doc.content || doc.rawText || '',
        metadata: {
          title: doc.title,
          url: doc.url,
          timestamp: doc.savedAt || new Date().toISOString(),
          credibility: doc.credibility || 'medium',
          sourceId: doc.id,
        },
      })
    }
  }
  
  // 2. User-provided content (custom prompt, additional notes)
  if (input.settings.customPrompt) {
    sources.push({
      id: `user-prompt-${Date.now()}`,
      type: 'user',
      rawContent: input.settings.customPrompt,
      metadata: {
        title: '사용자 입력 프롬프트',
        timestamp: new Date().toISOString(),
        credibility: 'high',
      },
    })
  }
  
  console.log(`[Stage 1] 수집된 소스: ${sources.length}개`)
  return sources
}

/**
 * 맛집 글용 소스 수집
 */
export async function collectRestaurantSources(
  input: RestaurantPipelineInput
): Promise<PipelineSource[]> {
  const sources: PipelineSource[] = []
  
  // 1. Place Profile
  if (input.placeProfile) {
    sources.push({
      id: `place-${input.placeProfile.name}`,
      type: 'place',
      rawContent: formatPlaceProfile(input.placeProfile),
      metadata: {
        title: input.placeProfile.name,
        timestamp: new Date().toISOString(),
        credibility: 'high',
      },
    })
  }
  
  // 2. Review Digest
  if (input.reviewDigest) {
    sources.push({
      id: `reviews-${Date.now()}`,
      type: 'review',
      rawContent: formatReviewDigest(input.reviewDigest),
      metadata: {
        title: '방문객 리뷰 요약',
        timestamp: new Date().toISOString(),
        credibility: 'medium',
      },
    })
  }
  
  // 3. Web Evidence (if available)
  if (input.webEvidence && input.webEvidence.length > 0) {
    for (const evidence of input.webEvidence) {
      sources.push({
        id: `web-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'web',
        rawContent: evidence.snippet,
        metadata: {
          title: evidence.title,
          url: evidence.url,
          timestamp: new Date().toISOString(),
          credibility: evidence.relevance > 0.7 ? 'high' : 'medium',
        },
      })
    }
  }
  
  console.log(`[Stage 1] 수집된 맛집 소스: ${sources.length}개`)
  return sources
}

// ============================================
// Helper Functions
// ============================================

function inferSourceType(doc: { url?: string; title?: string; content?: string }): PipelineSource['type'] {
  const url = doc.url || ''
  const title = doc.title || ''
  
  if (url.includes('perplexity') || title.includes('Perplexity')) {
    return 'perplexity'
  }
  if (url.includes('liner') || title.includes('Liner')) {
    return 'liner'
  }
  if (url.includes('naver') || url.includes('google')) {
    return 'web'
  }
  return 'web'
}

function formatPlaceProfile(profile: RestaurantPipelineInput['placeProfile']): string {
  return `
매장명: ${profile.name}
카테고리: ${profile.category}
주소: ${profile.address}
${profile.phone ? `전화: ${profile.phone}` : ''}
${profile.hours ? `영업시간: ${profile.hours.join(', ')}` : ''}
`.trim()
}

function formatReviewDigest(digest: RestaurantPipelineInput['reviewDigest']): string {
  return `
리뷰 요약: ${digest.summary}

주요 Highlights:
${digest.highlights.map(h => `- ${h}`).join('\n')}

인용구:
${digest.quotes.map(q => `- "${q}"`).join('\n')}
`.trim()
}
