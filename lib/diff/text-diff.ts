/**
 * Text Diff Utilities
 * 
 * 두 텍스트 간 차이를 계산하는 유틸리티 함수들
 * - 라인 기반 diff (본문 비교용)
 * - 태그 배열 diff (해시태그 비교용)
 * - 단순 변경 감지 (제목, CTA 비교용)
 */

export type DiffLineType = 'added' | 'removed' | 'unchanged' | 'changed'

export interface DiffLine {
  type: DiffLineType
  left?: string   // 기준 버전의 내용
  right?: string  // 비교 버전의 내용
  lineNumber?: number
}

export interface TagDiffResult {
  added: string[]
  removed: string[]
  common: string[]
}

/**
 * 두 텍스트를 라인 단위로 비교하여 diff 생성
 * @param left 기준 버전 텍스트
 * @param right 비교 버전 텍스트
 * @returns DiffLine 배열
 */
export function diffTextByLines(left: string, right: string): DiffLine[] {
  const leftLines = left.split('\n').filter(line => line.trim() !== '')
  const rightLines = right.split('\n').filter(line => line.trim() !== '')
  
  const result: DiffLine[] = []
  let leftIndex = 0
  let rightIndex = 0
  
  while (leftIndex < leftLines.length || rightIndex < rightLines.length) {
    const leftLine = leftLines[leftIndex]
    const rightLine = rightLines[rightIndex]
    
    if (leftIndex >= leftLines.length) {
      // 기준 버전에 없는 라인 → 추가됨
      result.push({
        type: 'added',
        right: rightLine,
        lineNumber: rightIndex + 1,
      })
      rightIndex++
    } else if (rightIndex >= rightLines.length) {
      // 비교 버전에 없는 라인 → 제거됨
      result.push({
        type: 'removed',
        left: leftLine,
        lineNumber: leftIndex + 1,
      })
      leftIndex++
    } else if (leftLine === rightLine) {
      // 동일한 라인
      result.push({
        type: 'unchanged',
        left: leftLine,
        right: rightLine,
        lineNumber: leftIndex + 1,
      })
      leftIndex++
      rightIndex++
    } else {
      // 변경된 라인 - 단순화: 왼쪽은 removed, 오른쪽은 added로 처리
      result.push({
        type: 'changed',
        left: leftLine,
        right: rightLine,
        lineNumber: leftIndex + 1,
      })
      leftIndex++
      rightIndex++
    }
  }
  
  return result
}

/**
 * 두 문자열 배열(태그 등)을 비교하여 차이 분석
 * @param left 기준 버전 배열
 * @param right 비교 버전 배열
 * @returns TagDiffResult
 */
export function diffStringArrays(left: string[], right: string[]): TagDiffResult {
  const leftSet = new Set(left.map(s => s.trim()))
  const rightSet = new Set(right.map(s => s.trim()))
  
  const added: string[] = []
  const removed: string[] = []
  const common: string[] = []
  
  // Array.from()으로 Set을 배열로 변환하여 iteration
  Array.from(rightSet).forEach(item => {
    if (leftSet.has(item)) {
      common.push(item)
    } else {
      added.push(item)
    }
  })
  
  Array.from(leftSet).forEach(item => {
    if (!rightSet.has(item)) {
      removed.push(item)
    }
  })
  
  return { added, removed, common }
}

/**
 * 두 문자열이 동일한지 확인
 */
export function isTextChanged(left: string, right: string): boolean {
  return left.trim() !== right.trim()
}

/**
 * 변경사항 요약 생성
 */
export function generateDiffSummary(
  titleChanged: boolean,
  contentDiff: DiffLine[],
  tagsDiff: TagDiffResult
): string {
  const parts: string[] = []
  
  if (titleChanged) {
    parts.push('제목 변경')
  }
  
  const addedLines = contentDiff.filter(d => d.type === 'added').length
  const removedLines = contentDiff.filter(d => d.type === 'removed').length
  const changedLines = contentDiff.filter(d => d.type === 'changed').length
  
  if (addedLines > 0 || removedLines > 0 || changedLines > 0) {
    const changes: string[] = []
    if (addedLines > 0) changes.push(`+${addedLines}줄`)
    if (removedLines > 0) changes.push(`-${removedLines}줄`)
    if (changedLines > 0) changes.push(`~${changedLines}줄`)
    parts.push(`본문: ${changes.join(', ')}`)
  }
  
  if (tagsDiff.added.length > 0 || tagsDiff.removed.length > 0) {
    const tagChanges: string[] = []
    if (tagsDiff.added.length > 0) tagChanges.push(`+${tagsDiff.added.length}개`)
    if (tagsDiff.removed.length > 0) tagChanges.push(`-${tagsDiff.removed.length}개`)
    parts.push(`태그: ${tagChanges.join(', ')}`)
  }
  
  return parts.length > 0 ? parts.join(' · ') : '변경사항 없음'
}
