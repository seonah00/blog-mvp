/**
 * Select Component - HubSpot Enterprise Design System
 * 
 * 공통 선택 컴포넌트
 * - error 상태
 * - disabled 상태
 * - label 연결
 */

import * as React from 'react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** 에러 상태 */
  error?: boolean
  /** 에러 메시지 */
  errorMessage?: string
  /** 라벨 */
  label?: string
  /** 도움말 텍스트 */
  helperText?: string
  /** 옵션들 */
  options: { value: string; label: string; disabled?: boolean }[]
  /** placeholder */
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    error = false,
    errorMessage,
    label,
    helperText,
    disabled,
    options,
    placeholder,
    className = '',
    id,
    ...props 
  }, ref) => {
    const selectId = id || React.useId()
    
    const selectClasses = [
      'select',
      error ? 'border-[var(--accent-critical)] focus:border-[var(--accent-critical)] focus:ring-[var(--accent-critical-light)]' : '',
      className,
    ].filter(Boolean).join(' ')

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={selectClasses}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select'

export default Select
