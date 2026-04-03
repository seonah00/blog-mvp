/**
 * Stage 6: Natural Rewrite
 * 
 * 초안 문장을 더 자연스럽게 다듬는 단계
 * 메모투, 조사요약투, 기계적 SEO 문장 제거
 * 사람 말투처럼 부드럽게 연결
 * 기존에 사람이 Claude로 하던 역할을 시스템 낮부 단계로 복원
 */

import { generateWithPurpose } from '../client'
import type { RawDraft, RewrittenDraft, StyleChange } from './types'
import type { InformationalPipelineInput, RestaurantPipelineInput } from './types'

// 메모투/기계적 문장 패턴
const MEMO_PATTERNS = [
  /관련 자료를 본면[^.]*\./g,
  /이 내용을 실제 글에 녹이[^.]*\./g,
  /비슷한 흐름이 언급됩니다[^.]*\./g,
  /다음과 같이 정리할 수 있습니다[^.]*\./g,
  /실제 글에 녹일 때는[^.]*\./g,
  /조사 결과를 본면[^.]*\./g,
  /참고하면[^.]*\./g,
  /위 내용을 참고하[^.]*\./g,
  /앞서 다룬 내용[^.]*\./g,
  /글을 작성할 때[^.]*\./g,
  /작성자의 의견[^.]*\./g,
  /본문에서 다루[^.]*\./g,
  /feat\.[^.]*\./g,
]

const MECHANICAL_PATTERNS = [
  /첫째,\s*둘째,\s*셋째/g,
  /첫 번째로.*두 번째로.*세 번째로/g,
  /이것은.*이다\./g,
  /위에서 언급한 바와 같이/g,
  /앞서 설명한 대로/g,
]

/**
 * 자연화 재작성 (정보성 글)
 */
export async function rewriteNatural(
  rawDraft: RawDraft,
  input: InformationalPipelineInput,
  onProgress?: (progress: number) => void
): Promise<RewrittenDraft> {
  onProgress?.(10)

  const changes: StyleChange[] = []
  const rewrittenSections: RewrittenDraft['sections'] = []

  // 각 섹션별 재작성
  const totalSections = rawDraft.sections.length
  for (let i = 0; i < totalSections; i++) {
    const section = rawDraft.sections[i]
    onProgress?.(20 + Math.floor((i / totalSections) * 70))

    // 1. 메모투 제거
    let content = removeMemoPatterns(section.content, changes)
    
    // 2. 기계적 패턴 제거
    content = removeMechanicalPatterns(content, changes)

    // 3. AI로 자연화
    const naturalContent = await rewriteWithAI(content, input)

    // 변경 사항 기록
    if (naturalContent !== content) {
      changes.push({
        type: 'improved',
        original: content.substring(0, 100) + '...',
        rewritten: naturalContent.substring(0, 100) + '...',
        reason: '문장을 더 자연스럽게 다듬음',
      })
    }

    rewrittenSections.push({
      heading: section.heading,
      content: naturalContent,
      wordCount: naturalContent.length,
    })
  }

  onProgress?.(100)

  const fullContent = rewrittenSections.map(s => 
    s.heading ? `## ${s.heading}\n\n${s.content}` : s.content
  ).join('\n\n')

  console.log(`[Stage 6] 자연화 완료: ${changes.length}개 문장 개선`)

  return {
    content: fullContent,
    sections: rewrittenSections,
    styleChanges: changes,
    improvementNotes: changes.map(c => c.reason),
  }
}

/**
 * 자연화 재작성 (맛집 글)
 */
export async function rewriteRestaurantNatural(
  rawDraft: RawDraft,
  input: RestaurantPipelineInput
): Promise<RewrittenDraft> {
  const changes: StyleChange[] = []
  const rewrittenSections: RewrittenDraft['sections'] = []

  for (const section of rawDraft.sections) {
    // 메모투 및 템플릿 제거
    let content = removeMemoPatterns(section.content, changes)
    content = removeTemplateMarkers(content, changes)

    // 간단한 자연화
    content = content
      .replace(/에서 즐거운 식사 되세요[!.]*/g, '')
      .replace(/방문해 주셔서 감사합니다[.]*/g, '')
      .replace(/맛있는 식사 되세요[.]*/g, '')

    rewrittenSections.push({
      heading: section.heading,
      content,
      wordCount: content.length,
    })
  }

  const fullContent = rewrittenSections.map(s => 
    s.heading ? `## ${s.heading}\n\n${s.content}` : s.content
  ).join('\n\n')

  return {
    content: fullContent,
    sections: rewrittenSections,
    styleChanges: changes,
    improvementNotes: changes.map(c => c.reason),
  }
}

// ============================================
// Helper Functions
// ============================================

function removeMemoPatterns(content: string, changes: StyleChange[]): string {
  let result = content

  for (const pattern of MEMO_PATTERNS) {
    const matches = result.match(pattern)
    if (matches) {
      for (const match of matches) {
        changes.push({
          type: 'memo',
          original: match,
          rewritten: '',
          reason: '메모투 문장 제거',
        })
      }
      result = result.replace(pattern, '')
    }
  }

  return result
}

function removeMechanicalPatterns(content: string, changes: StyleChange[]): string {
  const result = content

  for (const pattern of MECHANICAL_PATTERNS) {
    const matches = result.match(pattern)
    if (matches) {
      for (const match of matches) {
        changes.push({
          type: 'mechanical',
          original: match,
          rewritten: match, // Will be improved by AI
          reason: '기계적 문장 패턴 개선',
        })
      }
    }
  }

  return result
}

function removeTemplateMarkers(content: string, changes: StyleChange[]): string {
  const patterns = [
    /^---\s*$/gm,
    /\*\*기본 정보\*\*/g,
    /📍\s*$/gm,
    /TODO:.*/g,
    /FIXME:.*/g,
  ]

  let result = content
  for (const pattern of patterns) {
    result = result.replace(pattern, '')
  }

  return result.trim()
}

async function rewriteWithAI(
  content: string,
  input: InformationalPipelineInput
): Promise<string> {
  const systemPrompt = `당신은 글을 다듬는 에디터입니다. 다음 원칙을 따르세요:

**목표:**
1. 문장을 더 자연스럽고 읽기 쉽게 다듬기
2. AI가 쓴 것처럼 딱딱한 표현을 사람 말투로 변경
3. 과하지 않은 친근한 어조 유지
4. 원문의 의미는 그대로 유지

**금지:**
- "관련 자료를 본면", "참고하면" 등 메모투
- "첫째, 둘째, 셋째" 같은 기계적羅列
- "이것은 ~이다" 같은 딱딱한 문장

**출력:**
다듬어진 글만 출력하세요. 설명이나 코멘트는 하지 마세요.`

  // 글이 너무 길면 섹션별로 처리
  if (content.length > 2000) {
    return content // Skip AI rewrite for long content (performance)
  }

  try {
    const result = await generateWithPurpose('refine', {
      systemPrompt,
      userPrompt: `다음 글을 자연스럽게 다듬어주세요:\n\n${content}`,
      temperature: 0.4,
    } as any)  // eslint-disable-line @typescript-eslint/no-explicit-any

    if (result.ok && result.data) {
      return result.data as string
    }
  } catch (error) {
    console.warn('[Stage 6] AI 재작성 실패, 원문 유지:', error)
  }

  return content
}
