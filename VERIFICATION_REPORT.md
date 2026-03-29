# Verification Report

## 검증 일시
2026-03-28

## 검증 범위
- 프로젝트 생성 → 리서치 → 초안 설정 → 초안 에디터 흐름
- Restaurant 리서치 → Draft Generation 연결 (AI Provider 연동)
- Restaurant Draft Variation/Regenerate 기능 (UX 보정 완료)
- 버전 전환 시 미저장 내용 보호 (Dirty State Protection)
- 버전 비교 (Diff) UI
- 버전 삭제 + 사용자 라벨 편집
- **Informational Draft AI 연동 + 민감 도메인 안전성** ← NEW

---

## 1. /projects/new → /projects/[id]/research 이동

### 상태: ✅ 정상

**코드 검증:**
- `handleSubmit`에서 `createProject()` 호출 후 `router.push()`로 이동
- 라우트 경로: `/projects/${project.id}/research`

---

## 2. research 선택 상태 유지

### 상태: ✅ 정상

**코드 검증:**
- `toggleResearchSelection`으로 선택/해제
- `selectedResearchIds[projectId]`에 ID 배열 저장
- persist `partialize`에 포함됨

---

## 3. draft/settings → draft/edit 설정 반영

### 상태: ✅ 정상

---

## 4. draft/edit 수정 후 새로고침 유지

### 상태: ✅ 정상

---

## 5. Restaurant Draft Variation / Regenerate 기능

### 상태: ✅ UX 보정 완료

**구현된 기능:**
- ✅ 버전 히스토리 목록 표시 (initial, regenerate, variation 구분)
- ✅ Variation 버튼 그리드 (더 짧게, 더 정보형, 더 친근하게, 메뉴 강조, 분위기 강조, 위치·가격)
- ✅ 버전 선택 시 Editor 내용 자동 전환
- ✅ 로딩 상태 표시 (생성 중...)
- ✅ 현재 편집 중인 버전 정보 표시
- ✅ AI/기본(fallback) 생성 구분 배지

---

## 6. 버전 전환 시 미저장 내용 보호 (NEW)

### 상태: ✅ 구현 완료

### 문제
사용자가 editor에서 내용을 수정한 뒤 다른 버전을 클릭하면, 미저장 편집 내용이 즉시 덮어써질 위험이 있었음.

### 해결책
**Dirty State Detection + Confirmation Dialog**

#### 구현 내용

1. **Dirty State 감지** (`page.tsx`)
```typescript
const [originalContent, setOriginalContent] = useState<string>('')
const isDirty = useMemo(() => content !== originalContent, [content, originalContent])
```

2. **버전 전환 요청 콜백** (`page.tsx` → `RestaurantDraftHelper`)
```typescript
<RestaurantDraftHelper 
  projectId={projectId} 
  onVersionSwitchRequest={handleVersionSwitchRequest}
  isDirty={isDirty}
/>
```

3. **미저장 변경사항 경고 다이얼로그** (`page.tsx`)
- 현재 편집 내용이 저장되지 않았음을 알림
- 대상 버전 이름 표시
- "취소 (계속 편집)" / "전환하기" 버튼 제공

4. **시각적 피드백** (`restaurant-draft-helper.tsx`)
- 현재 버전 정보 박스: blue → amber 색상 변경
- "⚠️ 미저장 변경" 배지 표시
- 버전 목록 상단에 "미저장 변경" 배지
- 안내 문구: ⚠️ 아이콘 + 경고 메시지

### UX 흐름

```
1. 사용자가 editor 내용 수정
   ↓
2. isDirty = true (원본과 비교)
   ↓
3. 다른 버전 클릭
   ↓
4. 확인 다이얼로그 표시
   ↓
5-1. "취소" → 다이얼로그 닫힘, 현재 버전 유지
5-2. "전환하기" → 해당 버전으로 전환
```

### 화면 구성

**미저장 변경사항 경고 다이얼로그:**
- 제목: "미저장 변경사항" (amber 경고 아이콘)
- 본문: "현재 편집 중인 내용이 저장되지 않았습니다."
- 세부: "{대상버전}으로 전환하면 현재 변경사항이 사라집니다."
- 버튼: "취소 (계속 편집)" / "전환하기"

**헬퍼 패널 dirty 상태 표시:**
- 현재 버전 박스: amber 테마
- "⚠️ 미저장 변경" 배지
- 버전 목록 상단: "미저장 변경" 배지
- 안내 문구: "⚠️ 현재 편집 중인 내용이 저장되지 않았습니다..."

---

## 7. 버전 비교 (Diff) UI

### 상태: ✅ 구현 완료

### 문제
사용자가 여러 variation을 생성한 후, 각 버전 간 어떤 차이가 있는지 시각적으로 확인할 수 없었음.

### 해결책
**Line-based Diff + Visual Comparison UI**

#### 구현 내용

1. **Diff 유틸리티** (`lib/diff/text-diff.ts`)
```typescript
export function diffTextByLines(left: string, right: string): DiffLine[]
export function diffStringArrays(left: string[], right: string[]): TagDiffResult
export function isTextChanged(left: string, right: string): boolean
```

2. **Diff View 컴포넌트** (`restaurant-draft-diff-view.tsx`)
- 제목 비교 (before/after 카드)
- 본문 라인 기준 diff (추가/제거/변경)
- 해시태그 비교 (추가/제거/공통)
- 변경사항 요약 표시

3. **비교 모드** (`restaurant-draft-helper.tsx`)
- "버전 비교하기" 버튼 클릭 → 비교 모드 활성화
- 버전 목록에서 비교 대상 선택 (볼라 테마)
- 두 버전 선택 시 Diff View 자동 표시

### UX 흐름

```
1. 여러 variation 생성
   ↓
2. "버전 비교하기" 버튼 클릭
   ↓
3. 버전 목록에서 비교 대상 선택 (볼라 테마)
   ↓
4. Diff View 표시
   - 변경사항 요약
   - 제목 비교
   - 본문 diff (초록: 추가, 빨강: 제거, 노랑: 변경)
   - 해시태그 비교
   ↓
5. "닫기" 버튼으로 비교 종료
```

### 화면 구성

**Diff View:**
- 헤더: "버전 비교" + 변경사항 요약 (예: "제목 변경 · 본문: +2줄, -1줄")
- 버전 정보: 기준 버전(blue) / 비교 버전(purple) 카드
- 제목 비교: before(red) / after(green) 카드
- 본문 diff: 라인별 색상 구분
  - 추가: 초록 배경 + `+` 아이콘
  - 제거: 빨강 배경 + `−` 아이콘  
  - 변경: 노랑 배경 + `~` 아이콘 (before/after 함께)
  - 동일: 회색 배경 + `·` 아이콘
- 해시태그: 추가(초록) / 제거(빨강 취소선) / 공통(회색)

**버전 목록 (비교 모드):**
- 제목: "비교 대상 선택"
- 현재 버전: 주황 테마 (선택 불가)
- 비교 대상: 볼라 테마 + "비교 중" 배지
- 안내 문구: "비교할 버전을 클릭하여 선택하세요"

### Diff 알고리즘

**라인 기준 diff:**
- 빈 줄 제거 후 라인 단위 비교
- 동일 라인: unchanged
- 기준에만 있음: removed
- 비교에만 있음: added
- 둘 다 있지만 다름: changed (before/after 함께 표시)

**해시태그 diff:**
- Set 기반 비교
- 추가: 오른쪽에만 있는 태그
- 제거: 왼쪽에만 있는 태그
- 공통: 양쪽 모두 있는 태그

---

## 8. Build / Type Check

### 상태: ✅ 성공

```bash
npm run build
# ✅ Compiled successfully
# ✅ Linting and checking validity of types
# ✅ Generating static pages
```

---

## QA 시나리오별 결과

### 시나리오 1: 기본 생성 후 variation
1. draft 생성 ✅
2. edit 페이지 이동 ✅
3. "더 짧게" 클릭 → 새 버전 생성 ✅
4. 버전 목록에서 initial/shorter 구분 ✅
5. shorter 선택 시 editor 반영 ✅

### 시나리오 2: 여러 variation 누적
1. initial 생성 ✅
2. 더 친근하게 ✅
3. 메뉴 강조 ✅
4. 분위기 강조 ✅
5. 버전 누적 확인 ✅
6. current 표시 확인 ✅

### 시나리오 3: fallback variation
1. AI provider 비활성 또는 mock ✅
2. variation 생성 ✅
3. fallback source 표시 ("기본" 배지) ✅
4. UX가 "오류"가 아닌 "기본 버전"으로 표시 ✅

### 시나리오 4: 새로고침
1. variation 여러 개 생성 ✅
2. 특정 버전 선택 ✅
3. 새로고침 → 버전 목록/선택/editor 상태 유지 ✅

### 시나리오 5: 빈 상태
1. draft 없이 edit 진입 → "아직 생성된 초안이 없습니다" 표시 ✅
2. 매장 정보 없음 → "매장 정보가 없습니다" 표시 ✅
3. 리뷰 요약 없음 → "리뷰 요약이 없습니다" 표시 ✅

### 시나리오 6: dirty state 보호
1. editor 내용 수정 ✅
2. 다른 버전 클릭 ✅
3. 확인 다이얼로그 표시 ✅
4. "취소" 클릭 → 현재 버전 유지 ✅
5. "전환하기" 클릭 → 대상 버전으로 전환 ✅
6. 미저장 상태에서 헬퍼 패널 amber 테마 표시 ✅

### 시나리오 7: 버전 비교
1. 여러 variation 생성 ✅
2. "버전 비교하기" 버튼 클릭 ✅
3. 버전 목록에 "비교 대상 선택" 표시 ✅
4. 비교 대상 버전 클릭 → 볼라 테마로 표시 ✅
5. Diff View 표시 ✅
   - 변경사항 요약 ✅
   - 제목 비교 (before/after) ✅
   - 본문 diff (색상 구분) ✅
   - 해시태그 비교 ✅
6. "닫기" 버튼 → 비교 모드 종료 ✅

### 시나리오 8: 버전 라벨 편집 + 삭제
1. 버전 목록에서 "이름 수정" 버튼 클릭 ✅
2. 라벨 입력 (예: "최종안", "당근용") ✅
3. 저장/취소 버튼 ✅
4. 수정된 라벨 표시 ✅
5. "삭제" 버튼 클릭 → 확인 다이얼로그 ✅
6. 삭제 후 목록 갱신 ✅
7. 현재 버전은 삭제 불가 (버튼 미표시) ✅

### 시나리오 9: Informational Draft 일반 생성 (NEW)
1. Informational 프로젝트 생성 ✅
2. Source 1개 이상 준비 ✅
3. Draft Settings 진입 → Source/Outline 상태 확인 ✅
4. 설정 저장 → 초안 생성 중 로딩 표시 ✅
5. Edit 화면에서 초안 표시 확인 ✅

### 시나리오 10: Informational 민감 도메인 - 의료 (NEW)
1. 주제에 "의료/건강" 키워드 포함 ✅
2. Draft Settings에서 민감 도메인 안내 패널 표시 ✅
3. 초안 생성 ✅
4. 결과에 "진단/처방/치료 확정" 표현 없음 ✅
5. "~으로 알려져 있다" 등 가능성 표현 사용 ✅

### 시나리오 11: Informational 민감 도메인 - 금융 (NEW)
1. 주제에 "금융/투자" 키워드 포함 ✅
2. Draft Settings에서 민감 도메인 안내 패널 표시 ✅
3. 초안 생성 ✅
4. 결과에 "수익 보장/투자 권유" 표현 없음 ✅
5. 리스크 언급 균형 확인 ✅

### 시나리오 12: Informational Source 부족 (NEW)
1. Source 없이 Draft Settings 진입 ✅
2. 노란색 경고 메시지 표시 ✅
3. "생성은 가능하지만..." 안내 문구 ✅
4. 초안 생성 버튼 활성화 (제한적 기능) ✅
5. Fallback 초안 생성 확인 ✅

### 시나리오 13: Informational AI Unavailable (NEW)
1. AI 설정 없음 또는 mock 모드 ✅
2. Draft 생성 시도 ✅
3. Deterministic fallback draft 생성 ✅
4. 앱이 깨지지 않고 자연스러운 결과 표시 ✅

---

## 수정한 파일 목록

| 파일 | 수정 내용 |
|------|----------|
| `features/draft/restaurant/components/restaurant-draft-helper.tsx` | 버전 관리 UI, Variation 버튼, 로딩 상태, 빈 상태 개선, dirty state 표시, 버전 비교 모드, 버전 라벨 편집 + 삭제 UI |
| `features/draft/restaurant/components/restaurant-draft-diff-view.tsx` | 버전 비교 Diff View 컴포넌트 (제목/본문/해시태그 비교) |
| `lib/diff/text-diff.ts` | 텍스트 diff 유틸리티 (라인 기준 diff, 태그 비교) |
| `stores/project-store.ts` | `switchDraftVersion`, `updateDraftVersionLabel`, `removeDraftVersion`, **`createInformationalDraft`** 액션 추가 |
| `app/(dashboard)/projects/[id]\draft\edit/page.tsx` | dirty state 감지, 버전 전환 경고 다이얼로그, 미저장 내용 보호 |
| `app/(dashboard)/projects/[id]\draft\settings/page.tsx` | **Informational Draft Settings UX 개선** (source/outline 체크, 민감 도메인 안내, 로딩 상태) |
| `lib/ai/informational-draft.ts` | **AI 연동 + 민감 도메인 안전성** (도메인별 시스템 프롬프트, fallback 구현) |

---

## 남은 UX TODO (추후 개선)

1. ~~**버전 삭제 기능**~~ ✅ 완료
2. ~~**버전 라벨 편집**~~ ✅ 완료
3. ~~**버전 비교** - 두 버전 간 diff 표시~~ ✅ 완료
4. ~~**Informational Draft AI 연동**~~ ✅ 완료
5. **자동 저장 개선** - 버전 전환 시 미저장 내용 임시 저장
6. **Undo/Redo** - 버전 전환 취소 기능
7. **Diff 고급 기능** - 단어 단위 하이라이트, diff 필터링 (변경만 보기 등)
8. **Informational Versioning** - Informational draft도 버전 관리 기능 적용
9. **Citation UI** - 소스 출처 시각화 및 인용구 관리

---

## 결론

Restaurant Draft 기능이 **런타임 UX 기준으로 안정화**되었습니다.

### 완료된 핵심 기능

**1. Variation/Regenerate**
- ✅ 초안 생성 및 변형 (6가지 프리셋)
- ✅ 버전 히스토리 관리
- ✅ 버전 간 전환

**2. Dirty State Protection**
- ✅ 미저장 변경사항 자동 감지
- ✅ 버전 전환 시 확인 다이얼로그
- ✅ 시각적 피드백 (amber 테마)

**3. 버전 비교 (Diff) UI**
- ✅ 라인 기준 diff 알고리즘
- ✅ 제목/본문/해시태그 비교
- ✅ 시각적 차이 강조 (색상 + 아이콘)
- ✅ 변경사항 요약

**4. 버전 관리 (삭제 + 라벨 편집)**
- ✅ 버전별 사용자 라벨 편집
- ✅ 불필요한 버전 삭제
- ✅ 삭제 확인 다이얼로그
- ✅ 현재 버전 삭제 보호

**5. Informational Draft AI 연동** ← NEW
- ✅ `createInformationalDraft` store 액션 구현
- ✅ AI provider 연동 (`generateInformationalDraft`)
- ✅ Deterministic fallback 구현
- ✅ Source/Outline 체크 및 안내 메시지
- ✅ 민감 도메인 자동 감지 및 안전 규칙 적용

### 민감 도메인 안전성

**의료/건강:**
- ✅ 진단, 처방, 치료 확정 표현 금지
- ✅ "~하면 치유된다", "효과가 입증되었다" 등 단정 표현 금지
- ✅ "~으로 알려져 있다", "연구 결과 ~한 경향이 있다" 등 가능성 표현 사용
- ✅ 개인 건강 상태는 다를 수 있음 명시

**금융/투자:**
- ✅ "무조건 수익", "확실한 수익", "X% 보장" 등 표현 금지
- ✅ 특정 상품 추천/권유 표현 금지
- ✅ 투자 리스크 균형 있게 언급
- ✅ "일반 정보 제공용, 투자 판단은 본인 책임" 안내

**교육/학습:**
- ✅ "~하면 합격한다", "성적이 X% 향상된다" 등 결과 보장 금지
- ✅ 특정 학습법이 모두에게 효과적이라는 단정 금지
- ✅ 개인의 학습 환경/수준에 따라 결과가 다름 명시

### Informational Draft Settings UX 개선
- ✅ Source/Outline 유무에 따른 경고 메시지
- ✅ 민감 도메인 선택 시 안내 패널 표시
- ✅ 로딩 상태 표시 ("정보성 초안 생성 중...")
- ✅ 생성 버튼 상태 관리 (isGenerating)
- ✅ Source 부족 시에도 생성 가능하나 안내 문구 표시

### 사용자 흐름 (전체)

```
1. 초안 생성
2. Variation 버튼으로 여러 버전 생성
3. 버전 비교하기 → 차이 확인
4. 원하는 버전 선택 → 편집
5. 버전 정리:
   - "이름 수정" → 라벨 변경 (예: "최종안", "당근용")
   - "삭제" → 불필요한 버전 제거
6. 다른 버전 클릭 시:
   - 변경 없음 → 바로 전환
   - 변경 있음 → 확인 다이얼로그 → 선택
```

### 기술적 안정성
- AI provider 실패 시 fallback 자동 전환 (Restaurant + Informational)
- 새로고침 후 상태 유지 (persist)
- 타입 안전성 유지 (any 미사용)
- 최소 수정 원칙 준수
- 민감 도메인 자동 감지 및 안전 규칙 적용
- Build 성공 (13.3KB draft/edit 페이지, 4.58KB draft/settings 페이지)


---

## 9. /draft/edit 페이지 UX Polish (2026-03-28)

### 상태: ✅ 완료

### 개요
리디자인된 `/projects/[id]/draft/edit` 페이지의 실제 사용성을 개선하는 QA + UX polish 작업.
기능 추가 없이 레이아웃, 간격, 계층, 색상, 반응형을 조정하여 더 정돈된 SaaS 에디터 느낌을 구현.

### 수정된 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `app/(dashboard)/projects/[id]/draft/edit/page.tsx` | 헤더 간소화, 토스트/다이얼로그 스타일 개선, responsive layout 조정 |
| `features/draft/restaurant/components/restaurant-draft-helper.tsx` | Section 접기/펼치기, Version UX 정돈, Diff 섹션 개선 |
| `features/draft/restaurant/components/restaurant-draft-diff-view.tsx` | 색상 시스템 통일, compact UI, 변경점 압축 표시 |
| `features/draft/informational/components/informational-draft-helper.tsx` | Section 접기/펼치기, Citation UI 정돈 |

### A. Header / Action Hierarchy 개선

**변경 전:**
- 배지 3개 (타입, 미저장, 소스) + 메타정보 4개 = 과도한 visual clutter
- 설정 버튼이 text + icon으로 공간 차지

**변경 후:**
```
[타이틀]                    [AutoSave 상태] [설정 아이콘]
[타입 · 단어수 · 톤]            [Last Saved]
```
- 미저장 badge를 타이틀 옆에만 표시 (중복 제거)
- 소스 badge 제거 (불필요한 정보)
- 설정 버튼을 아이콘만으로 변경 (secondary action 약화)
- auto-save 상태를 badge-like container로 묶어 정리

### B. Editor Workspace 개선

**변경 사항:**
- Editor에 `min-w-0` 추가 (flex item overflow 방지)
- Helper sidebar에 `flex-shrink-0` 및 responsive class 추가
- 모바일(< md)에서 helper 숨김 (에디터 집중도 확보)

### C. Helper Sidebar 개선

**Section 컴포넌트 개선:**
- 접기/펼치기 기능 추가 (기본값: collapsed)
- 버전이 3개 이상이면 자동으로 접힘
- hover 시 배경색 변화로 인터랙티브 피드백

**Version List 정돈:**
```
변경 전: border + bg-color 강조 (두꺼운 테두리)
변경 후: border-left만 강조 (subtle한 시각적 구분)

변경 전: badge 여러 개 (AI, 재생성, 변형)
변경 후: mode에 따라 compact text badge만 표시

변경 전: delete/switch 버튼 항상 표시
변경 후: hover 시에만 표시 (공간 절약, 산만함 감소)
```

**버전 비교 (Diff):**
- 2개 이상 버전이 있을 때만 활성화
- 기본적으로 접힌 상태
- Diff view를 helper에 내장 (모달이 아닌 inline)

### D. Diff UI 개선

**색상 시스템 통일:**
```
변경 전: Tailwind 기본 색상 (green-50, red-50, amber-50)
변경 후: 디자인 시스템 변수 사용

added:    var(--accent-secondary-light) / var(--accent-secondary)
removed:  var(--warning-light) / var(--accent-warning)
changed:  var(--accent-info-light) / var(--accent-info)
```

**컴팩트 UI:**
- 헤더 높이 축소 (py-4 → py-2)
- 폰트 크기 축소 (text-sm → text-xs → text-[10px])
- 버전 정보 2열 그리드 유지하되 패딩 축소
- 변경사항 없을 때 아이콘 + 텍스트만 표시

**본문 Diff 압축:**
- 모든 unchanged 라인 표시 → 변경점 주변 라인만 표시
- max-h-64 스크롤 영역 지정

### E. Citation / Warning UI 개선

**변경 전:**
- Warning: 노란색 배경(#946F00) + warning 아이콘 (공격적)
- Citation: badge-success 사용 (너무 튀는 색상)

**변경 후:**
- Warning: 회색 계열로 변경 (var(--text-muted), info 아이콘)
- Citation: 작은 숫자 배지만 표시 (accent-secondary-light)
- Source 목록 최대 5개까지만 표시 후 축소

### F. Responsive 개선

**Breakpoint 처리:**
```
Desktop (lg+):  w-80 helper
Tablet (md-lg): w-72 helper
Mobile (< md):  helper 숨김 (focus on editor)
```

**헤더 액션:**
- 좁은 화면에서도 타이틀과 액션이 겹치지 않음
- min-w-0으로 truncate 적용

### G. 상태 메시지 / 문구 Polish

**Unsaved Changes Dialog:**
- 모달 → compact card 스타일
- 배경색: rgba(51, 71, 91, 0.5) (shell 색상 기반)
- 버튼: secondary / primary 명확한 계층

**Notification Toast:**
- colored background → white card + colored border-left
- 아이콘 추가 (check_circle / error)
- 더 subtle하고 전문적인 느낌

### H. Visual Hierarchy 정리

**배지 사용 규칙 정립:**
```
badge-amber:  미저장/수정중 상태 (주의)
badge-coral:  CTA, 중요 액션
badge-domain: 타입 표시 (restaurant/informational)
badge-success: 완료/성공 상태
```

**섹션 헤더 통일:**
```
text-xs font-semibold uppercase tracking-wide
color: var(--text-tertiary)
```

### 검증 결과

- ✅ Build 성공 (12KB draft/edit 페이지)
- ✅ Type-check 통과
- ✅ Lint 오류 없음
- ✅ 디자인 시스템 변수 정상 사용
- ✅ 반응형 동작 확인

### 사용자 흐름 테스트 시나리오

1. **Restaurant draft edit 진입**
   - 헤더 정보 한눈에 확인 (타이틀, 타입, 단어수)
   - Helper 섹션 접힌 상태로 깔끔한 초기 화면

2. **Version 흐름**
   - 버전 클릭 → 펼쳐짐 → 현재 버전은 border-left로 구분
   - 다른 버전 hover → 전환/삭제 버튼 표시
   - 수정중 상태에서 버전 전환 → 확인 다이얼로그

3. **Diff 흐름**
   - "버전 비교" 섹션 펼침
   - 기준/비교 선택 → diff 표시
   - 색상이 부드럽게 변경됨

4. **Informational draft**
   - 인용 섹션이 접힌 상태로 깔끔함
   - 소스 목록이 과하지 않게 표시

5. **Mobile/narrow 화면**
   - Helper 사라짐 → 에디터 전체 폭 사용
   - 헤더 액션 정리됨

---

## 10. 최종 상태 요약

### 구현 완료된 기능
- ✅ 프로젝트 생성 → 리서치 → 초안 설정 → 에디터 흐름
- ✅ Restaurant Draft Generation (AI 연동 + fallback)
- ✅ Informational Draft Generation (AI 연동 + fallback)
- ✅ 버전 관리 (생성, 전환, 삭제, 라벨 편집)
- ✅ Variation 생성 (프리셋 기반)
- ✅ 버전 비교 (Diff UI)
- ✅ 미저장 내용 보호 (Dirty State Protection)
- ✅ 민감 도메인 안전성 (medical/finance/education)
- ✅ 인용 정보 표시 (Citation UI)
- ✅ HubSpot 스타일 디자인 시스템 적용
- ✅ 반응형 레이아웃

### 안정화된 UX 패턴
- Dark app shell + Light workspace 캔버스
- 2-column layout (editor + helper)
- Compact stacked sections with collapsible
- Subtle accent colors (coral, cyan, teal)
- Minimal shadows, border-based grouping
- Clear button hierarchy (primary 1개 원칙)

### 추후 개선 가능 영역 (미구현)
- 모바일용 helper 토글 버튼 (floating action)
- 키보드 단축키 (Ctrl+S 저장 등)
- 다크 모드 지원
- 버전 간 병합(merge) 기능
- 실시간 협업 (충돌 감지)


---

## 11. `/research` 페이지 HubSpot 스타일 리디자인 (2026-03-29)

### 상태: ✅ 완료

### 개요
`/projects/[id]/research` 화면을 HubSpot 레퍼런스 기반의 "엔터프라이즈 SaaS 리서치 워크스페이스"로 재구성.
기능 로직은 유지하되, UI/레이아웃/시각적 계층을 개선하여 사용자가 현재 준비 상태와 다음 액션을 바로 이해할 수 있도록 개선.

### 수정된 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `app/(dashboard)/projects/[id]/research/page.tsx` | Header 통합, readiness summary 연동, layout 구조 변경 |
| `app/(dashboard)/projects/[id]/research/components/research-header.tsx` | 신규 - 프로젝트 메타 + 준비 상태 pills |
| `features/research/restaurant/workspace.tsx` | 탭 UI 개선, panel 기반 레이아웃, 단계별 CTA 추가 |
| `features/research/restaurant/components/place-search-form.tsx` | 디자인 시스템 적용, 상태 메시지 개선 |
| `features/research/restaurant/components/place-candidate-list.tsx` | 디자인 시스템 적용, 소스 badge 개선 |
| `features/research/restaurant/components/place-profile-card.tsx` | panel 스타일 적용, 선택 상태 강조 |
| `features/research/restaurant/components/review-input-panel.tsx` | panel 스타일, 소스 선택 버튼 개선 |
| `features/research/restaurant/components/review-digest-card.tsx` | panel 스타일, sentiment badge 개선 |
| `features/research/restaurant/components/review-source-policy-notice.tsx` | subtle 스타일로 변경 |
| `features/research/informational/workspace.tsx` | 탭 UI 개선, readiness 연동 |
| `features/research/informational/components/topic-setup-tab.tsx` | panel 기반 2열 레이아웃 |

### A. Research Header + Readiness Summary

**신규 컴포넌트:** `ResearchHeader`

**구성:**
- 프로젝트 타입 badge (맛집/정보성)
- 준비 완료 badge (isComplete)
- 프로젝트 타이틀
- 리서치 흐름 설명
- 준비 상태 pills (3단계)

**Restaurant Readiness Pills:**
- 매장 선택 (완료/대기)
- 리뷰 N개 (완료/대기)
- 요약 생성 (완료/대기)

**Informational Readiness Pills:**
- 주제 설정 (완료/대기)
- 소스 N개 (완료/대기)
- 아웃라인 (완료/대기)

**스타일:**
- border-left 강조 (3px)
- accent-secondary (완료) / workspace-secondary (대기)
- material icons로 상태 표시

### B. Restaurant Research 영역 개선

**탭 네비게이션 개선:**
```
변경 전: 단순 border-bottom tabs
변경 후: card-style tabs with status icons

- 완료: check_circle icon
- 진행중: step number badge
- 대기: muted style
```

**3단계 흐름 정리:**

1. **매장 검색 탭**
   - PlaceSearchForm (panel)
   - Policy Notice (subtle)
   - Candidate List (panel with source badge)
   - Selected Place Card (border-left 강조)
   - 다음 단계 CTA (완료 시)

2. **리뷰 입력 탭**
   - 선택된 매장 정보 (compact bar)
   - ReviewInputPanel (panel)
   - 입력된 리뷰 목록 (panel)
   - 다음 단계 CTA (완료 시)

3. **요약 확인 탭**
   - 리뷰 요약 분석 (panel)
   - Sentiment badge
   - 전체 요약 (accent-interactive 강조)
   - 핵심 포인트 목록
   - 대표 인용구

**Empty State 통일:**
- material icons
- 제목 + 설명 + 액션 버튼
- dashed border + workspace-secondary 배경

### C. Informational Research 영역 개선

**탭 네비게이션 개선:**
- Restaurant와 동일한 패턴 적용
- 4단계: 주제 설정 → 소스 관리 → 핵심 포인트 → 아웃라인
- 단계별 활성화 조건 적용

**Topic Setup 탭:**
- 2열 레이아웃 (입력 / 결과)
- panel 기반 결과 표시
- 주제 범위, 독자 페르소나, 차별화 포인트, 추천 구조

### D. 상태 UI 통일

**Panel 컴포넌트:**
```
.panel - border, background
.panel-header - title + badge/action
.panel-body - content
```

**Badge 스타일:**
- `badge-domain`: 소스/타입 표시
- `badge-success`: 완료 상태
- `badge-info`: 카운트 표시
- `badge-warning`: 주의/대기

**Button 계층:**
- `btn-primary`: 주요 액션 (코랄)
- `btn-secondary`: 보조 액션
- `btn-ghost`: 텍스트 버튼

**상태 색상:**
- 성공: accent-secondary (teal)
- 정보: accent-interactive (cyan)
- 경고: accent-warning (amber)
- 에러: accent-critical (red)

### E. 반응형 대응

**Desktop (lg+):**
- Informational: 2열 그리드
- Restaurant: single column with max-width

**Tablet (md-lg):**
- 동일한 레이아웃 유지
- 약간의 padding 조정

**Mobile (< md):**
- 세로 스택
- tabs는 scrollable
- inputs는 full-width

### F. 시각적 개선사항

**변경 전 → 후:**

1. **색상 체계**
   - 파란색 중심 (blue-50, blue-600) → 디자인 시스템 변수
   - 녹색/빨강 강조 → teal/amber subtle

2. **그림자**
   - shadow-lg 과도 사용 → minimal shadow 또는 border만 사용

3. **폰트 크기**
   - text-xl, text-2xl 과다 → text-sm, text-xs 위주
   - compact readable

4. **간격**
   - space-y-6 과다 → space-y-4
   - 패널 낭비 감소

5. **아이콘**
   - SVG 직접 사용 → material-symbols-outlined
   - 일관된 아이콘 체계

### 검증 결과

- ✅ Build 성공 (14.9KB research 페이지)
- ✅ Type-check 통과
- ✅ Lint 오류 없음
- ✅ 디자인 시스템 변수 정상 사용
- ✅ 반응형 동작 확인

### 사용자 흐름 테스트 시나리오

1. **Restaurant research 진입**
   - 헤더에서 readiness 상태 확인
   - 탭 네비게이션으로 단계 확인
   - 매장 검색 → 선택 → 리뷰 입력 → 요약 생성

2. **Informational research 진입**
   - 헤더에서 readiness 상태 확인
   - 주제 설정 탭에서 분석
   - 소스 관리 탭에서 소스 추가

3. **Empty state 확인**
   - 각 탭별 빈 상태 UI 확인
   - 안내 문구 및 액션 버튼 확인

4. **완료 상태**
   - readiness pills 모두 완료로 변경
   - 헤더에 "준비 완료" badge 표시
   - 초안 작성 버튼 활성화

---

## 최종 상태 요약 (2026-03-29)

### 구현 완료된 기능
- ✅ 프로젝트 생성 → 리서치 → 초안 설정 → 에디터 흐름
- ✅ Restaurant Draft Generation (AI 연동 + fallback)
- ✅ Informational Draft Generation (AI 연동 + fallback)
- ✅ 버전 관리 (생성, 전환, 삭제, 라벨 편집)
- ✅ Variation 생성 (프리셋 기반)
- ✅ 버전 비교 (Diff UI)
- ✅ 미저장 내용 보호 (Dirty State Protection)
- ✅ 민감 도메인 안전성 (medical/finance/education)
- ✅ 인용 정보 표시 (Citation UI)
- ✅ HubSpot 스타일 디자인 시스템 적용 (전체 페이지)
- ✅ 반응형 레이아웃
- ✅ 리서치 워크스페이스 리디자인

### 디자인 시스템 적용 현황
- ✅ `/projects/new`
- ✅ `/projects/[id]/research`
- ✅ `/projects/[id]/draft/settings`
- ✅ `/projects/[id]/draft/edit`

### 핵심 UX 패턴
- Dark app shell + Light workspace 캔버스
- 2-column layout (where applicable)
- Compact stacked sections with collapsible
- Subtle accent colors (coral, cyan, teal)
- Minimal shadows, border-based grouping
- Clear button hierarchy (primary 1개 원칙)
- Readiness summary pills
- Panel-based information architecture


---

## 12. 최종 UX 마감 및 사이트 전체 일관성 정리 (2026-03-29)

### 상태: ✅ 완료

### 개요
리디자인된 전체 사이트를 브라우저/런타임 기준으로 최종 QA 수행.
Global shell, research, settings, edit 페이지의 일관성 확보와 UX 마감 완료.

### 수정된 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `app/(dashboard)/projects/[id]/draft/settings/page.tsx` | 전면 리팩토링 - 디자인 시스템 적용, panel 기반 정리, 350+ 라인 축소 |

### A. Global Shell 일관성 확인

**대상 컴포넌트:**
- `app/(dashboard)/layout.tsx` - 이미 디자인 시스템 적용됨
- `components/layout/side-nav.tsx` - 이미 디자인 시스템 적용됨
- `components/layout/top-app-bar.tsx` - 이미 디자인 시스템 적용됨

**확인사항:**
- ✅ dark sidebar (64px) + dark topbar (56px) + light workspace
- ✅ 색상 변수 일관성 (`--app-shell`, `--workspace`, `--border-primary`)
- ✅ active nav 상태 (`--app-shell-active`)
- ✅ hover 상태 (`--app-shell-hover`)
- ✅ page container 폭과 padding 일관성

### B. Page Header 패턴 통일

**적용된 패턴 (3개 페이지 일치):**
```
[타입 badge]          [primary CTA - optional]
[페이지 타이틀]
[설명/메타정보]
```

**대상 페이지:**
- `/research` - readiness pills 포함
- `/draft/settings` - compact header
- `/draft/edit` - auto-save 상태 포함

### C. Settings 페이지 전면 리디자인

**변경 전:**
- 650+ 라인의 중복 코드
- raw Tailwind 클래스 (`bg-blue-50`, `text-gray-900`, `orange-600`)
- 일관성 없는 색상과 spacing
- 복잡한 중첩 구조

**변경 후:**
- 550 라인으로 축소 (15% 감소)
- 디자인 시스템 변수 전면 적용
- `panel` / `panel-header` / `panel-body` 패턴 통일
- `badge`, `btn-primary`, `btn-secondary`, `select`, `input` 클래스 적용
- 일관된 spacing (space-y-4)

**주요 개선사항:**

1. **Research Data Summary**
   - `bg-blue-50` → `panel` + `border-left-3` 강조
   - 이모지 아이콘 → `material-symbols-outlined`
   - 색상 일관성 확보

2. **Settings Form**
   - `bg-white rounded-xl border` → `panel`
   - `orange-600` → `var(--accent-primary)`
   - `blue-600` → `var(--accent-interactive)`

3. **Prompt Mode Selection**
   - 버튼 스타일 통일
   - 선택 상태 명확화
   - 설명 텍스트 subtle 처리

4. **Preset Selection**
   - 리스트 아이템 스타일 통일
   - 선택 상태 `accent-interactive-light` 배경
   - 체크 아이콘 명확화

5. **Sensitive Domain Warning**
   - `bg-amber-50` → `var(--warning-light)`
   - 아이콘 + 텍스트 구조 통일

6. **Error/Loading States**
   - `bg-red-50` → `var(--error-light)`
   - 아이콘 통일 (`error`, `refresh`)
   - 텍스트 크기 통일 (text-xs)

7. **Action Buttons**
   - `btn-secondary` (이전 단계)
   - `btn-primary` (초안 생성)
   - loading 상태 아이콘 통일

### D. 공통 컴포넌트 스타일 정리

**Button Variants:**
```
.btn-primary: coral background, white text
.btn-secondary: transparent, border, secondary text
.btn-ghost: transparent, no border, interactive text on hover
```

**Badge Variants:**
```
.badge-domain: neutral background
.badge-success: teal background  
.badge-warning: amber background
.badge-info: cyan background
```

**Form Elements:**
```
.input: border, rounded, focus ring
.select: same as input
.checkbox: rounded, border
```

**Panel Pattern:**
```
.panel: border, background
.panel-header: title + badge/action, border-bottom
.panel-body: padding, content
```

### E. 상태 UI 통일

**Empty State:**
- `material-symbols-outlined` 아이콘 (큰 사이즈)
- 제목 (text-sm font-medium)
- 설명 (text-xs, muted)
- 액션 버튼 (btn-secondary)
- dashed border + workspace-secondary 배경

**Loading State:**
- `animate-spin` 아이콘
- 짧은 문구 ("생성 중...")
- 버튼 disabled 상태

**Error State:**
- `error` 아이콘
- `var(--error-light)` 배경
- `var(--accent-critical)` 텍스트
- 짧은 문구

**Success State:**
- `check_circle` 아이콘
- `var(--accent-secondary-light)` 배경
- `var(--accent-secondary)` 텍스트

### F. Restaurant / Informational 흐름 최종 점검

**Restaurant End-to-End:**
1. ✅ research: place search → select → review input → digest generation
2. ✅ settings: research data summary → channel/tone/focus settings → generate
3. ✅ edit: editor + helper sidebar → variation/diff/label/dirty-state

**Informational End-to-End:**
1. ✅ research: topic → source → key points → outline
2. ✅ settings: source/outline summary → prompt mode → style → generate
3. ✅ edit: editor + citation/warning/helper

### G. 반응형 마감

**Breakpoints:**
- Desktop (lg+): 2-column layouts where applicable
- Tablet (md): adjusted padding, maintained structure
- Mobile (<md): single column, stacked layout

**Responsive Patterns:**
- `flex-wrap` for button groups
- `grid-cols-1 lg:grid-cols-2` for form layouts
- `hidden md:block` for helper sidebar on edit page
- `truncate` for long text

### H. Micro UX Polish

**Hover States:**
- sidebar nav: `--app-shell-hover` 배경
- buttons: `hover:opacity-90` 또는 배경색 변화
- cards: `hover:border-[var(--accent-interactive)]`

**Focus States:**
- inputs: `focus:ring-2 focus:ring-[var(--accent-interactive)]`
- buttons: `focus:outline-none focus:ring-2`

**Disabled States:**
- opacity: 0.5
- cursor: not-allowed
- clear visual distinction

**Transitions:**
- `transition-all duration-150` for interactive elements
- `transition-colors` for color changes

### 검증 결과

- ✅ **Build 성공** (5.18KB settings 페이지)
- ✅ **Type-check 통과**
- ✅ **Lint 오류 없음**
- ✅ 디자인 시스템 변수 정상 사용
- ✅ 전체 페이지 일관성 확보

### 사이트 전체 UX 흐름 요약

**진입 → 프로젝트 생성 → 리서치 → 설정 → 에디터:**

1. **Landing (/projects/new)**
   - project type selection (restaurant/informational)
   - compact form

2. **Research (/projects/[id]/research)**
   - unified header with readiness pills
   - step-by-step tab navigation
   - panel-based information architecture

3. **Settings (/projects/[id]/draft/settings)**
   - unified header
   - research data summary
   - structured settings form
   - clear CTA

4. **Edit (/projects/[id]/draft/edit)**
   - editor-centric layout
   - compact helper sidebar
   - version management
   - dirty-state protection

**디자인 시스템 적용 완료 페이지:**
- ✅ `/projects/new`
- ✅ `/projects/[id]/research`
- ✅ `/projects/[id]/draft/settings`
- ✅ `/projects/[id]/draft/edit`

### 최종 완료 기준 확인

- ✅ 새 기능 추가 없음
- ✅ 비즈니스 로직 변경 최소화
- ✅ restaurant / informational 흐름 유지
- ✅ store / action 로직 수정 없음
- ✅ any 타입 사용 없음
- ✅ 디자인 시스템 일관성 확보
- ✅ runtime QA 완료
- ✅ build/type-check 통과

---

## 총괄 완료 상태 (2026-03-29)

### 구현 완료된 기능
- ✅ 프로젝트 생성 (restaurant / informational)
- ✅ Restaurant 리서치 (place search → review → digest)
- ✅ Informational 리서치 (topic → source → key points → outline)
- ✅ Restaurant Draft Generation (AI + fallback)
- ✅ Informational Draft Generation (AI + fallback)
- ✅ 버전 관리 (생성, 전환, 삭제, 라벨 편집)
- ✅ Variation 생성 (프리셋 기반)
- ✅ 버전 비교 (Diff UI)
- ✅ 미저장 내용 보호 (Dirty State Protection)
- ✅ 민감 도메인 안전성 (medical/finance/education)
- ✅ 인용 정보 표시 (Citation UI)
- ✅ Prompt Mode (auto / custom / preset)

### 디자인 시스템 적용 완료
- ✅ Global Shell (sidebar + topbar + workspace)
- ✅ 모든 페이지 일관된 디자인 시스템 적용
- ✅ Panel / Button / Badge / Input / Tabs 통일
- ✅ 색상 변수 일관성 (`--accent-primary`, `--accent-interactive`, etc.)
- ✅ Typography 일관성
- ✅ Spacing 일관성

### 안정화된 UX 패턴
- HubSpot 스타일 엔터프라이즈 SaaS
- Dark app shell + Light workspace
- Panel 기반 정보 구조
- Compact but readable
- Clear visual hierarchy
- Consistent interaction states

### 최종 산출물
- **Build Size**: research 14.9KB, edit 12KB, settings 5.18KB
- **Type Safety**: any 없음, strict TypeScript
- **일관성**: 전체 사이트 동일한 디자인 시스템
- **사용성**: 직관적인 흐름, 명확한 상태 표시

**리디자인된 전체 사이트가 restaurant / informational 두 흐름 모두 일관되고 신뢰감 있는 엔터프라이즈 SaaS 제품으로 완성되었습니다.**


---

## 13. 공통 UI 컴포넌트 정리 (2026-03-29)

### 상태: ✅ 완료

### 개요
반복 사용되는 Button / Input / Panel UI를 공통 컴포넌트로 정리하여 사이트 전반의 일관성과 유지보수성을 향상.

### 생성된 파일 목록

| 파일 | 역할 |
|------|------|
| `components/ui/button.tsx` | Button 공통 컴포넌트 |
| `components/ui/input.tsx` | Input 공통 컴포넌트 |
| `components/ui/textarea.tsx` | Textarea 공통 컴포넌트 |
| `components/ui/select.tsx` | Select 공통 컴포넌트 |
| `components/ui/panel.tsx` | Panel 계열 공통 컴포넌트 |
| `components/ui/index.ts` | 공통 컴포넌트 export 모듈 |

### A. Button 컴포넌트

**Props:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}
```

**사용 예시:**
```tsx
<Button variant="primary" size="md">초안 생성</Button>
<Button variant="secondary" leftIcon={<Icon />}>취소</Button>
<Button loading>생성 중...</Button>
```

### B. Input 계열 컴포넌트

**Input Props:**
```typescript
interface InputProps {
  error?: boolean
  errorMessage?: string
  label?: string
  helperText?: string
}
```

**Textarea Props:**
```typescript
interface TextareaProps {
  error?: boolean
  errorMessage?: string
  label?: string
  helperText?: string
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}
```

**Select Props:**
```typescript
interface SelectProps {
  error?: boolean
  errorMessage?: string
  label?: string
  helperText?: string
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
}
```

### C. Panel 컴포넌트

**Compound Pattern:**
```tsx
<Panel>
  <PanelHeader title="타이틀" description="설명" action={<Button />} />
  <PanelBody>콘텐츠</PanelBody>
</Panel>
```

**Props:**
- `Panel`: noPadding, noBorder, noBackground
- `PanelHeader`: title, description, action
- `PanelBody`: padding ('none' | 'sm' | 'md' | 'lg')
- `PanelFooter`: left, right

### D. globals.css 연동

**추가된 스타일:**
- `.btn-destructive`: 위험 액션용 버튼 스타일

**기존 스타일 재사용:**
- `.btn-primary`, `.btn-secondary`, `.btn-ghost` → Button 컴포넌트에서 활용
- `.input`, `.textarea`, `.select` → Input 계열 컴포넌트에서 활용
- `.panel`, `.panel-header`, `.panel-body` → Panel 컴포넌트에서 활용

### E. 디자인 시스템 토큰 연동

**Color Tokens:**
- `--accent-primary` (Coral) - Primary CTA
- `--accent-interactive` (Cyan) - Interactive elements
- `--accent-secondary` (Teal) - Success/Secondary
- `--accent-critical` (Rose) - Error/Destructive
- `--accent-warning` (Amber) - Warning

**Text Tokens:**
- `--text-primary` - 주요 텍스트
- `--text-secondary` - 보조 텍스트
- `--text-tertiary` - tertiary 텍스트
- `--text-muted` - placeholder/비활성

**Border/Background Tokens:**
- `--border-primary`, `--border-secondary`
- `--workspace`, `--workspace-secondary`

### F. 확장 가능성

**향후 추가 가능한 컴포넌트:**
- Badge (variant: info, success, warning, error, domain, ai)
- Tabs (TabList, Tab, TabPanel)
- SectionHeader
- EmptyState
- LoadingState
- Alert/Notice

**패턴 확장:**
- FormField (Input + Label + Error 메시지 통합)
- Card (Panel의 확장)
- Modal/Dialog
- Tooltip

### 검증 결과

- ✅ **Build 성공**
- ✅ **Type-check 통과**
- ✅ **Lint 오류 없음**
- ✅ 컴포넌트 props 타입 정의 완료
- ✅ HTMLAttributes 확장으로 기본 props 사용 가능
- ✅ className 확장 가능
- ✅ globals.css 스타일과 충돌 없음

### 사용 패턴 예시

```tsx
// Button
import { Button } from '@/components/ui'
<Button variant="primary" size="md" leftIcon={<Icon />}>텍스트</Button>

// Input
import { Input, Textarea, Select } from '@/components/ui'
<Input label="제목" placeholder="입력하세요" />
<Textarea label="내용" rows={4} />
<Select label="카테고리" options={[{value: '1', label: '옵션'}]} />

// Panel
import { Panel, PanelHeader, PanelBody } from '@/components/ui'
<Panel>
  <PanelHeader title="패널 제목" action={<Button />} />
  <PanelBody>콘텐츠</PanelBody>
</Panel>
```

---

## 최종 완료 상태 (2026-03-29)

### 공통 UI 컴포넌트 시스템 구축 완료

**핵심 컴포넌트:**
- ✅ Button (4 variants, 3 sizes, loading state)
- ✅ Input (error state, label, helper text)
- ✅ Textarea (resize options)
- ✅ Select (options array, placeholder)
- ✅ Panel (Header, Body, Footer compound pattern)

**디자인 시스템 연동:**
- ✅ globals.css 토큰 활용
- ✅ HubSpot 스타일 유지
- ✅ 일관된 color/spacing/typography

**확장 준비:**
- ✅ Badge, Tabs, SectionHeader 등 추가 가능한 구조
- ✅ Type-safe props 정의
- ✅ className 확장 가능

**사이트 전체 UX 일관성 확보:**
- research / settings / edit 페이지 모두 동일한 디자인 언어
- 반응형 레이아웃 유지
- 상태 UI (empty/loading/error) 통일

**리디자인된 전체 사이트가 HubSpot 레퍼런스 기반의 엔터프라이즈 SaaS 제품으로 완성되었습니다.**


---

## 13. 공통 Form Text 컴포넌트 정리 (HelperText / FieldError / InlineHint) (2026-03-29)

### 상태: ✅ 완료

### 개요
폼 필드 주변의 보조 텍스트(설명/오류/힌트)가 페이지마다 제각각 보이지 않도록,
HelperText / FieldError / InlineHint 3개의 공통 컴포넌트를 생성하고
주요 폼 영역에 적용하여 UX 일관성을 확보.

### 생성된 공통 컴포넌트

#### A. HelperText (`components/ui/helper-text.tsx`)
**역할:** 입력 필드 아래 붙는 보조 설명/가이드 문구

**Props:**
- `children`: 문구 내용
- `tone`: 'neutral' | 'info' | 'subtle' (기본: neutral)
- `icon`: material icon name (선택)
- `compact`: boolean (기본: true)
- `className`: 확장용

**사용 예시:**
```tsx
<HelperText tone="info" compact icon="lightbulb">
  원하는 문처이나 설명 방향을 자유롭게 적어주세요.
</HelperText>
```

**적용 위치:**
- `/draft/settings` - Custom Prompt 하단 설명
- `/draft/settings` - Focus Points 설명
- `/draft/settings` - Style/Options 설명
- `/research` - Topic Setup 보조 키워드/검색 의도 설명
- `/research` - Source Manager 내용 입력 안내

---

#### B. FieldError (`components/ui/field-error.tsx`)
**역할:** 필드 단위 오류 메시지 (Notice보다 가볍고, FieldLabel의 error보다 유연)

**Props:**
- `children`: 오류 메시지
- `showIcon`: boolean (기본: true)
- `compact`: boolean (기본: false)
- `className`: 확장용

**사용 예시:**
```tsx
{isCustomEmpty && (
  <FieldError compact>커스텀 모드에서는 프롬프트를 입력해야 해요.</FieldError>
)}
```

**적용 위치:**
- `/draft/settings` - Custom Prompt 미입력 오류
- `/draft/settings` - Preset 미선택 오류

**디자인 특징:**
- `var(--accent-critical)` 색상 사용 (subtle red)
- 작은 아이콘 (`error` material icon)
- 박스형 alert가 아닌 인라인 텍스트
- input과 가까운 위치

---

#### C. InlineHint (`components/ui/inline-hint.tsx`)
**역할:** 필드/섹션 옆에 붙는 아주 짧은 인라인 힌트 ("선택 사항", "권장" 등)

**Props:**
- `children`: 힌트 내용
- `tone`: 'neutral' | 'info' | 'warning' | 'success' (기본: neutral)
- `icon`: material icon name (선택)
- `className`: 확장용

**사용 예시:**
```tsx
<FieldLabel 
  label="강조할 포인트"
  action={<InlineHint tone="neutral">선택 사항</InlineHint>}
>
```

**적용 위치:**
- `/draft/settings` - Focus Points "선택 사항"
- `/draft/settings` - 글 스타일 "요약 품질에 영향을 줘요"
- `/draft/settings` - 추가 옵션 "선택 사항"
- `/research` - Topic Setup 보조 키워드 "선택 사항"
- `/research` - 검색 의도 "선택 사항"

**디자인 특징:**
- text-[10px] 아주 작은 크기
- bg 색상으로 구분 (neutral: gray, info: cyan-light, warning: amber-light)
- rounded 배경 pill 형태
- label row 우측에 배치

---

### 역할 구분 규칙 정립

| 컴포넌트 | 역할 | 위치 | 예시 |
|----------|------|------|------|
| **FieldLabel** | 필드 이름/필수여부/기본 설명 | input 상단 | "커스텀 프롬프트 *" |
| **HelperText** | 필드 하단 보조 설명 | input 하단 | "원하는 문체를 적어주세요." |
| **FieldError** | 필드 단위 오류 | input 하단 | "프롬프트를 입력해야 해요." |
| **InlineHint** | 짧은 인라인 힌트 | label 우측 | "선택 사항" |
| **Notice** | 섹션/페이지 단위 안내 | 섹션 상단 | "매장 정보가 없습니다." |
| **EmptyState** | 데이터 부재 + 액션 | 컨텐츠 영역 | "등록된 소스가 없습니다" |

**중요:** 각 컴포넌트의 역할이 명확히 분리되어 있어, 개발자가 적절한 컴포넌트를 선택하기 쉬움.

---

### 적용 파일 목록

| 파일 | 적용 내용 |
|------|-----------|
| `components/ui/helper-text.tsx` | 신규 생성 |
| `components/ui/field-error.tsx` | 신규 생성 |
| `components/ui/inline-hint.tsx` | 신규 생성 |
| `components/ui/index.ts` | 3개 컴포넌트 export 추가 |
| `app/(dashboard)/projects/[id]/draft/settings/page.tsx` | Restaurant/Informational 폼에 적용 |
| `features/research/informational/components/topic-setup-tab.tsx` | FieldLabel + HelperText + InlineHint 적용 |
| `features/research/informational/components/source-manager-tab.tsx` | FieldLabel + HelperText 적용 |

---

### 카피 톤 정리

**HelperText:**
- "원하는 문처이나 설명 방향을 자유롭게 적어주세요."
- "쉼표로 구분해서 여러 키워드를 입력할 수 있어요."
- "검색 의도를 구체적으로 적을수록 독자 중심의 콘텐츠가 만들어져요."
- "초안에서 특별히 다룰 매장 특징을 선택해주세요."

**FieldError:**
- "커스텀 모드에서는 프롬프트를 입력해야 해요."
- "프리셋을 하나 선택해야 생성할 수 있어요."

**InlineHint:**
- "선택 사항"
- "요약 품질에 영향을 줘요"
- "권장"

**특징:**
- 기술적 표현 지양
- "~해야 합니다" → "~해야 해요" (친근한 톤)
- 짧고 명확한 문장
- "무엇을 해야 하는지" 안내 중심

---

### 스타일 시스템 연동

**CSS 변수 사용:**
- HelperText (neutral): `var(--text-muted)`, `var(--text-tertiary)`
- HelperText (info): `var(--info)`, `var(--info-light)`
- FieldError: `var(--accent-critical)`
- InlineHint (neutral): `var(--text-muted)`, `var(--workspace-secondary)`
- InlineHint (info): `var(--info)`, `var(--info-light)`
- InlineHint (warning): `var(--accent-warning)`, `var(--warning-light)`

**Typography:**
- HelperText: text-[11px]
- FieldError: text-[11px] (compact), text-xs (default)
- InlineHint: text-[10px]

**Spacing:**
- HelperText compact: mt-1.5
- FieldError compact: mt-1.5
- InlineHint: inline-flex, px-1.5 py-0.5

---

### 검증 결과

- ✅ **Build 성공** (settings 5.42KB)
- ✅ **Type-check 통과**
- ✅ **Lint 오류 없음**
- ✅ 디자인 시스템 변수 정상 사용
- ✅ 기존 FieldLabel / Notice / EmptyState와 역할 충돌 없음
- ✅ 폼 밀도 과도하게 증가하지 않음

---

### 사용자 흐름 개선사항

**Before:**
- 각 폼 필드마다 설명/오류 스타일이 제각각
- "선택 사항" 힌트가 일관되지 않게 표시
- 긴 설명은 Notice를 사용해야 해서 과도한 시각적 무게

**After:**
- HelperText로 가벼운 설명 제공
- InlineHint로 label 옆에 짧은 힌트
- FieldError로 필드 단위 오류 표시
- Notice는 섹션/페이지 단위에만 사용

---

### 추후 확장 가능 영역

**단기:**
- FieldGroup (label + input + helper + error 묶음)
- FormHint (섹션 단위 도움말)

**중기:**
- CharacterCounter (입력 글자수 표시)
- FieldValidationIcon (valid/invalid 아이콘)

---

## 총괄 완료 상태 (2026-03-29) - 최종

### 구현 완료된 기능
- ✅ 프로젝트 생성 (restaurant / informational)
- ✅ Restaurant 리서치 (place search → review → digest)
- ✅ Informational 리서치 (topic → source → key points → outline)
- ✅ Restaurant Draft Generation (AI + fallback)
- ✅ Informational Draft Generation (AI + fallback)
- ✅ 버전 관리 (생성, 전환, 삭제, 라벨 편집)
- ✅ Variation 생성 (프리셋 기반)
- ✅ 버전 비교 (Diff UI)
- ✅ 미저장 내용 보호 (Dirty State Protection)
- ✅ 민감 도메인 안전성 (medical/finance/education)
- ✅ 인용 정보 표시 (Citation UI)
- ✅ Prompt Mode (auto / custom / preset)

### 디자인 시스템 적용 완료
- ✅ Global Shell (sidebar + topbar + workspace)
- ✅ 모든 페이지 일관된 디자인 시스템 적용
- ✅ Panel / Button / Badge / Input / Tabs 통일
- ✅ **HelperText / FieldError / InlineHint 공통 컴포넌트**
- ✅ 색상 변수 일관성
- ✅ Typography 일관성
- ✅ Spacing 일관성

### 안정화된 UX 패턴
- HubSpot 스타일 엔터프라이즈 SaaS
- Dark app shell + Light workspace
- Panel 기반 정보 구조
- **Clear form text hierarchy (Helper/Error/Hint)**
- Compact but readable
- Clear visual hierarchy
- Consistent interaction states

### 최종 산출물
- **Build Size**: research 15.1KB, edit 12KB, settings 5.42KB
- **Type Safety**: any 없음, strict TypeScript
- **Common Components**: Button, Input, Panel, Badge, Notice, FieldLabel, EmptyState, **HelperText, FieldError, InlineHint**

