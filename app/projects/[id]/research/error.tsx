'use client'

/**
 * Research Page Error Boundary
 * 
 * /projects/[id]/research 전용 error boundary
 * React #185 (Maximum update depth exceeded) 감지 및 복구
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ResearchErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ResearchErrorBoundary({ error, reset }: ResearchErrorBoundaryProps) {
  const router = useRouter()
  const [isReloading, setIsReloading] = useState(false)

  useEffect(() => {
    console.error('[Research Page Error]', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  // React #185 또는 무한 루프 감지
  const isInfiniteLoopError = 
    error.message?.includes('185') ||
    error.message?.includes('Maximum update depth exceeded') ||
    error.message?.includes('Maximum call stack size exceeded')

  const handleReload = () => {
    setIsReloading(true)
    // 페이지 완전 새로고침으로 상태 초기화
    window.location.reload()
  }

  const handleGoBack = () => {
    router.push('/projects/new')
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="panel max-w-md w-full">
        <div className="panel-body text-center py-8">
          <span className="material-symbols-outlined text-5xl mb-4" style={{ color: '#ef4444' }}>
            error
          </span>
          
          <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {isInfiniteLoopError 
              ? '데이터 로딩 중 문제가 발생했습니다' 
              : '페이지를 불러올 수 없습니다'
            }
          </h1>
          
          <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
            {isInfiniteLoopError
              ? '브라우저 데이터가 일시적으로 불안정합니다. 새로고침으로 해결됩니다.'
              : '예상치 못한 오류가 발생했습니다. 다시 시도해 주세요.'
            }
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleReload}
              disabled={isReloading}
              className="btn-primary"
            >
              {isReloading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  새로고침 중...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">refresh</span>
                  페이지 새로고침
                </>
              )}
            </button>
            
            <button
              onClick={handleGoBack}
              disabled={isReloading}
              className="btn-secondary"
            >
              새 프로젝트 만들기
            </button>
          </div>

          {/* 개발 환경에서만 오류 상세 표시 */}
          {process.env.NODE_ENV === 'development' && (
            <div 
              className="mt-6 p-3 rounded text-left text-xs overflow-auto"
              style={{ 
                backgroundColor: 'var(--workspace-secondary)',
                color: 'var(--text-muted)',
                maxHeight: '150px',
              }}
            >
              <div className="font-mono">
                <div>Error: {error.message}</div>
                {error.digest && <div>Digest: {error.digest}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
