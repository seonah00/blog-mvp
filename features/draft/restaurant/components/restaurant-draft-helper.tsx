/**
 * Restaurant Draft Helper - HubSpot Enterprise Style
 * 
 * 맛집 글쓰기를 위한 사이드바 헬퍼 패널
 * - 매장 정보 섹션
 * - 리뷰 다이제스트 섹션
 * - 추천 포인트/방문 팁
 * - 버전 관리 및 Variation 생성
 * - 버전 비교 (Diff)
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useProjectStore, useRestaurantDraftVersions } from '@/stores/project-store'
import type { NormalizedPlaceProfile, ReviewDigest, RestaurantDraftVariationPreset, RestaurantDraftSettings, RestaurantDraftVersion } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import { RestaurantDraftDiffView } from './restaurant-draft-diff-view'

interface RestaurantDraftHelperProps {
  projectId: string
  onVersionSwitchRequest?: (versionId: string, label?: string) => void
  isDirty?: boolean
}

// Generate recommendation points from review digest
function generateRecommendationPoints(digest: ReviewDigest | undefined): string[] {
  if (!digest) return []
  
  const points: string[] = []
  
  for (const highlight of digest.highlights) {
    if (highlight.includes('추천') || highlight.includes('인기') || highlight.includes('만족')) {
      points.push(highlight)
    }
  }
  
  if (digest.sentiment === 'positive') {
    points.push('전반적으로 좋은 평가를 받는 매장')
  }
  
  if (digest.quotes.length > 0) {
    points.push(`방문객 인용: "${digest.quotes[0].slice(1, 30)}..."`)
  }
  
  return points.length > 0 ? points : ['매장의 특징을 리서치 데이터에서 확인하세요']
}

// Generate visit tips from review digest
function generateVisitTips(digest: ReviewDigest | undefined): string[] | undefined {
  if (!digest) return undefined
  
  const tips: string[] = []
  
  for (const highlight of digest.highlights) {
    if (highlight.includes('웨이팅') || highlight.includes('예약') || highlight.includes('주차')) {
      tips.push(highlight)
    }
  }
  
  return tips.length > 0 ? tips : undefined
}

// Compact Section Component
function Section({ title, children, action, collapsed = false }: { title: string; children: React.ReactNode; action?: React.ReactNode; collapsed?: boolean }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--border-primary)' }}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[var(--workspace-secondary)] transition-colors"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {action}
          <span 
            className="material-symbols-outlined text-sm transition-transform" 
            style={{ color: 'var(--text-muted)', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          >
            expand_more
          </span>
        </div>
      </button>
      {!isCollapsed && <div className="px-4 pb-3">{children}</div>}
    </div>
  )
}

// Place Info Section
function PlaceInfoSection({ place }: { place: NormalizedPlaceProfile }) {
  return (
    <Section title="매장 정보">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{place.name}</h4>
          <span className="badge badge-domain text-xs">{place.category}</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{place.address}</p>
        {place.phone && (
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
            <span className="material-symbols-outlined text-sm">phone</span>
            {place.phone}
          </p>
        )}
      </div>
    </Section>
  )
}

// Review Digest Section
function ReviewDigestSection({ digest }: { digest: ReviewDigest }) {
  return (
    <Section title="리뷰 요약">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`badge ${
            digest.sentiment === 'positive' ? 'badge-success' :
            digest.sentiment === 'mixed' ? 'badge-warning' : 'badge-domain'
          }`}>
            {digest.sentiment === 'positive' ? '긍정적' : 
             digest.sentiment === 'mixed' ? '복합적' : '중립'}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {digest.highlights.length}개 키포인트
          </span>
        </div>
        
        <p className="text-sm line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
          {digest.summary}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {digest.highlights.slice(0, 3).map((highlight, i) => (
            <span 
              key={i} 
              className="text-xs px-2 py-1 rounded-md"
              style={{ 
                backgroundColor: 'var(--workspace-tertiary)',
                color: 'var(--text-secondary)'
              }}
            >
              {highlight.length > 20 ? highlight.slice(0, 20) + '...' : highlight}
            </span>
          ))}
        </div>
      </div>
    </Section>
  )
}

// Recommendations Section
function RecommendationsSection({ digest }: { digest: ReviewDigest | undefined }) {
  const points = useMemo(() => generateRecommendationPoints(digest), [digest])
  const tips = useMemo(() => generateVisitTips(digest), [digest])
  
  if (!digest) return null
  
  return (
    <Section title="추천 포인트 & 팁">
      <div className="space-y-3">
        <ul className="space-y-2">
          {points.slice(0, 3).map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined text-sm mt-0.5" style={{ color: 'var(--accent-secondary)' }}>check_circle</span>
              <span className="line-clamp-2">{point}</span>
            </li>
          ))}
        </ul>
        
        {tips && tips.length > 0 && (
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>방문 팁</p>
            <ul className="space-y-1">
              {tips.slice(0, 2).map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span className="material-symbols-outlined text-sm">lightbulb</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Section>
  )
}

// Variation Preset Button
const VARIATION_PRESETS: { id: RestaurantDraftVariationPreset; label: string; description: string }[] = [
  { id: 'menu_focus', label: '메뉴 중심', description: '대표 메뉴와 맛에 집중' },
  { id: 'same_but_fresher', label: '표현 다양화', description: '같은 내용, 다른 표현' },
  { id: 'more_friendly', label: '친근하게', description: '더 친근한 톤으로' },
  { id: 'more_informative', label: '정보형', description: '더 정보 중심으로' },
]

// Variation Section
function VariationSection({ projectId }: { projectId: string }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<RestaurantDraftVariationPreset | null>(null)
  const store = useProjectStore()
  
  const handleGenerate = useCallback(async (preset: RestaurantDraftVariationPreset) => {
    setIsGenerating(true)
    setSelectedPreset(preset)
    
    try {
      const settings: RestaurantDraftSettings = {
        channel: 'blog',
        tone: 'friendly',
        focusPoints: ['menu', 'atmosphere'],
        prohibitedExpressions: [],
      }
      await store.createRestaurantDraftVariation(projectId, settings, preset)
    } finally {
      setIsGenerating(false)
      setSelectedPreset(null)
    }
  }, [projectId, store])
  
  return (
    <Section 
      title="변형 생성"
      action={isGenerating && <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" style={{ color: 'var(--accent-interactive)' }} />}
    >
      <div className="grid grid-cols-2 gap-2">
        {VARIATION_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleGenerate(preset.id)}
            disabled={isGenerating}
            className="text-left p-2.5 rounded-md border text-xs transition-all hover:border-[var(--accent-interactive)] hover:bg-[var(--accent-interactive-light)]"
            style={{ 
              borderColor: 'var(--border-secondary)',
              backgroundColor: selectedPreset === preset.id ? 'var(--accent-interactive-light)' : 'var(--workspace)'
            }}
          >
            <span className="font-medium block mb-0.5" style={{ color: 'var(--text-primary)' }}>{preset.label}</span>
            <span style={{ color: 'var(--text-tertiary)' }}>{preset.description}</span>
          </button>
        ))}
      </div>
    </Section>
  )
}

// Version List Section
function VersionListSection({ 
  projectId, 
  onVersionSwitchRequest,
  isDirty 
}: { 
  projectId: string
  onVersionSwitchRequest?: (versionId: string, label?: string) => void
  isDirty?: boolean 
}) {
  const { versions, currentVersion } = useRestaurantDraftVersions(projectId)
  const currentVersionId = currentVersion?.id
  const store = useProjectStore()
  
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  
  const handleEditLabel = (version: RestaurantDraftVersion) => {
    setEditingLabel(version.id)
    setEditValue(version.label || '')
  }
  
  const handleSaveLabel = (versionId: string) => {
    store.updateDraftVersionLabel(projectId, versionId, editValue)
    setEditingLabel(null)
  }
  
  const handleSwitch = (version: RestaurantDraftVersion) => {
    if (onVersionSwitchRequest) {
      onVersionSwitchRequest(version.id, version.label)
    } else {
      store.switchDraftVersion(projectId, version.id)
    }
  }
  
  const handleDelete = (versionId: string) => {
    if (confirm('이 버전을 삭제하시겠습니까?')) {
      store.removeDraftVersion(projectId, versionId)
    }
  }
  
  if (versions.length === 0) {
    return (
      <Section title="버전">
        <p className="text-xs text-center py-3" style={{ color: 'var(--text-tertiary)' }}>
          생성된 버전이 없습니다
        </p>
      </Section>
    )
  }
  
  return (
    <Section 
      title={`버전 (${versions.length})`}
      action={isDirty && <span className="badge badge-amber" title="미저장 변경사항이 있습니다">수정중</span>}
      collapsed={versions.length > 3}
    >
      <div className="space-y-1.5">
        {versions.map((version) => {
          const isCurrent = version.id === currentVersionId
          
          return (
            <div 
              key={version.id}
              className={`group p-2 rounded-md border text-xs transition-all ${
                isCurrent ? 'border-l-2' : 'hover:border-[var(--border-secondary)]'
              }`}
              style={{ 
                borderColor: isCurrent ? 'var(--accent-interactive)' : 'transparent',
                borderLeftColor: isCurrent ? 'var(--accent-interactive)' : undefined,
                backgroundColor: isCurrent ? 'var(--accent-interactive-light)' : 'var(--workspace)'
              }}
            >
              <div className="flex items-center gap-2">
                {/* Label */}
                {editingLabel === version.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleSaveLabel(version.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel(version.id)}
                    className="input flex-1 text-xs py-0.5 px-1.5"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span 
                    className="font-medium flex-1 truncate cursor-pointer hover:text-[var(--accent-interactive)]"
                    style={{ color: 'var(--text-primary)' }}
                    onClick={() => handleEditLabel(version)}
                    title="클릭하여 이름 변경"
                  >
                    {version.label}
                  </span>
                )}
                
                {/* Mode badge - compact */}
                {version.mode === 'variation' && (
                  <span className="text-[10px] px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-info-light)', color: 'var(--accent-info)' }}>변형</span>
                )}
                {version.mode === 'regenerate' && (
                  <span className="text-[10px] px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--accent-warning)' }}>재생성</span>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {formatRelativeTime(version.generatedAt)}
                </span>
                
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isCurrent ? (
                    <>
                      <button
                        onClick={() => handleSwitch(version)}
                        className="p-1 rounded hover:bg-[var(--workspace-secondary)]"
                        title="이 버전으로 전환"
                      >
                        <span className="material-symbols-outlined text-base" style={{ color: 'var(--accent-interactive)' }}>swap_horiz</span>
                      </button>
                      <button
                        onClick={() => handleDelete(version.id)}
                        className="p-1 rounded hover:bg-[var(--workspace-secondary)]"
                        title="삭제"
                      >
                        <span className="material-symbols-outlined text-base" style={{ color: 'var(--text-muted)' }}>delete</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: 'var(--accent-interactive)', backgroundColor: 'var(--accent-interactive-light)' }}>
                      현재
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// Diff Section
function DiffSection({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [baseVersionId, setBaseVersionId] = useState<string>('')
  const [compareVersionId, setCompareVersionId] = useState<string>('')
  
  const { versions } = useRestaurantDraftVersions(projectId)
  
  const baseVersion = versions.find(v => v.id === baseVersionId)
  const compareVersion = versions.find(v => v.id === compareVersionId)
  
  if (versions.length < 2) {
    return (
      <Section title="버전 비교" collapsed>
        <p className="text-xs text-center py-3" style={{ color: 'var(--text-tertiary)' }}>
          비교할 버전이 2개 이상 필요합니다
        </p>
      </Section>
    )
  }
  
  if (!isOpen) {
    return (
      <Section title="버전 비교" collapsed>
        <button 
          onClick={() => {
            setIsOpen(true)
            setBaseVersionId(versions[0]?.id || '')
            setCompareVersionId(versions[1]?.id || '')
          }}
          className="btn-secondary w-full text-xs"
        >
          <span className="material-symbols-outlined text-sm mr-1">compare</span>
          버전 비교하기
        </button>
      </Section>
    )
  }
  
  return (
    <Section 
      title="버전 비교"
      action={
        <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-[var(--workspace-tertiary)]">
          <span className="material-symbols-outlined text-sm" style={{ color: 'var(--text-tertiary)' }}>close</span>
        </button>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)' }}>기준</label>
            <select 
              value={baseVersionId} 
              onChange={(e) => setBaseVersionId(e.target.value)}
              className="select text-xs py-1"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)' }}>비교</label>
            <select 
              value={compareVersionId} 
              onChange={(e) => setCompareVersionId(e.target.value)}
              className="select text-xs py-1"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {baseVersion && compareVersion && (
          <div className="border rounded-md overflow-hidden max-h-96 overflow-y-auto custom-scrollbar" style={{ borderColor: 'var(--border-primary)' }}>
            <RestaurantDraftDiffView
              baseVersion={baseVersion}
              compareVersion={compareVersion}
              onClose={() => setIsOpen(false)}
            />
          </div>
        )}
      </div>
    </Section>
  )
}

// Main Component
export function RestaurantDraftHelper({ projectId, onVersionSwitchRequest, isDirty }: RestaurantDraftHelperProps) {
  const placeProfile = useProjectStore((state) => state.getSelectedPlace(projectId))
  const reviewDigest = useProjectStore((state) => state.getReviewDigest(projectId))
  
  return (
    <div className="py-2">
      {/* Place Info */}
      {placeProfile && <PlaceInfoSection place={placeProfile} />}
      
      {/* Review Digest */}
      {reviewDigest && <ReviewDigestSection digest={reviewDigest} />}
      
      {/* Recommendations */}
      <RecommendationsSection digest={reviewDigest} />
      
      {/* Variation */}
      <VariationSection projectId={projectId} />
      
      {/* Version List */}
      <VersionListSection 
        projectId={projectId} 
        onVersionSwitchRequest={onVersionSwitchRequest}
        isDirty={isDirty}
      />
      
      {/* Diff */}
      <DiffSection projectId={projectId} />
    </div>
  )
}
