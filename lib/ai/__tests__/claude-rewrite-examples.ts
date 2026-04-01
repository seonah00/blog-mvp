/**
 * Claude Rewriting 예상 입출력 예시
 * 
 * OpenAI 초안 → Claude 리라이팅의 기대 동작을 정의
 */

export interface RewriteExample {
  name: string
  input: string
  expectedOutput: string
  keyPoints: string[]
}

// 예시 1: 사용자 인용구 + 웹 조사 표현 보존
export const example1_UserQuoteAndWebEvidence: RewriteExample = {
  name: '사용자 인용구 + 웹 조사 표현 보존',
  input: `"파스타 소스가 정말 진했어요"라는 말이 딱 맞을 정도로 맛의 밀도가 잘 느껴졌다.
분위기는 조용해서 데이트하기 좋았어요.
웹 검색에서는 이곳이 소개팅 장소로 자주 언급된다는 이야기가 있다.`,
  expectedOutput: `"파스타 소스가 정말 진했어요"라는 표현이 잘 어울릴 만큼 맛의 밀도가 또렷하게 느껴졌다.
분위기는 조용해서 데이트하기 좋았어요.
웹 검색에서는 이곳이 소개팅 장소로 자주 언급된다는 이야기가 있다.`,
  keyPoints: [
    '✅ 사용자 인용구 "파스타 소스가 정말 진했어요" 원문 유지',
    '✅ 문장 흐름 개선: "말이 딱 맞을 정도로" → "표현이 잘 어울릴 만큼"',
    '✅ 표현 다듬기: "잘 느껴졌다" → "또렷하게 느껴졌다"',
    '✅ 웹 조사 표현 보존: "언급된다는 이야기가 있다" (단정형으로 변경 안 함)',
    '✅ 체험형 표현 유지: "좋았어요"',
  ],
}

// 예시 2: AI 티 나는 표현 제거
export const example2_RemoveAIPatterns: RewriteExample = {
  name: 'AI 티 나는 표현 제거',
  input: `이번에 소개할 곳은 강남에 위치한 트라attoria입니다.
함께 알아보시죠.
지금 바로 예약하세요.`,
  expectedOutput: `주말 오후, 친구와 함께 방문한 강남의 트라attoria입니다.
실제 방문 후기를 공유해 드립니다.`,
  keyPoints: [
    '✅ "이번에 소개할 곳은" → "주말 오후, 친구와 함께 방문한" (구체적 상황)',
    '✅ "함께 알아보시죠" → 제거',
    '✅ "지금 바로 예약하세요" → 제거 (광고성)',
  ],
}

// 예시 3: 웹 조사 표현 단정형 변경 위험 (나쁜 예시)
export const example3_DangerousChange: RewriteExample = {
  name: '[위험] 웹 조사 표현 단정형 변경',
  input: `평일 저녁에는 웨이팅이 30분 정도 있는 것으로 알려져 있습니다.
발렛 파킹이 가능한 것으로 보입니다.`,
  expectedOutput: `평일 저녁에는 웨이팅이 30분 정도 있는 것으로 알려져 있습니다.
발렛 파킹이 가능한 것으로 보입니다.`,
  keyPoints: [
    '❌ 위험: "있는 것으로 알려져 있습니다" → "있습니다" (단정형 변경 금지)',
    '❌ 위험: "가능한 것으로 보입니다" → "가능합니다" (단정형 변경 금지)',
    '✅ 올바른 동작: 원문 그대로 유지',
  ],
}

// 예시 4: 사용자 인용구 왜곡 위험 (나쁜 예시)
export const example4_QuoteDistortion: RewriteExample = {
  name: '[위험] 사용자 인용구 왜곡',
  input: `직원분이 친절하셨어요.
직원분이 매우 친절하셨습니다.`,
  expectedOutput: `직원분이 친절하셨어요.`,
  keyPoints: [
    '❌ 위험: "친절하셨어요" → "매우 친절하셨습니다" (감정 강화)',
    '❌ 위험: 체험형 표현을 정중체로 변경',
    '✅ 올바른 동작: 원문 인용구 그대로 유지',
  ],
}

// 예시 5: 새로운 사실 추가 위험 (나쁜 예시)
export const example5_NewFacts: RewriteExample = {
  name: '[위험] 새로운 사실 추가',
  input: `파스타가 맛있었어요.
가격은 적당했어요.`,
  expectedOutput: `파스타가 맛있었어요.
가격은 적당했어요.`,
  keyPoints: [
    '❌ 위험: "토마토 소스가 유명합니다" (원문 없는 정보 추가)',
    '❌ 위험: "런치 세트는 15,000원입니다" (가격 정보 추가)',
    '❌ 위험: "셰프가 직접 만든" (추측 추가)',
    '✅ 올바른 동작: 원문에 없는 정보 추가 금지',
  ],
}

// 예시 6: 종합 - 좋은 리라이팅
export const example6_GoodRewrite: RewriteExample = {
  name: '종합 - 좋은 리라이팅',
  input: `이번에 소개할 곳은 강남 테헤란로에 위치한 트라attoria입니다. 이탈리안 레스토랑입니다.
"파스타가 정말 맛있었어요"라는 말이 딱 맞습니다. 분위기가 조용해서 좋았습니다.
웹 검색에서는 데이트 장소로 알려져 있습니다.`,
  expectedOutput: `강남 테헤란로에 있는 트라attoria는 이탈리안 레스토랑입니다.
"파스타가 정말 맛있었어요"라는 표현이 잘 어울립니다. 조용한 분위기가 마음에 들었어요.
웹 검색에서는 데이트 장소로 알려져 있습니다.`,
  keyPoints: [
    '✅ "이번에 소개할 곳은" 제거',
    '✅ 사용자 인용구 "파스타가 정말 맛있었어요" 유지',
    '✅ "말이 딱 맞습니다" → "표현이 잘 어울립니다" (자연스러움)',
    '✅ "분위기가 조용해서 좋았습니다" → "조용한 분위기가 마음에 들었어요" (문장 구조 다양화)',
    '✅ "알려져 있습니다" 유지 (단정형으로 변경 안 함)',
  ],
}

// 모든 예시
export const allExamples = [
  example1_UserQuoteAndWebEvidence,
  example2_RemoveAIPatterns,
  example3_DangerousChange,
  example4_QuoteDistortion,
  example5_NewFacts,
  example6_GoodRewrite,
]

// 출력 형식
export function printExamples(): void {
  console.log('='.repeat(80))
  console.log('📝 Claude Rewriting 예상 입출력 예시')
  console.log('='.repeat(80))
  
  allExamples.forEach((ex, i) => {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`예시 ${i + 1}: ${ex.name}`)
    console.log('='.repeat(80))
    
    console.log('\n📥 입력:')
    console.log(ex.input.split('\n').map(l => `  ${l}`).join('\n'))
    
    console.log('\n📤 기대 출력:')
    console.log(ex.expectedOutput.split('\n').map(l => `  ${l}`).join('\n'))
    
    console.log('\n✓ 체크포인트:')
    ex.keyPoints.forEach(point => console.log(`  ${point}`))
  })
  
  console.log('\n' + '='.repeat(80))
}

// 메인 실행
if (require.main === module) {
  printExamples()
}
