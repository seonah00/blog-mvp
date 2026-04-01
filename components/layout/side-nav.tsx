/**
 * Side Navigation Bar - HubSpot Enterprise Style
 * 
 * 다크 앱 셸 디자인
 * - 좌측 고정 네비게이션 (64px compact 모드 또는 240px 확장 모드)
 * - Icon-first 구조
 * - Muted filled highlight for active state
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { icon: "dashboard", label: "대시보드", href: "/" },
  { icon: "edit_document", label: "새 글쓰기", href: "/projects/new" },
  { icon: "chat", label: "스레드 글", href: "/threads/new" },
  { icon: "store", label: "당근 글", href: "/karrot/new" },
  { icon: "folder", label: "프로젝트 목록", href: "/projects" },
  { icon: "settings", label: "설정", href: "/settings" },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside 
      className="fixed left-0 top-0 h-full w-64 z-50 flex flex-col"
      style={{ 
        backgroundColor: 'var(--app-shell)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
        <div 
          className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <span className="material-symbols-outlined text-white text-lg">auto_awesome</span>
        </div>
        <span 
          className="text-lg font-semibold tracking-tight"
          style={{ color: 'var(--on-app-shell)' }}
        >
          BlogAI
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "active"
                  : ""
              }`}
              style={{
                color: isActive ? 'var(--on-app-shell)' : 'var(--on-app-shell-muted)',
                backgroundColor: isActive ? 'var(--app-shell-active)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--app-shell-hover)';
                  e.currentTarget.style.color = 'var(--on-app-shell)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--on-app-shell-muted)';
                }
              }}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer - Profile */}
      <div 
        className="py-3 px-3 border-t border-white/10"
        style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
      >
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150"
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
          <span className="material-symbols-outlined text-lg">account_circle</span>
          <span>프로필</span>
        </Link>
      </div>
    </aside>
  );
}
