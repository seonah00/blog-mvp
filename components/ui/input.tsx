/**
 * Input Component - HubSpot Enterprise Design System
 * 
 * 공통 입력 컴포넌트
 * - error 상태
 * - disabled 상태
 * - label 연결
 */

import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 에러 상태 */
  error?: boolean
  /** 에러 메시지 */
  errorMessage?: string
  /** 라벨 */
  label?: string
  /** 도움말 텍스트 */
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    error = false,
    errorMessage,
    label,
    helperText,
    disabled,
    className = '',
    id,
    ...props 
  }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    
    const inputClasses = [
      'input',
      error ? 'border-[var(--accent-critical)] focus:border-[var(--accent-critical)] focus:ring-[var(--accent-critical-light)]' : '',
      className,
    ].filter(Boolean).join(' ')

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={inputClasses}
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

Input.displayName = 'Input'

export default Input
