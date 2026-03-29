/**
 * InlineHint Component - HubSpot Enterprise Design System
 * 
 * 필드/섹션 옆에 붙는 아주 짧은 인라인 힌트
 * - "선택 사항", "권장", "없어도 생성 가능" 등
 * - Notice는 너무 무겁고, Badge는 설명이 부족한 경우
 * - Label row, option row, meta row 등에 자연스럽게 배치
 */

import * as React from 'react'

export interface InlineHintProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 힌트 내용 */
  children: React.ReactNode
  /** 톤 변형 */
  tone?: 'neutral' | 'info' | 'warning' | 'success'
  /** 아이콘 (material icon name) */
  icon?: string
}

const toneStyles = {
  neutral: {
    text: 'var(--text-muted)',
    bg: 'var(--workspace-secondary)',
  },
  info: {
    text: 'var(--info)',
    bg: 'var(--info-light)',
  },
  warning: {
    text: 'var(--accent-warning)',
    bg: 'var(--warning-light)',
  },
  success: {
    text: 'var(--accent-secondary)',
    bg: 'var(--accent-secondary-light)',
  },
}

export const InlineHint = React.forwardRef<HTMLSpanElement, InlineHintProps>(
  ({ 
    children,
    tone = 'neutral',
    icon,
    className = '',
    ...props 
  }, ref) => {
    const styles = toneStyles[tone]

    return (
      <span
        ref={ref}
        className={[
          'inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium',
          className,
        ].filter(Boolean).join(' ')}
        style={{ 
          color: styles.text,
          backgroundColor: styles.bg,
        }}
        {...props}
      >
        {icon && (
          <span className="material-symbols-outlined text-[12px]">
            {icon}
          </span>
        )}
        <span>{children}</span>
      </span>
    )
  }
)

InlineHint.displayName = 'InlineHint'

export default InlineHint
