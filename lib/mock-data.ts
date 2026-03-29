import type { DraftSettings, Project, ResearchItem } from '@/types'
import { createId } from '@/lib/utils'

export function createMockResearchItems(project: Project): ResearchItem[] {
  const topic = project.topic || project.title
  const keywordText =
    project.keywords.length > 0 ? project.keywords.join(', ') : '핵심 키워드'

  return [
    {
      id: createId('research'),
      projectId: project.id,
      title: `${topic} 시장 동향 요약`,
      sourceUrl: 'https://example.com/market-trends',
      domain: 'example.com',
      summary: `${topic}와 관련된 최근 흐름, 사용자 관심사, 콘텐츠 포인트를 정리한 자료입니다.`,
      excerpt: `${keywordText}를 중심으로 사용자가 실제로 궁금해하는 문제와 검색 의도를 파악할 수 있습니다.`,
      relevanceScore: 95,
    },
    {
      id: createId('research'),
      projectId: project.id,
      title: `${topic} 실무 가이드`,
      sourceUrl: 'https://example.com/practical-guide',
      domain: 'example.com',
      summary: `실제 적용 방법과 단계별 체크리스트를 설명하는 가이드 문서입니다.`,
      excerpt: `초보자도 바로 실행할 수 있도록 문제 정의 → 실행 → 검증 순서로 정리되어 있습니다.`,
      relevanceScore: 91,
    },
    {
      id: createId('research'),
      projectId: project.id,
      title: `${topic} 자주 묻는 질문`,
      sourceUrl: 'https://example.com/faq',
      domain: 'example.com',
      summary: `독자가 자주 묻는 질문과 반론 포인트를 정리했습니다.`,
      excerpt: `FAQ 섹션과 CTA 설계에 활용할 만한 사용자 질문 패턴이 포함되어 있습니다.`,
      relevanceScore: 87,
    },
    {
      id: createId('research'),
      projectId: project.id,
      title: `${topic} 성공 사례 분석`,
      sourceUrl: 'https://example.com/case-study',
      domain: 'example.com',
      summary: `실제 사례를 통해 어떤 구조와 메시지가 효과적인지 보여주는 자료입니다.`,
      excerpt: `콘텐츠 흐름, 제목 구조, 신뢰 확보 포인트를 벤치마킹할 수 있습니다.`,
      relevanceScore: 84,
    },
  ]
}

interface DraftContext {
  project: Project
  settings: DraftSettings
  selectedResearch: ResearchItem[]
}

export function createMockDraftFromContext({
  project,
  settings,
  selectedResearch,
}: DraftContext) {
  const researchBullets =
    selectedResearch.length > 0
      ? selectedResearch
          .map((item, index) => {
            return `${index + 1}. ${item.title} — ${item.summary}`
          })
          .join('\n')
      : '1. 선택된 리서치 데이터가 없습니다. 기본 초안으로 생성됩니다.'

  const faqSection = settings.includeFaq
    ? `

## 자주 묻는 질문

### Q. ${project.topic}를 지금 시작필도 늦지 않았나요?
A. 늦지 않았습니다. 중요한 것은 완벽한 준비보다 빠른 실행과 반복 개선입니다.

### Q. 초보자도 바로 적용할 수 있나요?
A. 네. 핵심은 복잡한 전략보다 작은 실행 단위를 만들어 바로 테스트핼보는 것입니다.
`
    : ''

  return `# ${project.title}

## 개요

이 글은 ${project.targetAudience}를 위한 콘텐츠입니다.  
주제는 **${project.topic}**이며, 전체 문체는 **${settings.tone}** 톤으로 작성합니다.

## 작성 목표

${settings.goal}

## 핵심 키워드

${project.keywords.length > 0 ? project.keywords.join(', ') : '키워드 미입력'}

## 리서치 요약

${researchBullets}

## 본문 초안

${project.topic}를 효과적으로 설명하려면 먼저 독자가 어떤 상황에 있는지 이해해야 합니다.  
대부분의 독자는 정보를 원하지만, 동시에 바로 실행 가능한 방법도 기대합니다.

첫째, 현재 상황을 빠르게 진단해야 합니다.  
둘째, 작은 실행 단위를 설계해야 합니다.  
셋째, 결과를 측정하고 개선 포인트를 찾아야 합니다.

이 글에서는 위 세 가지를 중심으로 실제 적용 가능한 형태로 내용을 구성합니다.  
특히 ${project.targetAudience} 관점에서 "어디서부터 시작해야 하는가"를 명확하게 보여주는 데 초점을 둡니다.

## 추천 구성

- 문제 정의
- 핵심 개념 정리
- 실행 단계
- 실수하기 쉬운 포인트
- 마무리 CTA

## CTA

${settings.cta}

## 추가 작성 지시

${settings.customPrompt || '추가 프롬프트 없음'}
${faqSection}
`
}

/**
 * 기존 함수명 유지 (호환성)
 */
export function getMockResearchItems(projectId: string = ''): ResearchItem[] {
  return createMockResearchItems({
    id: projectId,
    type: 'informational',
    title: 'Temporary Project',
    topic: 'AI',
    targetAudience: '일반',
    tone: 'professional',
    keywords: ['AI'],
    status: 'researching',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

/**
 * 기존 함수 유지 (호환성)
 */
export function generateMockDraft(
  projectId: string,
  length: 'short' | 'medium' | 'long' = 'medium'
) {
  const lengthMultiplier = {
    short: 0.6,
    medium: 1,
    long: 1.5,
  }

  const baseWordCount = 850
  const wordCount = Math.floor(baseWordCount * lengthMultiplier[length])

  const content = `# 인공지능이 바꾸는 미래의 직업 세계

지난 10년간 인공지능 기술은 눈부신 속도로 발전해 왔습니다. 특히 생성형 AI의 등장은 우리가 일하는 방식을 근본적으로 재정의하고 있으며, 이는 단순한 도구의 변화를 넘어 노동 시장 전반의 대대적인 개편을 예고하고 있습니다.

## 1. AI와 자동화의 현재

많은 전문가들은 자동화로 인해 사라질 직업들에 대해 경고합니다. 하지만 동시에 새로운 기회가 열리고 있다는 점도 간과해서는 안 됩니다. AI 기술이 인간의 창의성을 대체하기보다는 보조하는 역할을 수행하게 될 것입니다.

## 2. 사라지는 직업과 위기

반복적이고 예측 가능한 업무는 AI로 대첐되기 쉽습니다. 데이터 입력, 단순 문서 작성, 기본 고객 응대 등이 대표적입니다. 그러나 창의적 사고와 감성 지능이 필요한 영역에서는 여전히 인간의 가치가 높게 평가받을 것입니다.

## 3. 새롭게 생겨나는 직업

AI 시대에는 새로운 직업이 등장하고 있습니다. 프롬프트 엔지니어, AI 윤리 전문가, 데이터 큐레이터 등 기술과 인간성을 결합한 직업들이 주목받고 있습니다.

## 4. 우리가 준비해야 할 것

미래의 노동 시장에서 가장 중요한 역량은 '적응성'이 될 것입니다. 고정된 기술에 안주하기보다 끊임없이 새로운 도구를 배우고 이를 자신의 전문성과 결합하는 능력이 성공의 열쇠입니다.

---

*본 글은 AI 리서치를 바탕으로 작성되었습니다.*
`

  return {
    projectId,
    title: '인공지능이 바꾸는 미래의 직업 세계',
    content,
    version: 1,
    wordCount,
    updatedAt: new Date().toISOString(),
  }
}
