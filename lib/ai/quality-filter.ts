/**
 * Quality Filter - 초안 품질 검사 및 자동 수정
 * 
 * 생성된 블로그 초안에서 다음 문제를 자동으로 검사하고 수정합니다:
 * 1. placeholder/template marker 누수
 * 2. 메타/메모투 문장 제거
 * 3. 중복 섹션/문장 제거
 * 4. 제목-본문 정합성 검사
 * 5. markdown/template leakage 제거
 */

export interface QualityCheckResult {
  /** 검사 상태 */
  status: 'pass' | 'fail' | 'fixed'
  /** 발견된 문제 목록 */
  issues: Array<{
    type: 'placeholder' | 'template' | 'memo' | 'duplicate' | 'meta' | 'empty' | 'mismatch'
    message: string
    context?: string
    line?: number
  }>
  /** 수정된 본문 */
  fixedContent: string
  /** 수정 요약 */
  fixSummary: string[]
}

// ============================================
// 패턴 정의
// ============================================

/** Placeholder/TODO 패턴 */
const PLACEHOLDER_PATTERNS = [
  /내용을 입력하세요\.*/gi,
  /여기에 내용을 작성하세요\.*/gi,
  /TODO:?.*/gi,
  /FIXME:?.*/gi,
  /\[.*?입력.*?\]/gi,
  /\[.*?작성.*?\]/gi,
  /\[.*?추가.*?\]/gi,
  /\.\.\.\s*$/gm,
]

/** Template/Marker 패턴 */
const TEMPLATE_PATTERNS = [
  /^---\s*$/gm,
  /\*\*기본 정보\*\*/gi,
  /\*\*기본정보\*\*/gi,
  /📍\s*$/gm,
  /📞\s*$/gm,
  /에서 즐거운 식사 되세요!*/gi,
  /방문해 주셔서 감사합니다.*/gi,
  /맛있는 식사 되세요.*/gi,
]

/** 메타/메모투 문장 패턴 */
const META_WRITING_PATTERNS = [
  /관련 자료를 본면[^.]*\.[^.]*/gi,
  /이 내용을 실제 글에 녹이[^.]*\.[^.]*/gi,
  /이 부분은 실제 상황에 맞춰[^.]*\.[^.]*/gi,
  /독자가 바로 이해할 수 있[^.]*\.[^.]*/gi,
  /훨씬 자연스럽고 읽기 쉬운[^.]*\.[^.]*/gi,
  /비슷한 흐름이 언급됩니다[^.]*/gi,
  /예시와 함께 설명하는 것이 좋습니다[^.]*/gi,
  /참고하시면 됩니다[^.]*/gi,
  /위 내용을 참고하[^.]*\.[^.]*/gi,
  /앞서 다룬 내용[^.]*\.[^.]*/gi,
  /실제로 적용[^.]*\.[^.]*/gi,
  /글을 작성할 때[^.]*\.[^.]*/gi,
  /작성자의 의견[^.]*\.[^.]*/gi,
  /본문에서 다루[^.]*\.[^.]*/gi,
]

// ============================================
// 유틸리티 함수
// ============================================

function splitIntoSections(content: string): Array<{
  type: 'heading' | 'paragraph' | 'quote' | 'empty'
  content: string
  level?: number
}> {
  const lines = content.split('\n')
  const sections: Array<{ type: 'heading' | 'paragraph' | 'quote' | 'empty'; content: string; level?: number }> = []
  let currentParagraph = ''
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    if (!trimmed) {
      if (currentParagraph) {
        sections.push({ type: 'paragraph', content: currentParagraph.trim() })
        currentParagraph = ''
      }
      continue
    }
    
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      if (currentParagraph) {
        sections.push({ type: 'paragraph', content: currentParagraph.trim() })
        currentParagraph = ''
      }
      sections.push({ type: 'heading', content: trimmed, level: headingMatch[1].length })
      continue
    }
    
    if (trimmed.startsWith('>')) {
      if (currentParagraph) {
        sections.push({ type: 'paragraph', content: currentParagraph.trim() })
        currentParagraph = ''
      }
      sections.push({ type: 'quote', content: trimmed })
      continue
    }
    
    currentParagraph += line + '\n'
  }
  
  if (currentParagraph.trim()) {
    sections.push({ type: 'paragraph', content: currentParagraph.trim() })
  }
  
  return sections
}

function normalizeSentence(sentence: string): string {
  return sentence
    .replace(/[\s\n\r\t]+/g, '')
    .replace(/[.,!?;:'"()[\]{}]/g, '')
    .toLowerCase()
}

function removeDuplicateSentences(content: string): string {
  const sentences = content.split(/(?<=[.!?])\s+/)
  const seen = new Set<string>()
  const result: string[] = []
  
  for (const sentence of sentences) {
    const normalized = normalizeSentence(sentence)
    if (!normalized || normalized.length < 10) {
      result.push(sentence)
      continue
    }
    
    if (seen.has(normalized)) {
      continue
    }
    
    seen.add(normalized)
    result.push(sentence)
  }
  
  return result.join(' ')
}

function removeDuplicateSections(content: string): string {
  const sections = splitIntoSections(content)
  const seenHeadings = new Set<string>()
  const result: typeof sections = []
  let skipUntilNextHeading = false
  
  for (const section of sections) {
    if (section.type === 'heading') {
      const normalized = normalizeSentence(section.content)
      
      if (seenHeadings.has(normalized)) {
        skipUntilNextHeading = true
        continue
      }
      
      seenHeadings.add(normalized)
      skipUntilNextHeading = false
      result.push(section)
    } else if (!skipUntilNextHeading) {
      result.push(section)
    }
  }
  
  return result.map(s => s.content).join('\n\n')
}

// ============================================
// 검사 함수들
// ============================================

function checkPlaceholders(content: string): Array<{ message: string; context: string }> {
  const issues: Array<{ message: string; context: string }> = []
  
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => {
        issues.push({
          message: `Placeholder 발견: "${match.substring(0, 30)}..."`,
          context: match,
        })
      })
    }
  }
  
  return issues
}

function checkTemplateMarkers(content: string): Array<{ message: string; context: string }> {
  const issues: Array<{ message: string; context: string }> = []
  
  for (const pattern of TEMPLATE_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => {
        issues.push({
          message: `Template marker 발견: "${match}"`,
          context: match,
        })
      })
    }
  }
  
  return issues
}

function checkMetaWriting(content: string): Array<{ message: string; context: string }> {
  const issues: Array<{ message: string; context: string }> = []
  
  for (const pattern of META_WRITING_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => {
        issues.push({
          message: `메타/메모투 문장 발견: "${match.substring(0, 40)}..."`,
          context: match,
        })
      })
    }
  }
  
  return issues
}

function checkEmptySections(content: string): Array<{ message: string; context: string }> {
  const issues: Array<{ message: string; context: string }> = []
  const sections = splitIntoSections(content)
  
  for (let i = 0; i < sections.length - 1; i++) {
    const current = sections[i]
    const next = sections[i + 1]
    
    if (current.type === 'heading' && next.type === 'heading') {
      issues.push({
        message: `빈 섹션 발견: "${current.content.substring(0, 30)}..."`,
        context: `${current.content}\n${next.content}`,
      })
    }
  }
  
  return issues
}

function checkDuplicates(content: string): Array<{ message: string; context: string }> {
  const issues: Array<{ message: string; context: string }> = []
  const sentences = content.split(/(?<=[.!?])\s+/)
  const seen = new Set<string>()
  
  for (const sentence of sentences) {
    const normalized = normalizeSentence(sentence)
    if (normalized.length > 20 && seen.has(normalized)) {
      issues.push({
        message: `중복 문장 발견: "${sentence.substring(0, 40)}..."`,
        context: sentence,
      })
    }
    seen.add(normalized)
  }
  
  return issues
}

// ============================================
// 수정 함수들
// ============================================

function removePlaceholders(content: string): string {
  let result = content
  for (const pattern of PLACEHOLDER_PATTERNS) {
    result = result.replace(pattern, '')
  }
  return result
}

function removeTemplateMarkers(content: string): string {
  let result = content
  for (const pattern of TEMPLATE_PATTERNS) {
    result = result.replace(pattern, '')
  }
  return result
}

function removeMetaWriting(content: string): string {
  let result = content
  for (const pattern of META_WRITING_PATTERNS) {
    result = result.replace(pattern, '')
  }
  return result
}

function removeEmptySections(content: string): string {
  const sections = splitIntoSections(content)
  const result: typeof sections = []
  
  for (let i = 0; i < sections.length; i++) {
    const current = sections[i]
    const next = sections[i + 1]
    
    if (current.type === 'heading' && next?.type === 'heading') {
      continue
    }
    
    result.push(current)
  }
  
  return result.map(s => s.content).join('\n\n')
}

function cleanExcessWhitespace(content: string): string {
  return content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
}

// ============================================
// 메인 품질 필터
// ============================================

export function applyQualityFilter(content: string): QualityCheckResult {
  const issues: QualityCheckResult['issues'] = []
  let fixedContent = content
  const fixSummary: string[] = []
  
  // 1. Placeholder 검사 및 제거
  const placeholderIssues = checkPlaceholders(fixedContent)
  if (placeholderIssues.length > 0) {
    issues.push(...placeholderIssues.map(i => ({ type: 'placeholder' as const, message: i.message, context: i.context })))
    fixedContent = removePlaceholders(fixedContent)
    fixSummary.push(`Placeholder ${placeholderIssues.length}개 제거`)
  }
  
  // 2. Template marker 검사 및 제거
  const templateIssues = checkTemplateMarkers(fixedContent)
  if (templateIssues.length > 0) {
    issues.push(...templateIssues.map(i => ({ type: 'template' as const, message: i.message, context: i.context })))
    fixedContent = removeTemplateMarkers(fixedContent)
    fixSummary.push(`Template marker ${templateIssues.length}개 제거`)
  }
  
  // 3. 메타/메모투 문장 검사 및 제거
  const metaIssues = checkMetaWriting(fixedContent)
  if (metaIssues.length > 0) {
    issues.push(...metaIssues.map(i => ({ type: 'meta' as const, message: i.message, context: i.context })))
    fixedContent = removeMetaWriting(fixedContent)
    fixSummary.push(`메타/메모투 문장 ${metaIssues.length}개 제거`)
  }
  
  // 4. 중복 문장 제거
  const duplicateIssues = checkDuplicates(fixedContent)
  if (duplicateIssues.length > 0) {
    issues.push(...duplicateIssues.map(i => ({ type: 'duplicate' as const, message: i.message, context: i.context })))
    fixedContent = removeDuplicateSentences(fixedContent)
    fixSummary.push(`중복 문장 ${duplicateIssues.length}개 제거`)
  }
  
  // 5. 중복 섹션 제거
  fixedContent = removeDuplicateSections(fixedContent)
  
  // 6. 빈 섹션 제거
  const emptyIssues = checkEmptySections(fixedContent)
  if (emptyIssues.length > 0) {
    issues.push(...emptyIssues.map(i => ({ type: 'empty' as const, message: i.message, context: i.context })))
    fixedContent = removeEmptySections(fixedContent)
    fixSummary.push(`빈 섹션 ${emptyIssues.length}개 제거`)
  }
  
  // 7. 공백 정리
  fixedContent = cleanExcessWhitespace(fixedContent)
  
  return {
    status: issues.length === 0 ? 'pass' : 'fixed',
    issues,
    fixedContent,
    fixSummary,
  }
}

export function applyQualityFilterToDraft<T extends { content: string; title?: string }>(
  draft: T
): T & { qualityResult: QualityCheckResult } {
  const qualityResult = applyQualityFilter(draft.content)
  
  return {
    ...draft,
    content: qualityResult.fixedContent,
    qualityResult,
  }
}

export function checkTitleBodyConsistency(
  title: string,
  content: string,
  mainKeyword: string
): Array<{ type: 'mismatch'; message: string }> {
  const issues: Array<{ type: 'mismatch'; message: string }> = []
  
  // 1. 메인 키워드가 제목에 포함되어 있는지
  if (mainKeyword && !title.toLowerCase().includes(mainKeyword.toLowerCase())) {
    issues.push({
      type: 'mismatch',
      message: `제목에 메인 키워드 "${mainKeyword}"가 포함되지 않음`,
    })
  }
  
  // 2. 제목의 핵심 단어가 본문에 등장하는지
  const titleWords = title
    .replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318Fa-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length >= 2)
  
  const contentLower = content.toLowerCase()
  const missingWords = titleWords.filter(w => !contentLower.includes(w.toLowerCase()))
  
  if (missingWords.length > 0 && missingWords.length >= titleWords.length / 2) {
    issues.push({
      type: 'mismatch',
      message: `제목의 핵심 단어(${missingWords.slice(0, 3).join(', ')})가 본문에 부족함`,
    })
  }
  
  return issues
}

export function logQualityResult(result: QualityCheckResult): void {
  console.log('\n========================================')
  console.log('품질 검사 결과')
  console.log('========================================')
  console.log(`상태: ${result.status === 'pass' ? '✅ 통과' : result.status === 'fixed' ? '🔧 수정됨' : '❌ 실패'}`)
  
  if (result.issues.length > 0) {
    console.log(`\n발견된 문제: ${result.issues.length}개`)
    result.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.type}] ${issue.message}`)
    })
  }
  
  if (result.fixSummary.length > 0) {
    console.log('\n[자동 수정 내역]')
    result.fixSummary.forEach((fix, index) => {
      console.log(`  ${index + 1}. ${fix}`)
    })
  }
  
  console.log('========================================\n')
}
