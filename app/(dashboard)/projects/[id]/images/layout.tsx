/**
 * Image Generation Layout
 * - 이미지 생성 페이지 공통 레이아웃
 * - BottomStickyBar 포함
 */

import { BottomStickyBar } from "@/components/layout/bottom-sticky-bar";

export default function ImageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      <BottomStickyBar />
    </div>
  );
}
