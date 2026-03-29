# Next.js 마이그레이션 매핑 문서

## 원본 파일 → 신규 파일 매핑 표

### App Router Pages

| 원본 파일 | 신규 위치 | 설명 | 상태 |
|-----------|----------|------|------|
| `stitch-raw/pages/01-dashboard.html` | `app/(dashboard)/page.tsx` | 대시보드 메인 화면 | ✅ 완료 |
| `stitch-raw/pages/02-project-create.html` | `app/(dashboard)/projects/new/page.tsx` | 새 프로젝트 생성 | ✅ 완료 |
| `stitch-raw/pages/03-research-results.html` | `app/(dashboard)/projects/[id]/research/page.tsx` | 리서치 결과 | ✅ 완료 |
| `stitch-raw/pages/04-draft-settings.html` | `app/(dashboard)/projects/[id]/draft/settings/page.tsx` | 초안 작성 설정 | ✅ 완료 |
| `stitch-raw/pages/05-draft-editor.html` | `app/(dashboard)/projects/[id]/draft/edit/page.tsx` | 초안 에디터 | ✅ 완료 |
| `stitch-raw/pages/06-image-generation.html` | `app/(dashboard)/projects/[id]/images/page.tsx` | 문단별 이미지 생성 | ✅ 완료 |
| `stitch-raw/pages/07-image-generation-simple.html` | `app/(dashboard)/projects/[id]/images/simple/page.tsx` | 간단 이미지 생성 | ✅ 완료 |
| `stitch-raw/pages/08-thumbnail-editor.html` | `app/(dashboard)/projects/[id]/thumbnail/page.tsx` | 썸네일 에디터 | ✅ 완료 |
| `stitch-raw/pages/09-export.html` | `app/(dashboard)/projects/[id]/export/page.tsx` | 기본 낮에는 | ✅ 완료 |
| `stitch-raw/pages/10-export-studio.html` | `app/(dashboard)/projects/[id]/export/studio/page.tsx` | Export Studio | ✅ 완료 |

### Layout Components

| 원본 파일 | 신규 위치 | 설명 | 상태 |
|-----------|----------|------|------|
| `stitch-raw/components/01-side-nav.html` | `components/layout/side-nav.tsx` | 사이드 네비게이션 | ✅ 완료 |
| `stitch-raw/components/02-top-app-bar.html` | `components/layout/top-app-bar.tsx` | 상단 앱 바 | ✅ 완료 |
| `stitch-raw/components/04-bottom-sticky-bar.html` | `components/layout/bottom-sticky-bar.tsx` | 하단 고정 바 | ✅ 완료 |
| `stitch-raw/components/05-project-stepper.html` | `components/layout/project-stepper.tsx` | 프로젝트 스텝퍼 | ✅ 완료 |

### Feature Components

| 원본 파일 | 신규 위치 | 설명 | 상태 |
|-----------|----------|------|------|
| `stitch-raw/components/03-editor-correction-panel.html` | `features/draft/components/correction-panel/correction-panel.tsx` | 교정 패널 | ✅ 완료 |

### Layout Files

| 원본 참고 | 신규 위치 | 설명 | 상태 |
|-----------|----------|------|------|
| - | `app/layout.tsx` | Root Layout | ✅ 완료 |
| - | `app/(dashboard)/layout.tsx` | Main Layout | ✅ 완료 |
| - | `app/(dashboard)/projects/[id]/layout.tsx` | Project Detail Layout | ✅ 완료 |
| - | `app/(dashboard)/projects/[id]/draft/edit/layout.tsx` | Editor Layout | ✅ 완료 |
| - | `app/(dashboard)/projects/[id]/images/layout.tsx` | Image Layout | ✅ 완료 |
| - | `app/(dashboard)/projects/[id]/export/layout.tsx` | Export Layout | ✅ 완료 |

## 라우트 구조

```
/dashboard                              # 대시보드
/projects/new                           # 새 프로젝트
/projects/[id]                          # 프로젝트 상세
/projects/[id]/research                 # 리서치 결과
/projects/[id]/draft/settings           # 초안 설정
/projects/[id]/draft/edit               # 초안 에디터
/projects/[id]/images                   # 이미지 생성
/projects/[id]/images/simple            # 간단 이미지 생성
/projects/[id]/thumbnail                # 썸네일 에디터
/projects/[id]/export                   # 낮에는
/projects/[id]/export/studio            # Export Studio
```

## 레이아웃 중첩 구조

```
Root Layout
└── Dashboard Layout (SideNav + TopAppBar)
    ├── /dashboard
    ├── /projects/new
    └── /projects/[id]
        ├── Project Layout
        │   ├── /research
        │   ├── /draft/settings
        │   ├── /draft/edit + Editor Layout (CorrectionPanel)
        │   ├── /images + Image Layout (BottomBar)
        │   ├── /thumbnail
        │   └── /export + Export Layout (Stepper + BottomBar)
        │       └── /studio
```

## 주요 변경사항

### 1. 상태 관리
- 원본: 정적인 HTML
- 마이그레이션: React useState로 상호작용 추가

### 2. 라우팅
- 원본: 단일 파일에 여러 화면
- 마이그레이션: Next.js App Router로 분리

### 3. 레이아웃
- 원본: 각 화멸별 중복된 SideNav/TopBar
- 마이그레이션: Layout 파일로 공통화

### 4. 컴포넌트
- 원본: 하나의 큰 HTML 파일
- 마이그레이션: 기능별 컴포넌트 분리

## 보존 원칙

1. **원본 파일 보존**: `stitch-raw/` 폴터의 모든 파일은 수정 없이 보존
2. **디자인 유지**: 색상, 폰트, 레이아웃 구조 최대한 유지
3. **아이콘 유지**: Material Icons 그대로 사용
4. **클린 코드**: TODO 주석으로 향후 개선점 표시
