/**
 * Export Page
 * - 기본 낮에는 옵션 (Markdown, HTML, 클립보드)
 * - 미리보기 카드
 * 
 * 원본: stitch-raw/pages/09-export.html
 * 
 * TODO:
 * - [ ] 실제 파일 다운로드
 * - [ ] 클립보드 복사 기능
 * - [ ] 외부 채널 연동
 * - [ ] 완성 상태 표시
 */

"use client";

export default function ExportPage() {
  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Main Grid */}
      <div className="grid grid-cols-10 gap-8">
        {/* LEFT: Preview */}
        <div className="col-span-6 space-y-4">
          <div className="bg-[var(--surface-container-lowest)] rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--on-surface)]">미리보기</h3>
            </div>
            <div className="w-full aspect-video bg-gradient-to-br from-blue-900 to-purple-900"></div>
            <div className="p-8 space-y-6">
              <h2 className="text-xl font-bold text-[var(--on-surface)] leading-tight">인공지능이 바꾸는 미래의 직업 세계</h2>
              <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed opacity-80">
                지난 10년간 인공지능 기술은 눈부신 속도로 발전해 왔습니다...
              </p>
              <div className="flex justify-center items-center gap-4 text-[13px] text-[var(--on-surface-variant)]/60">
                <span>1,243 단어</span>
                <span>•</span>
                <span>8분 읽기</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Export Options */}
        <div className="col-span-4 space-y-4">
          <div className="bg-[var(--surface-container-lowest)] rounded-xl border p-6 flex flex-col gap-6">
            <h3 className="text-base font-semibold text-[var(--on-surface)]">낮에는 옵션</h3>
            <div className="space-y-4">
              {[
                { icon: "text_snippet", color: "blue", title: "Markdown", desc: "Notion, Obsidian, 개발자용", action: "다운로드 .md" },
                { icon: "language", color: "green", title: "HTML", desc: "웹사이트, 이메일 뉴스레터용", action: "다운로드 .html" },
                { icon: "content_copy", color: "purple", title: "클립보드 복사", desc: "어디서든 바로 붙여넣기", action: "복사하기" },
                { icon: "link", color: "orange", title: "외부 채널 발행", desc: "워드프레스, 티스토리, 브런치", action: "연동하기", link: true },
              ].map((option) => (
                <div key={option.title} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--surface-container)] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-${option.color}-50 flex items-center justify-center text-${option.color}-600`}>
                      <span className="material-symbols-outlined">{option.icon}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{option.title}</span>
                      <span className="text-xs text-[var(--on-surface-variant)]">{option.desc}</span>
                    </div>
                  </div>
                  {option.link ? (
                    <a className="text-xs text-[var(--primary)] font-medium" href="#">연동하기</a>
                  ) : (
                    <button className="px-3 py-1.5 border rounded-lg text-xs font-medium hover:bg-slate-50">{option.action}</button>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 flex flex-col items-center text-center gap-2">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                아티클이 완성되었습니다!
              </div>
              <div className="text-[11px] text-green-600 opacity-80">총 작업 시간: 23분 · 3번의 수정 · AI 감지 23%</div>
            </div>

            <button className="w-full h-11 bg-[var(--primary)] text-white rounded-lg font-bold hover:opacity-95 transition-all shadow-md">
              새 프로젝트 시작하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
