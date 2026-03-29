# 데이터 흐름 및 상태 관리 문서

## Phase 1 MVP 데이터 흐름

### 1. 프로젝트 생성 플로우

```
┌─────────────────┐     createProject()      ┌──────────────────┐
│  /projects/new  │ ───────────────────────► │   Zustand Store  │
│   (폼 입력)      │                          │  (projects 배열)  │
└─────────────────┘                          └────────┬─────────┘
       │                                              │
       │ redirect                                     │ persist
       ▼                                              ▼
┌─────────────────┐                          ┌──────────────────┐
│/[id]/research   │ ◄──────────────────────  │   localStorage   │
│                 │      getProject()        │"blog-mvp-project-│
└─────────────────┘                          │     store"       │
                                             └──────────────────┘
```

**액션 흐름:**
1. 사용자가 `/projects/new`에서 폼 입력 (title, topic, targetAudience, tone, keywords)
2. `handleSubmit` → `createProject({ title, topic, tone, keywords })`
3. Store에서 자동으로:
   - Project 객체 생성 (ID: `createId('project')`)
   - Mock 리서치 아이템 6개 생성
   - 처음 2개 아이템 자동 선택
4. `/projects/{project.id}/research`로 리다이렉트

### 2. 리서치 선택 플로우

```
┌─────────────────────────┐
│   /[id]/research        │
│                         │
│  researchItems[pid]     │
│  selectedResearchIds    │
│         │               │
│         ▼               │
│  toggleResearchSelection│
│  (pid, itemId)          │
│         │               │
│         ▼               │
│   localStorage          │
└─────────────────────────┘
```

**액션 흐름:**
1. `researchItems[projectId]`로 리서치 목록 조회
2. `selectedResearchIds[projectId]`로 선택 상태 확인
3. 토글 클릭 → `toggleResearchSelection(projectId, itemId)`
4. 선택된 아이템 조회 → `getSelectedResearchItems(projectId)`

### 3. 초안 설정 플로우

```
┌─────────────────────────┐     saveDraftSettings()      ┌─────────────┐
│ /[id]/draft/settings    │ ───────────────────────────► │ draftSettings│
│   (설정 폼)              │                              │ [projectId] │
└─────────────────────────┘                              └──────┬──────┘
       │                                                        │
       │ redirect                                               │ persist
       ▼                                                        ▼
┌─────────────────────────┐                            ┌─────────────┐
│   /[id]/draft/edit      │ ◄────────────────────────  │ localStorage│
│                         │      createDraft()         │             │
└─────────────────────────┘                            └─────────────┘
```

**액션 흐름:**
1. 사용자가 설정 입력 (category, goal, tone, length, cta, customPrompt, includeFaq)
2. "초안 생성하기" 클릭 → `saveDraftSettings(projectId, settings)`
   - 프로젝트 상태가 'writing'으로 변경
3. `createDraft(projectId)`:
   - 프로젝트, 설정, 선택된 리서치 기반으로 컨텍스트 생성
   - `createMockDraftFromContext()`로 초안 내용 생성
   - wordCount 자동 계산
4. `/projects/{projectId}/draft/edit`로 리다이렉트

### 4. 에디터 플로우

```
┌─────────────────────────┐
│   /[id]/draft/edit      │
│                         │
│  getProject()           │
│  getDraftSettings()     │
│  getDraft()             │
│         │               │
│         ▼               │
│  ┌─────────────┐        │
│  │   Draft     │        │
│  │  Content    │        │
│  └─────────────┘        │
│                         │
└─────────────────────────┘
```

## 상태 구조

```typescript
// Zustand Store State
{
  hasHydrated: boolean                    // hydration 완료 여부
  
  projects: Project[]                     // 모든 프로젝트
  researchItems: Record<string, ResearchItem[]>  // 프로젝트별 리서치
  selectedResearchIds: Record<string, string[]>  // 프로젝트별 선택된 리서치
  draftSettings: Record<string, DraftSettings>   // 프로젝트별 초안 설정
  drafts: Record<string, Draft>          // 프로젝트별 초안
}
```

## Persist 설정

```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: 'blog-mvp-project-store',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      projects: state.projects,
      researchItems: state.researchItems,
      selectedResearchIds: state.selectedResearchIds,
      draftSettings: state.draftSettings,
      drafts: state.drafts,
    }),
    onRehydrateStorage: () => (state, error) => {
      if (!error) state?.setHasHydrated(true)
    },
  }
)
```

## 주요 API

### ProjectStore

| 메서드 | 설명 | 사용 위치 |
|--------|------|----------|
| `createProject(data)` | 프로젝트 생성 + mock 리서치 생성 + 첫 2개 선택 | /projects/new |
| `getProject(id)` | 프로젝트 조회 | 모든 페이지 |
| `researchItems[pid]` | 리서치 목록 직접 접근 | /research |
| `toggleResearchSelection(pid, itemId)` | 리서치 토글 | /research |
| `getSelectedResearchItems(pid)` | 선택된 아이템 전체 반환 | store 낶부 |
| `saveDraftSettings(pid, settings)` | 설정 저장 + 프로젝트 상태 변경 | /draft/settings |
| `getDraftSettings(pid)` | 설정 조회 | /draft/edit |
| `createDraft(pid)` | 컨텍스트 기반 초안 생성 | /draft/settings |
| `getDraft(pid)` | 초안 조회 | /draft/edit |
| `updateDraftContent(pid, content)` | 초안 내용 업데이트 + wordCount 재계산 | /draft/edit |
| `resetAll()` | 전체 상태 초기화 | 개발/테스트 |

## 새로운 기능

### 1. Hydration 상태 관리
```typescript
const hasHydrated = useProjectStore((state) => state.hasHydrated)

// 컴포넌트에서 사용
if (!hasHydrated) return <Loading />
```

### 2. 컨텍스트 기반 초안 생성
```typescript
createDraft(projectId) // 낶부에서 자동으로:
// 1. project 조회
// 2. settings 조회  
// 3. selectedResearch 조회
// 4. createMockDraftFromContext({ project, settings, selectedResearch })
```

### 3. Word Count 자동 계산
```typescript
// 초안 생성 시
wordCount: countWords(content)

// 내용 업데이트 시
updateDraftContent(pid, newContent) // 자동으로 wordCount 재계산
```

### 4. 프로젝트 상태 자동 전환
```typescript
// 리서치 완료 후 설정 저장 시
saveDraftSettings(pid, settings) {
  // draftSettings 저장
  // + 프로젝트 status: 'researching' → 'writing' 자동 변경
}
```

## 새로고침 시나리오

1. `/projects/abc123/research`에서 새로고침
2. Store가 localStorage에서 복원 (`blog-mvp-project-store`)
3. `onRehydrateStorage` → `setHasHydrated(true)`
4. `getProject("abc123")`로 프로젝트 조회
5. `researchItems["abc123"]`로 리서치 목록 조회
6. `selectedResearchIds["abc123"]`로 선택 상태 복원

## 테스트 체크리스트

- [ ] 프로젝트 생성 시 자동으로 2개 리서치 선택됨
- [ ] 소스 선택/해제 → localStorage 저장 확인
- [ ] 새로고침 후 선택 상태 유지
- [ ] 초안 설정 저장 시 프로젝트 상태 'writing'으로 변경
- [ ] 초안 생성 시 컨텍스트(프로젝트+설정+리서치) 반영
- [ ] 에디터에서 wordCount 정상 표시
- [ ] 길이(short/medium/long)에 따른 초안 내용 조정
- [ ] FAQ 포함 여부에 따른 목차/내용 변경
- [ ] CTA가 초안 마지막에 정상 표시
- [ ] 여러 프로젝트 동시 작업 시 데이터 격리 확인
