/**
 * Stage 7: Quality Review
 * 
 * 기존 quality-filter.ts, content-filter.ts를 통합한 최종 품질 검사
 * banned terms, placeholder, 중복 등 검사
 * 최종 통과 시에만 editor에 반영
 */

import { validateAndFixContent, logFilterResult } from '../content-filter'
import { applyQualityFilter, logQualityResult, checkTitleBodyConsistency } from '../quality-filter'
import type { 
  RewrittenDraft, 
  TitleGenerationResult, 
  QualityReviewResult,
  QualityCheckResult 
} from './types'
import type { InformationalPipelineInput, RestaurantPipelineInput } from './types'

/**
 * 품질 검사 수행
 */
export async function reviewQuality(
  rewritten: RewrittenDraft,
  titleResult: TitleGenerationResult,
  input: InformationalPipelineInput | RestaurantPipelineInput,
  qualityConfig: { minPassScore: number; autoFix: boolean; maxRetries: number }
): Promise<QualityReviewResult> {
  console.log('[Stage 7] 품질 검사 시작...')

  const content = rewritten.content
  const title = titleResult.selectedTitle

  // 1. 금지어 검사
  const bannedCheck = validateAndFixContent(content)
  logFilterResult(bannedCheck)

  // 2. 품질 필터 적용
  const qualityCheck = applyQualityFilter(bannedCheck.fixedContent)
  logQualityResult(qualityCheck)

  // 3. 제목-본문 정합성 검사
  const mainKeyword = 'meta' in input 
    ? input.meta.mainKeyword 
    : input.placeProfile.name
  const alignment = checkTitleBodyConsistency(title, content, mainKeyword)

  // 4. 제목 품질 확인
  const titleQuality = titleResult.titleQualityStatus === 'pass' || 
                       titleResult.titleQualityStatus === 'fixed'

  // 결과 조합
  const result: QualityReviewResult = {
    bannedTermsCheck: {
      found: bannedCheck.bannedTermsCount,
      fixed: bannedCheck.bannedTermsFixSummary.length,
      status: bannedCheck.bannedTermsStatus === 'pass' ? 'pass' : 'fail',
      summary: bannedCheck.bannedTermsFixSummary,
    },
    placeholderCheck: {
      found: countIssues(qualityCheck, 'placeholder'),
      status: hasIssues(qualityCheck, 'placeholder') ? 'fail' : 'pass',
    },
    templateCheck: {
      found: countIssues(qualityCheck, 'template'),
      status: hasIssues(qualityCheck, 'template') ? 'fail' : 'pass',
    },
    duplicateCheck: {
      sentences: countIssues(qualityCheck, 'duplicate'),
      sections: 0, // TODO: section duplicate check
      status: hasIssues(qualityCheck, 'duplicate') ? 'fail' : 'pass',
    },
    metaWritingCheck: {
      found: countIssues(qualityCheck, 'memo') + countIssues(qualityCheck, 'meta'),
      status: (hasIssues(qualityCheck, 'memo') || hasIssues(qualityCheck, 'meta')) 
        ? 'fail' : 'pass',
    },
    titleBodyAlignment: {
      aligned: alignment.length === 0 && titleQuality,
      issues: alignment.map(a => a.message),
    },
    finalStatus: 'pass',
    fixedContent: qualityCheck.fixedContent,
    reviewNotes: [],
  }

  // 최종 상태 판정
  const hasCriticalErrors = 
    result.bannedTermsCheck.status === 'fail' && result.bannedTermsCheck.found > 3 ||
    !result.titleBodyAlignment.aligned ||
    !titleResult.titleKeywordIncluded

  if (hasCriticalErrors) {
    result.finalStatus = 'fail'
    result.reviewNotes.push('심각한 품질 문제 발견')
  } else if (
    result.bannedTermsCheck.status === 'fail' ||
    result.placeholderCheck.status === 'fail' ||
    result.metaWritingCheck.found > 0
  ) {
    result.finalStatus = qualityConfig.autoFix ? 'fixed' : 'fail'
    result.reviewNotes.push('일부 품질 문제 자동 수정됨')
  }

  // 상세 로그
  console.log(`[Stage 7] 품질 검사 완료:`)
  console.log(`  - 금지어: ${result.bannedTermsCheck.found}개 발견, ${result.bannedTermsCheck.fixed}개 수정`)
  console.log(`  - placeholder: ${result.placeholderCheck.found}개`)
  console.log(`  - template: ${result.templateCheck.found}개`)
  console.log(`  - 중복: ${result.duplicateCheck.sentences}개`)
  console.log(`  - 메모투: ${result.metaWritingCheck.found}개`)
  console.log(`  - 제목-본문 정합성: ${result.titleBodyAlignment.aligned ? 'OK' : 'NG'}`)
  console.log(`  - 최종 상태: ${result.finalStatus}`)

  return result
}

// ============================================
// Helper Functions
// ============================================

function countIssues(qualityResult: QualityCheckResult, type: string): number {
  return qualityResult.issues.filter(i => i.type === type).length
}

function hasIssues(qualityResult: QualityCheckResult, type: string): boolean {
  return qualityResult.issues.some(i => i.type === type)
}

/**
 * 품질 검사 결과 요약 생성
 */
export function formatQualityReport(result: QualityReviewResult): string {
  const lines = [
    '=== 품질 검사 결과 ===',
    `금지어: ${result.bannedTermsCheck.found}개 (수정: ${result.bannedTermsCheck.fixed}개) [${result.bannedTermsCheck.status}]`,
    `Placeholder: ${result.placeholderCheck.found}개 [${result.placeholderCheck.status}]`,
    `Template: ${result.templateCheck.found}개 [${result.templateCheck.status}]`,
    `중복 문장: ${result.duplicateCheck.sentences}개 [${result.duplicateCheck.status}]`,
    `메모투: ${result.metaWritingCheck.found}개 [${result.metaWritingCheck.status}]`,
    `제목-본문 정합성: [${result.titleBodyAlignment.aligned ? 'pass' : 'fail'}]`,
    '',
    `최종 결과: ${result.finalStatus.toUpperCase()}`,
  ]

  if (result.reviewNotes.length > 0) {
    lines.push('', '참고사항:', ...result.reviewNotes)
  }

  return lines.join('\n')
}

/**
 * 품질 기준 충족 여부 확인
 */
export function meetsQualityStandards(result: QualityReviewResult): boolean {
  return (
    result.finalStatus === 'pass' || result.finalStatus === 'fixed'
  ) && result.titleBodyAlignment.aligned
}
