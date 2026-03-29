/**
 * EmptyState Component - HubSpot Enterprise Design System
 * 
 * 공통 빈 상태 컴포넌트
 * - title + description + optional action
 * - icon support
 * - size variants (default / compact)
 * - tone variants (neutral / info / warning)
 * - panel 안에서 자연스럽게 보임
 */

import * as React from 'react'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 제목 */
  title: string
  /** 설명 */
  description?: string
  /** 아이콘 (material icon name) */
  icon?: string
  /** 액션 버튼/링크 */
  action?: React.ReactNode
  /** 크기 변형 */
  size?: 'default' | 'compact'
  /** 톤 변형 */
  tone?: 'neutral' | 'info' | 'warning'
  /** border 표시 */
  bordered?: boolean
}

const toneStyles = {
  neutral: {
    iconColor: 'var(--text-muted)',
    bg: 'var(--workspace-secondary)',
    border: 'var(--border-secondary)',
  },
  info: {
    iconColor: 'var(--info)',
    bg: 'var(--info-light)',
    border: 'var(--info)',
  },
  warning: {
    iconColor: 'var(--warning)',
    bg: 'var(--warning-light)',
    border: 'var(--warning)',
  },
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ 
    title,
    description,
    icon = 'inbox',
    action,
    size = 'default',
    tone = 'neutral',
    bordered = true,
    className = '',
    ...props 
  }, ref) => {
    const styles = toneStyles[tone]
    const isCompact = size === 'compact'

    const containerClasses = [
      'flex flex-col items-center text-center rounded-md',
      isCompact ? 'py-6 px-4' : 'py-10 px-6',
      bordered ? 'border border-dashed' : '',
      className,
    ].filter(Boolean).join(' ')

    return (
      <div
        ref={ref}
        className={containerClasses}
        style={{
          backgroundColor: styles.bg,
          borderColor: bordered ? styles.border : undefined,
        }}
        {...props}
      >
        {/* Icon */}
        <span 
          className={`material-symbols-outlined ${isCompact ? 'text-2xl mb-2' : 'text-3xl mb-3'}`}
          style={{ color: styles.iconColor }}
        >
          {icon}
        </span>

        {/* Title */}
        <h3 
          className={`font-medium ${isCompact ? 'text-sm' : 'text-sm'}`}
          style={{ color: 'var(--text-secondary)' }}
        >
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p 
            className={`mt-1 ${isCompact ? 'text-xs' : 'text-xs'}`}
            style={{ color: 'var(--text-tertiary)' }}
          >
            {description}
          </p>
        )}

        {/* Action */}
        {action && (
          <div className={`${isCompact ? 'mt-3' : 'mt-4'}`}>
            {action}
          </div>
        )}
      </div>
    )
  }
)

EmptyState.displayName = 'EmptyState'

export default EmptyState
