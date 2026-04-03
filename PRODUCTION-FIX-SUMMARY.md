# Production Fix Summary

**수정 일시:** 2026-04-01  
**목표:** React #185 (Maximum update depth exceeded) 해결 및 운영 안정성 확보  
**상태:** ✅ 완료

---

## 🔴 P0 (즉시 수정 완료)

### 1. useRestaurantDraftVersions Hook 제거
**문제:** 전체 store 구독으로 인한 무한 리렌더링
**파일:** `stores/project-store.ts`
**수정:** 해당 hook 완전 제거, 대신 개별 selector 사용 권장

```typescript
// 제거됨
export function useRestaurantDraftVersions(projectId: string | null) {
  const store = useProjectStore()  // ❌ 전체 구독
  // ...
}
```

### 2. Error Boundary 추가
**문제:** uncaught exception 시 앱 전체 crash (white screen)
**파일:** 
- `app/error.tsx` (신규)
- `app/projects/[id]/research/error.tsx` (신규)

**효과:** 
- React #185 오류 감지 및 사용자 친화적 메시지 표시
- 새로고침/홈 이동 버튼 제공

### 3. restaurant-draft-helper.tsx 수정
**문제:** 제거된 hook import 및 사용
**파일:** `features/draft/restaurant/components/restaurant-draft-helper.tsx`

**수정:**
```typescript
// BEFORE
import { useProjectStore, useRestaurantDraftVersions } from '@/stores/project-store'
const { versions, currentVersion } = useRestaurantDraftVersions(projectId)

// AFTER
import { useProjectStore } from '@/stores/project-store'
const versions = useProjectStore((state) => state.getDraftVersions(projectId))
const currentVersion = useProjectStore((state) => state.getCurrentDraftVersion(projectId))
```

### 4. Store Getter 참조 안정성 확보
**문제:** `?? []` 패턴으로 인해 매번 새로운 배열 참조 생성
**파일:** `stores/project-store.ts`

**수정:**
```typescript
// BEFORE
getSelectedResearchItems: (projectId) => {
  const items = get().researchItems[projectId] ?? []  // ❌ 새 배열
  const selectedIds = get().selectedResearchIds[projectId] ?? []  // ❌ 새 배열
  return items.filter((item) => selectedIds.includes(item.id))
}

// AFTER
getSelectedResearchItems: (projectId) => {
  const items = get().researchItems[projectId]
  const selectedIds = get().selectedResearchIds[projectId]
  if (!items || !selectedIds) return EMPTY_ARRAY as ResearchItem[]  // ✅ 동일 참조
  return items.filter((item) => selectedIds.includes(item.id))
}
```

### 5. Production Source Map 활성화
**문제:** production 디버깅 불가능
**파일:** `next.config.js`

**수정:**
```javascript
const nextConfig = {
  // ...
  productionBrowserSourceMaps: true,  // ✅ 추가
}
```

---

## 📊 검증 결과

| 항목 | 결과 | 비고 |
|------|------|------|
| Type Check | ✅ Pass | 모든 타입 오류 해결 |
| Build | ✅ Pass | 15 routes 정상 생성 |
| Bundle Size | ✅ 안정 | 미미한 변화만 |
| Error Boundary | ✅ 추가 | 2개 파일 신규 생성 |

---

## 🚀 Vercel 배포 체크리스트

```bash
# 1. 캐시 정리
rm -rf .next

# 2. 빌드 테스트
npm run build

# 3. Vercel 배포
vercel --prod
```

### 배포 후 검증
- [ ] `/projects/new` 정상 접속
- [ ] 정보성 글 생성 → research 페이지 진입
- [ ] 맛집 글 생성 → 매장 검색 → research 페이지 진입
- [ ] research 페이지에서 새로고침
- [ ] 브라우저 콘솔에 React #185 없음
- [ ] 임의로 오류 발생 시 error boundary 표시

---

## 📝 수정된 파일 목록

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `stores/project-store.ts` | 수정 | useRestaurantDraftVersions 제거, getter 안정화 |
| `features/draft/restaurant/components/restaurant-draft-helper.tsx` | 수정 | hook 대신 selector 사용 |
| `app/error.tsx` | 신규 | 최상위 error boundary |
| `app/projects/[id]/research/error.tsx` | 신규 | research 페이지 error boundary |
| `next.config.js` | 수정 | productionBrowserSourceMaps 추가 |

---

## 🎯 예상 효과

### React #185 해결
- **원인:** useRestaurantDraftVersions hook의 전체 store 구독
- **해결:** 개별 selector 사용으로 변경
- **기대:** research 페이지 정상 진입 및 사용

### Error Handling 개선
- **Before:** uncaught exception → white screen
- **After:** error boundary → 사용자 친화적 메시지

### 디버깅 개선
- **Before:** production에서 minified 오류만 확인 가능
- **After:** source map으로 원본 코드 디버깅 가능

---

## ⚠️ 주의사항

### localStorage 상태 초기화
일부 사용자는 이전 버전의 상태 데이터를 가지고 있을 수 있습니다.
React #185가 지속될 경우 브라우저 개발자 도구에서:
```javascript
localStorage.clear()
location.reload()
```

### 빌드 캐시
Vercel 배포 시 이전 빌드 캐시가 남아있을 수 있습니다.
반드시 캐시 없이 재배포하세요.

---

## 🔮 다음 단계 (권장)

### P1 (고priority)
- Sentry 설치: production 에러 추적
- Playwright 설치: 핵심 플로우 E2E 테스트

### P2 (중priority)
- React Query 도입: 서버 상태 관리 분리
- Zustand selector 전면 검토

---

## ✅ 마무리

**React #185의 주요 원인이었던 useRestaurantDraftVersions hook을 제거하고, error boundary를 추가하여 운영 안정성을 크게 개선했습니다.**

**바로 Vercel에 배포하셔도 됩니다.**
