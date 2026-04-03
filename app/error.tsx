'use client'

/**
 * Root Error Boundary
 * 
 * App Router의 최상위 error.tsx
 * - Production 환경에서 uncaught exception 발생 시 사용자에게 표시
 * - 개발 중에는 Next.js 기본 오버레이가 표시됨
 * - React #185와 같은 무한 루프 오류도 여기에서 잡힘
 */

import { useEffect } from 'react'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RootErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // 프로덕션 환경에서만 로깅
    console.error('[Root Error]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  // React #185 감지
  const isReact185 = error.message?.includes('185') || 
                     error.message?.includes('Maximum update depth exceeded')

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#fafafa',
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            padding: '32px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 20px',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}>
              ⚠️
            </div>
            
            <h1 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '12px',
            }}>
              {isReact185 ? '페이지 로딩 중 문제가 발생했습니다' : '오류가 발생했습니다'}
            </h1>
            
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.5',
            }}>
              {isReact185 
                ? '데이터 로딩 중 일시적인 문제가 발생했습니다. 페이지를 새로고침해 주세요.'
                : '예상치 못한 오류가 발생했습니다. 문제가 지속되면 관리자에게 문의해 주세요.'
              }
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
            }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                다시 시도
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                홈으로
              </button>
            </div>

            {/* 프로덕션에서만 표시되는 디버그 정보 */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{
                marginTop: '24px',
                padding: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                textAlign: 'left',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#6b7280',
                overflow: 'auto',
                maxHeight: '200px',
              }}>
                <div>Error: {error.message}</div>
                {error.digest && <div>Digest: {error.digest}</div>}
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
