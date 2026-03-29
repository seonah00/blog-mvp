/**
 * Draft Editor Layout
 * - Editor 전용 레이아웃
 * - CorrectionPanel 포함
 * 
 * 원본: stitch-raw/components/03-editor-correction-panel.html
 */

import { CorrectionPanel } from "@/features/draft/components/correction-panel/correction-panel";

export default function DraftEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Editor Area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      
      {/* Right Correction Panel */}
      <CorrectionPanel />
    </div>
  );
}
