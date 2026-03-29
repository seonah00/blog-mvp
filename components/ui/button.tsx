/**
 * Button Component - HubSpot Enterprise Design System
 * 
 * 공통 버튼 컴포넌트
 * - variant: primary / secondary / ghost / destructive
 * - size: sm / md / lg
 * - states: default, hover, focus, disabled, loading
 * - icons: leftIcon, rightIcon
 */

import * as React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 변형 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  /** 버튼 크기 */
  size?: 'sm' | 'md' | 'lg'
  /** 로딩 상태 */
  loading?: boolean
  /** 왼쪽 아이콘 */
  leftIcon?: React.ReactNode
  /** 오른쪽 아이콘 */
  rightIcon?: React.ReactNode
  /** 전체 너비 */
  fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    leftIcon, 
    rightIcon, 
    fullWidth = false,
    disabled,
    children,
    className = '',
    ...props 
  }, ref) => {
    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    }

    // Variant styles
    const variantStyles = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      destructive: 'btn-destructive',
    }

    // Base classes
    const baseClasses = [
      'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      sizeStyles[size],
      variantStyles[variant],
      fullWidth ? 'w-full' : '',
      (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '',
      className,
    ].filter(Boolean).join(' ')

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={baseClasses}
        {...props}
      >
        {loading && (
          <span className="material-symbols-outlined text-[1em] animate-spin">
            refresh
          </span>
        )}
        {!loading && leftIcon && (
          <span className="flex items-center">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="flex items-center">{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
