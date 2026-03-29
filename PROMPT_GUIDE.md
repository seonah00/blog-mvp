# AI 프롬프트 설계 가이드

## 개요

이 문서는 Blog MVP에서 사용될 AI 기능별 프롬프트 설계를 정의합니다. 각 기능은 단계별 워크플로우에서 호출되며, 일관된 입출력 형식을 유지합니다.

---

## 1. Research 요약

### 목적
수집된 리서치 자료를 분석하여 블로그 글 작성에 필요한 핵심 인사이트, 키 포인트, 구조를 추출합니다.

### 입력 데이터
```typescript
interface ResearchSummaryInput {
  topic: string
  targetAudience: string
  researchItems: {
    title: string
    summary: string
    excerpt: string
    relevanceScore: number
  }[]
  keywords: string[]
}
```

### 출력 형식
```typescript
interface ResearchSummaryOutput {
  keyInsights: string[]        // 핵심 인사이트 3-5개
  recommendedStructure: {      // 권장 글 구조
    section: string
    purpose: string
  }[]
  targetPainPoints: string[]   // 타겟 독자의 Pain Point
  recommendedTone: string      // 권장 톤
  contentGaps: string[]        // 보충이 필요한 내용
}
```

### 시스템 프롬프트 초안
```
당신은 전문 콘텐츠 리서처입니다. 제공된 리서치 자료를 분석하여 블로그 글 작성에 필요한 핵심 정보를 추출하세요.

규칙:
1. 객관적 사실에 기반하여 분석하세요
2. 중복되는 내용은 통합하세요
3. 타겟 독자 관점에서 중요도를 판단하세요
4. 출처는 명시하지 않고 내용만 요약하세요
5. 핵심 인사이트는 구체적이고 실행 가능해야 합니다
```

### 사용자 프롬프트 템플릿
```
주제: {topic}
타겟 독자: {targetAudience}
키워드: {keywords.join(', ')}

다음 리서치 자료를 분석해주세요:

{researchItems.map((item, i) => `
[${i + 1}] ${item.title}
요약: ${item.summary}
내용: ${item.excerpt}
관련도: ${item.relevanceScore}%
`).join('\n')}

분석 결과를 JSON 형식으로 제공해주세요.
```

### 향후 조정 가능한 옵션
- `maxInsights`: 최대 인사이트 개수 (기본: 5)
- `depth`: 분석 깊이 (basic/advanced)
- `language`: 출력 언어 (ko/en)
- `focusArea`: 특정 영역 집중 (예: "실무 적용")

---

## 2. Draft 생성

### 목적
리서치 요약과 설정을 바탕으로 완성도 높은 블로그 초안을 생성합니다.

### 입력 데이터
```typescript
interface DraftGenerationInput {
  project: {
    title: string
    topic: string
    targetAudience: string
    tone: 'professional' | 'friendly' | 'casual' | 'expert' | 'persuasive'
    keywords: string[]
  }
  settings: {
    category: string
    goal: string
    length: 'short' | 'medium' | 'long'
    cta: string
    customPrompt: string
    includeFaq: boolean
  }
  researchSummary: {
    keyInsights: string[]
    recommendedStructure: { section: string; purpose: string }[]
    targetPainPoints: string[]
  }
}
```

### 출력 형식
```typescript
interface DraftGenerationOutput {
  title: string
  content: string        // 마크다운 형식
  sections: {
    heading: string
    content: string
    wordCount: number
  }[]
  estimatedReadTime: number  // 분 단위
  keywordsUsed: string[]     // 실제 사용된 키워드
}
```

### 시스템 프롬프트 초안
```
당신은 전문 블로그 작가입니다. 제공된 정보를 바탕으로 고품질의 블로그 글을 작성하세요.

작성 원칙:
1. 독자 관점에서 가치 있는 정보를 제공하세요
2. 자연스러운 흐름으로 글을 구성하세요
3. 설정된 톤과 일관되게 작성하세요
4. 키워드를 자연스럽게 포함하세요 (과도한 반복 금지)
5. 구체적인 예시와 데이터를 포함하세요
6. 소제목(H2, H3)을 적절히 사용해 가독성을 높이세요
7. 마지막에 CTA를 자연스럽게 포함하세요

형식:
- 마크다운 형식 사용
- 제목은 H1 (#)
- 소제목은 H2 (##) 또는 H3 (###)
- 문단은 3-5문장으로 구성
```

### 사용자 프롬프트 템플릿
```
# 프로젝트 정보
제목: {project.title}
주제: {project.topic}
타겟 독자: {project.targetAudience}
글 톤: {project.tone}
핵심 키워드: {project.keywords.join(', ')}

# 작성 설정
카테고리: {settings.category}
작성 목표: {settings.goal}
글 길이: {settings.length} (short: 800자, medium: 1500자, long: 2500자)
CTA: {settings.cta}
추가 지시: {settings.customPrompt}
FAQ 포함: {settings.includeFaq ? '예' : '아니오'}

# 리서치 인사이트
{researchSummary.keyInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

# 권장 구조
{researchSummary.recommendedStructure.map(s => `- ${s.section}: ${s.purpose}`).join('\n')}

위 정보를 바탕으로 마크다운 형식의 블로그 글을 작성해주세요.
```

### 향후 조정 가능한 옵션
- `creativity`: 창의성 수준 (conservative/balanced/creative)
- `structure`: 글 구조 템플릿 (listicle/how-to/story)
- `includeExamples`: 실제 사례 포함 여부
- `includeStats`: 통계 데이터 포함 여부
- `paragraphLength`: 문단 길이 (short/medium/long)

---

## 3. Draft 수정/Correction

### 목적
기존 초안의 문법, 스타일, 내용을 개선하거나 특정 섹션을 재작성합니다.

### 입력 데이터
```typescript
interface CorrectionInput {
  originalText: string
  correctionType: 'grammar' | 'style' | 'rewrite' | 'shorten' | 'expand' | 'tone'
  context?: {
    sectionHeading?: string
    targetAudience: string
    tone: string
  }
  instruction?: string  // 사용자 추가 지시
}
```

### 출력 형식
```typescript
interface CorrectionOutput {
  correctedText: string
  changes: {
    type: 'grammar' | 'wording' | 'structure' | 'content'
    original: string
    suggestion: string
    reason: string
  }[]
  confidence: number  // 0-1
}
```

### 시스템 프롬프트 초안 (유형별)

#### 3.1 문법 교정
```
당신은 전문 교정자입니다. 제공된 텍스트의 문법, 맞춤법, 문장 구조를 교정하세요.

규칙:
1. 원문의 의도와 톤을 유지하세요
2. 자연스러운 한국어/영어 표현으로 개선하세요
3. 불필요한 과장이나 수동태를 능동태로 변경하세요
4. 변경 사항과 이유를 함께 설명하세요
```

#### 3.2 스타일 개선
```
당신은 콘텐츠 에디터입니다. 텍스트의 가독성과 설득력을 높이도록 개선하세요.

규칙:
1. 문장을 더 간결하고 명확하게 만드세요
2. 전문 용어는 적절히 설명을 덧붙이세요
3. 긴 문장은 2-3개의 짧은 문장으로 나누세요
4. bullet point 사용을 권장하세요
5. 독자의 관심을 끄는 훅(hook)을 추가하세요
```

#### 3.3 섹션 재작성
```
당신은 전문 작가입니다. 제공된 섹션을 지시사항에 따라 완전히 재작성하세요.

규칙:
1. 원문의 핵심 메시지는 유지하되 표현을 새롭게 하세요
2. 타겟 독자에게 더 효과적인 접근 방식을 사용하세요
3. 구체적인 예시와 데이터를 포함하세요
4. 설정된 톤을 일관되게 적용하세요
```

### 사용자 프롬프트 템플릿

#### 문법 교정
```
다음 텍스트의 문법과 표현을 교정해주세요:

[원문]
{originalText}

교정된 텍스트와 함께 어떤 부분을 왜 변경했는지 설명해주세요.
```

#### 스타일 개선
```
다음 텍스트의 가독성과 설득력을 높여주세요:

[원문]
{originalText}

타겟 독자: {context.targetAudience}
현재 톤: {context.tone}

더 명확하고 간결하게 개선해주세요.
```

#### 섹션 재작성
```
다음 섹션을 재작성해주세요:

[원문]
{originalText}

섹션 제목: {context.sectionHeading}
지시사항: {instruction || '더 구체적이고 실용적으로 작성해주세요'}

핵심 메시지는 유지하면서 새롭게 작성해주세요.
```

### 향후 조정 가능한 옵션
- `strictness`: 교정 엄격도 (mild/standard/strict)
- `preserveTerms`: 변경하지 않을 용어 목록
- `maxChangeRatio`: 최대 변경 비율 (예: 30%)
- `focus`: 집중 교정 영역 (grammar/flow/clarity)

---

## 4. Image Prompt 생성

### 목적
블로그 글의 핵심 내용을 시각화할 수 있는 AI 이미지 생성용 프롬프트를 생성합니다.

### 입력 데이터
```typescript
interface ImagePromptInput {
  section: {
    heading: string
    content: string
  }
  project: {
    topic: string
    tone: string
  }
  imageStyle: 'realistic' | 'illustration' | 'minimal' | '3d'
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16'
}
```

### 출력 형식
```typescript
interface ImagePromptOutput {
  prompts: {
    purpose: string      // 이미지 용도 (대표/섹션/인포그래픽)
    prompt: string       // 이미지 생성 프롬프트
    negativePrompt: string
    aspectRatio: string
    recommendedModel: string
  }[]
  colorPalette: string[]  // 권장 색상 팔레트
  composition: string     // 구도 설명
}
```

### 시스템 프롬프트 초안
```
당신은 AI 이미지 프롬프트 엔지니어입니다. 블로그 콘텐츠에 어울리는 고품질 이미지 생성 프롬프트를 작성하세요.

프롬프트 작성 원칙:
1. 구체적이고 묘사적인 형용사를 사용하세요
2. 조명, 색감, 구도를 명시하세요
3. 브랜드 일관성을 위한 스타일 키워드를 포함하세요
4. 부정적 프롬프트(negative prompt)도 함께 제공하세요
5. 이미지의 목적과 사용 위치를 고려하세요

톤별 스타일 키워드:
- professional: clean, corporate, polished, sophisticated
- friendly: warm, inviting, approachable, soft lighting
- casual: candid, lifestyle, natural, authentic
- expert: technical, detailed, precise, high-tech
- persuasive: bold, dynamic, impactful, vibrant
```

### 사용자 프롬프트 템플릿
```
# 프로젝트 정보
주제: {project.topic}
톤: {project.tone}

# 섹션 내용
제목: {section.heading}
내용: {section.content}

# 이미지 설정
스타일: {imageStyle}
비율: {aspectRatio}

위 내용을 시각화하는 이미지 생성 프롬프트를 3개 작성해주세요:
1. 대표 이미지 (hero image)
2. 섹션 일러스트
3. 인포그래픽 요소

각 프롬프트는 영어로 작성하고, negative prompt도 포함해주세요.
```

### 향후 조정 가능한 옵션
- `imageCount`: 생성할 이미지 개수
- `colorScheme`: 선호 색상 테마
- `mood`: 이미지 분위기 (bright/dark/neutral)
- `diversity`: 다양성 고려 여부
- `brandGuidelines`: 브랜드 가이드라인 적용

---

## 5. Export Studio용 SNS 변환

### 목적
작성된 블로그 글을 다양한 SNS 플랫폼에 맞는 형식으로 변환합니다.

### 지원 플랫폼
- Twitter/X (280자 기준)
- LinkedIn (전문가용 긴 형식)
- Instagram (캡션 + 해시태그)
- Threads (대화형)
- Facebook

### 입력 데이터
```typescript
interface SnsConversionInput {
  originalPost: {
    title: string
    content: string
    keyPoints: string[]
  }
  platform: 'twitter' | 'linkedin' | 'instagram' | 'threads' | 'facebook'
  variant: 'summary' | 'thread' | 'quote' | 'question'
  options?: {
    includeHashtags: boolean
    includeEmoji: boolean
    cta?: string
  }
}
```

### 출력 형식
```typescript
interface SnsConversionOutput {
  posts: {
    content: string
    characterCount: number
    hashtags?: string[]
    suggestedImage?: string  // 이미지 설명
    bestPostingTime?: string
  }[]
  hashtags: string[]
  mentions: string[]
  engagementTips: string[]
}
```

### 시스템 프롬프트 초안 (플랫폼별)

#### Twitter/X
```
당신은 Twitter 콘텐츠 전문가입니다. 블로그 글을 Twitter에 최적화된 형식으로 변환하세요.

규칙:
1. 280자 제한을 준수하세요 (초과 시 thread 형식 사용)
2. hook이 강력한 첫 문장으로 시작하세요
3. 핵심 가치를 앞부분에 배치하세요
4. 2-3개의 관련 해시태그를 포함하세요
5. 질문이나 CTA로 마무리하세요
6. 줄바꿈으로 가독성을 높이세요
```

#### LinkedIn
```
당신은 LinkedIn 콘텐츠 전략가입니다. 전문가 네트워크에 적합한 형식으로 변환하세요.

규칙:
1. 전문적이면서도 대화체 톤을 사용하세요
2. 개인적 경험이나 스토리를 포함하세요
3. actionable한 인사이트를 제공하세요
4. 문단마다 줄바꿈으로 가독성 확보
5. 3-5개의 관련 해시태그를 포함하세요
6. 댓글을 유도하는 질문으로 마무리하세요
```

#### Instagram
```
당신은 Instagram 콘텐츠 크리에이터입니다. 시각적 플랫폼에 맞는 캡션을 작성하세요.

규칙:
1. 첫 줄은 강력한 hook으로 시작하세요
2. 이모지를 적절히 사용해 시각적 흥미를 더하세요
3. 개인적이고 친근한 톤을 유지하세요
4. 해시태그는 10-15개 포함하세요 (인기태그 + 니치태그 조합)
5. CTA는 명확하고 실행 가능해야 합니다
```

### 사용자 프롬프트 템플릿

#### Twitter 변환
```
다음 블로그 글을 Twitter용으로 변환해주세요:

[원문 제목]
{originalPost.title}

[원문 내용]
{originalPost.content}

[핵심 포인트]
{originalPost.keyPoints.join('\n')}

# 요구사항
형식: {variant} (summary/thread/quote/question)
해시태그 포함: {options.includeHashtags ? '예' : '아니오'}
이모지 포함: {options.includeEmoji ? '예' : '아니오'}

Twitter 스타일로 변환해주세요. 280자 초과 시 자동으로 thread 형식으로 나눠주세요.
```

#### LinkedIn 변환
```
다음 블로그 글을 LinkedIn용으로 변환해주세요:

[원문 제목]
{originalPost.title}

[원문 내용]
{originalPost.content}

[핵심 포인트]
{originalPost.keyPoints.join('\n')}

LinkedIn 전문가 네트워크에 적합한 톤과 길이로 변환해주세요. 개인적 스토리 요소와 전문적 인사이트를 결합해주세요.
```

#### Instagram 변환
```
다음 블로그 글을 Instagram 캡션으로 변환해주세요:

[원문 제목]
{originalPost.title}

[원문 내용]
{originalPost.content}

[핵심 포인트]
{originalPost.keyPoints.join('\n')}

Instagram 스타일의 캡션과 해시태그 세트를 만들어주세요. 이모지를 적절히 활용하고, 시각적 피드에 어울리는 톤으로 작성해주세요.
```

### 향후 조정 가능한 옵션
- `tone`: 플랫폼별 톤 조정 (formal/casual/playful)
- `length`: 길이 설정 (short/medium/full)
- `hashtagStrategy`: 해시태그 전략 (trending/niche/branded)
- `ctaType`: CTA 유형 (link/comment/share/like)
- `audienceSegment`: 타겟 세그먼트 지정

---

## 공통 가이드라인

### API 호출 시 고려사항

1. **재시도 로직**
   - 실패 시 3회 재시도 (exponential backoff)
   - 타임아웃: 30초

2. **응답 파싱**
   - JSON 형식 우선
   - 실패 시 raw text 반환

3. **캐싱**
   - 동일 입력 1시간 캐싱
   - 버전 관리로 재생성 지원

4. **오류 처리**
   - 부분적 성공 시 완료된 부분 반환
   - 사용자에게 오류 메시지 표시

### 프롬프트 엔지니어링 베스트 프랙티스

1. **명확한 역할 부여**
   - "당신은 ~입니다"로 시작

2. **구체적인 규칙 나열**
   - 번호 매긴 목록 사용

3. **입출력 예시 제공**
   - Few-shot 예시 포함

4. **제약사항 명시**
   - 길이, 형식, 금지사항

5. **일관된 형식**
   - 마크다운, JSON 등 표준 형식 사용

---

## 버전 관리

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2026-03-26 | 초안 작성 |

---

*이 문서는 실제 AI 모델 연동 시 테스트 결과를 바탕으로 지속적으로 업데이트됩니다.*
