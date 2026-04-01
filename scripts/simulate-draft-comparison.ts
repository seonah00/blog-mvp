/**
 * OpenAI vs Claude Draft 비교 시뮬레이션
 * 
 * 실제 API 호출 없이 비교 출력 구조를 시뮬레이션
 * 실행: npx ts-node scripts/simulate-draft-comparison.ts
 */

// 샘플 타입 정의
interface SampleInput {
  name: string
  channel: 'blog' | 'threads' | 'daangn'
  tone: 'friendly' | 'informative' | 'recommendation'
  focusPoints: string[]
  quotes: string[]
  webEvidenceCount: number
}

// 테스트 샘플 정의
const samples: SampleInput[] = [
  {
    name: 'Standard (friendly, blog)',
    channel: 'blog',
    tone: 'friendly',
    focusPoints: ['menu', 'atmosphere'],
    quotes: [
      '파스타 소스가 정말 진했어요. 토마토 향이 진하게 났어요.',
      '분위기는 조용해서 데이트하기 좋았어요.',
      '직원분이 추천해주신 와인도 잘 맞았어요.',
    ],
    webEvidenceCount: 0,
  },
  {
    name: 'With WebEvidence',
    channel: 'blog',
    tone: 'friendly',
    focusPoints: ['menu', 'atmosphere', 'waiting', 'parking'],
    quotes: ['파스타 소스가 정말 진했어요.'],
    webEvidenceCount: 2,
  },
  {
    name: 'Threads 채널',
    channel: 'threads',
    tone: 'friendly',
    focusPoints: ['menu', 'atmosphere'],
    quotes: ['파스타 소스가 진짜 최고였어요!'],
    webEvidenceCount: 0,
  },
  {
    name: 'Informative 톤',
    channel: 'blog',
    tone: 'informative',
    focusPoints: ['menu', 'price', 'location'],
    quotes: ['런치 세트 가성비가 좋습니다.', '와인 추천이 전문적이었어요.'],
    webEvidenceCount: 0,
  },
  {
    name: '당근마켓 채널',
    channel: 'daangn',
    tone: 'friendly',
    focusPoints: ['menu', 'price'],
    quotes: [],
    webEvidenceCount: 0,
  },
]

// 가상의 OpenAI 초안
function simulateOpenAIContent(sample: SampleInput): string {
  const baseContents: Record<string, string> = {
    blog: `# 강남 데이트 맛집 트라attoria 방문 후기

이번에 소개할 곳은 강남 테헤란로에 위치한 트라attoria입니다. 이탈리안 레스토랑으로 파스타가 정말 맛있었어요.

## 대표 메뉴

${sample.quotes[0] || '파스타 소스가 진하고 맛있었어요.'}

## 분위기

${sample.quotes[1] || '분위기는 조용해서 데이트하기 좋았어요.'}

${sample.webEvidenceCount > 0 ? '## 웨이팅 정보\n\n평일 저녁에는 웨이팅이 30분 정도 있는 것으로 알려져 있습니다.' : ''}

---
**기본 정보**
📍 서울특별시 강남구 테헤란로 123 | 📞 02-1234-5678

#맛집 #이탈리안레스토랑`,

    threads: `🍝 강남 파스타 맛집 발견!

${sample.quotes[0] || '파스타가 정말 맛있었어요!'}

📍 강남 테헤란로

#맛집 #파스타 #강남`,

    daangn: `[강남역] 파스타 맛집 추천

${sample.quotes[0] || '점심 메뉴 괜찮았어요.'}

📍 강남역 5분 거리
💰 런치 15,000원~`,
  }
  
  return baseContents[sample.channel]
}

// 가상의 Claude 결과
function simulateClaudeContent(sample: SampleInput, openaiContent: string): string {
  // 기본 개선
  let content = openaiContent
    .replace('이번에 소개할 곳은', '주말 저녁 방문한')
    .replace('입니다. 이탈리안 레스토랑으로', '입니다.')
    .replace('만족스러웠습니다.', '좋았어요.')
  
  // webEvidence 있는 샘플에서는 의도적으로 문제 만들기
  if (sample.webEvidenceCount > 0) {
    content = content
      .replace('있는 것으로 알려져 있습니다', '있습니다')  // 위험!
      .replace('있는 것으로 알려져 있다', '있다')  // 위험!
  }
  
  return content
}

// QA 체크
function performQACheck(sample: SampleInput, openaiContent: string, claudeContent: string) {
  // 인용구 보존 체크
  let quotesPreserved = 0
  sample.quotes.forEach(quote => {
    if (claudeContent.includes(quote.replace(/[.!]/g, ''))) {
      quotesPreserved++
    }
  })
  
  // webEvidence 표현 체크
  const webExprs = ['로 알려져 있다', '라는 언급이 있다', '는 것으로 보인다', '있는 것으로 알려져 있습니다']
  const openaiWebCount = webExprs.filter(e => openaiContent.includes(e)).length
  const claudeWebCount = webExprs.filter(e => claudeContent.includes(e)).length
  
  // 어조 체크
  const formalCount = (claudeContent.match(/습니다/g) || []).length
  const casualCount = (claudeContent.match(/었어요|했어요|더라고요/g) || []).length
  const toneIssue = sample.tone === 'friendly' && formalCount > casualCount * 2
  
  return {
    quotesPreserved,
    quotesTotal: sample.quotes.length,
    webExprPreserved: claudeWebCount >= openaiWebCount,
    webExprOpenAI: openaiWebCount,
    webExprClaude: claudeWebCount,
    lengthDelta: claudeContent.length - openaiContent.length,
    toneIssue,
    formalCount,
    casualCount,
  }
}

// 메인 실행
console.log('='.repeat(100))
console.log('🧪 OpenAI vs Claude Draft 비교 시뮬레이션')
console.log('='.repeat(100))

samples.forEach((sample, index) => {
  console.log(`\n${'='.repeat(100)}`)
  console.log(`📦 샘플 ${index + 1}: ${sample.name}`)
  console.log('='.repeat(100))
  
  // 설정 출력
  console.log('\n📊 입력 설정:')
  console.log(`  - 채널: ${sample.channel}`)
  console.log(`  - 톤: ${sample.tone}`)
  console.log(`  - 포커스: ${sample.focusPoints.join(', ')}`)
  console.log(`  - 인용구: ${sample.quotes.length}개`)
  console.log(`  - WebEvidence: ${sample.webEvidenceCount}개`)
  
  // OpenAI 초안
  const openaiContent = simulateOpenAIContent(sample)
  
  // Claude 결과
  const claudeContent = simulateClaudeContent(sample, openaiContent)
  
  // QA 체크
  const qa = performQACheck(sample, openaiContent, claudeContent)
  
  // 결과 출력
  console.log('\n📊 비교 결과:')
  console.log(`  전략: openai-then-claude`)
  console.log(`  길이: ${openaiContent.length} → ${claudeContent.length} (${qa.lengthDelta > 0 ? '+' : ''}${qa.lengthDelta}자)`)
  
  console.log('\n🔍 QA 자동 점검:')
  
  // 인용구
  if (sample.quotes.length > 0) {
    const status = qa.quotesPreserved >= sample.quotes.length * 0.5 ? '✅' : '⚠️ '
    console.log(`  ${status} 인용구 보존: ${qa.quotesPreserved}/${sample.quotes.length}개`)
    if (qa.quotesPreserved < sample.quotes.length) {
      console.log('     ⚠️ 일부 인용구가 누락되었습니다')
    }
  } else {
    console.log('  ℹ️  인용구 없음')
  }
  
  // webEvidence
  if (sample.webEvidenceCount > 0) {
    const status = qa.webExprPreserved ? '✅' : '❌'
    console.log(`  ${status} WebEvidence 표현: ${qa.webExprClaude}/${qa.webExprOpenAI}개 보존`)
    if (!qa.webExprPreserved) {
      console.log('     ❌ "~로 알려져 있다" → "~이다"로 변경됨!')
    }
  }
  
  // 어조
  if (sample.tone === 'friendly') {
    const status = qa.toneIssue ? '⚠️ ' : '✅'
    console.log(`  ${status} 어조 일관성: ${qa.formalCount}개 정중체, ${qa.casualCount}개 친근체`)
    if (qa.toneIssue) {
      console.log('     ⚠️ friendly 톤인데 정중체가 많습니다')
    }
  }
  
  // 내용 미리보기
  console.log('\n📝 내용 미리보기:')
  console.log('  🤖 OpenAI:')
  console.log(openaiContent.split('\n').slice(0, 5).map(l => `    ${l}`).join('\n'))
  console.log('    ...')
  console.log('\n  🎭 Claude:')
  console.log(claudeContent.split('\n').slice(0, 5).map(l => `    ${l}`).join('\n'))
  console.log('    ...')
  
  // 종합 평가
  console.log('\n📋 종합 평가:')
  const issues: string[] = []
  if (sample.quotes.length > 0 && qa.quotesPreserved < sample.quotes.length * 0.5) {
    issues.push('인용구 누락')
  }
  if (sample.webEvidenceCount > 0 && !qa.webExprPreserved) {
    issues.push('WebEvidence 표현 변경')
  }
  if (qa.toneIssue) {
    issues.push('어조 불일치')
  }
  
  if (issues.length === 0) {
    console.log('  ✅ QA 통과 - openai_then_claude 권장')
  } else {
    console.log(`  ⚠️  문제: ${issues.join(', ')}`)
    if (issues.includes('WebEvidence 표현 변경')) {
      console.log('  💡 권장: Claude 프롬프트 보강 필요')
    }
  }
})

console.log('\n' + '='.repeat(100))
console.log('✅ 시뮬레이션 완료')
console.log('='.repeat(100))

console.log('\n📊 샘플별 요약:')
console.log('  1. Standard: 인용구 3개, webEvidence 없음 → ✅ 권장')
console.log('  2. WebEvidence: webEvidence 2개 → ❌ 주의 (표현 변경됨)')
console.log('  3. Threads: 짧은 글 → ✅ 권장')
console.log('  4. Informative: 객관적 톤 → ✅ 권장')
console.log('  5. 당근마켓: 매우 짧음 → ✅ 권장')

console.log('\n💡 최종 권장:')
console.log('  기본값: RESTAURANT_DRAFT_PROVIDER=openai_then_claude')
console.log('  WebEvidence 많을 때: 주의 필요, 모니터링 후 조정')
console.log('  문제 발생 시: RESTAURANT_DRAFT_PROVIDER=openai 로 전환 가능')
