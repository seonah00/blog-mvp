"use client";

/**
 * Export Studio Page
 * - 고급 낮에는 (SNS 콘텐츠 재작성 포함)
 * 
 * 원본: stitch-raw/pages/10-export-studio.html
 * 
 * TODO:
 * - [ ] SNS 플랫폼별 콘텐츠 변환
 * - [ ] Threads, Instagram, LinkedIn 스타일 변환
 * - [ ] 선택한 SNS로 일괄 변환
 */

"use client";

import { useState } from "react";

const snsPlatforms = [
  { id: "threads", name: "스레드 (Threads)", icon: "forum", desc: "스레드 시리즈 작성", color: "slate", checked: false },
  { id: "daangn", name: "당근 소식", icon: "store", desc: "동네 소식지/광고용", color: "orange", checked: false },
  { id: "instagram", name: "인스타그램", icon: "photo_library", desc: "카드 뉴스 캡션용", color: "pink", checked: true },
  { id: "linkedin", name: "링크드인", icon: "work", desc: "전문적 요약형", color: "blue", checked: false },
];

export default function ExportStudioPage() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="mt-16 p-8 flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        {/* LEFT: Article Preview */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <div className="bg-[var(--surface-container-lowest)] rounded-xl p-8 shadow-sm border">
            <div className="aspect-[21/9] w-full rounded-lg overflow-hidden mb-8 relative bg-gradient-to-br from-blue-600 to-purple-600">
              <div className="absolute bottom-4 left-6">
                <span className="bg-[var(--primary)]/90 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">Technology</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-[var(--on-surface)] mb-4">AI가 바꾸는 현대 마케팅의 미래: 2024년 주요 트렌드 분석</h2>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b text-xs text-slate-500">
              <span>2024년 5월 24일</span>
              <span>읽기 시간 8분</span>
            </div>
            <p className="text-[var(--on-surface-variant)] leading-relaxed">
              인공지능 기술은 더 이상 선택이 아닌 생존의 필수 요소가 되었습니다...
            </p>
          </div>

          {/* Completion Message */}
          <div className="bg-[var(--primary-fixed)]/30 rounded-xl p-6 border border-[var(--primary)]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[var(--primary)] shadow-sm">
                  <span className="material-symbols-outlined text-2xl">verified</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--on-primary-fixed-variant)]">아티클이 완성되었습니다!</h3>
                  <p className="text-sm text-slate-600">완성도 높은 아티클이 성공적으로 생성되었습니다.</p>
                </div>
              </div>
              <div className="flex gap-6">
                {[
                  { label: "작업 시간", value: "12분" },
                  { label: "수정 횟수", value: "4회" },
                  { label: "AI 점수", value: "98점" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase">{stat.label}</p>
                    <p className="font-bold text-[var(--primary)]">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Export Options */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bg-[var(--surface-container-lowest)] rounded-xl p-6 shadow-sm border sticky top-24">
            {/* Traditional Export */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">전통적 낮에는</h3>
              {[
                { icon: "description", label: "Markdown 파일 다운로드" },
                { icon: "code", label: "HTML 코드로 복사" },
              ].map((item) => (
                <button key={item.label} className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-[var(--surface-container)] transition-colors group mb-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-[var(--primary)]">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 text-sm">download</span>
                </button>
              ))}
            </div>

            {/* SNS Repurpose */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--on-surface)]">SNS 콘텐츠로 재작성</h3>
                <p className="text-xs text-slate-500">작성된 글을 각 SNS 성격에 맞게 AI가 다시 작성합니다</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {snsPlatforms.map((platform) => (
                  <label
                    key={platform.id}
                    className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPlatforms.includes(platform.id)
                        ? "border-[var(--primary)] bg-[var(--primary-fixed)]/10"
                        : "border-[var(--outline-variant)]/10 hover:border-[var(--primary)]/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform.id)}
                      onChange={() => togglePlatform(platform.id)}
                      className="absolute top-3 right-3"
                    />
                    <span className={`material-symbols-outlined mb-2 ${
                      platform.id === "instagram" ? "text-pink-600" :
                      platform.id === "linkedin" ? "text-blue-600" :
                      platform.id === "daangn" ? "text-orange-500" : "text-slate-700"
                    }`}>{platform.icon}</span>
                    <span className="text-xs font-bold mb-1">{platform.name}</span>
                    <span className="text-[10px] text-slate-500">{platform.desc}</span>
                  </label>
                ))}
              </div>
              <button className="w-full py-4 bg-[var(--primary)] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all mt-6">
                선택한 SNS 글로 변환하기 ✨
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-16 pt-12 pb-24 border-t flex flex-col items-center gap-6">
        <button className="px-12 py-4 bg-[var(--primary)] text-white rounded-full font-bold shadow-xl hover:opacity-90 transition-all">
          새 프로젝트 시작하기
        </button>
        <a className="text-slate-400 text-sm hover:text-slate-600 font-medium underline" href="#">
          대시보드로 돌아가기
        </a>
      </footer>
    </div>
  );
}
