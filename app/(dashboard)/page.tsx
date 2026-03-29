/**
 * Dashboard Page
 * - 프로젝트 목록, 통계 카드 표시
 * - 메인 진입점
 * 
 * 원본: stitch-raw/pages/01-dashboard.html
 * 
 * TODO:
 * - [ ] 프로젝트 목록 API 연동
 * - [ ] 통계 데이터 계산
 * - [ ] 프로젝트 생성 페이지 이동
 * - [ ] 테이블 정렬/필터링
 * - [ ] 페이지네이션
 */

import Link from "next/link";

// TODO: API에서 가져올 데이터 타입
interface Project {
  id: string;
  name: string;
  category: string;
  status: "research" | "draft" | "review" | "completed";
  wordCount: number;
  updatedAt: string;
}

// TODO: API 연동 후 삭제할 목업 데이터
const mockProjects: Project[] = [
  {
    id: "1",
    name: "The Future of AI",
    category: "기술",
    status: "research",
    wordCount: 1240,
    updatedAt: "2시간 전",
  },
  {
    id: "2",
    name: "Sustainable Living Guide",
    category: "라이프스타일",
    status: "draft",
    wordCount: 850,
    updatedAt: "5시간 전",
  },
];

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
      {/* Page Header */}
      <section>
        <h2 className="text-2xl font-semibold text-[var(--on-surface)]">개요</h2>
        <p className="text-[var(--on-surface-variant)] mt-1">
          AI를 통해 편집 워크플로우를 관리하고 자동화하세요
        </p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects */}
        <div className="bg-[var(--surface-container-lowest)] p-6 rounded-xl border border-[var(--outline-variant)]/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              +2 이번 주
            </span>
          </div>
          <div className="text-3xl font-bold text-[var(--on-surface)]">12</div>
          <div className="text-sm font-medium text-[var(--on-surface-variant)] mt-1">전체 프로젝트</div>
        </div>

        {/* Active */}
        <div className="bg-[var(--surface-container-lowest)] p-6 rounded-xl border border-[var(--outline-variant)]/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <span className="material-symbols-outlined">pending</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-[var(--on-surface)]">3</div>
          <div className="text-sm font-medium text-[var(--on-surface-variant)] mt-1">진행 중</div>
        </div>

        {/* Completed */}
        <div className="bg-[var(--surface-container-lowest)] p-6 rounded-xl border border-[var(--outline-variant)]/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-[var(--on-surface)]">8</div>
          <div className="text-sm font-medium text-[var(--on-surface-variant)] mt-1">완료됨</div>
        </div>

        {/* This Month */}
        <div className="bg-[var(--surface-container-lowest)] p-6 rounded-xl border border-[var(--outline-variant)]/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              일정대로
            </span>
          </div>
          <div className="text-3xl font-bold text-[var(--on-surface)]">5</div>
          <div className="text-sm font-medium text-[var(--on-surface-variant)] mt-1">이번 달</div>
        </div>
      </section>

      {/* Project Table Section */}
      <section className="bg-[var(--surface-container-lowest)] rounded-xl border border-[var(--outline-variant)]/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--surface-container)]">
          <h3 className="font-bold text-[var(--on-surface)]">최근 프로젝트</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[var(--surface-container-low)] text-[10px] font-bold tracking-widest text-[var(--outline)] uppercase">
            <tr>
              <th className="px-6 py-3">프로젝트</th>
              <th className="px-6 py-3">카테고리</th>
              <th className="px-6 py-3">상태</th>
              <th className="px-6 py-3">단어 수</th>
              <th className="px-6 py-3 text-right">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface-container)]">
            {mockProjects.map((project) => (
              <tr 
                key={project.id} 
                className="hover:bg-[var(--surface-container-low)] transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-[var(--on-surface)]">{project.name}</div>
                </td>
                <td className="px-6 py-4 text-[var(--on-surface-variant)] text-sm">{project.category}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight ${
                    project.status === "research" ? "bg-amber-100 text-amber-800" :
                    project.status === "draft" ? "bg-blue-100 text-blue-800" :
                    "bg-emerald-100 text-emerald-800"
                  }`}>
                    {project.status === "research" ? "조사 중" :
                     project.status === "draft" ? "초안 작성" :
                     project.status === "review" ? "검토 중" : "완료"}
                  </span>
                </td>
                <td className="px-6 py-4 text-[var(--on-surface-variant)] text-sm">{project.wordCount.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/projects/${project.id}`}
                    className="text-[var(--primary)] font-semibold text-sm hover:underline flex items-center justify-end gap-1"
                  >
                    열기 <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
