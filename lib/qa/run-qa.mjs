/**
 * Threads Settings QA Test Suite
 * 
 * 2축 구조(주제 × 전략)에 대한 자동화된 QA 검증
 */

// ============================================
// 1. 자동 추천 전략 로직
// ============================================

const RECOMMENDED_STRATEGY = {
  food: 'story',
  info: 'tip',
  branding: 'story',
}

function getRecommendedStrategy(purpose) {
  return RECOMMENDED_STRATEGY[purpose]
}

// ============================================
// 2. 미리보기 텍스트 생성
// ============================================

function getPreviewText(purpose, strategy, threadCount) {
  const purposeText = {
    food: '맛집/음식',
    info: '정보/팁',
    branding: '브랜딩',
  }
  const strategyText = {
    story: '스토리텔링',
    tip: '실용정보',
    engage: '공감소통',
  }
  return `${purposeText[purpose]} × ${strategyText[strategy]} 조합으로 ${threadCount}개의 스레드가 생성됩니다.`
}

// ============================================
// 3. 레거시 데이터 호환성
// ============================================

function normalizeStrategyType(strategyType, purpose) {
  if (strategyType) return strategyType
  return RECOMMENDED_STRATEGY[purpose]
}

// ============================================
// 4. 9개 조합별 유효성 검증
// ============================================

const VALID_COMBOS = [
  'food-story', 'food-tip', 'food-engage',
  'info-story', 'info-tip', 'info-engage',
  'branding-story', 'branding-tip', 'branding-engage',
]

function isValidCombo(purpose, strategy) {
  return VALID_COMBOS.includes(`${purpose}-${strategy}`)
}

function getExpectedToneForCombo(purpose, strategy) {
  const comboMap = {
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
  return comboMap[`${purpose}-${strategy}`]
}

// ============================================
// 테스트 실행
// ============================================

function runTests() {
  const results = []
  
  // 1. 자동 추천 전략 로직 테스트
  const strategyTests = [
    { purpose: 'food', expected: 'story' },
    { purpose: 'info', expected: 'tip' },
    { purpose: 'branding', expected: 'story' },
  ]
  
  const strategyErrors = []
  strategyTests.forEach(({ purpose, expected }) => {
    const actual = getRecommendedStrategy(purpose)
    if (actual !== expected) {
      strategyErrors.push(`${purpose}: 기대=${expected}, 실제=${actual}`)
    }
  })
  
  results.push({
    category: '자동 추천 전략 로직',
    passed: strategyErrors.length === 0,
    message: strategyErrors.length === 0 
      ? '모든 추천 전략이 올바르게 매핑됨' 
      : `${strategyErrors.length}개 불일치`,
    details: strategyErrors,
  })
  
  // 2. 미리보기 텍스트 테스트
  const previewTests = [
    { purpose: 'food', strategy: 'story', count: 5 },
    { purpose: 'info', strategy: 'tip', count: 7 },
    { purpose: 'branding', strategy: 'engage', count: 3 },
  ]
  
  const previewErrors = []
  previewTests.forEach(({ purpose, strategy, count }) => {
    const text = getPreviewText(purpose, strategy, count)
    if (!text.includes(`${count}개의 스레드`)) {
      previewErrors.push(`threadCount 누락: ${text}`)
    }
  })
  
  results.push({
    category: '미리보기 텍스트 생성',
    passed: previewErrors.length === 0,
    message: previewErrors.length === 0 
      ? '미리보기 텍스트가 올바르게 생성됨' 
      : `${previewErrors.length}개 문제 발견`,
    details: previewErrors,
  })
  
  // 3. 레거시 호환성 테스트
  const legacyTests = [
    { strategyType: undefined, purpose: 'food', expected: 'story' },
    { strategyType: undefined, purpose: 'info', expected: 'tip' },
    { strategyType: undefined, purpose: 'branding', expected: 'story' },
    { strategyType: 'engage', purpose: 'food', expected: 'engage' },
  ]
  
  const legacyErrors = []
  legacyTests.forEach(({ strategyType, purpose, expected }) => {
    const actual = normalizeStrategyType(strategyType, purpose)
    if (actual !== expected) {
      legacyErrors.push(`strategyType=${strategyType}, purpose=${purpose}: 기대=${expected}, 실제=${actual}`)
    }
  })
  
  results.push({
    category: '레거시 데이터 호환성',
    passed: legacyErrors.length === 0,
    message: legacyErrors.length === 0 
      ? '레거시 데이터가 올바르게 처리됨' 
      : `${legacyErrors.length}개 문제 발견`,
    details: legacyErrors,
  })
  
  // 4. 9개 조합 유효성 테스트
  const purposes = ['food', 'info', 'branding']
  const strategies = ['story', 'tip', 'engage']
  
  const comboErrors = []
  const validCombos = []
  
  purposes.forEach(purpose => {
    strategies.forEach(strategy => {
      if (isValidCombo(purpose, strategy)) {
        validCombos.push(`${purpose}-${strategy}`)
        const tone = getExpectedToneForCombo(purpose, strategy)
        if (!tone) {
          comboErrors.push(`${purpose}-${strategy}: 기대 톤 설명 누락`)
        }
      } else {
        comboErrors.push(`${purpose}-${strategy}: 유효하지 않은 조합`)
      }
    })
  })
  
  results.push({
    category: '9개 조합 유효성',
    passed: comboErrors.length === 0 && validCombos.length === 9,
    message: comboErrors.length === 0 
      ? `모든 9개 조합이 유효함 (${validCombos.length}개)` 
      : `${comboErrors.length}개 문제 발견`,
    details: comboErrors,
  })
  
  // 5. 9개 조합별 기대 톤 출력
  console.log('\n=== 9개 주제/전략 조합별 기대 톤 ===\n')
  purposes.forEach(purpose => {
    strategies.forEach(strategy => {
      const tone = getExpectedToneForCombo(purpose, strategy)
      console.log(`${purpose} + ${strategy}: ${tone}`)
    })
  })
  
  return results
}

// ============================================
// 메인 실행
// ============================================

const results = runTests()

console.log('\n=== Threads Settings QA 자동화 결과 ===\n')

let passed = 0
let failed = 0

results.forEach(result => {
  const icon = result.passed ? '✅ PASS' : '❌ FAIL'
  console.log(`${icon} [${result.category}] ${result.message}`)
  if (result.details && result.details.length > 0) {
    result.details.forEach(detail => console.log(`   - ${detail}`))
  }
  
  if (result.passed) passed++
  else failed++
})

console.log(`\n총 ${results.length}개 항목: ${passed}개 Pass, ${failed}개 Fail`)

process.exit(failed > 0 ? 1 : 0)
