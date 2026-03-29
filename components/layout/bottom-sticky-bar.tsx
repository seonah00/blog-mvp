/**
 * Bottom Sticky Bar
 * - 하단 고정 액션 바
 * - 이미지 생성, 낮에는 등에서 사용
 * 
 * 원본: stitch-raw/components/04-bottom-sticky-bar.html
 * 
 * Props:
 * - leftContent: 좌측 영역 컨텐츠
 * - rightContent: 우측 영역 컨텐츠
 * - className: 추가 스타일
 */

"use client";

interface BottomStickyBarProps {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
}

export function BottomStickyBar({ 
  leftContent, 
  rightContent, 
  className = "" 
}: BottomStickyBarProps) {
  return (
    <footer 
      className={`fixed bottom-0 right-0 left-[240px] h-20 bg-white/90 backdrop-blur-md border-t border-[var(--surface-container)] flex items-center justify-between px-8 z-50 ${className}`}
    >
      {/* Left Section */}
      <div className="flex items-center gap-6">
        {leftContent || (
          <div className="flex flex-col">
            <span className="text-[11px] text-[var(--outline)] font-medium">
              총 6장 생성 · 3장 선택됨
            </span>
            <span className="text-xs font-bold text-[var(--on-surface)]">
              대표 1장 · 문단별 2장
            </span>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {rightContent || (
          <>
            <button className="text-sm font-bold text-[var(--outline)] hover:text-[var(--on-surface)] transition-colors">
              걸너뛰기
            </button>
            <button className="bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-md">
              다음 단계로 이동
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </>
        )}
      </div>
    </footer>
  );
}
