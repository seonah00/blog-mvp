/**
 * FieldLabel Component - HubSpot Enterprise Design System
 * 
 * 공통 폼 필드 라벨 컴포넌트
 * - label text
 * - required / optional 표시
 * - description / helper text
 * - error text
 * - htmlFor 연결
 * - action slot (우측 작은 링크나 badge)
 */

import * as React from 'react'

export interface FieldLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 라벨 텍스트 */
  label: string
  /** input id (htmlFor) */
  htmlFor?: string
  /** 필수 여부 */
  required?: boolean
  /** 선택 여부 표시 */
  optional?: boolean
  /** 설명/도움말 텍스트 */
  description?: string
  /** 에러 텍스트 */
  error?: string
  /** 우측 액션 (링크, badge 등) */
  action?: React.ReactNode
  /** label과 input 사이 간격 */
  spacing?: 'sm' | 'md' | 'lg'
}

export const FieldLabel = React.forwardRef<HTMLDivElement, FieldLabelProps>(
  ({ 
    label,
    htmlFor,
    required = false,
    optional = false,
    description,
    error,
    action,
    spacing = 'md',
    className = '',
    children,
    ...props 
  }, ref) => {
    const spacingClasses = {
      sm: 'mb-1.5',
      md: 'mb-2',
      lg: 'mb-3',
    }

    const labelClasses = [
      'block text-xs font-medium',
      spacingClasses[spacing],
      className,
    ].filter(Boolean).join(' ')

    return (
      <div ref={ref} className="w-full" {...props}>
        {/* Label Row */}
        <div className="flex items-center justify-between">
          <label 
            htmlFor={htmlFor}
            className={labelClasses}
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
            {required && (
              <span 
                className="ml-1"
                style={{ color: 'var(--accent-critical)' }}
                aria-label="필수"
              >
                *
              </span>
            )}
            {optional && !required && (
              <span 
                className="ml-1 text-[10px] font-normal"
                style={{ color: 'var(--text-muted)' }}
              >
                (선택)
              </span>
            )}
          </label>
          {action && (
            <div className="flex-shrink-0">{action}</div>
          )}
        </div>

        {/* Description */}
        {description && !error && (
          <p 
            className="text-[11px] mb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {description}
          </p>
        )}

        {/* Error */}
        {error && (
          <p 
            className="text-[11px] mb-1.5"
            style={{ color: 'var(--accent-critical)' }}
          >
            {error}
          </p>
        )}

        {/* Children (input, select, textarea 등) */}
        {children}
      </div>
    )
  }
)

FieldLabel.displayName = 'FieldLabel'

export default FieldLabel
