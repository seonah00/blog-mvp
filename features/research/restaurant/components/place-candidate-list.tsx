/**
 * Place Candidate List - HubSpot Enterprise Style
 * 
 * 검색된 매장 후보 목록 표시
 * - Google / Naver / Mock 출처 표시
 * - Rating, 리뷰 수 표시
 * - 선택 시 store 반영
 */

'use client'

import { useProjectStore } from '@/stores/project-store'
import type { PlaceCandidate } from '@/types'

interface PlaceCandidateListProps {
  projectId: string
  candidates: PlaceCandidate[]
}

function getSourceBadge(source: PlaceCandidate['source']) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    google_places_api: { 
      bg: 'var(--accent-info-light)', 
      text: 'var(--accent-info)',
      border: 'var(--accent-info)'
    },
    naver_local_api: { 
      bg: 'var(--accent-secondary-light)', 
      text: 'var(--accent-secondary)',
      border: 'var(--accent-secondary)'
    },
    manual: { 
      bg: 'var(--workspace-secondary)', 
      text: 'var(--text-tertiary)',
      border: 'var(--border-secondary)'
    },
  }
  
  const labels: Record<string, string> = {
    google_places_api: 'Google',
    naver_local_api: 'Naver',
    manual: 'Mock',
  }
  
  return {
    style: styles[source] || styles.manual,
    label: labels[source] || source,
  }
}

function StarRating({ rating, reviewCount }: { rating?: number; reviewCount?: number }) {
  if (!rating) return null
  
  return (
    <div className="flex items-center gap-1 text-xs">
      <span style={{ color: 'var(--accent-warning)' }}>★</span>
      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{rating.toFixed(1)}</span>
      {reviewCount && (
        <span style={{ color: 'var(--text-tertiary)' }}>({reviewCount.toLocaleString()})</span>
      )}
    </div>
  )
}

export function PlaceCandidateList({ projectId, candidates }: PlaceCandidateListProps) {
  const selectPlace = useProjectStore((state) => state.selectPlace)

  const handleSelect = (candidate: PlaceCandidate) => {
    const source: 'google' | 'naver' | 'manual' = 
      candidate.source === 'google_places_api' ? 'google' : 
      candidate.source === 'naver_local_api' ? 'naver' : 'manual'
    
    const normalizedPlace = {
      name: candidate.name,
      address: candidate.roadAddress || candidate.address || '',
      category: candidate.category || '음식점',
      phone: candidate.phone,
      coordinates: candidate.latitude && candidate.longitude 
        ? { lat: candidate.latitude, lng: candidate.longitude }
        : undefined,
      sources: [source] as ('google' | 'naver' | 'manual')[],
      normalizedAt: new Date().toISOString(),
    }
    
    selectPlace(projectId, normalizedPlace)
  }

  if (candidates.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>클릭하여 선택</p>
      
      <div className="space-y-2">
        {candidates.map((candidate) => {
          const sourceBadge = getSourceBadge(candidate.source)
          
          return (
            <button
              key={candidate.id}
              onClick={() => handleSelect(candidate)}
              className="w-full p-3 rounded-md border text-left transition-all hover:border-[var(--accent-interactive)] hover:bg-[var(--accent-interactive-light)] group"
              style={{ 
                backgroundColor: 'var(--workspace)',
                borderColor: 'var(--border-secondary)'
              }}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  {/* Name & Category */}
                  <div className="flex items-center gap-2 mb-1">
                    <h4 
                      className="text-sm font-medium truncate group-hover:text-[var(--accent-interactive)] transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {candidate.name}
                    </h4>
                    {candidate.category && (
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ 
                          backgroundColor: 'var(--workspace-secondary)',
                          color: 'var(--text-tertiary)'
                        }}
                      >
                        {candidate.category}
                      </span>
                    )}
                  </div>
                  
                  {/* Address */}
                  <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                    {candidate.roadAddress || candidate.address}
                  </p>
                  
                  {/* Description */}
                  {candidate.description && (
                    <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                      {candidate.description}
                    </p>
                  )}
                  
                  {/* Rating & Phone */}
                  <div className="flex items-center gap-3 mt-2">
                    <StarRating rating={candidate.rating} reviewCount={candidate.reviewCount} />
                    
                    {candidate.phone && (
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                        <span className="material-symbols-outlined text-xs">phone</span>
                        {candidate.phone}
                      </span>
                    )}
                  </div>
                  
                  {/* Map Link */}
                  {candidate.mapUrl && (
                    <a
                      href={candidate.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-2 text-[10px] hover:underline"
                      style={{ color: 'var(--accent-interactive)' }}
                    >
                      <span>지도에서 보기</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  )}
                </div>
                
                {/* Source Badge */}
                <span 
                  className="text-[10px] px-2 py-1 rounded border flex-shrink-0"
                  style={{
                    backgroundColor: sourceBadge.style.bg,
                    color: sourceBadge.style.text,
                    borderColor: sourceBadge.style.border
                  }}
                >
                  {sourceBadge.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
