/**
 * OpenAI vs Claude Draft 비교 테스트 스크립트
 * 
 * 실행: npx ts-node scripts/test-draft-comparison.ts
 * 
 * 목적:
 * 1. 샘플별 draft 입력 검증
 * 2. _debug 구조 출력 테스트
 * 3. 샘플 데이터 품질 확인
 */

import { allSamples } from '../lib/ai/__tests__/draft-samples'
import type { GenerateRestaurantDraftInput } from '../lib/ai/restaurant-draft'

console.log('='.repeat(80))
console.log('📝 Restaurant Draft 비교 테스트 - 샘플 데이터 검증')
console.log('='.repeat(80))
console.log('')

allSamples.forEach(({ name, sample }, index) => {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`📦 샘플 ${index + 1}: ${name}`)
  console.log('='.repeat(80))
  
  // 샘플 구조 분석
  console.log('\n📊 입력 데이터 분석:')
  console.log(`  - 채널: ${sample.settings.channel}`)
  console.log(`  - 톤: ${sample.settings.tone}`)
  console.log(`  - 포커스: ${sample.settings.focusPoints.join(', ')}`)
  console.log(`  - 인용구 수: ${sample.reviewDigest.quotes.length}`)
  console.log(`  - WebEvidence: ${sample.webEvidence?.length || 0}개`)
  console.log(`  - 프로젝트 제목: ${sample.projectTitle}`)
  
  // 주요 체크포인트
  console.log('\n🔍 QA 체크포인트:')
  
  // 1. 사용자 인용구 체크
  const quotes = sample.reviewDigest.quotes
  if (quotes.length === 0) {
    console.log('  ⚠️  인용구 없음 (당근마켓/threads에서 정상일 수 있음)')
  } else {
    console.log(`  ✅ 인용구 ${quotes.length}개 있음`)
    quotes.forEach((q, i) => {
      console.log(`     ${i + 1}. "${q.slice(0, 40)}${q.length > 40 ? '...' : ''}"`)
    })
  }
  
  // 2. webEvidence 체크
  if (sample.webEvidence && sample.webEvidence.length > 0) {
    console.log(`  ✅ WebEvidence ${sample.webEvidence.length}개:`)
    sample.webEvidence.forEach((e, i) => {
      console.log(`     - "${e.query}" (${e.confidence})`)
      // 완곡 표현 체크
      const expressions = ['로 알려져 있다', '라는 언급이 있다', '는 것으로 보인다']
      const found = expressions.filter(expr => e.summary.includes(expr))
      if (found.length > 0) {
        console.log(`       └─ 완곡 표현: ${found.join(', ')}`)
      }
    })
  } else {
    console.log('  ℹ️  WebEvidence 없음')
  }
  
  // 3. 채널별 특성
  console.log('\n📱 채널 특성:')
  switch (sample.settings.channel) {
    case 'blog':
      console.log('  - 예상 길이: 800-2000자')
      console.log('  - 구조: 도입-본론-결론')
      break
    case 'threads':
      console.log('  - 예상 길이: 400-800자')
      console.log('  - 구조: 짧은 임팩트')
      break
    case 'daangn':
      console.log('  - 예상 길이: 200-500자')
      console.log('  - 구조: 간결 정보 중심')
      break
  }
  
  // 4. 톤별 특성
  console.log('\n🎭 톤 특성:')
  switch (sample.settings.tone) {
    case 'friendly':
      console.log('  - 체험형 표현: "~였어요", "~더라고요"')
      console.log('  - 주의: Claude가 "~입니다"로 바꾸지 않아야 함')
      break
    case 'informative':
      console.log('  - 객관적 표현: "~입니다", "~합니다"')
      console.log('  - 주의: 정보 정확성 유지')
      break
    case 'recommendation':
      console.log('  - 추천 표현: "~추천해요", "~드려요"')
      break
  }
  
  // 5. 예상 위험 포인트
  console.log('\n⚠️  예상 위험 포인트:')
  if (sample.webEvidence && sample.webEvidence.length > 0) {
    console.log('  - WebEvidence 표현이 단정형으로 변경될 위험')
    console.log('    (예: "~로 알려져 있다" → "~이다")')
  }
  if (quotes.length > 0) {
    console.log('  - 사용자 인용구가 왜곡되거나 삭제될 위험')
  }
  if (sample.settings.channel === 'threads') {
    console.log('  - 짧은 글에서 문맥이 어색해질 위험')
  }
  if (sample.settings.tone === 'friendly') {
    console.log('  - 친근한 표현이 정중체로 변경될 위험')
  }
})

console.log('\n' + '='.repeat(80))
console.log('✅ 샘플 데이터 검증 완료')
console.log('='.repeat(80))
console.log('\n📋 테스트 실행 방법:')
console.log('  1. 개발 서버 실행: npm run dev')
console.log('  2. 브라우저에서 프로젝트 생성 → draft 생성')
console.log('  3. 콘솔에서 [📝 Restaurant Draft Debug] 로그 확인')
console.log('\n📋 자동 QA 체크 항목:')
console.log('  - 사용자 인용구 보존 여부')
console.log('  - WebEvidence 표현 보존 여부')
console.log('  - 새로운 사실 추가 여부')
console.log('  - 어조 일관성')
console.log('  - 길이 변화')
