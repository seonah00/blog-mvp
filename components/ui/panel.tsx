/**
 * Panel Component - HubSpot Enterprise Design System
 * 
 * 공통 패널 컴포넌트
 * - Panel: 기본 컨테이너
 * - PanelHeader: 헤더 영역 (title + action)
 * - PanelBody: 본문 영역
 * - PanelFooter: 푸터 영역
 */

import * as React from 'react'

// ============================================
// Panel Context
// ============================================

interface PanelContextValue {
  hasHeader: boolean
  setHasHeader: (value: boolean) => void
}

const PanelContext = React.createContext<PanelContextValue | undefined>(undefined)

function usePanelContext() {
  const context = React.useContext(PanelContext)
  if (!context) {
    throw new Error('Panel subcomponents must be used within Panel')
  }
  return context
}

// ============================================
// Panel Root
// ============================================

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 패딩 제거 */
  noPadding?: boolean
  /** 테두리 제거 */
  noBorder?: boolean
  /** 배경색 제거 */
  noBackground?: boolean
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ 
    noPadding = false,
    noBorder = false,
    noBackground = false,
    className = '',
    children,
    ...props 
  }, ref) => {
    const [hasHeader, setHasHeader] = React.useState(false)

    const panelClasses = [
      'rounded-md',
      !noBackground ? 'bg-[var(--workspace)]' : '',
      !noBorder ? 'border border-[var(--border-primary)]' : '',
      className,
    ].filter(Boolean).join(' ')

    return (
      <PanelContext.Provider value={{ hasHeader, setHasHeader }}>
        <div ref={ref} className={panelClasses} {...props}>
          {children}
        </div>
      </PanelContext.Provider>
    )
  }
)

Panel.displayName = 'Panel'

// ============================================
// Panel Header
// ============================================

export interface PanelHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 타이틀 */
  title?: React.ReactNode
  /** 설명 */
  description?: React.ReactNode
  /** 우측 액션 */
  action?: React.ReactNode
}

export const PanelHeader = React.forwardRef<HTMLDivElement, PanelHeaderProps>(
  ({ 
    title,
    description,
    action,
    className = '',
    children,
    ...props 
  }, ref) => {
    const { setHasHeader } = usePanelContext()

    React.useEffect(() => {
      setHasHeader(true)
      return () => setHasHeader(false)
    }, [setHasHeader])

    const headerClasses = [
      'flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]',
      className,
    ].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={headerClasses} {...props}>
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {description}
            </p>
          )}
          {children}
        </div>
        {action && (
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    )
  }
)

PanelHeader.displayName = 'PanelHeader'

// ============================================
// Panel Body
// ============================================

export interface PanelBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 패딩 크기 */
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const PanelBody = React.forwardRef<HTMLDivElement, PanelBodyProps>(
  ({ 
    padding = 'md',
    className = '',
    children,
    ...props 
  }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    }

    const bodyClasses = [paddingClasses[padding], className].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={bodyClasses} {...props}>
        {children}
      </div>
    )
  }
)

PanelBody.displayName = 'PanelBody'

// ============================================
// Panel Footer
// ============================================

export interface PanelFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 좌측 콘텐츠 */
  left?: React.ReactNode
  /** 우측 콘텐츠 */
  right?: React.ReactNode
}

export const PanelFooter = React.forwardRef<HTMLDivElement, PanelFooterProps>(
  ({ 
    left,
    right,
    className = '',
    children,
    ...props 
  }, ref) => {
    const footerClasses = [
      'flex items-center justify-between px-4 py-3 border-t border-[var(--border-primary)] bg-[var(--workspace-secondary)] rounded-b-md',
      className,
    ].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={footerClasses} {...props}>
        <div className="flex items-center gap-2">{left || children}</div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    )
  }
)

PanelFooter.displayName = 'PanelFooter'

// ============================================
// Named Export
// ============================================

export { Panel as default }
