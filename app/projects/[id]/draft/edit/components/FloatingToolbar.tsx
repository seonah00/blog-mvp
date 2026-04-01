/**
 * Floating Toolbar
 * 
 * 텍스트 선택 시 나타나는 플로팅 툴
 * @see PROMPT_GUIDE.md Section 3 - Draft Correction
 */

'use client'

import { useState, useCallback } from 'react'
import { correctText } from '../actions'
import type { CorrectionType } from '@/lib/ai'

interface FloatingToolbarProps {
  selectedText: string
  rect: DOMRect | null
  isVisible: boolean
  /** 교정 결과 처리 콜백 */
  onCorrectionResult: (correctedText: string) => void
  /** 에러 발생 시 콜백 */
  onError?: (message: string) => void
  onClose: () => void
  /** 프로젝트 컨텍스트 */
  projectContext?: {
    targetAudience: string
    tone: string
  }
}

export function FloatingToolbar({
  selectedText,
  rect,
  isVisible,
  onCorrectionResult,
  onError,
  onClose,
  projectContext = { targetAudience: '일반 독자', tone: 'friendly' },
}: FloatingToolbarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeType, setActiveType] = useState<CorrectionType | null>(null)

  if (!isVisible || !rect || !selectedText) {
    return null
  }

  // 텍스트 길이 검증
  const isTextValid = selectedText.trim().length >= 5

  // 툴팁 위치 계산 (선택 영역 위, viewport 기준)
  const top = rect.top + window.scrollY - 50
  const left = rect.left + rect.width / 2

  /**
   * 교정 액션 처리
   * CorrectionPanel과 동일한 파이프라인 사용
   */
  const handleCorrection = useCallback(async (type: CorrectionType) => {
    // 텍스트 길이 검증
    if (!isTextValid) {
      onError?.('더 긴 텍스트를 선택해주세요. (최소 5자)')
      onClose()
      return
    }

    setIsLoading(true)
    setActiveType(type)

    try {
      const response = await correctText({
        originalText: selectedText,
        correctionType: type,
        context: {
          targetAudience: projectContext.targetAudience,
          tone: projectContext.tone,
        },
      })

      if (response.success && response.data) {
        onCorrectionResult(response.data.correctedText)
      } else {
        onError?.(response.error?.message || '교정 중 오류가 발생했습니다.')
      }
    } catch (err) {
      onError?.('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
      setActiveType(null)
      onClose()
    }
  }, [isTextValid, selectedText, projectContext, onCorrectionResult, onError, onClose])

  const buttons: { type: CorrectionType; label: string; title: string }[] = [
    { type: 'grammar', label: '문법', title: '문법 교정' },
    { type: 'style', label: '스타일', title: '스타일 개선' },
    { type: 'rewrite', label: '다시쓰기', title: '내용 재작성' },
  ]

  return (
    <div
      className="fixed z-50 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-gray-900 px-2 py-1.5 shadow-lg"
      style={{ top, left }}
    >
      {buttons.map((button, index) => (
        <div key={button.type} className="flex items-center gap-1">
          {index > 0 && <div className="h-4 w-px bg-gray-700" />}
          <button
            onClick={() => handleCorrection(button.type)}
            disabled={isLoading || !isTextValid}
            className={`rounded px-3 py-1.5 text-sm font-medium transition ${
              activeType === button.type
                ? 'bg-blue-600 text-white'
                : 'text-white hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isTextValid ? button.title : '텍스트를 더 길게 선택해주세요'}
          >
            {isLoading && activeType === button.type ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              button.label
            )}
          </button>
        </div>
      ))}
      
      {/* 화살표 */}
      <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-gray-900" />
    </div>
  )
}

/**
 * TODO: 향후 확장 액션
 * - 'shorten': 내용 축약 (간결하게)
 * - 'expand': 내용 확장 (상세히)
 * - 'tone': 톤 변경 (격식체/구어체)
 * 
 * 현재는 grammar/style/rewrite만 지원
 * @see lib/ai/types.ts - CorrectionType
 */
