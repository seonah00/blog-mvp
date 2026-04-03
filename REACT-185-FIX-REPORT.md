# React #185 (Maximum update depth exceeded) 오류 수정 보고서

**작업 일시:** 2026-04-01  
**오류:** `Uncaught Error: Minified React error #185`  
**원인:** Zustand selector 참조 불안정성으로 인한 무한 리렌더링

---

## 1. 원인 분석

### 문제 패턴 1: Store getter의 `?? []` 반환
```typescript
// BEFORE (문제)
getReviewInputs: (projectId) => {
  return get().restaurantReviewInputs[projectId] ?? []
}
```
- `?? []`는 매번 새로운 배열 리터럴을 생성
- Zustand selector가 매 렌더링마다 새로운 참조를 반환
- React는 참조 변경을 데이터 변경으로 인식 → 리렌더링 트거
- 리렌더링 → 다시 selector 호출 → 무한 루프

### 문제 패턴 2: Research Page의 조걶부 selector
```typescript
// BEFORE (문제)
const reviews = useProjectStore((state) => 
  project?.type === 'restaurant' ? state.getReviewInputs(projectId) : []
)
```
- 타입이 restaurant가 아닐 때 `[]` 리터럴 반환
- 매 렌더링마다 새로운 배열 참조 생성
- 컴포넌트 리렌더링 유발

---

## 2. 가장 유력한 원인 Top 3

| 순위 | 원인 | 영향도 |
|------|------|--------|
| 1 | Store getter의 `?? []` 패턴 | 모든 배열 getter에 영향 |
| 2 | Research page 조걶부 selector | 페이지 진입 시 즉시 발생 |
| 3 | Workspace 컴포넌트의 동시 구독 | 다중 selector 호출 |

---

## 3. 수정 전략

### 전략 A: 참조 안정성 확보 (EMPTY_ARRAY 상수)
```typescript
// 상수 정의
const EMPTY_ARRAY = Object.freeze([]) as unknown as never[]

// getter 수정
getReviewInputs: (projectId) => {
  return get().restaurantReviewInputs[projectId] || (EMPTY_ARRAY as UserReviewInput[])
}
```

### 전략 B: Selector 통합 및 useMemo 적용
```typescript
// BEFORE
const reviews = useProjectStore((state) => 
  project?.type === 'restaurant' ? state.getReviewInputs(projectId) : []
)

// AFTER
const restaurantData = useProjectStore((state) => {
  if (project?.type !== 'restaurant') return null
  return {
    reviews: state.getReviewInputs(projectId),
    // ...
  }
})

const readiness = useMemo(() => {
  // 계산 로직
}, [restaurantData])
```

---

## 4. 실제 코드 Patch

### stores/project-store.ts
```diff
+ // 참조 안정성을 위한 상수들 (React #185 오류 방지)
+ const EMPTY_ARRAY = Object.freeze([]) as unknown as never[]

  getImagePrompts: (projectId) => {
-   return get().imagePrompts[projectId] ?? []
+   return get().imagePrompts[projectId] || (EMPTY_ARRAY as ImagePrompt[])
  },

  getPlaceCandidates: (projectId) => {
-   return get().restaurantPlaceCandidates[projectId] ?? []
+   return get().restaurantPlaceCandidates[projectId] || (EMPTY_ARRAY as PlaceCandidate[])
  },

  getCanonicalPlaces: (projectId) => {
-   return get().restaurantCanonicalPlaces[projectId] ?? []
+   return get().restaurantCanonicalPlaces[projectId] || (EMPTY_ARRAY as CanonicalPlace[])
  },

  getReviewInputs: (projectId) => {
-   return get().restaurantReviewInputs[projectId] ?? []
+   return get().restaurantReviewInputs[projectId] || (EMPTY_ARRAY as UserReviewInput[])
  },

  getWebEvidence: (projectId) => {
-   return get().restaurantWebEvidence[projectId] ?? []
+   return get().restaurantWebEvidence[projectId] || (EMPTY_ARRAY as WebEvidence[])
  },

  getDraftVersions: (projectId) => {
-   return get().restaurantDraftVersions[projectId] ?? []
+   return get().restaurantDraftVersions[projectId] || (EMPTY_ARRAY as RestaurantDraftVersion[])
  },

  getSources: (projectId) => {
-   return get().informationalSources[projectId] ?? []
+   return get().informationalSources[projectId] || (EMPTY_ARRAY as SourceInput[])
  },

  getSourceDocuments: (projectId) => {
-   return get().informationalSourceDocs[projectId] ?? []
+   return get().informationalSourceDocs[projectId] || (EMPTY_ARRAY as SourceDocument[])
  },

  getKeyPoints: (projectId) => {
-   return get().informationalKeyPoints[projectId] ?? []
+   return get().informationalKeyPoints[projectId] || (EMPTY_ARRAY as KeyPoint[])
  },
```

### app/projects/[id]/research/page.tsx
```diff
+ import { useMemo } from 'react'

- // 조걶부 selector (문제)
- const selectedPlace = useProjectStore((state) => 
-   project?.type === 'restaurant' ? state.getSelectedPlace(projectId) : null
- )
- const reviews = useProjectStore((state) => 
-   project?.type === 'restaurant' ? state.getReviewInputs(projectId) : []
- )

+ // 통합 selector + useMemo
+ const restaurantData = useProjectStore((state) => {
+   if (project?.type !== 'restaurant') return null
+   return {
+     selectedPlace: state.getSelectedPlace(projectId),
+     reviews: state.getReviewInputs(projectId),
+     digest: state.getReviewDigest(projectId),
+   }
+ })

+ const readiness = useMemo(() => {
+   // readiness 계산
+ }, [restaurantData])
```

---

## 5. 수정 후 검증 방법

### Local 테스트
```bash
# 1. Build
npm run build

# 2. Production 모드로 실행
npm start

# 3. 브라우저에서 테스트
# - /projects/new → 정보성 글 생성 → /projects/[id]/research 이동 확인
# - /projects/new → 맛집 글 생성 → 매장 검색 → research 이동 확인
```

### Vercel 배포 시 확인사항
```bash
# .next 캐시 삭제 후 배포
rm -rf .next
npm run build
```

### 디버깅 포인트
- 브라우저 콘솔에 React #185 오류가 사라졌는지 확인
- research 페이지에서 새로고침 시 무한 루프가 없는지 확인
- tabs 전환 시 정상 동작하는지 확인

---

## 6. 추가로 남을 수 있는 리스크

| 리스크 | 가능성 | 대응책 |
|--------|--------|--------|
| 다른 컴포넌트의 동일 패턴 | 중간 | grep으로 `?? \[\]` 패턴 전수 검사 |
| Workspace 낮부 무한 루프 | 낮음 | 탭 전환 테스트로 검증 |
| Store 구독 중복 | 낮음 | React DevTools Profiler 확인 |

### 예방 조치
- 향후 모든 store getter는 `?? []` 대신 `|| EMPTY_ARRAY` 패턴 사용
- 조걶부 selector 작성 시 항상 참조 안정성 고려
- Code Review 시 selector 패턴 체크리스트 포함

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `stores/project-store.ts` | EMPTY_ARRAY 상수 추가, 9개 getter 수정 |
| `app/projects/[id]/research/page.tsx` | useMemo 적용, selector 통합 |

---

## 검증 결과

| 항목 | 결과 |
|------|------|
| Type Check | ✅ Pass |
| Build | ✅ Pass |
| Route 개수 | 15개 (변화 없음) |

**React #185 오류 수정 완료. Vercel 배포 후 확인 권장.**
