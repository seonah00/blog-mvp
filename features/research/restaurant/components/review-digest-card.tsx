/**
 * Review Digest Card - HubSpot Enterprise Style
 * 
 * AI가 생성한 리뷰 요약/분석 결과 표시
 * - 생성 버튼 및 로딩/에러 상태 처리
 * - 생성된 digest 표시
 */

'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { generateReviewDigestAction } from '@/features/research/actions'
import type { ReviewDigest, UserReviewInput } from '@/types'

interface ReviewDigestCardProps {
  projectId: string
  placeName: string
  placeCategory: string
  reviews: UserReviewInput[]
  digest: ReviewDigest | undefined
  onDigestGenerated: (digest: ReviewDigest) => void
}

type GenerateStatus = 'idle' | 'loading' | 'success' | 'error'

export function ReviewDigestCard({
  projectId,
  placeName,
  placeCategory,
  reviews,
  digest,
  onDigestGenerated,
}: ReviewDigestCardProps) {
  const [status, setStatus] = useState<GenerateStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  const handleGenerate = async () => {
    if (reviews.length === 0) {
      setError('리뷰가 없습니다. 먼저 리뷰를 입력해주세요.')
      return
    }

    setStatus('loading')
    setError(null)
    setWarnings([])

    try {
      const result = await generateReviewDigestAction(
        projectId,
        placeName,
        placeCategory,
        reviews
      )

      if (result.success && result.digest) {
        setStatus('success')
        setWarnings(result.warnings)
        onDigestGenerated(result.digest)
      } else {
        setStatus('error')
        setError(result.error || '요약 생성에 실패했습니다.')
        setWarnings(result.warnings)
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    }
  }

  // digest가 있으면 결과 표시
  if (digest) {
    return (
      <div className="panel">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" style={{ color: 'var(--accent-secondary)' }}>summarize</span>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>리뷰 요약 분석</h3>
          </div>
          {digest.sentiment && <SentimentBadge sentiment={digest.sentiment} />}
        </div>

        <div className="panel-body space-y-4">
          {/* Summary */}
          <div 
            className="p-3 rounded-md border-l-3"
            style={{ 
              backgroundColor: 'var(--accent-interactive-light)',
              borderLeftColor: 'var(--accent-interactive)'
            }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--accent-interactive)' }}>전체 요약</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{digest.summary}</p>
          </div>

          {/* Highlights */}
          {digest.highlights.length > 0 && (
            <div>
              <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>핵심 포인트</h4>
              <ul className="space-y-2">
                {digest.highlights.map((highlight, i) => {
                  const isCaution = highlight.startsWith('[참고]')
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span style={{ color: isCaution ? 'var(--accent-warning)' : 'var(--accent-interactive)' }}>
                        {isCaution ? '⚠' : '•'}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {isCaution ? highlight.replace('[참고] ', '') : highlight}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Quotes */}
          {digest.quotes.length > 0 && (
            <div>
              <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>대표 인용구</h4>
              <div className="space-y-2">
                {digest.quotes.map((quote, i) => (
                  <blockquote 
                    key={i} 
                    className="pl-3 py-2 text-sm italic border-l-2"
                    style={{ 
                      borderColor: 'var(--border-secondary)',
                      color: 'var(--text-tertiary)',
                      backgroundColor: 'var(--workspace-secondary)'
                    }}
                  >
                    {quote}
                  </blockquote>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div 
            className="flex items-center justify-between pt-3 border-t"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              생성: {new Date(digest.generatedAt).toLocaleString()}
            </span>
            <button
              onClick={handleGenerate}
              disabled={status === 'loading'}
              className="btn-ghost text-xs py-1 px-2"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              다시 생성
            </button>
          </div>
        </div>
      </div>
    )
  }

  // digest가 없으면 생성 버튼 표시
  return (
    <div className="panel">
      <div className="panel-body">
        <div className="text-center py-8">
          {/* Icon */}
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: 'var(--accent-interactive-light)' }}
          >
            <span className="material-symbols-outlined text-xl" style={{ color: 'var(--accent-interactive)' }}>summarize</span>
          </div>

          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            리뷰 요약이 없습니다
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
            입력하신 {reviews.length}개의 리뷰를 AI가 분석하여 핵심 포인트와 인용구를 추출합니다.
          </p>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div 
              className="mb-3 p-3 rounded-md text-xs text-left mx-auto max-w-md"
              style={{ backgroundColor: 'var(--warning-light)', color: 'var(--accent-warning)' }}
            >
              <ul className="space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Error */}
          {error && (
            <div 
              className="mb-3 p-3 rounded-md text-xs mx-auto max-w-md flex items-start gap-2"
              style={{ backgroundColor: 'var(--error-light, #FEE2E2)', color: 'var(--accent-critical, #DC2626)' }}
            >
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={status === 'loading' || reviews.length === 0}
            className="btn-primary text-sm"
          >
            {status === 'loading' ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                요약 생성 중...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                리뷰 요약 생성하기
              </>
            )}
          </button>

          {/* Info */}
          <p className="mt-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            분석 대상: {reviews.length}개의 리뷰
          </p>
        </div>
      </div>
    </div>
  )
}

function SentimentBadge({ sentiment }: { sentiment: NonNullable<ReviewDigest['sentiment']> }) {
  const styles = {
    positive: { bg: 'var(--accent-secondary-light)', text: 'var(--accent-secondary)', label: '긍정적' },
    mixed: { bg: 'var(--warning-light)', text: 'var(--accent-warning)', label: '복합적' },
    neutral: { bg: 'var(--workspace-secondary)', text: 'var(--text-tertiary)', label: '중립' },
  } as const

  const style = styles[sentiment ?? 'neutral']

  return (
    <span 
      className="text-[10px] px-2 py-0.5 rounded font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  )
}
