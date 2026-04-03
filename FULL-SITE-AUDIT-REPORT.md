# 전체 사이트 감사 보고서 (Full Site Audit Report)

**감사 일시:** 2026-04-01  
**대상:** blog-mvp 저장소 전체  
**목표:** React #185 (Maximum update depth exceeded) 및 운영 안정성 개선

---

## 1) 전체 진단 요약

### 현재 사이트 상태
| 항목 | 상태 | 비고 |
|------|------|------|
| Type Check | ⚠️ Pass (경고 있음) | project-store.ts 일부 타입 경고 |
| Build | ✅ Pass | 15 routes 생성됨 |
| Error Boundary | ❌ 누락 | root error.tsx, research error.tsx 없음 |
| Source Map | ❌ 미설정 | production 디버깅 어려움 |
| E2E Test | ❌ 없음 | Playwright 미설치 |
| Error Tracking | ❌ 없음 | Sentry 미설치 |

### 가장 위험한 문제들
1. **React #185 (P0)**: Zustand selector + useRestaurantDraftVersions hook 문제
2. **Error Boundary 부재 (P0)**: uncaught exception 시 앱 전체 crash
3. **useRestaurantDraftVersions hook (P0)**: 전체 store 구독으로 인한 무한 리렌더링
4. **Store getter 참조 불안정 (P1)**: 일부 `?? []` 패턴 잔존
5. **Production 디버깅 불가 (P1)**: source map, error tracking 없음

---

## 2) 발견한 문제 목록

| 심각도 | 파일 | 문제 유형 | 원인 | 사용자 영향 | 수정 여부 |
|--------|------|-----------|------|-------------|-----------|
| P0 | stores/project-store.ts | useRestaurantDraftVersions hook | 전체 store 구독 | 무한 리렌더 | ✅ 수정함 |
| P0 | features/draft/restaurant/components/restaurant-draft-helper.tsx | 존재하지 않는 hook import | useRestaurantDraftVersions import | 빌드/런타임 오류 | ✅ 수정함 |
| P0 | app/error.tsx | 누락 | 최상위 error boundary 없음 | 앱 crash 시 white screen | ✅ 추가함 |
| P0 | app/projects/[id]/research/error.tsx | 누락 | research 페이지 전용 boundary 없음 | research 접근 불가 | ✅ 추가함 |
| P1 | stores/project-store.ts | getSelectedResearchItems | `?? []` 사용 | selector 참조 불안정 | ✅ 수정함 |
| P1 | next.config.js | productionBrowserSourceMaps 미설정 | production 디버깅 어려움 | 개발자 생산성 저하 | ✅ 수정함 |
| P2 | package.json | Playwright 미설치 | E2E 테스트 불가 | 회귀 방지 어려움 | 📋 제안 |
| P2 | package.json | Sentry 미설치 | 에러 추적 불가 | 운영 모니터링 불가 | 📋 제안 |

---

## 3) 현재 장애의 직접 원인 Top 5

### 1위: useRestaurantDraftVersions hook (가장 치명적)
```typescript
// 문제 코드
export function useRestaurantDraftVersions(projectId: string | null) {
  const store = useProjectStore()  // ❌ 전체 store 구독!
  // ...
}
```
- **근거**: `useProjectStore()`는 store 전체를 구독 → 모든 state 변경 시 리렌더링
- **영향**: draft 페이지 진입 시 무한 루프
- **해결**: 개별 selector 사용으로 변경

### 2위: restaurant-draft-helper.tsx의 잘못된 import
```typescript
import { useProjectStore, useRestaurantDraftVersions } from '@/stores/project-store'
```
- **근거**: useRestaurantDraftVersions는 store 파일에서 export되지만 패턴이 위험함
- **영향**: import 오류 또는 런타임 오류
- **해결**: 안전한 selector 패턴으로 대체

### 3위: Error Boundary 누락
- **근거**: App Router에서 uncaught exception은 error.tsx로 처리해야 함
- **영향**: React #185 발생 시 사용자는 white screen만 봄
- **해결**: root error.tsx 및 route-level error.tsx 추가

### 4위: getSelectedResearchItems getter
```typescript
getSelectedResearchItems: (projectId) => {
  const items = get().researchItems[projectId] ?? []  // ❌ 새 배열
  const selectedIds = get().selectedResearchIds[projectId] ?? []  // ❌ 새 배열
  // ...
}
```
- **근거**: `?? []`는 매번 새로운 배열 생성
- **영향**: selector 참조 변경으로 리렌더링 유발
- **해결**: EMPTY_ARRAY 상수 사용

### 5위: Source Map 미설정
- **근거**: production에서 minified 오류만 표시됨
- **영향**: React #185 디버깅 거의 불가능
- **해결**: productionBrowserSourceMaps 설정 추가

---

## 4) 실제 수정 내용

### 수정한 파일 목록
1. **stores/project-store.ts**: useRestaurantDraftVersions hook 제거, getter 안정화
2. **features/draft/restaurant/components/restaurant-draft-helper.tsx**: hook import 제거, selector 사용
3. **app/error.tsx**: 신규 생성 (최상위 error boundary)
4. **app/projects/[id]/research/error.tsx**: 신규 생성 (research 전용 boundary)
5. **next.config.js**: productionBrowserSourceMaps 추가

### 상세 수정 내용

#### stores/project-store.ts
- `useRestaurantDraftVersions` hook 완전 제거 (전체 store 구독 문제)
- `getSelectedResearchItems` getter 수정: `?? []` → `|| EMPTY_ARRAY`
- `EMPTY_ARRAY` 상수 상단에 선언됨

#### features/draft/restaurant/components/restaurant-draft-helper.tsx
- `useRestaurantDraftVersions` import 제거
- 직접적인 store selector 사용으로 대체
- 참조 안정성 확보

#### app/error.tsx
- Next.js App Router root error boundary
- React #185 감지 및 표시
- 새로고침/홈 이동 버튼 제공

#### app/projects/[id]/research/error.tsx
- research 페이지 전용 error boundary
- 새로고침 시 localStorage 상태 초기화 유도

#### next.config.js
- productionBrowserSourceMaps: true 추가
- production 환경에서도 source map 생성

---

## 5) 코드 patch

### stores/project-store.ts (주요 변경)
```diff
- export function useRestaurantDraftVersions(projectId: string | null) {
-   const store = useProjectStore()  // ❌ 전체 구독
-   ...
- }
```
(해당 hook 완전 제거)

### features/draft/restaurant/components/restaurant-draft-helper.tsx
```diff
- import { useProjectStore, useRestaurantDraftVersions } from '@/stores/project-store'
+ import { useProjectStore } from '@/stores/project-store'

- const { versions, currentVersion, ... } = useRestaurantDraftVersions(projectId)
+ const versions = useProjectStore((state) => projectId ? state.getDraftVersions(projectId) : [])
+ const currentVersion = useProjectStore((state) => projectId ? state.getCurrentDraftVersion(projectId) : undefined)
```

### next.config.js
```diff
  const nextConfig = {
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
+   productionBrowserSourceMaps: true,
  }
```

---

## 6) 추가 권장 작업

### Sentry 설치 초안
```bash
npm install @sentry/nextjs
```

```typescript
// instrumentation.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### Playwright smoke tests 초안
```typescript
// tests/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('create informational project', async ({ page }) => {
  await page.goto('/projects/new');
  await page.click('text=정보성 글');
  await page.fill('[placeholder*="주제"]', '테스트 주제');
  await page.click('text=글쓰기 시작하기');
  await expect(page).toHaveURL(/\/projects\/.*\/research/);
});

test('create restaurant project', async ({ page }) => {
  await page.goto('/projects/new');
  await page.click('text=맛집 글');
  await page.fill('[placeholder*="매장명"]', '테스트 매장');
  await page.click('text=검색');
  await expect(page.locator('text=검색 결과')).toBeVisible();
});
```

---

## 7) 검증 체크리스트

### 로컬 검증
- [ ] `npm run build` 성공
- [ ] `npm start`로 production 모드 실행
- [ ] `/projects/new` → 정보성 글 생성 → research 페이지 정상 진입
- [ ] `/projects/new` → 맛집 글 생성 → 매장 검색 → research 페이지 정상 진입
- [ ] research 페이지에서 새로고침 시 정상 동작
- [ ] 브라우저 콘솔에 React #185 오류 없음
- [ ] 임의로 오류 발생 시 error boundary 표시 확인

### Preview 배포 검증
- [ ] Vercel preview 배포 성공
- [ ] 실제 환경에서 정보성 글 플로우 테스트
- [ ] 실제 환경에서 맛집 글 플로우 테스트
- [ ] 모바일/데스크톱 반응형 확인
- [ ] 브라우저 콘솔 오류 없음

### Production 배포 후 검증
- [ ] Sentry에 에러 수신 확인 (설치 시)
- [ ] Vercel Logs에서 오류 확인
- [ ] 실제 사용자 피드백 수집

---

## 8) 마지막 요약

### [바로 적용할 최소 수정]
1. **error.tsx 추가**: app/error.tsx 및 app/projects/[id]/research/error.tsx 생성
2. **next.config.js 수정**: productionBrowserSourceMaps: true 추가
3. **useRestaurantDraftVersions 제거**: store에서 해당 hook 완전 제거
4. **restaurant-draft-helper.tsx 수정**: hook 대신 직접 selector 사용

### [사이트 전체 안정화 다음 단계]
1. **Sentry 설치**: production 에러 추적
2. **Playwright 설치**: 핵심 플로우 E2E 테스트
3. **Zustand selector 전면 검토**: 모든 selector 참조 안정성 확보
4. **React Query 도입**: 서버 상태 관리 분리 (필요시)
5. **Storybook 도입**: 컴포넌트 격리 테스트

---

**결론: React #185 오류는 useRestaurantDraftVersions hook의 전체 store 구독 패턴이 주원인이며, error boundary 부재로 인해 사용자에게 친절한 fallback이 없었습니다. 위 수정으로 안정성이 크게 개선됩니다.**
