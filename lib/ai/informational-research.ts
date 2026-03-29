/**
 * Informational Research AI Functions
 * 
 * 정보성 글쓰기를 위한 AI 보조 기능들
 * @see PROMPT_GUIDE.md - Informational Research
 */

import type { SourceDocument, InformationalOutline, KeyPoint, TopicAnalysis } from '@/types'

export interface SourceProcessingInput {
  sourceId: string
  url: string
  content: string
  metadata?: {
    title?: string
    author?: string
    publishedAt?: string
  }
}

/**
 * 소스 문서 처리
 * 
 * 입력된 소스(글/문서)를 분석하여 핵심 내용 추출
 * @policy: 스크래핑 금지 - 사용자가 직접 제공한 콘텐츠만 사용
 */
export async function processSourceDocument(
  input: SourceProcessingInput
): Promise<SourceDocument> {
  const { sourceId, url, content, metadata } = input
  
  const prompt = `
다음 문서를 분석하여 정보성 글쓰기에 활용할 수 있는 형태로 정리해주세요.

[원문 출처]
URL: ${url}
제목: ${metadata?.title || '제목 없음'}

[원문 내용]
${content.slice(0, 8000)} ${content.length > 8000 ? '... (중략)' : ''}

다음 형식으로 출력:
1. 요약 (3-5문장)
2. 핵심 키포인트 (5-10개)
3. 인용 가능한 구절 (2-3개)
4. 주장/사실 구분 (어떤 부분이 주장이고 어떤 부분이 사실인지)

JSON 형식:
{
  "summary": "string",
  "keyPoints": ["string"],
  "quotable": ["string"],
  "claims": [{"text": "string", "type": "claim|fact"}]
}
`

  // TODO: AI API 호출
  console.log('[AI] Processing source document:', url)
  
  return {
    id: `doc-${Date.now()}`,
    sourceId,
    content: content.slice(0, 10000), // 저장용 원문 (제한됨)
    summary: '문서 요약 내용',
    keyPoints: ['키포인트 1', '키포인트 2', '키포인트 3'],
    quotable: ['인용구 1', '인용구 2'],
    processedAt: new Date().toISOString(),
  }
}

/**
 * 토픽 분석
 * 
 * 주제에 대한 전반적인 분석 및 각도 제안
 */
export async function analyzeTopic(
  mainKeyword: string,
  subKeywords: string[],
  searchIntent?: string
): Promise<TopicAnalysis> {
  const prompt = `
다음 키워드를 중심으로 정보성 글쓰기를 위한 주제 분석을 해주세요.

[주요 키워드]
${mainKeyword}

[보조 키워드]
${subKeywords.join(', ')}

[검색 의도]
${searchIntent || '정보 탐색'}

다음 항목을 분석:
1. 주제 범위 정의
2. 독자 페르소나 (3가지)
3. 경쟁 콘텐츠 분석 (빠진 각도)
4. 차별화 포인트 제안
5. 정보 구조 제안 (섹션 개요)

JSON 형식으로 출력
`

  // TODO: AI API 호출
  console.log('[AI] Analyzing topic:', mainKeyword)
  
  return {
    mainKeyword,
    topicScope: `${mainKeyword}에 대한 종합 가이드`,
    readerPersonas: [
      { type: 'beginner', needs: '기본 개념 이해' },
      { type: 'practitioner', needs: '실전 적용법' },
    ],
    contentGaps: ['경쟁 콘텐츠에서 다루지 않은 각도 1', '각도 2'],
    differentiation: '차별화 포인트',
    suggestedStructure: [
      { section: '도입', focus: '문제 제기' },
      { section: '본론', focus: '핵심 내용' },
      { section: '결론', focus: '요약 및 CTA' },
    ],
    analyzedAt: new Date().toISOString(),
  }
}

/**
 * 키포인트 추출
 * 
 * 여러 소스에서 중요 정보 추출 및 중복 제거
 */
export async function extractKeyPoints(
  sourceDocs: SourceDocument[],
  targetKeyword: string
): Promise<KeyPoint[]> {
  const prompt = `
다음 소스 문서들에서 "${targetKeyword}"와 관련된 핵심 정보를 추출해주세요.

[소스 목록]
${sourceDocs.map(doc => `
출처: ${doc.sourceId}
요약: ${doc.summary}
키포인트: ${doc.keyPoints.join(', ')}
`).join('---\n')}

요구사항:
1. 각 소스의 핵심 내용을 통합
2. 중복 제거 및 유사 내용 병합
3. 사실/의견/예시/통계로 분류
4. 출처 추적 (어느 소스에서 왔는지)

JSON 배열 형식:
[
  {
    "id": "unique-id",
    "content": "핵심 내용",
    "sourceIds": ["source-1"],
    "category": "fact|opinion|example|statistic"
  }
]
`

  // TODO: AI API 호출
  console.log('[AI] Extracting key points from', sourceDocs.length, 'sources')
  
  return sourceDocs.flatMap((doc, i) => 
    doc.keyPoints.slice(0, 3).map((point, j) => ({
      id: `kp-${i}-${j}`,
      content: point,
      sourceIds: [doc.sourceId],
      category: 'fact' as const,
      extractedAt: new Date().toISOString(),
    }))
  )
}

/**
 * 아웃라인 생성
 * 
 * 분석된 정보를 바탕으로 글 구조 제안
 */
export async function generateOutline(
  topicAnalysis: TopicAnalysis,
  keyPoints: KeyPoint[],
  wordCountTarget: number
): Promise<InformationalOutline> {
  const sections = Math.ceil(wordCountTarget / 500)
  
  const prompt = `
다음 정보를 바탕으로 정보성 글의 아웃라인을 생성해주세요.

[주제 분석]
${topicAnalysis.topicScope}

[독자 페르소나]
${topicAnalysis.readerPersonas.map(p => `- ${p.type}: ${p.needs}`).join('\n')}

[핵심 포인트 목록]
${keyPoints.map(kp => `- [${kp.category}] ${kp.content}`).join('\n')}

[목표 분량]
약 ${wordCountTarget}자 (${sections}개 섹션으로 구성)

아웃라인 형식:
1. 제목 (SEO 최적화)
2. 타겟 독자
3. 섹션별 구성 (각 섹션: 헤딩, 핵심 포인트, 참조 소스, 예상 분량)
4. 추천 FAQ

JSON 형식으로 출력
`

  // TODO: AI API 호출
  console.log('[AI] Generating outline for:', topicAnalysis.mainKeyword)
  
  return {
    title: `${topicAnalysis.mainKeyword} 완벽 가이드`,
    targetAudience: topicAnalysis.readerPersonas.map(p => p.type).join(', '),
    sections: Array.from({ length: sections }, (_, i) => ({
      id: `sec-${i}`,
      heading: `섹션 ${i + 1}`,
      keyPoints: keyPoints.slice(i * 2, (i + 1) * 2).map(kp => kp.content),
      sourceIds: [],
      estimatedWords: 500,
    })),
    suggestedFaqs: [
      { question: '자주 묻는 질문 1', answer: '답변 1' },
      { question: '자주 묻는 질문 2', answer: '답변 2' },
    ],
    generatedAt: new Date().toISOString(),
  }
}

/**
 * 소스 검증
 * 
 * 정보의 신뢰성 및 출처 적절성 검토
 */
export async function verifySource(
  sourceDoc: SourceDocument
): Promise<{
  credibility: 'high' | 'medium' | 'low'
  issues: string[]
  suggestions: string[]
}> {
  // TODO: AI API 호출
  console.log('[AI] Verifying source:', sourceDoc.sourceId)
  
  return {
    credibility: 'medium',
    issues: [],
    suggestions: ['추가 검증 권장'],
  }
}
