/**
 * Correction Panel
 * 
 * AI 교정 기능 UI
 * @see PROMPT_GUIDE.md Section 3 - Draft Correction
 */

'use client'

import { useState, useCallback } from 'react'
import { correctText } from '../actions'
import type { CorrectionOutput, CorrectionType } from '@/lib/ai'
import { CORRECTION_TYPE_META } from '@/lib/ai'

interface CorrectionPanelProps {
  selectedText: string
  onApplyCorrection: (correctedText: string) => void
  /** 프로젝트 컨텍스트 (선택적) */
  projectContext?: {
    targetAudience: string
    tone: string
  }
}

// 적용 완료 상태 타입
type ApplyStatus = 'idle' | 'success' | 'error'

export function CorrectionPanel({
  selectedText,
  onApplyCorrection,
  projectContext = { targetAudience: '일반 독자', tone: 'friendly' },
}: CorrectionPanelProps) {
  const [activeType, setActiveType] = useState<CorrectionType | null>(null)
  const [result, setResult] = useState<CorrectionOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applyStatus, setApplyStatus] = useState<ApplyStatus>('idle')

  const handleRequestCorrection = useCallback(async (type: CorrectionType) => {
    // 빈 텍스트 체크
    if (!selectedText || selectedText.trim().length < 5) {
      setError('텍스트를 5자 이상 선택해주세요.')
      return
    }

    setActiveType(type)
    setIsLoading(true)
    setError(null)
    setResult(null)
    setApplyStatus('idle')

    try {
      /**
       * AI Correction 요청
       * @see lib/ai/prompts/correction.ts - 프롬프트 템플릿
       * @see lib/ai/schemas/correction.ts - 응답 검증
       * @see lib/ai/client.ts - MockAIClient
       */
      const response = await correctText({
        originalText: selectedText,
        correctionType: type,
        context: {
          targetAudience: projectContext.targetAudience,
          tone: projectContext.tone,
        },
      })

      if (response.success && response.data) {
        setResult(response.data)
      } else {
        setError(response.error?.message || '교정 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedText, projectContext])

  const handleApply = useCallback(() => {
    if (!result) return

    try {
      onApplyCorrection(result.correctedText)
      setApplyStatus('success')
      
      // 3초 후 성공 상태 리셋
      setTimeout(() => {
        setApplyStatus('idle')
      }, 3000)
    } catch (err) {
      setApplyStatus('error')
      setError('적용 중 오류가 발생했습니다.')
    }
  }, [result, onApplyCorrection])

  const handleDismissError = useCallback(() => {
    setError(null)
  }, [])

  const handleRetry = useCallback(() => {
    if (activeType) {
      handleRequestCorrection(activeType)
    }
  }, [activeType, handleRequestCorrection])

  const correctionTypes: CorrectionType[] = ['grammar', 'style', 'rewrite']

  return (
    <div className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">AI 교정</h2>
      
      {!selectedText ? (
        <p className="mt-4 text-sm text-gray-500">
          본문에서 교정할 텍스트를 선택하세요.
        </p>
      ) : selectedText.trim().length < 5 ? (
        <p className="mt-4 text-sm text-amber-600">
          더 긴 텍스트를 선택해주세요. (최소 5자)
        </p>
      ) : (
        <>
          <div className="mt-4 rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">선택된 텍스트</p>
            <p className="mt-1 line-clamp-3 text-sm text-gray-700">
              {selectedText}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {selectedText.length}자
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {correctionTypes.map((type) => {
              const meta = CORRECTION_TYPE_META[type]
              const isActive = activeType === type
              return (
                <button
                  key={type}
                  onClick={() => handleRequestCorrection(type)}
                  disabled={isLoading}
                  title={meta.description}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {meta.name}
                </button>
              )
            })}
          </div>

          {isLoading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
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
              AI 처리 중...
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <span className="text-red-500">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm text-red-600">{error}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={handleRetry}
                      className="text-xs font-medium text-red-700 hover:underline"
                    >
                      다시 시도
                    </button>
                    <span className="text-red-300">|</span>
                    <button
                      onClick={handleDismissError}
                      className="text-xs font-medium text-red-700 hover:underline"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {applyStatus === 'success' && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">
                ✅ 수정 내용이 적용되었습니다.
              </p>
            </div>
          )}

          {result && !isLoading && applyStatus !== 'success' && (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-blue-600">
                    {activeType && CORRECTION_TYPE_META[activeType].name} 제안
                  </p>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    신뢰도 {Math.round(result.confidence * 100)}%
                  </span>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap text-gray-800">{result.correctedText}</p>
              </div>

              {result.changes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">
                    변경 사항 ({result.changes.length}개)
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {result.changes.map((change, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm"
                      >
                        <span className="inline-block rounded px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 mb-1">
                          {change.type === 'grammar' && '문법'}
                          {change.type === 'wording' && '표현'}
                          {change.type === 'structure' && '구조'}
                          {change.type === 'content' && '내용'}
                        </span>
                        <p className="text-gray-500 line-through">{change.original}</p>
                        <p className="mt-1 text-blue-600">{change.suggestion}</p>
                        <p className="mt-1 text-xs text-gray-400">{change.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleApply}
                disabled={applyStatus === 'error'}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                적용하기
              </button>
            </div>
          )}
        </>
      )}

      {/* 
        향후 확장 TODO:
        - 'shorten': 내용 축약
        - 'expand': 내용 확장  
        - 'tone': 톤 조정
        
        @see lib/ai/prompts/correction.ts - FutureCorrectionType
      */}
    </div>
  )
}
