/**
 * Project Stepper
 * - 프로젝트 진행 단계 표시
 * - 리서치 → 초안 → 이미지 → 낮에는
 * 
 * 원본: stitch-raw/components/05-project-stepper.html
 * 
 * Props:
 * - currentStep: 현재 단계 (0-3)
 * - steps: 단계 배열
 */

"use client";

const defaultSteps = [
  { id: "research", label: "리서치" },
  { id: "draft", label: "초안 작성" },
  { id: "image", label: "이미지" },
  { id: "export", label: "낮에는" },
];

interface ProjectStepperProps {
  currentStep?: number;
  steps?: typeof defaultSteps;
}

export function ProjectStepper({ 
  currentStep = 3, 
  steps = defaultSteps 
}: ProjectStepperProps) {
  return (
    <div className="relative flex justify-between items-start w-full px-4">
      {/* Connector Line Background */}
      <div className="absolute top-3 left-0 w-full h-[2px] bg-slate-200 -z-10 mx-auto" />
      
      {/* Connector Line Progress */}
      <div 
        className="absolute top-3 left-0 h-[2px] bg-gradient-to-r from-green-500 via-green-500 to-[var(--primary)] -z-10"
        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
      />

      {/* Steps */}
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <div key={step.id} className="flex flex-col items-center gap-2 bg-[var(--surface)]">
            {/* Circle */}
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isCompleted 
                  ? "bg-green-500 text-white" 
                  : isCurrent 
                    ? "bg-[var(--primary)] text-white ring-4 ring-[var(--primary)]/20" 
                    : "bg-slate-200 text-slate-400"
              }`}
            >
              {isCompleted ? (
                <span className="material-symbols-outlined text-sm font-bold">check</span>
              ) : isCurrent ? (
                <div className="w-2 h-2 rounded-full bg-white" />
              ) : null}
            </div>
            
            {/* Label */}
            <span 
              className={`text-[12px] ${
                isCompleted || isCurrent 
                  ? isCurrent ? "text-[var(--primary)] font-bold" : "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
