/**
 * Place Profile Card - HubSpot Enterprise Style
 * 
 * 선택된 매장의 정규화된 프로필 표시
 */

'use client'

import type { NormalizedPlaceProfile } from '@/types'

interface PlaceProfileCardProps {
  place: NormalizedPlaceProfile
}

export function PlaceProfileCard({ place }: PlaceProfileCardProps) {
  return (
    <div 
      className="panel border-l-3"
      style={{ borderLeftColor: 'var(--accent-secondary)' }}
    >
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" style={{ color: 'var(--accent-secondary)' }}>check_circle</span>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>선택된 매장</h3>
        </div>
        <span 
          className="text-[10px] px-2 py-0.5 rounded font-medium"
          style={{ 
            backgroundColor: 'var(--accent-secondary-light)',
            color: 'var(--accent-secondary)'
          }}
        >
          {place.category}
        </span>
      </div>
      
      <div className="panel-body space-y-3">
        <div>
          <h4 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>{place.name}</h4>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{place.address}</p>
        </div>
        
        {place.phone && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="material-symbols-outlined text-sm" style={{ color: 'var(--text-tertiary)' }}>phone</span>
            <span>{place.phone}</span>
          </div>
        )}
        
        {place.hours && place.hours.length > 0 && (
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>영업시간</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{place.hours[0]}</p>
          </div>
        )}

        <div 
          className="flex items-center gap-1 pt-2 border-t text-[10px]"
          style={{ borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}
        >
          <span className="material-symbols-outlined text-xs">database</span>
          <span>출처: {place.sources.join(', ')}</span>
        </div>
      </div>
    </div>
  )
}
