'use client'

import { useState, useEffect, useCallback } from 'react'

interface SelectionInfo {
  text: string
  rect: DOMRect | null
}

interface UseTextSelectionReturn {
  selectedText: string
  selectionRect: DOMRect | null
  isVisible: boolean
  clearSelection: () => void
}

export function useTextSelection(
  containerRef: React.RefObject<HTMLElement>
): UseTextSelectionReturn {
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo>({
    text: '',
    rect: null,
  })

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection()
    
    if (!selection || selection.isCollapsed) {
      setSelectionInfo({ text: '', rect: null })
      return
    }

    const text = selection.toString().trim()
    
    if (!text) {
      setSelectionInfo({ text: '', rect: null })
      return
    }

    // 컨테이너 낶부 선택인지 확인
    const range = selection.getRangeAt(0)
    const container = containerRef.current
    
    if (container && !container.contains(range.commonAncestorContainer)) {
      setSelectionInfo({ text: '', rect: null })
      return
    }

    const rect = range.getBoundingClientRect()
    setSelectionInfo({ text, rect })
  }, [containerRef])

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges()
    setSelectionInfo({ text: '', rect: null })
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange)
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleSelectionChange])

  return {
    selectedText: selectionInfo.text,
    selectionRect: selectionInfo.rect,
    isVisible: !!selectionInfo.text,
    clearSelection,
  }
}
