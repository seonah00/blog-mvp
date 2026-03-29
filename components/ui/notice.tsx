/**
 * Notice Component - HubSpot Enterprise Design System
 * 
 * 공통 알림/안내 컴포넌트
 * - variant: info / warning / success / neutral
 * - title + description 구조
 * - optional action slot
 * - compact / inline 모드 지원
 */

import * as React from 'react'

export interface NoticeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 알림 변형 */
  variant?: 'info' | 'warning' | 'success' | 'neutral'
  /** 제목 (optional) */
  title?: string
  /** 설명 (title 없을 때는 children만, 있을 때는 보조 설명) */
  children: React.ReactNode
  /** 우측 액션 */
  action?: React.ReactNode
  /** 컴팩트 모드 */
  compact?: boolean
  /** 아이콘 숨김 */
  hideIcon?: boolean
}

const variantStyles = {
  info: {
    bg: 'var(--info-light)',
    border: 'var(--info)',
    icon: 'info',
    iconColor: 'var(--info)',
  },
  warning: {
    bg: 'var(--warning-light)',
    border: 'var(--warning)',
    icon: 'warning',
    iconColor: 'var(--warning)',
  },
  success: {
    bg: 'var(--success-light)',
    border: 'var(--success)',
    icon: 'check_circle',
    iconColor: 'var(--success)',
  },
  neutral: {
    bg: 'var(--workspace-secondary)',
    border: 'var(--border-secondary)',
    icon: 'info',
    iconColor: 'var(--text-tertiary)',
  },
}

export const Notice = React.forwardRef<HTMLDivElement, NoticeProps>(
  ({ 
    variant = 'neutral',
    title,
    children,
    action,
    compact = false,
    hideIcon = false,
    className = '',
    ...props 
  }, ref) => {
    const styles = variantStyles[variant]

    const noticeClasses = [
      'flex items-start gap-2 rounded-md border-l-2',
      compact ? 'p-2 text-xs' : 'p-3 text-xs',
      className,
    ].filter(Boolean).join(' ')

    return (
      <div
        ref={ref}
        className={noticeClasses}
        style={{
          backgroundColor: styles.bg,
          borderLeftColor: styles.border,
        }}
        {...props}
      >
        {!hideIcon && (
          <span 
            className="material-symbols-outlined flex-shrink-0 text-sm mt-0.5"
            style={{ color: styles.iconColor }}
          >
            {styles.icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <p 
              className="font-medium mb-0.5"
              style={{ color: variant === 'neutral' ? 'var(--text-secondary)' : 'var(--text-primary)' }}
            >
              {title}
            </p>
          )}
          <div style={{ color: 'var(--text-secondary)' }}>{children}</div>
        </div>
        {action && (
          <div className="flex-shrink-0 ml-2">{action}</div>
        )}
      </div>
    )
  }
)

Notice.displayName = 'Notice'

export default Notice
