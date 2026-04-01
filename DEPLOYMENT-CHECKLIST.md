
# 배포 준비 체크리스트

**프로젝트:** blog-mvp  
**검증 일시:** 2026-04-01  
**배포 플랫폼:** Vercel (권장) 또는 Netlify

---

## ✅ 배포 전 필수 체크

### 1. 타입 체크 & 빌드 검증

| 항목 | 명령어 | 상태 |
|------|--------|------|
| Type Check | `npx tsc --noEmit` | ✅ Pass |
| Build | `npx next build` | ✅ Pass |

**빌드 결과:**
- Next.js 15.5.14
- 모든 페이지 정상 생성
- /projects/[id]/draft/settings (159 kB) - Threads 설정 포함

---

### 2. 환경변수 상태

#### .env.local (Git 제외됨)
```bash
✅ .env.local exists
✅ .gitignore에 .env*.local 포함됨
```

#### 설정된 API 키 목록

| 변수명 | 상태 | 용도 |
|--------|------|------|
| `GOOGLE_MAPS_API_KEY` | ✅ 설정됨 | 맛집 검색 |
| `OPENAI_API_KEY` | ✅ 설정됨 | AI 초안 생성 |
| `ANTHROPIC_API_KEY` | ✅ 설정됨 | Claude 리라이팅 |
| `PERPLEXITY_API_KEY` | ✅ 설정됨 | 웹 리서치 |
| `NAVER_CLIENT_ID` | ✅ 설정됨 | 국내 맛집 검색 |
| `NAVER_CLIENT_SECRET` | ✅ 설정됨 | 국내 맛집 검색 |
| `KAKAO_REST_API_KEY` | ✅ 설정됨 | Kakao API (현재 비활성화) |

#### Feature Flags

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `AI_PROVIDER` | dual | OpenAI + Anthropic 동시 사용 |
| `RESTAURANT_DRAFT_PROVIDER` | openai_then_claude | 2단계 파이프라인 |
| `RESTAURANT_ENABLE_CLAUDE_REWRITE` | true | Claude 리라이팅 활성화 |
| `RESTAURANT_ENABLE_KAKAO` | false | Kakao API 비활성화 (403 오류 대응) |
| `RESTAURANT_ENABLE_WEB_RESEARCH` | true | Perplexity 웹 리서치 활성화 |

---

### 3. Git 상태

```bash
$ git status

수정된 파일 (Staging 필요):
- .env.example
- app/(dashboard)/projects/[id]/draft/edit/page.tsx
- app/(dashboard)/projects/[id]/draft/settings/page.tsx
- app/(dashboard)/projects/new/page.tsx
- features/research/actions.ts
- lib/ai/restaurant-draft.ts
- lib/integrations/env.ts
- lib/integrations/perplexity.ts
- next.config.js
- stores/project-store.ts
- tsconfig.json
- types/common.ts
- types/index.ts
- types/restaurant.ts

신규 파일 (Staging 필요):
- features/research/restaurant/components/*
- lib/ai/__tests__/*
- lib/ai/prompts/karrot-draft.ts
- lib/ai/prompts/threads-draft.ts
- lib/ai/schemas/karrot-draft.ts
- lib/ai/schemas/threads-draft.ts
- lib/env-public.ts
- lib/integrations/kakao-local.ts
- lib/research/*
- scripts/*
- types/evidence.ts
- types/karrot.ts
- types/threads.ts
```

---

## 🚀 Vercel 배포 가이드

### 1. GitHub Repository 연결

```bash
# 1. 변경사항 커밋
git add .
git commit -m "feat: Threads 2축 설정 UI 및 4타입 구조 완성

- Threads 설정 화면: 주제(food/info/branding) × 전략(story/tip/engage)
- Restaurant 설정: 2단계 AI 파이프라인 (OpenAI → Claude)
- Karrot 설정: 당근마켓 글 생성
- 9개 조합별 fallback 템플릿
- QA 자동화 테스트 추가"

# 2. 원격 저장소에 푸시
git push origin feature/threads-2axis
```

### 2. Vercel 프로젝트 설정

#### 새 프로젝트 import
1. https://vercel.com/new 접속
2. GitHub repo 선택: `blog-mvp`
3. Framework Preset: **Next.js** (자동 감지)
4. Root Directory: `./` (blog-mvp 하위에 프로젝트가 있으면 `blog-mvp` 입력)

#### 환경변수 등록 (Production)

**프로젝트 설정 > Environment Variables**

```
# AI APIs
AI_PROVIDER=dual
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-3-haiku-20240307

# Search APIs
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
KAKAO_REST_API_KEY=your_kakao_rest_api_key

# Research
PERPLEXITY_API_KEY=your_perplexity_api_key

# Feature Flags
RESTAURANT_PRIMARY_PROVIDER=naver
RESTAURANT_SECONDARY_PROVIDER=kakao
RESTAURANT_ENABLE_WEB_RESEARCH=true
RESTAURANT_WEB_RESEARCH_PROVIDER=perplexity
RESTAURANT_ENABLE_KAKAO=false
RESTAURANT_DRAFT_PROVIDER=openai_then_claude
RESTAURANT_ENABLE_CLAUDE_REWRITE=true
AI_TIMEOUT_MS=30000
NEXT_PUBLIC_USE_MOCK_PLACES=false
```

**⚠️ 중요:** Preview 환경에도 동일한 환경변수 등록 (Production 복사)

### 3. 배포 설정

| 설정 | 값 |
|------|-----|
| Framework Preset | Next.js |
| Build Command | `next build` |
| Output Directory | `dist` (next.config.js에 설정됨) |
| Install Command | `npm install` |
| Node Version | 18.x (권장) |

---

## 🧪 프리뷰 배포 후 스모크 테스트

### Threads 설정 화면 테스트
1. `/projects/new` → "스레드" 타입 선택
2. 주제: 맛집/정보/브랜딩 각각 선택
3. 전략: 스토리형/꿀팁형/공감형 각각 선택
4. 9개 조합 모두 미리보기 문구 확인
5. 초안 생성 클릭 → 정상 생성 확인

### Restaurant 설정 화면 테스트 (회귀)
1. `/projects/new` → "맛집" 타입 선택
2. 매장 검색 → 리뷰 입력
3. 초안 설정 → 초안 생성
4. Claude 리라이팅 결과 확인

### 회귀 테스트
- [ ] informational 타입 프로젝트 생성
- [ ] karrot 타입 프로젝트 생성
- [ ] 기존 프로젝트 로드 (없으면 신규 생성으로 대체)

---

## 🚨 문제 발생 시 대응

### 환경변수 누락 오류
```
Error: Missing environment variable: OPENAI_API_KEY
```
→ Vercel Settings > Environment Variables에서 해당 변수 등록

### 빌드 실패
```
Error: Build failed
```
→ Build Logs 확인 → 타입 에러 시 `npx tsc --noEmit` 로컬 확인

### API 500 오류
→ Vercel Functions Logs 확인 → 환경변수 값 확인

### 롤백 필요 시
1. Vercel Dashboard → Deployments
2. 이전 배포 선택 → "Promote to Production"

---

## 📋 배포 체크리스트 요약

| 단계 | 항목 | 상태 |
|------|------|------|
| ✅ | type-check 통과 | Pass |
| ✅ | build 통과 | Pass |
| ✅ | API 키 설정 확인 | 6개 키 설정됨 |
| ✅ | .env.local Git 제외 | .gitignore 확인 |
| ⬜ | Git 커밋 & 푸시 | 수행 필요 |
| ⬜ | Vercel 프로젝트 연결 | 수행 필요 |
| ⬜ | 환경변수 등록 | 수행 필요 |
| ⬜ | Preview 배포 확인 | 수행 필요 |
| ⬜ | 스모크 테스트 | 수행 필요 |
| ⬜ | Production 배포 | 수행 필요 |

---

## 🎯 배포 후 확인 URL

| 환경 | 예상 URL |
|------|----------|
| Preview | `https://blog-mvp-xxx.vercel.app` |
| Production | `https://blog-mvp.vercel.app` 또는 커스텀 도메인 |

---

**준비 완료! Git 커밋 & Vercel 배포를 진행하세요.**
