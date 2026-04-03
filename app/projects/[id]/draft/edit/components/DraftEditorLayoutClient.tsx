'use client'

import { useState } from 'react'
import { CorrectionPanel } from '@/features/draft/components/correction-panel/correction-panel'

interface DraftEditorLayoutClientProps {
  children: React.ReactNode
}

export function DraftEditorLayoutClient({ children }: DraftEditorLayoutClientProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Main Editor Area */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Toggle Button - floating */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="fixed right-4 bottom-4 z-50 px-4 py-2 bg-[var(--primary)] text-white rounded-full shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        aria-label={isPanelOpen ? '교정 패널 닫기' : '교정 패널 열기'}
        type="button"
      >
        <span className="material-symbols-outlined text-sm">
          {isPanelOpen ? 'close' : 'edit_note'}
        </span>
        <span className="text-sm">{isPanelOpen ? '닫기' : '교정 패널'}</span>
      </button>

      {/* Right Correction Panel - slide-in overlay */}
      {isPanelOpen && (
        <div className="fixed right-0 top-0 h-full w-80 z-40 shadow-xl animate-in slide-in-from-right duration-300">
          <div className="h-full bg-[var(--surface-container-lowest)] border-l border-[var(--outline-variant)]">
            <CorrectionPanel />
          </div>
        </div>
      )}
    </div>
  )
}
