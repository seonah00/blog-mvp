/**
 * FieldError Component - HubSpot Enterprise Design System
 * 
 * 필드 단위 오류 메시지
 * - 과도한 붉은 박스 대신, 작지만 명확한 오류 표시
 * - FieldLabel의 error prop 대신 유연하게 사용하거나 보완
 * - 페이지/섹션 단위 오류는 Notice 사용
 */

import * as React from 'react'

export interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** 오류 메시지 */
  children: React.ReactNode
  /** 아이콘 표시 여부 (기본: true) */
  showIcon?: boolean
  /** 컴팩트 모드 */
  compact?: boolean
}

export const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ 
    children,
    showIcon = true,
    compact = false,
    className = '',
    ...props 
  }, ref) => {
    return (
      <p
        ref={ref}
        className={[
          'flex items-start gap-1',
          compact ? 'text-[11px] mt-1.5' : 'text-xs mt-2',
          className,
        ].filter(Boolean).join(' ')}
        style={{ color: 'var(--accent-critical)' }}
        role="alert"
        {...props}
      >
        {showIcon && (
          <span 
            className="material-symbols-outlined flex-shrink-0 text-[14px]"
            style={{ color: 'var(--accent-critical)' }}
          >
            error
          </span>
        )}
        <span>{children}</span>
      </p>
    )
  }
)

FieldError.displayName = 'FieldError'

export default FieldError
