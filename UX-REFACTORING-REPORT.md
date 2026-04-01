# 프로젝트 생성/작성 UX 재구성 보고서

**작업 일시:** 2026-04-01  
**목표:** 프로젝트 생성 UX 단순화 및 진입 구조 재배치  
**원칙:** 기존 코드 최소 수정, 타입/스토어 호환성 유지

---

## 1. 수정한 파일 목록

### 신규 파일
| 파일 | 설명 |
|------|------|
| `app/(dashboard)/threads/new/page.tsx` | 스레드 글 별도 생성 페이지 |
| `app/(dashboard)/karrot/new/page.tsx` | 당근 글 별도 생성 페이지 |

### 수정 파일
| 파일 | 변경 내용 |
|------|-----------|
| `components/layout/side-nav.tsx` | 좌측 메뉴 재구성 (새 글쓰기/스레드/당근 분리) |
| `app/(dashboard)/projects/new/page.tsx` | 2타입 단순화, title 제거, 매장 검색 통합 |
| `types/threads.ts` | tone 타입 'witty' → 'friendly' 변경 |
| `lib/ai/schemas/threads-draft.ts` | tone enum 변경 |
| `lib/ai/prompts/threads-draft.ts` | tone label 변경 |
| `lib/qa/threads-settings-qa.ts` | 테스트 데이터 tone 변경 |
| `app/(dashboard)/projects/[id]/draft/settings/page.tsx` | tone 타입 일치 수정 |

---

## 2. 변경된 UX 구조 요약

### 좌측 사이드바 메뉴
```
Before:
├── 대시보드
├── 프로젝트 (/projects/new) - 4타입 모두
└── 설정

After:
├── 대시보드
├── 새 글쓰기 (/projects/new) - 정보성/맛집만
├── 스레드 글 (/threads/new) - 별도 진입
├── 당근 글 (/karrot/new) - 별도 진입
├── 프로젝트 목록 (/projects) - 리스트
└── 설정
```

### /projects/new (새 글쓰기)
```
Before:
├── 4개 타입 카드 (정보성/맛집/스레드/당근)
├── 프로젝트 제목 입력 (필수)
├── 주제 입력
├── 타겟 독자 입력
├── 톤 선택
└── 타입별 추가 필드

After:
├── 2개 타입 카드 (정보성 글 / 맛집 글)
│   ├── 정보성 글: 주제 + 키워드(선택)
│   └── 맛집 글: 매장명 검색 → 결과 선택
└── 프로젝트 제목 없음 (자동 생성)
```

### 정보성 글 생성 흐름
```
[주제 입력] → [키워드(선택)] → [글쓰기 시작]
                 ↓
        [자동 title = 주제]
                 ↓
        [/projects/{id}/research]
```

### 맛집 글 생성 흐름
```
[매장명 입력] → [검색] → [결과 리스트] → [매장 선택]
                                          ↓
                              [자동 title = 매장명]
                                          ↓
                              [/projects/{id}/research]
                                          ↓
                              [기존 research/draft 흐름 유지]
```

### 스레드 글 진입 (/threads/new)
```
[주제 입력] → [목적 선택: 맛집/정보/브랜딩]
                ↓
        [전략 선택: 스토리/꿀팁/공감]
                ↓
        [톤 선택] → [훅 입력(선택)]
                ↓
        [/projects/{id}/draft/settings]
```

### 당근 글 진입 (/karrot/new)
```
[목적 선택: 광고/맛집/동네소통]
        ↓
[동네 입력] → [주제 입력]
        ↓
[자동 title = "[동네] 주제"]
        ↓
[/projects/{id}/draft/settings]
```

---

## 3. 프로젝트 제목 제거 처리 방식

### UI 제거 범위
- `/projects/new`: 프로젝트 제목 입력 필드 완전 제거
- `/threads/new`: 프로젝트 제목 입력 필드 없음 (처음부터 없었음)
- `/karrot/new`: 프로젝트 제목 입력 필드 없음 (처음부터 없었음)

### 낮부 title 자동 생성 방식

| 타입 | 자동 생성 규칙 | 예시 |
|------|---------------|------|
| 정보성 글 | 주제 그대로 | "노션으로 블로그 운영하는 방법" |
| 맛집 글 | 선택된 매장명 | "파스타 하우스 강남점" |
| 스레드 글 | 주제 그대로 | "강남역 파스타 추천 TOP 5" |
| 당근 글 | [동네] 주제 | "[역삼동] 신규 오픈 카페 소개" |

### 데이터베이스/Store 영향
- `Project.title` 필드는 그대로 유지 (레거시 호환성)
- `createProject` 호출 시 자동 생성된 title 전달
- 기존 데이터와 완전 호환 (기존 프로젝트는 기존 title 유지)

---

## 4. Restaurant 검색/선택 흐름 연결 방식

### 재사용한 기존 로직
| 컴포넌트/함수 | 재사용 위치 |
|-------------|------------|
| `searchPlacesAction()` | `/projects/new` 매장 검색 |
| `PlaceCandidate` 타입 | 검색 결과 리스트 |
| `CanonicalPlace` 타입 | 선택된 매장 정규화 |
| `setPlaceCandidates()` | 선택 후 store 저장 |

### 검색 흐름 구현
```typescript
// 1. 매장명 입력 + 지역(선택)
// 2. 검색 버튼 클릭 또는 Enter
// 3. searchPlacesAction(query, region) 호출
// 4. 결과 리스트 표시 (PlaceCandidate[])
// 5. 사용자가 매장 선택
// 6. 선택된 매장으로 자동 정보 채움
// 7. 프로젝트 생성 시 store에 후보 저장
```

### 검색 실패/Fallback 처리
| 상황 | 처리 방식 |
|------|----------|
| 검색 결과 없음 | 직접 입력 폼 노출 (매장명/카테고리) |
| 검색 오류 | 에러 메시지 + 직접 입력 폼 노출 |
| API 실패 | Mock 데이터로 폼백 (기존 로직) |

---

## 5. Restaurant에서 제거/숨김 처리한 항목

### 제거된 입력 필드
- 프로젝트 제목 (자동 생성)
- 타겟 독자 (빈 문자열 기본값)
- 톤 선택 ('friendly' 기본값)

### 남은 입력 필드
- 매장명 (검색용)
- 지역 (선택, 검색 보조)
- 검색 결과 선택

### 낮부 데이터 처리
```typescript
restaurantMeta: {
  placeName: autoTitle,           // 자동 생성
  region: form.region || '',      // 입력 또는 선택된 주소
  category: selectedPlace?.category || '음식점',
  visitPurpose: '',               // 빈값
  targetAudience: '',             // 빈값 (제거됨)
}
```

---

## 6. Threads/Karrot 좌측 메뉴 분리 방식

### 라우팅 구조
| 페이지 | 라우트 | 진입점 |
|--------|--------|--------|
| 정보성 글 생성 | `/projects/new` | 사이드바 "새 글쓰기" |
| 맛집 글 생성 | `/projects/new` | 사이드바 "새 글쓰기" → 타입 선택 |
| 스레드 글 생성 | `/threads/new` | 사이드바 "스레드 글" |
| 당근 글 생성 | `/karrot/new` | 사이드바 "당근 글" |

### 기존 코드 재사용
| 신규 페이지 | 재사용한 기존 구조 |
|------------|------------------|
| `/threads/new` | 기존 `/projects/new`의 threads 폼 구조 |
| `/karrot/new` | 기존 `/projects/new`의 karrot 폼 구조 |

### 사이드바 메뉴 아이템
```typescript
const menuItems = [
  { icon: "dashboard", label: "대시보드", href: "/" },
  { icon: "edit_document", label: "새 글쓰기", href: "/projects/new" },
  { icon: "chat", label: "스레드 글", href: "/threads/new" },
  { icon: "store", label: "당근 글", href: "/karrot/new" },
  { icon: "folder", label: "프로젝트 목록", href: "/projects" },
  { icon: "settings", label: "설정", href: "/settings" },
];
```

---

## 7. 기존 기능 영향도

### Informational (정보성 글)
| 항목 | 영향 |
|------|------|
| 생성 흐름 | ✅ title 자동 생성으로 단순화 |
| research 단계 | ✅ 변경 없음 |
| draft/settings | ✅ 변경 없음 |
| 기존 데이터 | ✅ 완전 호환 |

### Restaurant (맛집 글)
| 항목 | 영향 |
|------|------|
| 생성 흐름 | ✅ 검색 기반으로 개선, title/targetAudience/tone 제거 |
| 검색/정규화 | ✅ 기존 로직 그대로 재사용 |
| research 단계 | ✅ 변경 없음 |
| draft/rewrite | ✅ 변경 없음 |
| 기존 데이터 | ✅ 완전 호환 |

### Threads (스레드 글)
| 항목 | 영향 |
|------|------|
| 진입점 | `/projects/new` → `/threads/new` 이동 |
| 생성 로직 | ✅ 기존 로직 재사용 |
| draft/settings | ✅ 변경 없음 |
| 기존 데이터 | ✅ 완전 호환 |

### Karrot (당근 글)
| 항목 | 영향 |
|------|------|
| 진입점 | `/projects/new` → `/karrot/new` 이동 |
| 생성 로직 | ✅ 기존 로직 재사용 |
| draft/settings | ✅ 변경 없음 |
| 기존 데이터 | ✅ 완전 호환 |

---

## 8. Type-Check 결과

```bash
$ npx tsc --noEmit
✅ 성공 (에러 없음)
```

### 타입 변경 사항
- `ThreadsProjectMeta.tone`: `'witty'` → `'friendly'`
- 관련 스키마/프롬프트/컴포넌트 일괄 수정
- 기존 데이터 마이그레이션 불필요 (런타임 문자열)

---

## 9. Build 결과

```bash
$ npx next build
✅ 성공

Route (app)                                 Size  First Load JS
┌ ○ /                                    1.63 kB         107 kB
├ ○ /karrot/new                          2.03 kB         151 kB  ← 신규
├ ○ /projects/new                        3.53 kB         152 kB  ← 수정
├ ○ /threads/new                         2.95 kB         152 kB  ← 신규
├ λ /projects/[id]/draft/settings        7.79 kB         159 kB
├ λ /projects/[id]/research              18.6 kB         170 kB
...
```

---

## 10. 남은 TODO / 추후 개선 포인트

### 당장 처리 불필요
- [ ] `/projects` 목록 페이지 (현재는 사이드바 링크만 존재)
- [ ] Threads/Karrot 생성 후 research 단계 연결 (현재는 draft/settings로 직접)
- [ ] 매장 검색 자동완성 (debounce 기반)

### 권장 개선사항
- [ ] 검색 결과 지도 연동 (선택적)
- [ ] 매장 이미지 미리보기 (API 제공 시)
- [ ] 최근 검색 기록

---

## 결론

| 항목 | 결과 |
|------|------|
| Type Check | ✅ Pass |
| Build | ✅ Pass |
| 기존 타입 호환성 | ✅ 유지 |
| 기존 Store 호환성 | ✅ 유지 |
| 레거시 데이터 호환성 | ✅ 유지 |
| **종합 판정** | **✅ UX 재구성 완료** |

프로젝트 생성 UX가 성공적으로 단순화되었습니다:
1. `/projects/new`는 정보성 글 / 맛집 글 2타입만
2. 프로젝트 제목 입력 없이 자동 생성
3. 맛집 글은 매장 검색 → 선택 흐름
4. 스레드/당근 글은 좌측 메뉴에서 별도 진입
5. 기존 모든 기능(research/draft/rewrite)은 그대로 유지
