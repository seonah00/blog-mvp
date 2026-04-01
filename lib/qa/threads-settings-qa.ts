/**
 * Threads Settings QA Test Suite
 * 
 * 2축 구조(주제 × 전략)에 대한 자동화된 QA 검증
 * - 자동 추천 전략 로직
 * - 미리보기 텍스트 생성
 * - 9개 조합별 fallback 템플릿 존재 여부
 * - 레거시 데이터 호환성
 */

import type { ThreadsProjectMeta, ThreadsDraftSettings, ThreadsStrategyType } from '@/types'

// ============================================
// 1. 자동 추천 전략 로직 테스트
// ============================================

export const RECOMMENDED_STRATEGY: Record<'food' | 'info' | 'branding', ThreadsStrategyType> = {
  food: 'story',
  info: 'tip',
  branding: 'story',
}

export function getRecommendedStrategy(purpose: 'food' | 'info' | 'branding'): ThreadsStrategyType {
  return RECOMMENDED_STRATEGY[purpose]
}

// ============================================
// 2. 미리보기 텍스트 생성
// ============================================

export function getPreviewText(
  purpose: 'food' | 'info' | 'branding',
  strategy: ThreadsStrategyType,
  threadCount: number
): string {
  const purposeText: Record<string, string> = {
    food: '맛집/음식',
    info: '정보/팁',
    branding: '브랜딩',
  }
  const strategyText: Record<string, string> = {
    story: '스토리텔링',
    tip: '실용정보',
    engage: '공감소통',
  }
  return `${purposeText[purpose]} × ${strategyText[strategy]} 조합으로 ${threadCount}개의 스레드가 생성됩니다.`
}

// ============================================
// 3. 레거시 데이터 호환성 (strategyType 없는 경우)
// ============================================

export function normalizeStrategyType(
  strategyType: ThreadsStrategyType | undefined,
  purpose: 'food' | 'info' | 'branding'
): ThreadsStrategyType {
  if (strategyType) return strategyType
  return RECOMMENDED_STRATEGY[purpose]
}

// ============================================
// 4. 9개 조합별 유효성 검증
// ============================================

export type StrategyPurposeCombo = 
  | 'food-story' | 'food-tip' | 'food-engage'
  | 'info-story' | 'info-tip' | 'info-engage'
  | 'branding-story' | 'branding-tip' | 'branding-engage'

export const VALID_COMBOS: StrategyPurposeCombo[] = [
  'food-story', 'food-tip', 'food-engage',
  'info-story', 'info-tip', 'info-engage',
  'branding-story', 'branding-tip', 'branding-engage',
]

export function isValidCombo(purpose: string, strategy: string): boolean {
  const combo = `${purpose}-${strategy}` as StrategyPurposeCombo
  return VALID_COMBOS.includes(combo)
}

export function getExpectedToneForCombo(
  purpose: 'food' | 'info' | 'branding',
  strategy: ThreadsStrategyType
): string {
  const comboMap: Record<StrategyPurposeCombo, string> = {
    'food-story': '후기/경험/감정선 중심',
    'food-tip': '메뉴/주문/방문 팁 중심',
    'food-engage': '질문/공감/반응 유도형',
    'info-story': '정보 + 경험 맥락형',
    'info-tip': '실용 팁/체크리스트형',
    'info-engage': '문제 제기 + 의견 유도형',
    'branding-story': '브랜드/철학/서사형',
    'branding-tip': '브랜드 인사이트/배운 점 정리형',
    'branding-engage': '가치관/고민 공유 + 반응 유도형',
  }
  return comboMap[`${purpose}-${strategy}` as StrategyPurposeCombo]
}

// ============================================
// 5. 설정 저장/복원 검증
// ============================================

export interface SettingsSnapshot {
  purpose: 'food' | 'info' | 'branding'
  strategyType: ThreadsStrategyType
  tone: 'casual' | 'friendly' | 'professional'
  threadCount: number
  includeImages: boolean
  ctaType: 'question' | 'link' | 'follow' | 'none'
}

export function createSettingsSnapshot(
  meta: Partial<ThreadsProjectMeta>,
  settings: Partial<ThreadsDraftSettings>
): SettingsSnapshot {
  return {
    purpose: meta?.purpose || 'info',
    strategyType: meta?.strategyType || 'tip',
    tone: meta?.tone || 'casual',
    threadCount: settings?.threadCount || 5,
    includeImages: settings?.includeImages ?? true,
    ctaType: settings?.ctaType || 'none',
  }
}

export function validateSettingsRecovery(
  saved: SettingsSnapshot | null,
  expected: SettingsSnapshot
): { passed: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!saved) {
    errors.push('저장된 설정이 없습니다')
    return { passed: false, errors }
  }
  
  if (saved.purpose !== expected.purpose) {
    errors.push(`purpose 불일치: 저장=${saved.purpose}, 기대=${expected.purpose}`)
  }
  if (saved.strategyType !== expected.strategyType) {
    errors.push(`strategyType 불일치: 저장=${saved.strategyType}, 기대=${expected.strategyType}`)
  }
  if (saved.tone !== expected.tone) {
    errors.push(`tone 불일치: 저장=${saved.tone}, 기대=${expected.tone}`)
  }
  if (saved.threadCount !== expected.threadCount) {
    errors.push(`threadCount 불일치: 저장=${saved.threadCount}, 기대=${expected.threadCount}`)
  }
  
  return { passed: errors.length === 0, errors }
}

// ============================================
// 6. UI 상태 검증 헬퍼
// ============================================

export function validateUIState(
  selectedPurpose: 'food' | 'info' | 'branding',
  selectedStrategy: ThreadsStrategyType,
  options: {
    purposeOptions: { value: string; label: string }[]
    strategyOptions: { value: string; label: string }[]
  }
): { passed: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 주제 옵션 유효성
  const validPurposes = options.purposeOptions.map(o => o.value)
  if (!validPurposes.includes(selectedPurpose)) {
    errors.push(`유효하지 않은 purpose: ${selectedPurpose}`)
  }
  
  // 전략 옵션 유효성
  const validStrategies = options.strategyOptions.map(o => o.value)
  if (!validStrategies.includes(selectedStrategy)) {
    errors.push(`유효하지 않은 strategy: ${selectedStrategy}`)
  }
  
  return { passed: errors.length === 0, errors }
}

// ============================================
// 테스트 실행 함수
// ============================================

export interface QAResult {
  category: string
  passed: boolean
  message: string
  details?: string[]
}

export function runThreadsSettingsQA(): QAResult[] {
  const results: QAResult[] = []
  
  // 1. 자동 추천 전략 로직 테스트
  results.push(testRecommendedStrategy())
  
  // 2. 미리보기 텍스트 테스트
  results.push(testPreviewText())
  
  // 3. 레거시 호환성 테스트
  results.push(testLegacyCompatibility())
  
  // 4. 9개 조합 유효성 테스트
  results.push(testAllCombinations())
  
  // 5. 설정 저장/복원 테스트
  results.push(testSettingsRecovery())
  
  return results
}

function testRecommendedStrategy(): QAResult {
  const tests = [
    { purpose: 'food' as const, expected: 'story' },
    { purpose: 'info' as const, expected: 'tip' },
    { purpose: 'branding' as const, expected: 'story' },
  ]
  
  const errors: string[] = []
  tests.forEach(({ purpose, expected }) => {
    const actual = getRecommendedStrategy(purpose)
    if (actual !== expected) {
      errors.push(`${purpose}: 기대=${expected}, 실제=${actual}`)
    }
  })
  
  return {
    category: '자동 추천 전략 로직',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? '모든 추천 전략이 올바르게 매핑됨' 
      : `${errors.length}개 불일치`,
    details: errors,
  }
}

function testPreviewText(): QAResult {
  const tests = [
    { purpose: 'food' as const, strategy: 'story' as const, count: 5 },
    { purpose: 'info' as const, strategy: 'tip' as const, count: 7 },
    { purpose: 'branding' as const, strategy: 'engage' as const, count: 3 },
  ]
  
  const errors: string[] = []
  tests.forEach(({ purpose, strategy, count }) => {
    const text = getPreviewText(purpose, strategy, count)
    if (!text.includes(`${count}개의 스레드`)) {
      errors.push(`threadCount 누락: ${text}`)
    }
  })
  
  return {
    category: '미리보기 텍스트 생성',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? '미리보기 텍스트가 올바르게 생성됨' 
      : `${errors.length}개 문제 발견`,
    details: errors,
  }
}

function testLegacyCompatibility(): QAResult {
  const tests = [
    { strategyType: undefined, purpose: 'food' as const, expected: 'story' },
    { strategyType: undefined, purpose: 'info' as const, expected: 'tip' },
    { strategyType: undefined, purpose: 'branding' as const, expected: 'story' },
    { strategyType: 'engage' as const, purpose: 'food' as const, expected: 'engage' },
  ]
  
  const errors: string[] = []
  tests.forEach(({ strategyType, purpose, expected }) => {
    const actual = normalizeStrategyType(strategyType, purpose)
    if (actual !== expected) {
      errors.push(`strategyType=${strategyType}, purpose=${purpose}: 기대=${expected}, 실제=${actual}`)
    }
  })
  
  return {
    category: '레거시 데이터 호환성',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? '레거시 데이터가 올바르게 처리됨' 
      : `${errors.length}개 문제 발견`,
    details: errors,
  }
}

function testAllCombinations(): QAResult {
  const purposes: ('food' | 'info' | 'branding')[] = ['food', 'info', 'branding']
  const strategies: ThreadsStrategyType[] = ['story', 'tip', 'engage']
  
  const errors: string[] = []
  const validCombos: string[] = []
  
  purposes.forEach(purpose => {
    strategies.forEach(strategy => {
      if (isValidCombo(purpose, strategy)) {
        validCombos.push(`${purpose}-${strategy}`)
        const tone = getExpectedToneForCombo(purpose, strategy)
        if (!tone) {
          errors.push(`${purpose}-${strategy}: 기대 톤 설명 누락`)
        }
      } else {
        errors.push(`${purpose}-${strategy}: 유효하지 않은 조합`)
      }
    })
  })
  
  return {
    category: '9개 조합 유효성',
    passed: errors.length === 0 && validCombos.length === 9,
    message: errors.length === 0 
      ? `모든 9개 조합이 유효함 (${validCombos.length}개)` 
      : `${errors.length}개 문제 발견`,
    details: errors,
  }
}

function testSettingsRecovery(): QAResult {
  const snapshot = createSettingsSnapshot(
    { purpose: 'food', strategyType: 'story', tone: 'friendly' },
    { threadCount: 7, includeImages: false, ctaType: 'question' }
  )
  
  const validation = validateSettingsRecovery(snapshot, {
    purpose: 'food',
    strategyType: 'story',
    tone: 'friendly',
    threadCount: 7,
    includeImages: false,
    ctaType: 'question',
  })
  
  return {
    category: '설정 저장/복원',
    passed: validation.passed,
    message: validation.passed 
      ? '설정이 올바르게 저장/복원됨' 
      : '설정 불일치',
    details: validation.errors,
  }
}
