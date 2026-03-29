/**
 * Top App Bar - HubSpot Enterprise Style
 * 
 * 다크 헤더 + 라이트 유틸리티 존
 * - 검색 또는 페이지 식별 영역
 * - 우측 유틸리티 액션
 */

"use client";

import { usePathname } from "next/navigation";

export function TopAppBar() {
  const pathname = usePathname();
  
  // 경로에서 페이지 타이틀 추출
  const getPageTitle = () => {
    if (pathname === "/") return "대시보드";
    if (pathname?.includes("/projects/new")) return "새 프로젝트";
    if (pathname?.includes("/research")) return "리서치";
    if (pathname?.includes("/draft/settings")) return "초안 설정";
    if (pathname?.includes("/draft/edit")) return "초안 편집";
    if (pathname?.includes("/settings")) return "설정";
    return "";
  };

  return (
    <header 
      className="sticky top-0 w-full z-40 h-14 flex items-center justify-between px-6"
      style={{ 
        backgroundColor: 'var(--app-shell-dark)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* Left - Page Title / Breadcrumb */}
      <div className="flex items-center gap-4">
        <h1 
          className="text-sm font-semibold"
          style={{ color: 'var(--on-app-shell)' }}
        >
          {getPageTitle()}
        </h1>
      </div>

      {/* Center - Search (optional) */}
      <div className="flex-1 max-w-md mx-8">
        <div 
          className="relative flex items-center"
          style={{ 
            backgroundColor: 'var(--app-shell)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <span 
            className="material-symbols-outlined absolute left-3 text-lg"
            style={{ color: 'var(--on-app-shell-subtle)' }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="검색..."
            className="w-full bg-transparent border-none py-2 pl-10 pr-4 text-sm outline-none"
            style={{ color: 'var(--on-app-shell)' }}
          />
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button 
          className="p-2 rounded-md transition-all duration-150"
          style={{ color: 'var(--on-app-shell-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--app-shell-hover)';
            e.currentTarget.style.color = 'var(--on-app-shell)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--on-app-shell-muted)';
          }}
        >
          <span className="material-symbols-outlined text-lg">notifications</span>
        </button>

        {/* Help */}
        <button 
          className="p-2 rounded-md transition-all duration-150"
          style={{ color: 'var(--on-app-shell-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--app-shell-hover)';
            e.currentTarget.style.color = 'var(--on-app-shell)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--on-app-shell-muted)';
          }}
        >
          <span className="material-symbols-outlined text-lg">help_outline</span>
        </button>

        {/* User Avatar */}
        <button 
          className="ml-2 w-8 h-8 rounded-full overflow-hidden transition-transform hover:scale-105"
          style={{ 
            background: 'linear-gradient(135deg, var(--accent-interactive), var(--accent-secondary))'
          }}
        >
          <div className="w-full h-full flex items-center justify-center text-white text-xs font-medium">
            U
          </div>
        </button>
      </div>
    </header>
  );
}
