'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseDraftAutosaveOptions {
  delay?: number
  onSave?: () => void
}

export function useDraftAutosave(
  content: string,
  options: UseDraftAutosaveOptions = {}
): {
  status: AutoSaveStatus
  triggerSave: () => void
} {
  const { delay = 1000, onSave } = options
  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef(content)

  const triggerSave = useCallback(() => {
    setStatus('saving')
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      try {
        // 실제 저장은 store의 updateDraftContent에서 처리됨
        // 이 훅은 상태 관리만 담당
        setStatus('saved')
        lastContentRef.current = content
        onSave?.()
        
        // 2초 후 idle로 전환
        setTimeout(() => {
          setStatus((current) => current === 'saved' ? 'idle' : current)
        }, 2000)
      } catch {
        setStatus('error')
      }
    }, delay)
  }, [content, delay, onSave])

  useEffect(() => {
    // 내용이 변경되면 자동 저장 트리거
    if (content !== lastContentRef.current) {
      triggerSave()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, triggerSave])

  return { status, triggerSave }
}
