# 기능 구현 1단계 - 최종 계획

## 변경사항 반영

### 1. Route 기준 조회
- `currentProject` 제거
- `getProjectById(id: string)` 사용
- 컴포넌트에서 `params.id`로 직접 조회

### 2. Research 선택 상태 저장
- `selectedResearchIds: Record<projectId, string[]>` 추가
- `toggleResearchSelection(projectId, researchId)` 액션 추가
- `selectAllResearch(projectId)` / `deselectAllResearch(projectId)` 추가

### 3. Zustand Persist 적용
- `localStorage`에 저장
- 새로고침 후에도 데이터 유지
- 키: `blog-ai-storage`

---

## 최종 생성/수정 파일 목록

### 신규 파일 (4개)

```
types/
└── index.ts                    # 타입 정의

lib/
├── utils.ts                    # 유틸리티 함수
└── mock-data.ts                # Mock 데이터

stores/
└── project-store.ts            # Zustand store (persist 적용)
```

### 수정 파일 (4개)

```
app/(dashboard)/projects/new/page.tsx                      # 프로젝트 생성
app/(dashboard)/projects/[id]/research/page.tsx            # 리서치 + 선택 상태
app/(dashboard)/projects/[id]/draft/settings/page.tsx      # 설정 저장
app/(dashboard)/projects/[id]/draft/edit/page.tsx          # 설정/초안 표시
```

### 의존성 추가

```bash
npm install zustand
```

---

## 타입 정의 (types/index.ts)

```typescript
// 프로젝트
export interface Project {
  id: string;
  title: string;
  targetAudience: string;
  tone: 'professional' | 'friendly' | 'authoritative' | 'casual';
  keywords: string[];
  length: 'short' | 'medium' | 'long';
  status: 'research' | 'draft_settings' | 'draft_edit' | 'image' | 'export' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// 프로젝트 생성 입력
export interface CreateProjectInput {
  title: string;
  targetAudience: string;
  tone: Project['tone'];
  keywords: string[];
  length: Project['length'];
}

// 리서치 아이템
export interface ResearchItem {
  id: string;
  title: string;
  excerpt: string;
  domain: string;
  url: string;
  isActive: boolean;
}

// 초안 설정
export interface DraftSettings {
  category: string;
  writingMethod: 'auto' | 'prompt';
  prompt: string;
  forbiddenKeywords: string[];
  requiredKeywords: string[];
  sampleText?: string;
}

// 초안
export interface Draft {
  id: string;
  projectId: string;
  content: string;
  version: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## Store 구조 (stores/project-store.ts)

```typescript
interface ProjectStore {
  // 상태
  projects: Project[];
  selectedResearchIds: Record<string, string[]>;  // projectId -> selectedIds
  draftSettings: Record<string, DraftSettings>;    // projectId -> settings
  drafts: Record<string, Draft>;                   // projectId -> draft

  // 액션 - Project
  createProject: (input: CreateProjectInput) => Project;
  getProjectById: (id: string) => Project | undefined;
  updateProjectStatus: (id: string, status: Project['status']) => void;

  // 액션 - Research
  getResearchItems: (projectId: string) => ResearchItem[];
  toggleResearchSelection: (projectId: string, researchId: string) => void;
  selectAllResearch: (projectId: string) => void;
  deselectAllResearch: (projectId: string) => void;
  getSelectedResearchCount: (projectId: string) => number;

  // 액션 - Draft Settings
  saveDraftSettings: (projectId: string, settings: DraftSettings) => void;
  getDraftSettings: (projectId: string) => DraftSettings | undefined;

  // 액션 - Draft
  createDraft: (projectId: string) => Draft;
  getDraftByProjectId: (projectId: string) => Draft | undefined;
}
```

---

## 데이터 흐름

### 1. 프로젝트 생성
```
[사용자] /projects/new에서 폼 작성
    ↓
[폼 제출] createProject(input)
    ↓
[Store] projects 배열에 추가, ID 생성
    ↓
[라우팅] router.push(`/projects/${newProject.id}/research`)
```

### 2. 리서치 페이지
```
[페이지 로드] params.id로 getProjectById(id) 조회
    ↓
[Store] project 반환 (없으면 404)
    ↓
[getResearchItems(projectId)] mock 데이터 반환
    ↓
[선택 토글] toggleResearchSelection(projectId, researchId)
    ↓
[Store] selectedResearchIds에 저장 (persist)
```

### 3. 초안 설정
```
[페이지 로드] params.id로 프로젝트 조회
    ↓
[설정 입력] 사용자가 카테고리, 프롬프트 등 입력
    ↓
[저장] saveDraftSettings(projectId, settings)
    ↓
[Store] draftSettings에 저장 (persist)
    ↓
[라우팅] router.push(`/projects/${projectId}/draft/edit`)
```

### 4. 초안 에디터
```
[페이지 로드] params.id로 프로젝트 조회
    ↓
[getDraftSettings(projectId)] 설정 불러오기
    ↓
[getDraftByProjectId(projectId)] 초안 불러오기 (없으면 생성)
    ↓
[표시] 설정과 초안 내용을 에디터에 표시
```

---

## Persist 설정

```typescript
persist(store, {
  name: 'blog-ai-storage',
  partialize: (state) => ({
    projects: state.projects,
    selectedResearchIds: state.selectedResearchIds,
    draftSettings: state.draftSettings,
    drafts: state.drafts,
  }),
})
```

localStorage에 저장되는 데이터:
- `projects`: 모든 프로젝트 목록
- `selectedResearchIds`: 각 프로젝트의 선택된 리서치 ID
- `draftSettings`: 각 프로젝트의 초안 설정
- `drafts`: 각 프로젝트의 초안 내용

---

승인되면 위 계획대로 구현을 시작하겠습니다.
