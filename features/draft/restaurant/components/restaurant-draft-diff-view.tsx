/**
 * Restaurant Draft Diff View
 * 
 * 두 버전 간 차이를 시각적으로 표시하는 컴포넌트
 * - 제목 비교
 * - 본문 라인 기반 diff
 * - 해시태그 비교
 */

'use client'

import { useMemo } from 'react'
import type { RestaurantDraftVersion } from '@/types'
import {
  diffTextByLines,
  diffStringArrays,
  isTextChanged,
  generateDiffSummary,
  type DiffLine,
} from '@/lib/diff/text-diff'

interface RestaurantDraftDiffViewProps {
  baseVersion: RestaurantDraftVersion
  compareVersion: RestaurantDraftVersion
  onClose: () => void
}

/**
 * Diff 라인 컴포넌트 - HubSpot 스타일 (subtle)
 */
function DiffLineView({ line }: { line: DiffLine }) {
  const styles = {
    added: { 
      bg: 'var(--accent-secondary-light)', 
      border: 'var(--accent-secondary)',
      icon: 'var(--accent-secondary)'
    },
    removed: { 
      bg: 'var(--warning-light)', 
      border: 'var(--accent-warning)',
      icon: 'var(--accent-warning)'
    },
    unchanged: { 
      bg: 'var(--workspace-secondary)', 
      border: 'transparent',
      icon: 'var(--text-muted)'
    },
    changed: { 
      bg: 'var(--accent-info-light)', 
      border: 'var(--accent-info)',
      icon: 'var(--accent-info)'
    },
  }

  const icons = {
    added: '+',
    removed: '−',
    unchanged: '·',
    changed: '~',
  }

  const content = () => {
    switch (line.type) {
      case 'added':
        return <span style={{ color: 'var(--accent-secondary-dark, #0D7A6E)' }}>{line.right}</span>
      case 'removed':
        return <span style={{ color: 'var(--text-muted)' }} className="line-through">{line.left}</span>
      case 'changed':
        return (
          <div className="space-y-1">
            <span style={{ color: 'var(--text-muted)' }} className="line-through block">{line.left}</span>
            <span style={{ color: 'var(--text-primary)' }} className="block">{line.right}</span>
          </div>
        )
      default:
        return <span style={{ color: 'var(--text-secondary)' }}>{line.left}</span>
    }
  }

  return (
    <div 
      className="px-3 py-2 text-xs border-l-2"
      style={{ 
        backgroundColor: styles[line.type].bg,
        borderColor: styles[line.type].border
      }}
    >
      <div className="flex items-start gap-2">
        <span className="font-medium w-4 text-xs" style={{ color: styles[line.type].icon }}>{icons[line.type]}</span>
        <div className="flex-1">{content()}</div>
      </div>
    </div>
  )
}

/**
 * 해시태그 비교 컴포넌트 - HubSpot 스타일
 */
function TagComparison({ left, right }: { left: string[]; right: string[] }) {
  const diff = useMemo(() => diffStringArrays(left, right), [left, right])

  if (diff.added.length === 0 && diff.removed.length === 0) {
    return (
      <div className="text-xs py-2" style={{ color: 'var(--text-tertiary)' }}>
        변경사항 없음
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {diff.added.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] font-medium mr-1" style={{ color: 'var(--accent-secondary)' }}>+추가</span>
          {diff.added.map(tag => (
            <span 
              key={tag} 
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'var(--accent-secondary-light)', color: 'var(--accent-secondary)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {diff.removed.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] font-medium mr-1" style={{ color: 'var(--accent-warning)' }}>−제거</span>
          {diff.removed.map(tag => (
            <span 
              key={tag} 
              className="text-[10px] px-1.5 py-0.5 rounded line-through opacity-60"
              style={{ backgroundColor: 'var(--warning-light)', color: 'var(--accent-warning)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {diff.common.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1.5 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <span className="text-[10px] mr-1" style={{ color: 'var(--text-muted)' }}>유지:</span>
          {diff.common.slice(0, 3).map(tag => (
            <span 
              key={tag} 
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'var(--workspace-secondary)', color: 'var(--text-secondary)' }}
            >
              {tag}
            </span>
          ))}
          {diff.common.length > 3 && (
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+{diff.common.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 제목 비교 컴포넌트 - HubSpot 스타일
 */
function TitleComparison({ left, right }: { left: string; right: string }) {
  const changed = useMemo(() => isTextChanged(left, right), [left, right])

  if (!changed) {
    return (
      <div className="text-xs py-2" style={{ color: 'var(--text-tertiary)' }}>
        변경사항 없음
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div 
        className="px-3 py-2 rounded text-xs border-l-2"
        style={{ 
          backgroundColor: 'var(--warning-light)', 
          borderColor: 'var(--accent-warning)'
        }}
      >
        <span className="block mb-0.5 text-[10px]" style={{ color: 'var(--accent-warning)' }}>기준</span>
        <span className="line-through opacity-60" style={{ color: 'var(--text-muted)' }}>{left}</span>
      </div>
      <div 
        className="px-3 py-2 rounded text-xs border-l-2"
        style={{ 
          backgroundColor: 'var(--accent-secondary-light)', 
          borderColor: 'var(--accent-secondary)'
        }}
      >
        <span className="block mb-0.5 text-[10px]" style={{ color: 'var(--accent-secondary)' }}>비교</span>
        <span style={{ color: 'var(--text-primary)' }}>{right}</span>
      </div>
    </div>
  )
}

/**
 * 본문 diff 컴포넌트 - HubSpot 스타일
 */
function ContentComparison({ left, right }: { left: string; right: string }) {
  const diffLines = useMemo(() => diffTextByLines(left, right), [left, right])
  const hasChanges = diffLines.some(line => line.type !== 'unchanged')

  if (!hasChanges) {
    return (
      <div className="text-xs py-3 text-center" style={{ color: 'var(--text-tertiary)' }}>
        변경사항 없음
      </div>
    )
  }

  // 변경된 라인 주변만 표시 (압축된 뷰)
  const significantLines = diffLines.filter((line, i) => {
    if (line.type !== 'unchanged') return true
    // 변경점 주변 2라인은 보존
    const nearby = diffLines.slice(Math.max(0, i-2), Math.min(diffLines.length, i+3))
    return nearby.some(l => l.type !== 'unchanged')
  })

  return (
    <div 
      className="border rounded overflow-y-auto max-h-64 custom-scrollbar" 
      style={{ borderColor: 'var(--border-primary)' }}
    >
      {significantLines.map((line, index) => (
        <DiffLineView key={index} line={line} />
      ))}
    </div>
  )
}

/**
 * 메인 Diff View 컴포넌트
 */
export function RestaurantDraftDiffView({
  baseVersion,
  compareVersion,
  onClose,
}: RestaurantDraftDiffViewProps) {
  const summary = useMemo(() => {
    const contentDiff = diffTextByLines(baseVersion.content, compareVersion.content)
    const tagsDiff = diffStringArrays(baseVersion.hashtags, compareVersion.hashtags)
    const titleChanged = isTextChanged(baseVersion.title, compareVersion.title)
    
    return {
      text: generateDiffSummary(titleChanged, contentDiff, tagsDiff),
      hasChanges: titleChanged || contentDiff.some(d => d.type !== 'unchanged') || tagsDiff.added.length > 0 || tagsDiff.removed.length > 0,
    }
  }, [baseVersion, compareVersion])

  return (
    <div className="bg-[var(--workspace)] overflow-hidden">
      {/* 헤더 - compact */}
      <div 
        className="px-3 py-2 border-b flex items-center justify-between"
        style={{ backgroundColor: 'var(--workspace-secondary)', borderColor: 'var(--border-primary)' }}
      >
        <div>
          <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>비교 결과</h3>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{summary.text}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--workspace-tertiary)] transition"
        >
          <span className="material-symbols-outlined text-base" style={{ color: 'var(--text-muted)' }}>close</span>
        </button>
      </div>

      {/* 버전 정보 - compact */}
      <div className="grid grid-cols-2 gap-0 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <div 
          className="px-3 py-2 border-r" 
          style={{ backgroundColor: 'var(--workspace-secondary)', borderColor: 'var(--border-primary)' }}
        >
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>기준</span>
          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {baseVersion.label || '초안'}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {baseVersion.wordCount}자
          </p>
        </div>
        <div className="px-3 py-2" style={{ backgroundColor: 'var(--workspace-secondary)' }}>
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>비교</span>
          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {compareVersion.label || '비교 대상'}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {compareVersion.wordCount}자
          </p>
        </div>
      </div>

      {/* 변경사항 없음 */}
      {!summary.hasChanges && (
        <div className="px-4 py-6 text-center">
          <span className="material-symbols-outlined text-2xl mb-1" style={{ color: 'var(--accent-secondary)' }}>check_circle</span>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>두 버전이 동일합니다</p>
        </div>
      )}

      {/* 변경사항 목록 */}
      {summary.hasChanges && (
        <div className="p-3 space-y-4">
          {/* 제목 비교 */}
          <section>
            <h4 className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
              제목
            </h4>
            <TitleComparison left={baseVersion.title} right={compareVersion.title} />
          </section>

          {/* 본문 비교 */}
          <section>
            <h4 className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
              본문
            </h4>
            <ContentComparison left={baseVersion.content} right={compareVersion.content} />
          </section>

          {/* 해시태그 비교 */}
          <section>
            <h4 className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
              해시태그
            </h4>
            <TagComparison left={baseVersion.hashtags} right={compareVersion.hashtags} />
          </section>
        </div>
      )}

      {/* 푸터 */}
      <div 
        className="px-3 py-2 border-t flex justify-end"
        style={{ backgroundColor: 'var(--workspace-secondary)', borderColor: 'var(--border-primary)' }}
      >
        <button
          onClick={onClose}
          className="btn-secondary text-xs py-1 px-3"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
