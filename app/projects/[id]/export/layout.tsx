/**
 * Export Layout
 * - Export 전용 레이아웃
 * - Stepper + BottomStickyBar 포함
 * 
 * 원본: stitch-raw/components/05-project-stepper.html + 04-bottom-sticky-bar.html
 */

import { ProjectStepper } from "@/components/layout/project-stepper";
import { BottomStickyBar } from "@/components/layout/bottom-sticky-bar";

export default function ExportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Stepper */}
      <div className="bg-[var(--surface)] px-8 py-4 border-b">
        <div className="max-w-3xl mx-auto">
          <ProjectStepper currentStep={3} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* Bottom Bar */}
      <BottomStickyBar />
    </div>
  );
}
