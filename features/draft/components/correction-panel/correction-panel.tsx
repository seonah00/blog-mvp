/**
 * Correction Panel
 * - 에디터 우측 교정 패널
 * - 반복키워드 탭, AI감지 탭
 * 
 * 원본: stitch-raw/components/03-editor-correction-panel.html
 * 
 * TODO:
 * - [ ] 탭 전환 상태 관리
 * - [ ] 반복키워드 분석 API 연동
 * - [ ] AI 감지 점수 계산
 * - [ ] Humanize 설정 기능
 */

"use client";

import { useState } from "react";

const tabs = [
  { id: "typos", label: "오타", count: 12 },
  { id: "spacing", label: "띄어쓰기", count: 8 },
  { id: "forbidden", label: "금지어", count: 3 },
  { id: "morphology", label: "형태소", count: 9 },
  { id: "keywords", label: "반복키워드", count: 7 },
  { id: "ai", label: "AI감지", count: null },
];

export function CorrectionPanel() {
  const [activeTab, setActiveTab] = useState("keywords");

  return (
    <aside className="w-[320px] h-screen bg-[var(--surface-container-lowest)] border-l border-[var(--outline-variant)] flex flex-col shadow-sm">
      {/* TOP TAB BAR */}
      <nav className="flex overflow-x-auto no-scrollbar whitespace-nowrap px-2 py-3 bg-[var(--surface-container)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 text-[13px] font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? "text-[var(--primary)] font-bold border-b-2 border-[var(--primary)]"
                : "text-slate-500"
            }`}
          >
            {tab.label} {tab.count && tab.count}
          </button>
        ))}
      </nav>

      {/* HEADER */}
      <div className="px-4 py-2">
        <p className="text-[12px] text-right text-[var(--outline)]">전체 단어 1,243개 분석됨</p>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-24">
        {activeTab === "keywords" && <RepeatKeywordsTab />}
        {activeTab === "ai" && <AIDetectionTab />}
      </div>

      {/* BOTTOM BUTTON */}
      <div className="p-4 border-t border-[var(--outline-variant)]/30 bg-[var(--surface-container-lowest)]">
        <button className="w-full h-11 bg-[var(--primary)] text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[var(--primary-container)] transition-colors">
          <span className="text-[14px]">✨ AI 키워드 최적화</span>
        </button>
        <p className="mt-2 text-[11px] text-center text-[var(--outline)]">
          키워드 밀도를 분석하여 자연스러운 흐름을 추천합니다.
        </p>
      </div>
    </aside>
  );
}

function RepeatKeywordsTab() {
  return (
    <>
      {/* SECTION: EXCESSIVE REPETITION */}
      <section className="space-y-3">
        <h3 className="text-[13px] font-bold text-[var(--error)] flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          ⚠️ 과다 반복
        </h3>
        <div className="space-y-4">
          {[
            { word: "인공지능", count: 23, percent: 80 },
            { word: "자동화", count: 17, percent: 60 },
            { word: "미래", count: 14, percent: 50 },
          ].map((item) => (
            <div key={item.word} className="space-y-1">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium">{item.word}</span>
                <span className="text-[11px] text-[var(--outline)]">{item.count}회 / {item.percent}%</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--surface-container)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--error)] rounded-full" style={{ width: `${item.percent}%` }}></div>
              </div>
              <button className="text-[11px] text-[var(--primary)] font-medium">줄이기 →</button>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: APPROPRIATE LEVEL */}
      <section className="space-y-3">
        <h3 className="text-[13px] font-bold text-green-600 flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          ✅ 적정 수준
        </h3>
        <div className="space-y-4">
          {[
            { word: "직업", count: 9, percent: 30 },
            { word: "기술", count: 7, percent: 20 },
          ].map((item) => (
            <div key={item.word} className="space-y-1">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium">{item.word}</span>
                <span className="text-[11px] text-[var(--outline)]">{item.count}회 / {item.percent}%</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--surface-container)] rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${item.percent}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WORD CLOUD */}
      <div className="p-4 bg-[var(--surface-container-low)] rounded-xl border border-[var(--outline-variant)]/20 flex flex-wrap items-center justify-center gap-2 text-center min-h-[120px]">
        <span className="text-2xl font-bold text-[var(--error)] leading-tight">인공지능</span>
        <span className="text-xl font-bold text-[var(--error)] leading-tight">자동화</span>
        <span className="text-lg font-semibold text-green-600">직업</span>
        <span className="text-base font-semibold text-green-600">기술</span>
      </div>
    </>
  );
}

function AIDetectionTab() {
  return (
    <div className="flex-1 overflow-y-auto px-4 space-y-6 pt-4 pb-24">
      {/* AI SCORE CARD */}
      <div className="p-5 bg-[var(--surface-container-low)] rounded-xl border border-[var(--outline-variant)]/20 space-y-4">
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-xs text-[var(--outline)] font-medium uppercase tracking-wider">AI Likelihood</span>
          <span className="text-5xl font-extrabold text-[var(--error)]">72%</span>
        </div>
        <div className="relative pt-4 pb-2">
          <div className="h-2 w-full rounded-full gauge-gradient"></div>
          <div className="absolute top-3 left-[72%] -translate-x-1/2 flex flex-col items-center">
            <div className="w-1 h-4 bg-[var(--on-surface)] rounded-full border-2 border-white shadow-sm"></div>
          </div>
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[10px] text-green-600 font-bold">안전</span>
            <span className="text-[10px] text-yellow-600 font-bold">주의</span>
            <span className="text-[10px] text-[var(--error)] font-bold">위험</span>
          </div>
        </div>
      </div>

      {/* DETECTOR BADGES */}
      <div className="grid grid-cols-1 gap-2">
        {[
          { name: "GPTZero", status: "AI 감지", statusColor: "error" },
          { name: "Turnitin", status: "AI 감지", statusColor: "error" },
          { name: "Originality", status: "주의", statusColor: "yellow" },
        ].map((detector) => (
          <div key={detector.name} className="flex items-center justify-between p-2.5 bg-[var(--error-container)]/20 border border-[var(--error)]/10 rounded-lg">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full bg-${detector.statusColor === "error" ? "[var(--error)]" : "yellow-500"}`}></span>
              <span className="text-[13px] font-semibold">{detector.name}</span>
            </div>
            <span className={`text-[11px] font-bold text-${detector.statusColor === "error" ? "[var(--error)]" : "yellow-700"}`}>
              {detector.status}
            </span>
          </div>
        ))}
      </div>

      {/* HUMANIZE SETTINGS */}
      <div className="space-y-4 pt-4 border-t border-[var(--outline-variant)]/20">
        <h4 className="text-[12px] font-bold text-[var(--outline)] uppercase">Humanize Settings</h4>
        <div className="space-y-3">
          {[
            { label: "문장 길이 다양화", checked: true },
            { label: "구어체 표현 추가", checked: true },
            { label: "AI 상투어 제거", checked: true },
            { label: "개인 경험 문장 삽입", checked: false },
          ].map((setting) => (
            <div key={setting.label} className="flex items-center justify-between">
              <span className="text-[13px]">{setting.label}</span>
              <div className={`w-8 h-4 rounded-full relative ${setting.checked ? "bg-[var(--primary)]" : "bg-[var(--surface-container-highest)]"}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full ${setting.checked ? "right-0.5" : "left-0.5"}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
