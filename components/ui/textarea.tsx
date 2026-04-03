/**
 * Textarea Component - HubSpot Enterprise Design System
 * 
 * 공통 텍스트영역 컴포넌트
 * - error 상태
 * - disabled 상태
 * - label 연결
 * - resize 옵션
 */

import * as React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 에러 상태 */
  error?: boolean
  /** 에러 메시지 */
  errorMessage?: string
  /** 라벨 */
  label?: string
  /** 도움말 텍스트 */
  helperText?: string
  /** 리사이즈 방향 */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    error = false,
    errorMessage,
    label,
    helperText,
    disabled,
    resize = 'vertical',
    className = '',
    id,
    rows = 4,
    ...props 
  }, ref) => {
    const generatedId = React.useId()
    const textareaId = id ?? generatedId
    
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }

    const textareaClasses = [
      'input min-h-[80px]',
      resizeClasses[resize],
      error ? 'border-[var(--accent-critical)] focus:border-[var(--accent-critical)] focus:ring-[var(--accent-critical-light)]' : '',
      className,
    ].filter(Boolean).join(' ')

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          rows={rows}
          className={textareaClasses}
          {...props}
        />
        {error && errorMessage && (
          <p className="mt-1 text-xs" style={{ color: 'var(--accent-critical)' }}>
            {errorMessage}
          </p>
        )}
        {!error && helperText && (
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
