/**
 * Place Search Form - HubSpot Enterprise Style
 * 
 * 매장 검색 폼
 * - 매장명 + 지역 입력
 * - Google Places + Naver Local API 호출
 * - Mock fallback 지원
 * 
 * ⚠️ Policy: 웹 크롤링 금지. 공식 API만 사용.
 */

'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { searchPlacesAction, type SearchPlacesResult } from '@/features/research/actions'
import { isMockModeEnabled } from '@/lib/integrations/env'

interface PlaceSearchFormProps {
  projectId: string
}

type SearchStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty'

export function PlaceSearchForm({ projectId }: PlaceSearchFormProps) {
  const [placeName, setPlaceName] = useState('')
  const [region, setRegion] = useState('')
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [searchResult, setSearchResult] = useState<SearchPlacesResult | null>(null)
  const [showMockBadge, setShowMockBadge] = useState(false)
  
  const setPlaceCandidates = useProjectStore((state) => state.setPlaceCandidates)
  const project = useProjectStore((state) => state.getProject(projectId))
  
  // 초기값 설정
  useEffect(() => {
    if (project?.restaurantMeta) {
      setPlaceName(project.restaurantMeta.placeName || '')
      setRegion(project.restaurantMeta.region || '')
    }
    
    setShowMockBadge(isMockModeEnabled())
  }, [project])

  const handleSearch = async () => {
    const trimmedName = placeName.trim()
    if (!trimmedName) {
      window.alert('매장명을 입력해주세요.')
      return
    }

    setStatus('loading')
    setSearchResult(null)

    try {
      const result = await searchPlacesAction(trimmedName, region.trim())
      
      if (result.success) {
        setSearchResult(result)
        setPlaceCandidates(projectId, result.candidates)
        
        if (result.candidates.length === 0) {
          setStatus('empty')
        } else {
          setStatus('success')
        }
        
        if (result.warnings.length > 0) {
          console.warn('[PlaceSearch] Warnings:', result.warnings)
        }
        if (result.errors.length > 0) {
          console.error('[PlaceSearch] Errors:', result.errors)
        }
      } else {
        setStatus('error')
        console.error('[PlaceSearch] Search failed:', result.errors)
      }
    } catch (error) {
      setStatus('error')
      console.error('[PlaceSearch] Unexpected error:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (status !== 'loading') {
        handleSearch()
      }
    }
  }

  const isLoading = status === 'loading'
  const hasResults = status === 'success' && searchResult && searchResult.candidates.length > 0
  const isEmpty = status === 'empty' || (searchResult && searchResult.candidates.length === 0)
  const hasError = status === 'error'
  const hasWarnings = searchResult && searchResult.warnings.length > 0
  const usedFallback = searchResult?.usedFallback

  return (
    <div className="space-y-4">
      {/* Mock Badge */}
      {showMockBadge && (
        <div 
          className="flex items-center gap-2 p-2 rounded-md text-xs"
          style={{ backgroundColor: 'var(--warning-light)', color: 'var(--accent-warning)' }}
        >
          <span className="material-symbols-outlined text-sm">info</span>
          <span>Mock Mode - API 연동 없이 샘플 데이터 사용</span>
        </div>
      )}
      
      {/* Input Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            매장명 <span style={{ color: 'var(--accent-critical)' }}>*</span>
          </label>
          <input
            type="text"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: 파스타 하우스"
            disabled={isLoading}
            className="input w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            지역
          </label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: 강남역"
            disabled={isLoading}
            className="input w-full text-sm"
          />
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={isLoading || !placeName.trim()}
        className="btn-primary w-full text-sm"
      >
        {isLoading ? (
          <>
            <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
            검색 중...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">search</span>
            매장 검색
          </>
        )}
      </button>

      {/* Status Messages */}
      <div className="space-y-2">
        {/* Error State */}
        {hasError && (
          <div 
            className="flex items-start gap-2 p-3 rounded-md text-xs"
            style={{ backgroundColor: 'var(--error-light, #FEE2E2)', color: 'var(--accent-critical, #DC2626)' }}
          >
            <span className="material-symbols-outlined text-sm">error</span>
            <span>검색 중 오류가 발생했습니다. 다시 시도해주세요.</span>
          </div>
        )}

        {/* Warnings */}
        {hasWarnings && searchResult && (
          <div 
            className="p-3 rounded-md text-xs"
            style={{ backgroundColor: 'var(--warning-light)', color: 'var(--accent-warning)' }}
          >
            <ul className="space-y-1">
              {searchResult.warnings.map((warning, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span>•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Fallback Notice */}
        {usedFallback && (
          <div 
            className="flex items-start gap-2 p-3 rounded-md text-xs"
            style={{ backgroundColor: 'var(--workspace-secondary)', color: 'var(--text-tertiary)' }}
          >
            <span className="material-symbols-outlined text-sm">info</span>
            <span>API 연동 없이 샘플 데이터를 표시 중입니다.</span>
          </div>
        )}

        {/* Empty State */}
        {isEmpty && (
          <div 
            className="text-center p-4 rounded-md text-xs"
            style={{ backgroundColor: 'var(--workspace-secondary)', color: 'var(--text-tertiary)' }}
          >
            <p>검색 결과가 없습니다.</p>
            <p className="mt-0.5" style={{ color: 'var(--text-muted)' }}>다른 검색어나 지역을 시도핸보세요.</p>
          </div>
        )}

        {/* Success State */}
        {hasResults && searchResult && (
          <div 
            className="flex items-center justify-between p-3 rounded-md text-xs"
            style={{ backgroundColor: 'var(--accent-secondary-light)', color: 'var(--accent-secondary)' }}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>
                <strong>{searchResult.candidates.length}개</strong>의 매장을 찾았습니다
              </span>
            </div>
            <div className="flex items-center gap-2">
              {searchResult.sources.google > 0 && (
                <span style={{ color: 'var(--text-muted)' }}>Google: {searchResult.sources.google}</span>
              )}
              {searchResult.sources.naver > 0 && (
                <span style={{ color: 'var(--text-muted)' }}>Naver: {searchResult.sources.naver}</span>
              )}
              {searchResult.sources.mock > 0 && (
                <span style={{ color: 'var(--text-muted)' }}>Mock</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        * Google Places API와 Naver Local API를 통해 검색됩니다. API 키가 없으면 Mock 데이터로 대체됩니다.
      </p>
    </div>
  )
}
