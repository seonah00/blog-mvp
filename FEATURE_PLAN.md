# 기능 구현 1단계 계획 (MVP 플로우)

## 목표
프로젝트 생성 → 리서치 → 초안 설정 → 초안 에디터까지 최소 동작하는 MVP 플로우 구현

---

## 구현 범위

### 1단계: 기반 구축
- [ ] 공통 타입 정의
- [ ] 상태 관리 스토어 구현
- [ ] mock 데이터 생성

### 2단계: 프로젝트 생성
- [ ] /projects/new 폼 제출 구현
- [ ] 프로젝트 저장 및 ID 생성
- [ ] 생성 후 /projects/[id]/research 로 이동

### 3단계: 리서치
- [ ] 프로젝트 정보 연결
- [ ] mock 리서치 데이터 표시
- [ ] 초안 생성 버튼 → settings로 이동

### 4단계: 초안 설정
- [ ] 설정값 저장 (로컬 상태)
- [ ] 저장 후 edit로 이동

### 5단계: 초안 에디터
- [ ] 설정값 불러오기
- [ ] 초안 내용 표시 (mock)

---

## 생성/수정할 파일 목록

### 1. 타입 정의
```
types/
└── index.ts                    # 신규 생성
```

**내용:**
- Project: 프로젝트 기본 정보
- ResearchItem: 리서치 소스
- DraftSettings: 초안 작성 설정
- Draft: 초안 내용 및 메타정보

### 2. 상태 관리
```
stores/
└── project-store.ts            # 신규 생성
```

**기술 스택:** Zustand (간단하고 가벼움)

**상태:**
- projects: Project[] (모든 프로젝트 목록)
- currentProject: Project | null (현재 선택된 프로젝트)
- researchItems: Record<projectId, ResearchItem[]> (프로젝트별 리서치)
- draftSettings: Record<projectId, DraftSettings> (프로젝트별 설정)
- drafts: Record<projectId, Draft> (프로젝트별 초안)

### 3. Mock 데이터
```
lib/
├── mock-data.ts                # 신규 생성 (mock 데이터)
└── utils.ts                    # 신규 생성 (유틸리티 - ID 생성 등)
```

### 4. 수정될 페이지 파일

| 파일 | 수정 내용 |
|------|----------|
| `app/(dashboard)/projects/new/page.tsx` | 폼 제출 핸들러, 저장, 리다이렉트 |
| `app/(dashboard)/projects/[id]/research/page.tsx` | 프로젝트 정보 연결, mock 데이터 사용 |
| `app/(dashboard)/projects/[id]/draft/settings/page.tsx` | 설정 저장, 스토어 연동 |
| `app/(dashboard)/projects/[id]/draft/edit/page.tsx` | 설정/초안 불러오기, 표시 |

### 5. 의존성 추가
```bash
npm install zustand
```

---

## 데이터 흐름

```
[사용자] → /projects/new
   ↓ 폼 제출
[Store] 프로젝트 생성 → ID 반환
   ↓ router.push
/projects/[id]/research
   ↓ useProject(id)
[Store] 프로젝트 조회 → mock 리서치 반환
   ↓ "초안 생성" 클릭
/projects/[id]/draft/settings
   ↓ 설정 저장
[Store] draftSettings 저장
   ↓ router.push
/projects/[id]/draft/edit
   ↓ useProjectSettings(id)
[Store] 설정 + 초안 조회
```

---

## 타입 정의 상세

### Project
```typescript
interface Project {
  id: string;
  title: string;
  targetAudience: string;
  tone: 'professional' | 'friendly' | 'authoritative' | 'casual';
  keywords: string[];
  length: 'short' | 'medium' | 'long';
  status: 'research' | 'draft_settings' | 'draft_edit' | 'image' | 'export' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

### ResearchItem
```typescript
interface ResearchItem {
  id: string;
  title: string;
  excerpt: string;
  domain: string;
  url: string;
  isSelected: boolean;
  isActive: boolean;
}
```

### DraftSettings
```typescript
interface DraftSettings {
  category: string;
  writingMethod: 'auto' | 'prompt';
  prompt: string;
  forbiddenKeywords: string[];
  requiredKeywords: string[];
  sampleText?: string;
}
```

### Draft
```typescript
interface Draft {
  id: string;
  projectId: string;
  content: string;
  version: number;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 구현 순서

1. **types/index.ts** - 타입 정의
2. **lib/utils.ts** - 유틸리티 (generateId 등)
3. **lib/mock-data.ts** - mock 데이터
4. **stores/project-store.ts** - Zustand 스토어
5. **package.json** - zustand 의존성 추가
6. **projects/new/page.tsx** - 생성 기능
7. **projects/[id]/research/page.tsx** - 리서치 연동
8. **projects/[id]/draft/settings/page.tsx** - 설정 저장
9. **projects/[id]/draft/edit/page.tsx** - 에디터 연동

---

## 제약사항 준수 확인

| 제약 | 준수 방법 |
|------|----------|
| 외부 API 없음 | Zustand + 로컬 상태만 사용 |
| DB 없음 | 메모리 내 store 사용 (새로고침 시 초기화) |
| 인증 없음 | 사용자 개념 없이 진행 |
| Layout/Route 유지 | 기존 구조 그대로 사용 |

---

승인되면 위 순서대로 구현을 시작하겠습니다.
