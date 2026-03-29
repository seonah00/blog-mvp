/**
 * Restaurant Research Workspace - HubSpot Enterprise Style
 * 
 * 맛집 콘텐츠를 위한 리서치 워크스페이스
 * - 매장 검색 (Place Search)
 * - 리뷰 입력 (Review Input)
 * - 요약 확인 (Review Digest)
 */

'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { EmptyState } from '@/components/ui/empty-state'
import { PlaceSearchForm } from './components/place-search-form'
import { PlaceCandidateList } from './components/place-candidate-list'
import { PlaceProfileCard } from './components/place-profile-card'
import { ReviewInputPanel } from './components/review-input-panel'
import { ReviewDigestCard } from './components/review-digest-card'
import { ReviewSourcePolicyNotice } from './components/review-source-policy-notice'
import type { ReviewDigest } from '@/types'

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
  const selectedPlace = useProjectStore((state) => state.getSelectedPlace(projectId))
  const reviews = useProjectStore((state) => state.getReviewInputs(projectId))
  const digest = useProjectStore((state) => state.getReviewDigest(projectId))
  const setReviewDigest = useProjectStore((state) => state.setReviewDigest)

  // digest 생성 완료 핸들러
  const handleDigestGenerated = (newDigest: ReviewDigest) => {
    setReviewDigest(projectId, newDigest)
  }

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
              selectedPlace={selectedPlace}
              onNext={() => setActiveTab('reviews')}
            />
          )}

          {activeTab === 'reviews' && (
            <ReviewsTabContent
              projectId={projectId}
              selectedPlace={selectedPlace}
              reviews={reviews}
              onNext={() => setActiveTab('digest')}
              onPrev={() => setActiveTab('search')}
            />
          )}

          {activeTab === 'digest' && (
            <DigestTabContent
              projectId={projectId}
              selectedPlace={selectedPlace}
              reviews={reviews}
              digest={digest}
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
  selectedPlace: ReturnType<typeof useProjectStore.prototype.getSelectedPlace>
  onNext: () => void
}

function SearchTabContent({ projectId, candidates, selectedPlace, onNext }: SearchTabContentProps) {
  return (
    <div className="space-y-4">
      {/* Search Form Panel */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>매장 검색</h3>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Google Places + Naver API</span>
        </div>
        <div className="panel-body">
          <PlaceSearchForm projectId={projectId} />
        </div>
      </div>

      {/* Policy Notice */}
      <ReviewSourcePolicyNotice />

      {/* Candidates List */}
      {candidates.length > 0 && !selectedPlace && (
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>검색 결과</h3>
            <span className="badge badge-info">{candidates.length}개</span>
          </div>
          <div className="panel-body">
            <PlaceCandidateList projectId={projectId} candidates={candidates} />
          </div>
        </div>
      )}

      {/* Selected Place */}
      {selectedPlace && (
        <>
          <PlaceProfileCard place={selectedPlace} />
          
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
                  "{selectedPlace.name}" 선택 완료
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  다음 단계에서 리뷰를 입력하세요
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
  reviews: ReturnType<typeof useProjectStore.prototype.getReviewInputs>
  onNext: () => void
  onPrev: () => void
}

function ReviewsTabContent({ projectId, selectedPlace, reviews, onNext, onPrev }: ReviewsTabContentProps) {
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

  return (
    <div className="space-y-4">
      {/* Selected Place Info */}
      <div 
        className="flex items-center gap-3 p-3 rounded-md border"
        style={{ backgroundColor: 'var(--workspace-secondary)', borderColor: 'var(--border-primary)' }}
      >
        <span className="material-symbols-outlined" style={{ color: 'var(--text-tertiary)' }}>restaurant</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{selectedPlace.name}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{selectedPlace.address}</p>
        </div>
        <button onClick={onPrev} className="btn-ghost text-xs">
          변경
        </button>
      </div>

      {/* Review Input Panel */}
      <ReviewInputPanel projectId={projectId} />

      {/* Policy Notice */}
      <ReviewSourcePolicyNotice />

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
                다음 단계에서 AI 요약을 생성하세요
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
  reviews: ReturnType<typeof useProjectStore.prototype.getReviewInputs>
  digest: ReviewDigest | undefined
  onDigestGenerated: (digest: ReviewDigest) => void
  onPrev: () => void
}

function DigestTabContent({ projectId, selectedPlace, reviews, digest, onDigestGenerated, onPrev }: DigestTabContentProps) {
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
      {/* Place Info */}
      <div 
        className="flex items-center gap-3 p-3 rounded-md border"
        style={{ backgroundColor: 'var(--workspace-secondary)', borderColor: 'var(--border-primary)' }}
      >
        <span className="material-symbols-outlined" style={{ color: 'var(--text-tertiary)' }}>restaurant</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{selectedPlace.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {reviews.length}개의 리뷰 기반 분석
          </p>
        </div>
      </div>

      {/* Review Digest Card */}
      <ReviewDigestCard
        projectId={projectId}
        placeName={selectedPlace.name}
        placeCategory={selectedPlace.category}
        reviews={reviews}
        digest={digest}
        onDigestGenerated={onDigestGenerated}
      />
    </div>
  )
}
