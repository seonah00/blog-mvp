/**
 * Restaurant Research Workspace - HubSpot Enterprise Style
 * 
 * 맛집 콘텐츠를 위한 리서치 워크스페이스
 * - 매장 검색 (Place Search) - Naver/Kakao/Google 통합
 * - 웹 조사 (Web Research) - Optional Perplexity
 * - 리뷰 입력 (Review Input)
 * - 요약 확인 (Review Digest)
 * 
 * 데이터 신뢰 계층 구조:
 * ┌─────────────────────────────────────────────┐
 * │  [사용자 직접 입력]  ← 최우선, 필수        │  ← Review Input (좌측 메인)
 * ├─────────────────────────────────────────────┤
 * │  [확정 정보] Naver/Kakao 구조화 데이터     │  ← CanonicalPlace (상단 고정)
 * ├─────────────────────────────────────────────┤
 * │  [참고 자료] 웹 조사 결과 (선택)           │  ← WebEvidence (우측 서브)
 * └─────────────────────────────────────────────┘
 */

'use client'

import { useState, useCallback } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { EmptyState } from '@/components/ui/empty-state'
import { PlaceSearchForm } from './components/place-search-form'
import { PlaceCandidateList } from './components/place-candidate-list'
import { PlaceProfileCard } from './components/place-profile-card'
import { ReviewInputPanel } from './components/review-input-panel'
import { ReviewDigestCard } from './components/review-digest-card'
import { ReviewSourcePolicyNotice } from './components/review-source-policy-notice'
import { researchRestaurantPlaceAction } from '@/features/research/actions'
import type { ReviewDigest, CanonicalPlace, NormalizedPlaceProfile } from '@/types'
import type { WebEvidence } from '@/types/evidence'

interface RestaurantResearchWorkspaceProps {
  projectId: string
  readiness: {
    hasPlace: boolean
    reviewCount: number
    hasDigest: boolean
    isComplete: boolean
  }
}

type ResearchTab = 'search' | 'reviews' | 'digest'

export function RestaurantResearchWorkspace({ projectId, readiness }: RestaurantResearchWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ResearchTab>('search')
  
  // Store data
  const candidates = useProjectStore((state) => state.getPlaceCandidates(projectId))
  const canonicalPlaces = useProjectStore((state) => state.getCanonicalPlaces(projectId))
  const selectedPlace = useProjectStore((state) => state.getSelectedPlace(projectId))
  const selectedCanonicalPlace = useProjectStore((state) => state.getSelectedCanonicalPlace(projectId))
  const reviews = useProjectStore((state) => state.getReviewInputs(projectId))
  const digest = useProjectStore((state) => state.getReviewDigest(projectId))
  const setReviewDigest = useProjectStore((state) => state.setReviewDigest)
  const webEvidence = useProjectStore((state) => state.getWebEvidence(projectId))

  // digest 생성 완료 핸들러
  const handleDigestGenerated = useCallback((newDigest: ReviewDigest) => {
    setReviewDigest(projectId, newDigest)
  }, [projectId, setReviewDigest])

  // 다음 탭으로 이동 가능한지 확인
  const canGoToReviews = !!selectedPlace
  const canGoToDigest = reviews.length > 0

  // 탭 레이블 및 상태
  const tabs = [
    { 
      id: 'search' as const, 
      label: '매장 검색', 
      icon: 'search',
      status: selectedPlace ? 'complete' as const : 'active' as const,
      disabled: false 
    },
    { 
      id: 'reviews' as const, 
      label: '리뷰 입력', 
      icon: 'edit_note',
      status: reviews.length > 0 ? 'complete' as const : canGoToReviews ? 'active' as const : 'pending' as const,
      disabled: !canGoToReviews 
    },
    { 
      id: 'digest' as const, 
      label: '요약 확인', 
      icon: 'summarize',
      status: digest ? 'complete' as const : canGoToDigest ? 'active' as const : 'pending' as const,
      disabled: !canGoToDigest 
    },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation - Compact */}
      <div className="border-b px-6" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--workspace-secondary)' }}>
        <div className="flex gap-1">
          {tabs.map((tab, index) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              stepNumber={index + 1}
            />
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'search' && (
            <SearchTabContent
              projectId={projectId}
              candidates={candidates}
              canonicalPlaces={canonicalPlaces}
              selectedPlace={selectedPlace}
              selectedCanonicalPlace={selectedCanonicalPlace}
              onNext={() => setActiveTab('reviews')}
            />
          )}

          {activeTab === 'reviews' && (
            <ReviewsTabContent
              projectId={projectId}
              selectedPlace={selectedPlace}
              selectedCanonicalPlace={selectedCanonicalPlace}
              reviews={reviews}
              webEvidence={webEvidence}
              onNext={() => setActiveTab('digest')}
              onPrev={() => setActiveTab('search')}
            />
          )}

          {activeTab === 'digest' && (
            <DigestTabContent
              projectId={projectId}
              selectedPlace={selectedPlace}
              selectedCanonicalPlace={selectedCanonicalPlace}
              reviews={reviews}
              digest={digest}
              webEvidence={webEvidence}
              onDigestGenerated={handleDigestGenerated}
              onPrev={() => setActiveTab('reviews')}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Tab Button Component
interface TabButtonProps {
  tab: {
    id: string
    label: string
    icon: string
    status: 'complete' | 'active' | 'pending'
    disabled: boolean
  }
  isActive: boolean
  onClick: () => void
  stepNumber: number
}

function TabButton({ tab, isActive, onClick, stepNumber }: TabButtonProps) {
  const getStyles = () => {
    if (isActive) {
      return {
        backgroundColor: 'var(--workspace)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-primary)',
        borderBottomColor: 'var(--workspace)',
      }
    }
    if (tab.disabled) {
      return {
        backgroundColor: 'transparent',
        color: 'var(--text-muted)',
        borderColor: 'transparent',
      }
    }
    return {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'transparent',
    }
  }

  const styles = getStyles()

  return (
    <button
      onClick={onClick}
      disabled={tab.disabled}
      className="flex items-center gap-2 px-4 py-3 text-xs font-medium transition-all relative -mb-px border border-b-0 rounded-t-md"
      style={{
        ...styles,
        cursor: tab.disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {/* Status Icon */}
      <span className="material-symbols-outlined text-sm">
        {tab.status === 'complete' ? 'check_circle' : tab.icon}
      </span>
      
      {/* Label */}
      <span>{tab.label}</span>
      
      {/* Step Number (when not complete) */}
      {tab.status !== 'complete' && (
        <span 
          className="ml-1 w-4 h-4 flex items-center justify-center rounded-full text-[10px]"
          style={{ 
            backgroundColor: isActive ? 'var(--accent-interactive-light)' : 'var(--workspace-secondary)',
            color: isActive ? 'var(--accent-interactive)' : 'var(--text-tertiary)'
          }}
        >
          {stepNumber}
        </span>
      )}
    </button>
  )
}

// Search Tab Content
interface SearchTabContentProps {
  projectId: string
  candidates: ReturnType<typeof useProjectStore.prototype.getPlaceCandidates>
  canonicalPlaces: ReturnType<typeof useProjectStore.prototype.getCanonicalPlaces>
  selectedPlace: ReturnType<typeof useProjectStore.prototype.getSelectedPlace>
  selectedCanonicalPlace: CanonicalPlace | undefined
  onNext: () => void
}

function SearchTabContent({ 
  projectId, 
  candidates, 
  canonicalPlaces, 
  selectedPlace, 
  selectedCanonicalPlace,
  onNext 
}: SearchTabContentProps) {
  const hasCandidates = candidates.length > 0

  return (
    <div className="space-y-4">
      {/* Search Form Panel */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>매장 검색</h3>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Naver + Kakao + Google</span>
        </div>
        <div className="panel-body">
          <PlaceSearchForm projectId={projectId} />
        </div>
      </div>

      {/* Policy Notice */}
      <ReviewSourcePolicyNotice />

      {/* Candidates List */}
      {hasCandidates && !selectedPlace && (
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>검색 결과</h3>
            <span className="badge badge-info">{candidates.length}개</span>
          </div>
          <div className="panel-body">
            <PlaceCandidateList 
              projectId={projectId} 
              candidates={candidates} 
              canonicalPlaces={canonicalPlaces}
            />
          </div>
          
          {/* Data Source Notice */}
          <div 
            className="panel-footer text-[10px]"
            style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-primary)' }}
          >
            <span className="material-symbols-outlined text-xs align-text-bottom">info</span>
            {' '}Naver/Kakao 데이터를 병합하여 표시합니다. 여러 소스에서 일치하는 장소는 통합되어 표시됩니다.
          </div>
        </div>
      )}

      {/* Selected Place - Canonical Place 정보로 풍부하게 표시 */}
      {selectedPlace && (
        <>
          {/* 확정 정보 헤더 */}
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-t-md text-xs font-medium"
            style={{ 
              backgroundColor: 'var(--accent-info)', 
              color: 'white'
            }}
          >
            <span className="material-symbols-outlined text-sm">verified</span>
            확정 정보 (Naver/Kakao)
          </div>
          
          {/* Canonical Place 상세 정보 */}
          <div 
            className="-mt-4 p-4 rounded-b-md rounded-tr-md border border-t-0"
            style={{ 
              backgroundColor: 'var(--workspace)', 
              borderColor: 'var(--border-primary)'
            }}
          >
            {selectedCanonicalPlace ? (
              /* Canonical Place가 있으면 상세 정보 표시 */
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedCanonicalPlace.name}
                    </h3>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {selectedCanonicalPlace.category?.primary} 
                      {selectedCanonicalPlace.category?.secondary && ` › ${selectedCanonicalPlace.category.secondary}`}
                    </p>
                  </div>
                  {selectedCanonicalPlace.confidence && (
                    <ConfidencePill confidence={selectedCanonicalPlace.confidence} />
                  )}
                </div>

                {/* 주소 정보 */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>location_on</span>
                    <div>
                      <p style={{ color: 'var(--text-primary)' }}>{selectedCanonicalPlace.address.road}</p>
                      {selectedCanonicalPlace.address.jibun && (
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>(지번) {selectedCanonicalPlace.address.jibun}</p>
                      )}
                    </div>
                  </div>
                  
                  {selectedCanonicalPlace.contact?.phone && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>phone</span>
                      <span style={{ color: 'var(--text-primary)' }}>{selectedCanonicalPlace.contact.phone}</span>
                    </div>
                  )}

                  {/* 좌표 정보 (접힘 상태로 표시 가능) */}
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>my_location</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {selectedCanonicalPlace.coordinates.lat.toFixed(6)}, {selectedCanonicalPlace.coordinates.lng.toFixed(6)}
                    </span>
                  </div>
                </div>

                {/* 데이터 소스 표시 */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                  {Object.keys(selectedCanonicalPlace.sources).map((sourceKey) => (
                    <SourceBadge key={sourceKey} source={sourceKey} />
                  ))}
                </div>
              </div>
            ) : (
              /* Canonical Place가 없으면 기본 PlaceProfileCard 표시 */
              <PlaceProfileCard place={selectedPlace} />
            )}
          </div>
          
          {/* Data Confidence Notice */}
          <div 
            className="flex items-start gap-2 p-3 rounded-md text-xs"
            style={{ backgroundColor: 'var(--accent-info-light)', color: 'var(--accent-info)' }}
          >
            <span className="material-symbols-outlined text-sm flex-shrink-0">info</span>
            <div>
              <p className="font-medium">구조화된 확정 데이터</p>
              <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                위 정보는 Naver/Kakao API에서 제공하는 검증된 데이터입니다. 
                초안 생성 시 이 데이터를 기반으로 정확한 정보를 제공합니다.
              </p>
            </div>
          </div>
          
          {/* Next Step CTA */}
          <div 
            className="flex items-center justify-between p-4 rounded-md border"
            style={{ 
              backgroundColor: 'var(--accent-secondary-light)', 
              borderColor: 'var(--accent-secondary)',
              borderLeftWidth: '3px'
            }}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: 'var(--accent-secondary)' }}>check_circle</span>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  &quot;{selectedPlace.name}&quot; 선택 완료
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  다음 단계에서 선택적으로 웹 조사를 실행하거나 바로 리뷰를 입력하세요
                </p>
              </div>
            </div>
            <button onClick={onNext} className="btn-primary text-xs">
              리뷰 입력 →
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Reviews Tab Content
interface ReviewsTabContentProps {
  projectId: string
  selectedPlace: ReturnType<typeof useProjectStore.prototype.getSelectedPlace>
  selectedCanonicalPlace: CanonicalPlace | undefined
  reviews: ReturnType<typeof useProjectStore.prototype.getReviewInputs>
  webEvidence: WebEvidence[]
  onNext: () => void
  onPrev: () => void
}

function ReviewsTabContent({ 
  projectId, 
  selectedPlace, 
  selectedCanonicalPlace,
  reviews, 
  webEvidence, 
  onNext, 
  onPrev 
}: ReviewsTabContentProps) {
  const [evidenceAdded, setEvidenceAdded] = useState(false)
  const [skipWebResearch, setSkipWebResearch] = useState(false)
  
  if (!selectedPlace) {
    return (
      <EmptyState
        icon="store"
        title="먼저 매장을 선택해주세요"
        description='"매장 검색" 탭에서 매장을 검색하고 선택해주세요.'
        action={
          <button onClick={onPrev} className="btn-secondary text-xs">
            매장 검색으로 이동
          </button>
        }
      />
    )
  }

  const handleEvidenceAdded = () => {
    setEvidenceAdded(true)
  }

  const handleSkipWebResearch = () => {
    setSkipWebResearch(true)
  }

  // 웹 조사를 skip했거나 이미 evidence가 있으면 참고 섹션 숨김
  const showWebResearchPanel = !skipWebResearch && webEvidence.length === 0

  return (
    <div className="space-y-4">
      {/* 확정 정보 헤더 - Canonical Place 표시 */}
      <div 
        className="flex items-center gap-3 p-3 rounded-md border"
        style={{ backgroundColor: 'var(--accent-info-light)', borderColor: 'var(--accent-info)' }}
      >
        <span className="material-symbols-outlined flex-shrink-0" style={{ color: 'var(--accent-info)' }}>verified</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: 'var(--accent-info)' }}>확정 정보</p>
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {selectedCanonicalPlace?.name || selectedPlace.name}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
            {selectedCanonicalPlace?.address?.road || selectedPlace.address}
          </p>
        </div>
        <button onClick={onPrev} className="btn-ghost text-xs flex-shrink-0">
          변경
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Review Input (사용자 입력 - 최우선) */}
        <div className="space-y-4">
          {/* 사용자 입력 섹션 헤더 */}
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-t-md text-xs font-medium"
            style={{ 
              backgroundColor: 'var(--accent-secondary)', 
              color: 'white'
            }}
          >
            <span className="material-symbols-outlined text-sm">edit_note</span>
            내 리뷰 입력 (필수)
          </div>
          <div className="-mt-4">
            <ReviewInputPanel projectId={projectId} />
          </div>
          <ReviewSourcePolicyNotice />
        </div>

        {/* Right: Optional Web Research (참고 자료) */}
        <div className="space-y-4">
          {/* 참고 자료 섹션 헤더 */}
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-t-md text-xs font-medium"
            style={{ 
              backgroundColor: 'var(--accent-info)', 
              color: 'white'
            }}
          >
            <span className="material-symbols-outlined text-sm">travel_explore</span>
            웹 조사 (선택)
          </div>
          <div className="-mt-4">
            <WebResearchPanel 
              projectId={projectId}
              place={selectedPlace}
              evidence={webEvidence}
              onEvidenceAdded={handleEvidenceAdded}
              onSkip={handleSkipWebResearch}
              skipped={skipWebResearch}
            />
          </div>
        </div>
      </div>

      {/* Next Step CTA */}
      {reviews.length > 0 && (
        <div 
          className="flex items-center justify-between p-4 rounded-md border"
          style={{ 
            backgroundColor: 'var(--accent-secondary-light)', 
            borderColor: 'var(--accent-secondary)',
            borderLeftWidth: '3px'
          }}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-secondary)' }}>check_circle</span>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {reviews.length}개의 리뷰 입력 완료
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {webEvidence.length > 0 
                  ? '웹 조사 결과를 포함하여 요약을 생성합니다'
                  : skipWebResearch 
                    ? '웹 조사 없이 리뷰만으로 요약을 생성합니다'
                    : '웹 조사 없이 리뷰만으로 요약을 생성합니다'}
              </p>
            </div>
          </div>
          <button onClick={onNext} className="btn-primary text-xs">
            요약 생성 →
          </button>
        </div>
      )}
    </div>
  )
}

// Digest Tab Content
interface DigestTabContentProps {
  projectId: string
  selectedPlace: ReturnType<typeof useProjectStore.prototype.getSelectedPlace>
  selectedCanonicalPlace: CanonicalPlace | undefined
  reviews: ReturnType<typeof useProjectStore.prototype.getReviewInputs>
  digest: ReviewDigest | undefined
  webEvidence: WebEvidence[]
  onDigestGenerated: (digest: ReviewDigest) => void
  onPrev: () => void
}

function DigestTabContent({ 
  projectId, 
  selectedPlace, 
  selectedCanonicalPlace,
  reviews, 
  digest, 
  webEvidence, 
  onDigestGenerated, 
  onPrev 
}: DigestTabContentProps) {
  if (!selectedPlace) {
    return (
      <EmptyState
        icon="store"
        title="먼저 매장을 선택해주세요"
        description='"매장 검색" 탭에서 매장을 검색하고 선택해주세요.'
        action={
          <button onClick={onPrev} className="btn-secondary text-xs">
            매장 검색으로 이동
          </button>
        }
      />
    )
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon="edit_note"
        title="리뷰가 없습니다"
        description='"리뷰 입력" 탭에서 최소 1개 이상의 리뷰를 추가해주세요.'
        action={
          <button onClick={onPrev} className="btn-secondary text-xs">
            리뷰 입력으로 이동
          </button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* 데이터 계층 요약 헤더 */}
      <div 
        className="p-3 rounded-md border"
        style={{ backgroundColor: 'var(--workspace-secondary)', borderColor: 'var(--border-primary)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-sm" style={{ color: 'var(--text-tertiary)' }}>summarize</span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>요약 생성 데이터 구성</span>
        </div>
        
        <div className="space-y-1.5 text-xs">
          {/* Tier 1: 사용자 입력 */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-medium flex-shrink-0" 
              style={{ backgroundColor: 'var(--accent-secondary)', color: 'white' }}>1</span>
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>내 리뷰</strong> {reviews.length}개 (최우선 반영)
            </span>
          </div>
          
          {/* Tier 2: 확정 정보 */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-medium flex-shrink-0" 
              style={{ backgroundColor: 'var(--accent-info)', color: 'white' }}>2</span>
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>확정 정보</strong> {selectedCanonicalPlace?.name || selectedPlace.name}
            </span>
          </div>
          
          {/* Tier 3: 참고 자료 */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-medium flex-shrink-0" 
              style={{ backgroundColor: webEvidence.length > 0 ? 'var(--accent-info)' : 'var(--text-muted)', color: 'white' }}>3</span>
            <span style={{ color: webEvidence.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              <strong>웹 조사</strong> {webEvidence.length > 0 ? `${webEvidence.length}개 자료 참고` : '미수행 (선택사항)'}
            </span>
          </div>
        </div>
      </div>

      {/* Draft Input Preview - 생성 전 데이터 미리보기 */}
      <DraftInputPreview
        selectedPlace={selectedPlace}
        selectedCanonicalPlace={selectedCanonicalPlace}
        reviews={reviews}
        digest={digest}
        webEvidence={webEvidence}
      />

      {/* Review Digest Card */}
      <ReviewDigestCard
        projectId={projectId}
        placeName={selectedPlace.name}
        placeCategory={selectedPlace.category}
        reviews={reviews}
        digest={digest}
        onDigestGenerated={onDigestGenerated}
        webEvidence={webEvidence}
      />
    </div>
  )
}

// Web Research Panel Component
interface WebResearchPanelProps {
  projectId: string
  place: NormalizedPlaceProfile
  evidence: WebEvidence[]
  onEvidenceAdded: () => void
  onSkip: () => void
  skipped: boolean
}

function WebResearchPanel({ projectId, place, evidence, onEvidenceAdded, onSkip, skipped }: WebResearchPanelProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const addWebEvidence = useProjectStore((state) => state.addWebEvidence)

  const handleResearch = async () => {
    setStatus('loading')
    setError(null)

    try {
      const result = await researchRestaurantPlaceAction(
        projectId,
        place.name,
        undefined, // region - 필요시 추출
        place.category
      )

      if (result.success && result.evidence) {
        addWebEvidence(projectId, result.evidence)
        setStatus('success')
        onEvidenceAdded()
      } else {
        setStatus('error')
        setError(result.error || '웹 조사 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    }
  }

  // Skip 처리
  if (skipped) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="text-center py-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: 'var(--workspace-secondary)' }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)' }}>block</span>
            </div>
            <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              웹 조사 생략
            </h4>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              웹 조사 없이 내 리뷰만으로 요약을 생성합니다.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 이미 evidence가 있으면 결과 표시
  if (evidence.length > 0) {
    const latestEvidence = evidence[evidence.length - 1]
    
    return (
      <div className="panel">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" style={{ color: 'var(--accent-info)' }}>travel_explore</span>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>웹 조사 결과</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ 
            backgroundColor: 'var(--accent-info-light)', 
            color: 'var(--accent-info)'
          }}>
            참고 자료
          </span>
        </div>
        <div className="panel-body space-y-3">
          {/* Summary */}
          <div 
            className="p-3 rounded-md text-sm"
            style={{ backgroundColor: 'var(--workspace-secondary)' }}
          >
            <p style={{ color: 'var(--text-secondary)' }}>{latestEvidence.summary}</p>
          </div>

          {/* Confidence & Policy */}
          <div className="flex items-center gap-2 text-[10px]">
            <ConfidenceBadge confidence={latestEvidence.confidence} />
            {latestEvidence.usagePolicy.requiresAttribution && (
              <span style={{ color: 'var(--text-muted)' }}>출처 표시 필요</span>
            )}
          </div>

          {/* Citations */}
          {latestEvidence.citations.length > 0 && (
            <div>
              <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>출처</p>
              <div className="space-y-1">
                {latestEvidence.citations.slice(0, 3).map((citation, i) => (
                  <a 
                    key={i}
                    href={citation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[10px] truncate hover:underline"
                    style={{ color: 'var(--accent-interactive)' }}
                  >
                    {citation}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Limitations */}
          {latestEvidence.limitations && latestEvidence.limitations.length > 0 && (
            <div 
              className="p-2 rounded-md text-[10px]"
              style={{ backgroundColor: 'var(--warning-light)', color: 'var(--accent-warning)' }}
            >
              <p className="font-medium mb-1">⚠️ 참고사항</p>
              <ul className="list-disc list-inside">
                {latestEvidence.limitations.map((limitation, i) => (
                  <li key={i}>{limitation}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Retry Button */}
          <button
            onClick={handleResearch}
            disabled={status === 'loading'}
            className="btn-ghost text-xs w-full"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            다시 조사하기
          </button>
        </div>
      </div>
    )
  }

  // Initial State - Run Research or Skip
  return (
    <div className="panel">
      <div className="panel-body">
        <div className="text-center py-4">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
            style={{ backgroundColor: 'var(--accent-info-light)' }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-info)' }}>travel_explore</span>
          </div>
          
          <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            웹 조사 (선택)
          </h4>
          <p className="text-[10px] mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Perplexity AI로 웹에서 추가 정보를 수집합니다.<br/>
            실패해도 리뷰 입력과 초안 생성에는 영향이 없습니다.
          </p>

          {status === 'error' && (
            <div 
              className="mb-3 p-2 rounded-md text-[10px] text-left"
              style={{ backgroundColor: 'var(--error-light)', color: 'var(--accent-critical)' }}
            >
              <div className="flex items-start gap-1">
                <span className="material-symbols-outlined text-xs flex-shrink-0">error</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleResearch}
              disabled={status === 'loading'}
              className="btn-secondary text-xs"
            >
              {status === 'loading' ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                  조사 중...
                </>
              ) : status === 'error' ? (
                <>
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  재시도
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">travel_explore</span>
                  웹 조사 실행
                </>
              )}
            </button>
            
            <button
              onClick={onSkip}
              disabled={status === 'loading'}
              className="btn-ghost text-xs"
            >
              <span className="material-symbols-outlined text-sm">skip_next</span>
              건너뛰기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Confidence Badge Component
function ConfidenceBadge({ confidence }: { confidence: 'verified' | 'mentioned' | 'uncertain' }) {
  const styles = {
    verified: { bg: 'var(--accent-secondary-light)', text: 'var(--accent-secondary)', label: '검증됨' },
    mentioned: { bg: 'var(--accent-info-light)', text: 'var(--accent-info)', label: '언급됨' },
    uncertain: { bg: 'var(--warning-light)', text: 'var(--accent-warning)', label: '불확실' },
  }
  
  const style = styles[confidence]
  
  return (
    <span 
      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  )
}

// Confidence Pill Component (for CanonicalPlace)
function ConfidencePill({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { label: '높음', color: 'var(--accent-secondary)' },
    medium: { label: '보통', color: 'var(--accent-info)' },
    low: { label: '낮음', color: 'var(--accent-warning)' },
  }
  
  const { label, color } = config[confidence]
  
  return (
    <span 
      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      신뢰도 {label}
    </span>
  )
}

// Source Badge Component
function SourceBadge({ source }: { source: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    naver: { bg: 'var(--accent-success-light)', text: 'var(--accent-success)', label: 'Naver' },
    kakao: { bg: 'var(--accent-warning-light)', text: 'var(--accent-warning)', label: 'Kakao' },
    google: { bg: 'var(--accent-info-light)', text: 'var(--accent-info)', label: 'Google' },
    manual: { bg: 'var(--workspace-secondary)', text: 'var(--text-tertiary)', label: '직접입력' },
  }
  
  const style = styles[source] || styles.manual
  
  return (
    <span 
      className="text-[10px] px-1.5 py-0.5 rounded"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  )
}

// Draft Input Preview Component
// 초안 생성 전 사용될 입력 데이터를 미리보기로 표시
interface DraftInputPreviewProps {
  selectedPlace: NormalizedPlaceProfile
  selectedCanonicalPlace: CanonicalPlace | undefined
  reviews: ReturnType<typeof useProjectStore.prototype.getReviewInputs>
  digest: ReviewDigest | undefined
  webEvidence: WebEvidence[]
}

function DraftInputPreview({ 
  selectedPlace, 
  selectedCanonicalPlace, 
  reviews, 
  digest, 
  webEvidence 
}: DraftInputPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // 데이터 존재 여부
  const hasUserInput = reviews.length > 0
  const hasDigest = !!digest
  const hasCanonicalPlace = !!selectedCanonicalPlace
  const hasWebEvidence = webEvidence.length > 0
  
  // 확정 정보 데이터 준비
  const verifiedInfo = hasCanonicalPlace ? {
    name: selectedCanonicalPlace.name,
    category: selectedCanonicalPlace.category?.full || selectedCanonicalPlace.category?.primary,
    address: selectedCanonicalPlace.address.road,
    phone: selectedCanonicalPlace.contact?.phone,
    coordinates: `${selectedCanonicalPlace.coordinates.lat.toFixed(4)}, ${selectedCanonicalPlace.coordinates.lng.toFixed(4)}`,
    sources: Object.keys(selectedCanonicalPlace.sources),
  } : {
    name: selectedPlace.name,
    category: selectedPlace.category,
    address: selectedPlace.address,
    phone: selectedPlace.phone,
    coordinates: selectedPlace.coordinates ? 
      `${selectedPlace.coordinates.lat.toFixed(4)}, ${selectedPlace.coordinates.lng.toFixed(4)}` : undefined,
    sources: selectedPlace.sources,
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" style={{ color: 'var(--accent-interactive)' }}>preview</span>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>초안 생성 데이터 미리보기</h3>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-ghost text-xs py-1 px-2"
        >
          <span className="material-symbols-outlined text-sm">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
          {isExpanded ? '접기' : '펼치기'}
        </button>
      </div>
      
      <div className="panel-body space-y-4">
        {/* Tier 1: 사용자 직접 입력 - 최우선 */}
        <div 
          className="p-3 rounded-md border-l-3"
          style={{ 
            backgroundColor: 'var(--accent-secondary-light)', 
            borderLeftColor: 'var(--accent-secondary)',
            borderLeftWidth: '3px'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span 
              className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-medium"
              style={{ backgroundColor: 'var(--accent-secondary)', color: 'white' }}
            >1</span>
            <span className="text-xs font-medium" style={{ color: 'var(--accent-secondary)' }}>사용자 직접 입력 (최우선)</span>
            {hasUserInput && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-secondary)', color: 'white' }}>
                사용됨
              </span>
            )}
          </div>
          
          {hasUserInput ? (
            <div className="space-y-1 text-xs">
              <p style={{ color: 'var(--text-primary)' }}>
                <strong>리뷰:</strong> {reviews.length}개 입력
              </p>
              {hasDigest && (
                <>
                  <p style={{ color: 'var(--text-primary)' }}>
                    <strong>요약:</strong> {digest.summary.slice(0, 60)}...
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    <strong>핵심 포인트:</strong> {digest.highlights.slice(0, 3).join(', ')}
                    {digest.highlights.length > 3 && ` 외 ${digest.highlights.length - 3}개`}
                  </p>
                </>
              )}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              아직 리뷰를 입력하지 않았습니다. 초안 생성을 위해 최소 1개 이상의 리뷰가 필요합니다.
            </p>
          )}
        </div>

        {/* Tier 2: 확정 정보 - 구조화 데이터 */}
        <div 
          className="p-3 rounded-md border-l-3"
          style={{ 
            backgroundColor: 'var(--accent-info-light)', 
            borderLeftColor: 'var(--accent-info)',
            borderLeftWidth: '3px'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span 
              className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-medium"
              style={{ backgroundColor: 'var(--accent-info)', color: 'white' }}
            >2</span>
            <span className="text-xs font-medium" style={{ color: 'var(--accent-info)' }}>확정 정보 (Naver/Kakao)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-info)', color: 'white' }}>
              사용됨
            </span>
          </div>
          
          <div className="space-y-1 text-xs">
            <p style={{ color: 'var(--text-primary)' }}>
              <strong>매장명:</strong> {verifiedInfo.name}
            </p>
            {verifiedInfo.category && (
              <p style={{ color: 'var(--text-primary)' }}>
                <strong>카테고리:</strong> {verifiedInfo.category}
              </p>
            )}
            <p style={{ color: 'var(--text-primary)' }}>
              <strong>주소:</strong> {verifiedInfo.address}
            </p>
            {verifiedInfo.phone && (
              <p style={{ color: 'var(--text-primary)' }}>
                <strong>전화:</strong> {verifiedInfo.phone}
              </p>
            )}
            {verifiedInfo.coordinates && (
              <p style={{ color: 'var(--text-secondary)' }}>
                <strong>좌표:</strong> {verifiedInfo.coordinates}
              </p>
            )}
            <div className="flex items-center gap-1 pt-1">
              <span style={{ color: 'var(--text-muted)' }}>출처:</span>
              {verifiedInfo.sources.map((source) => (
                <SourceBadge key={source} source={source} />
              ))}
            </div>
          </div>
        </div>

        {/* Tier 3: 참고 자료 - 웹 조사 */}
        <div 
          className="p-3 rounded-md border-l-3"
          style={{ 
            backgroundColor: hasWebEvidence ? 'var(--workspace-secondary)' : 'var(--workspace)',
            borderLeftColor: hasWebEvidence ? 'var(--accent-warning)' : 'var(--text-muted)',
            borderLeftWidth: '3px',
            opacity: hasWebEvidence ? 1 : 0.7
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span 
              className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-medium"
              style={{ 
                backgroundColor: hasWebEvidence ? 'var(--accent-warning)' : 'var(--text-muted)', 
                color: 'white' 
              }}
            >3</span>
            <span className="text-xs font-medium" style={{ color: hasWebEvidence ? 'var(--accent-warning)' : 'var(--text-muted)' }}>
              웹 조사 자료 (참고용)
            </span>
            {hasWebEvidence && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-warning)', color: 'white' }}>
                사용됨
              </span>
            )}
          </div>
          
          {hasWebEvidence ? (
            <div className="space-y-2 text-xs">
              {webEvidence.map((evidence, index) => (
                <div key={evidence.id} className="p-2 rounded" style={{ backgroundColor: 'var(--workspace)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>#{index + 1}</span>
                    <ConfidenceBadge confidence={evidence.confidence} />
                  </div>
                  {isExpanded && (
                    <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                      {evidence.summary.slice(0, 100)}...
                    </p>
                  )}
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    출처: {evidence.citations.length}개 링크
                  </p>
                </div>
              ))}
              {!isExpanded && webEvidence.length > 1 && (
                <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                  외 {webEvidence.length - 1}개 자료 더 보기...
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              웹 조사가 수행되지 않았습니다. (선택사항)
              <br />
              웹 조사는 초안 생성의 참고 자료로만 활용됩니다.
            </p>
          )}
        </div>

        {/* 데이터 우선순위 안내 */}
        <div 
          className="p-2 rounded-md text-[10px]"
          style={{ backgroundColor: 'var(--workspace-secondary)', color: 'var(--text-tertiary)' }}
        >
          <span className="material-symbols-outlined text-xs align-text-bottom">info</span>
          {' '}초안 생성 시 데이터 신뢰 순위: 1순위(사용자 입력) → 2순위(확정 정보) → 3순위(웹 조사)
        </div>
      </div>
    </div>
  )
}
