/**
 * HelperText Component - HubSpot Enterprise Design System
 * 
 * 입력 필드 하단에 붙는 보조 설명/가이드 문구
 * - FieldLabel의 description과 비슷하지만, 더 유연한 위치/용도로 사용
 * - 정보성 설명에 집중 (오류는 FieldError, 경고는 Notice 사용)
 */

import * as React from 'react'

export interface HelperTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** 보조 문구 내용 */
  children: React.ReactNode
  /** 톤 변형 - neutral(기본): 일반 설명, info: 정보성 강조, subtle: 더 흐릿하게 */
  tone?: 'neutral' | 'info' | 'subtle'
  /** 아이콘 (material icon name) - 필요할 때만 */
  icon?: string
  /** 컴팩트 모드 - 더 작은 여백과 텍스트 */
  compact?: boolean
}

const toneStyles = {
  neutral: {
    text: 'var(--text-muted)',
    icon: 'var(--text-tertiary)',
  },
  info: {
    text: 'var(--info)',
    icon: 'var(--info)',
  },
  subtle: {
    text: 'var(--text-tertiary)',
    icon: 'var(--text-muted)',
  },
}

export const HelperText = React.forwardRef<HTMLParagraphElement, HelperTextProps>(
  ({ 
    children,
    tone = 'neutral',
    icon,
    compact = false,
    className = '',
    ...props 
  }, ref) => {
    const styles = toneStyles[tone]

    return (
      <p
        ref={ref}
        className={[
          'flex items-start gap-1',
          compact ? 'text-[11px] mt-1.5' : 'text-[11px] mt-2',
          className,
        ].filter(Boolean).join(' ')}
        style={{ color: styles.text }}
        {...props}
      >
        {icon && (
          <span 
            className="material-symbols-outlined flex-shrink-0 text-[14px]"
            style={{ color: styles.icon }}
          >
            {icon}
          </span>
        )}
        <span>{children}</span>
      </p>
    )
  }
)

HelperText.displayName = 'HelperText'

export default HelperText
