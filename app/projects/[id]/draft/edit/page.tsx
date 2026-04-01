'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { formatRelativeTime } from '@/lib/utils'

// Components
import { AutoSaveIndicator } from './components/AutoSaveIndicator'
import { LastSavedTime } from './components/LastSavedTime'
import { FloatingToolbar } from './components/FloatingToolbar'
import { CorrectionPanel } from './components/CorrectionPanel'
import { BlockEditor, splitContentIntoBlocks, mergeBlocksIntoContent, type Block } from './components/BlockEditor'

// Type-specific Helper Components
import { RestaurantDraftHelper } from '@/features/draft/restaurant/components/restaurant-draft-helper'
import { InformationalDraftHelper } from '@/features/draft/informational/components/informational-draft-helper'

// Hooks
import { useDraftAutosave } from './hooks/useDraftAutosave'
import { useTextSelection } from './hooks/useTextSelection'

/**
 * 미저장 변경사항 경고 다이얼로그
 */
function UnsavedChangesDialog({
  isOpen,
  targetVersionLabel,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  targetVersionLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(51, 71, 91, 0.5)' }}>
      <div className="w-full max-w-sm rounded-lg shadow-xl overflow-hidden" style={{ backgroundColor: 'var(--workspace)' }}>
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--workspace-secondary)' }}>
          <span className="material-symbols-outlined text-lg" style={{ color: 'var(--accent-warning)' }}>warning</span>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>미저장 변경사항</h3>
        </div>
        
        {/* Body */}
        <div className="px-4 py-4">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            현재 편집 중인 내용이 저장되지 않았습니다.
            {targetVersionLabel && (
              <span className="block mt-1" style={{ color: 'var(--text-tertiary)' }}>
                "{targetVersionLabel}"(으)로 전환하면 현재 변경사항이 사라집니다.
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t flex gap-2 justify-end" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--workspace-secondary)' }}>
          <button onClick={onCancel} className="btn-secondary text-xs py-1.5 px-3">
            취소
          </button>
          <button onClick={onConfirm} className="btn-primary text-xs py-1.5 px-3" style={{ backgroundColor: 'var(--accent-warning)', borderColor: 'var(--accent-warning)' }}>
            전환하기
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Edit Header Component
 */
function EditHeader({
  draft,
  project,
  settings,
  autoSaveStatus,
  isDirty,
  onSettingsClick,
}: {
  draft: { title: string; version: number; wordCount: number; lastSavedAt?: string }
  project: { type: 'restaurant' | 'informational' | 'threads' | 'karrot'; title: string; topic: string }
  settings: { tone: string; length: string }
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error'
  isDirty: boolean
  onSettingsClick: () => void
}) {
  return (
    <div className="border-b" style={{ backgroundColor: 'var(--workspace)', borderColor: 'var(--border-primary)' }}>
      <div className="px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left - Title & Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {draft.title}
              </h1>
              {isDirty && (
                <span className="badge badge-amber" title="저장되지 않은 변경사항이 있습니다">수정중</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">folder</span>
                {project.type === 'restaurant' ? '맛집' : 
                 project.type === 'threads' ? '스레드' :
                 project.type === 'karrot' ? '당근' :
                 '정보성'}
              </span>
              <span>·</span>
              <span>{draft.wordCount}단어</span>
              <span>·</span>
              <span className="capitalize">{settings.tone}</span>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md" style={{ backgroundColor: 'var(--workspace-secondary)' }}>
              <AutoSaveIndicator status={autoSaveStatus} />
              <span style={{ color: 'var(--text-tertiary)' }}>·</span>
              <LastSavedTime lastSavedAt={draft.lastSavedAt} />
            </div>
            <button onClick={onSettingsClick} className="btn-ghost text-xs" title="초안 설정">
              <span className="material-symbols-outlined text-base">settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DraftEditPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const projectId = params.id
  const editorRef = useRef<HTMLDivElement>(null)

  // Store
  const hasHydrated = useProjectStore((state) => state.hasHydrated)
  const project = useProjectStore((state) => state.getProject(projectId))
  const settings = useProjectStore((state) => state.getDraftSettings(projectId))
  const draft = useProjectStore((state) => state.getDraft(projectId))
  const createDraft = useProjectStore((state) => state.createDraft)
  const createRestaurantDraft = useProjectStore((state) => state.createRestaurantDraft)
  const updateDraftContent = useProjectStore((state) => state.updateDraftContent)
  const reviewDigest = useProjectStore((state) => state.getReviewDigest(projectId))

  // Local state
  const [blocks, setBlocks] = useState<Block[]>([])
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  
  // 버전 전환 시 미저장 내용 보호
  const [originalContent, setOriginalContent] = useState<string>('')
  const [pendingVersionSwitch, setPendingVersionSwitch] = useState<{
    versionId: string
    label?: string
  } | null>(null)

  // Auto save
  const content = useMemo(() => mergeBlocksIntoContent(blocks), [blocks])
  
  // Dirty state
  const isDirty = useMemo(() => {
    return content !== originalContent
  }, [content, originalContent])
  
  const { status: autoSaveStatus } = useDraftAutosave(content, {
    delay: 1000,
    onSave: () => {
      updateDraftContent(projectId, content)
    },
  })

  // Text selection for floating toolbar
  const { selectedText, selectionRect, isVisible, clearSelection } = useTextSelection(editorRef)

  // Initialize draft
  useEffect(() => {
    const initDraft = async () => {
      if (!project || !settings || draft) return
      
      if (project.type === 'restaurant') {
        await createRestaurantDraft(projectId)
      } else {
        createDraft(projectId)
      }
    }
    
    initDraft()
  }, [project, settings, draft, projectId, createDraft, createRestaurantDraft])

  // Initialize blocks from draft content
  useEffect(() => {
    if (draft) {
      const initialBlocks = splitContentIntoBlocks(draft.content)
      setBlocks(initialBlocks)
      setOriginalContent(draft.content)
    }
  }, [draft?.projectId, draft?.version])

  // Handle block change
  const handleBlockChange = useCallback((blockId: string, newContent: string) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, content: newContent } : block
      )
    )
  }, [])

  // Handle block focus
  const handleBlockFocus = useCallback((blockId: string) => {
    setActiveBlockId(blockId)
  }, [])

  // Notification state
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const showNotification = useCallback((type: 'error' | 'success', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // Apply correction
  const applyCorrectionToBlock = useCallback((correctedText: string) => {
    if (!activeBlockId || !selectedText) return false

    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id === activeBlockId) {
          const index = block.content.indexOf(selectedText)
          if (index === -1) {
            console.warn('Selected text not found in block:', selectedText)
            return block
          }

          const before = block.content.slice(0, index)
          const after = block.content.slice(index + selectedText.length)
          
          return {
            ...block,
            content: before + correctedText + after,
          }
        }
        return block
      })
    )
    return true
  }, [activeBlockId, selectedText])

  const handleFloatingToolbarCorrection = useCallback((correctedText: string) => {
    const success = applyCorrectionToBlock(correctedText)
    if (success) {
      showNotification('success', '수정 내용이 적용되었습니다.')
      clearSelection()
    } else {
      showNotification('error', '텍스트를 찾을 수 없습니다. 다시 선택해주세요.')
    }
  }, [applyCorrectionToBlock, clearSelection, showNotification])

  const handleApplyCorrection = useCallback((correctedText: string) => {
    const success = applyCorrectionToBlock(correctedText)
    if (success) {
      clearSelection()
    }
  }, [applyCorrectionToBlock, clearSelection])

  const handleFloatingToolbarError = useCallback((message: string) => {
    showNotification('error', message)
  }, [showNotification])

  // Version switch handling
  const handleVersionSwitchRequest = useCallback((versionId: string, label?: string) => {
    if (isDirty) {
      setPendingVersionSwitch({ versionId, label })
    } else {
      const store = useProjectStore.getState()
      store.switchDraftVersion(projectId, versionId)
    }
  }, [isDirty, projectId])

  const confirmVersionSwitch = useCallback(() => {
    if (pendingVersionSwitch) {
      const store = useProjectStore.getState()
      store.switchDraftVersion(projectId, pendingVersionSwitch.versionId)
      setPendingVersionSwitch(null)
    }
  }, [pendingVersionSwitch, projectId])

  const cancelVersionSwitch = useCallback(() => {
    setPendingVersionSwitch(null)
  }, [])

  // Hydration check
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Loading states
  if (!hasHydrated || !isMounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          <span className="text-sm">초안을 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6">
        <h1 style={{ color: 'var(--text-primary)' }}>프로젝트를 찾을 수 없습니다.</h1>
        <p style={{ color: 'var(--text-tertiary)' }}>프로젝트 생성부터 다시 진행해 주세요.</p>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="p-6">
        <h1 style={{ color: 'var(--text-primary)' }}>초안 설정이 없습니다.</h1>
        <p style={{ color: 'var(--text-tertiary)' }}>먼저 초안 설정을 저장한 뒤 에디터로 이동해 주세요.</p>
        <button
          type="button"
          onClick={() => router.push(`/projects/${projectId}/draft/settings`)}
          className="btn-primary mt-4"
        >
          초안 설정으로 이동
        </button>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          <span className="text-sm">초안 생성 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--workspace)' }}>
      {/* Header */}
      <EditHeader
        draft={draft}
        project={project}
        settings={settings}
        autoSaveStatus={autoSaveStatus}
        isDirty={isDirty}
        onSettingsClick={() => router.push(`/projects/${projectId}/draft/settings`)}
      />

      {/* Main Content - 2 Column */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left - Editor */}
        <main className="flex-1 overflow-y-auto custom-scrollbar min-w-0">
          <div className="max-w-3xl mx-auto p-6">
            {/* Block Editor */}
            <div ref={editorRef} className="space-y-1">
              {blocks.map((block) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  onChange={handleBlockChange}
                  onFocus={handleBlockFocus}
                  isActive={activeBlockId === block.id}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Right - Helper Sidebar */}
        <aside 
          className="w-72 lg:w-80 overflow-y-auto custom-scrollbar border-l flex-shrink-0 hidden md:block"
          style={{ 
            backgroundColor: 'var(--workspace-secondary)',
            borderColor: 'var(--border-primary)'
          }}
        >
          {project.type === 'restaurant' ? (
            <RestaurantDraftHelper 
              projectId={projectId} 
              onVersionSwitchRequest={handleVersionSwitchRequest}
              isDirty={isDirty}
            />
          ) : project.type === 'threads' ? (
            <div className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>
                Threads 글쓰기 도우미
              </h3>
              <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <p>• 짧은 문장으로 작성하세요 (1-2문장)</p>
                <p>• 이모지를 적절히 사용하세요</p>
                <p>• 해시태그는 마지막에 별도로</p>
              </div>
            </div>
          ) : project.type === 'karrot' ? (
            <div className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>
                당근 글쓰기 도우미
              </h3>
              <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <p>• 동네 친구처럼 친근하게</p>
                <p>• 가격/위치 정보를 정확히</p>
                <p>• 과장된 표현은 피하세요</p>
              </div>
            </div>
          ) : (
            <InformationalDraftHelper projectId={projectId} />
          )}
        </aside>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div 
          className="fixed bottom-4 right-4 z-50 rounded-md px-3 py-2 shadow-lg border"
          style={{ 
            backgroundColor: 'var(--workspace)',
            borderColor: notification.type === 'error' ? 'var(--accent-critical)' : 'var(--accent-secondary)',
            borderLeftWidth: '3px'
          }}
        >
          <div className="flex items-center gap-2">
            <span 
              className="material-symbols-outlined text-sm"
              style={{ color: notification.type === 'error' ? 'var(--accent-critical)' : 'var(--accent-secondary)' }}
            >
              {notification.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{notification.message}</p>
          </div>
        </div>
      )}

      {/* Floating Toolbar */}
      <FloatingToolbar
        selectedText={selectedText}
        rect={selectionRect}
        isVisible={isVisible}
        onCorrectionResult={handleFloatingToolbarCorrection}
        onError={handleFloatingToolbarError}
        onClose={clearSelection}
        projectContext={{
          targetAudience: project.targetAudience,
          tone: settings.tone,
        }}
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={!!pendingVersionSwitch}
        targetVersionLabel={pendingVersionSwitch?.label}
        onConfirm={confirmVersionSwitch}
        onCancel={cancelVersionSwitch}
      />
    </div>
  )
}
