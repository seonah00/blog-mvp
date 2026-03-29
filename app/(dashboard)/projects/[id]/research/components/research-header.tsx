/**
 * Research Header
 * 
 * 리서치 페이지 헤더 + 준비 상태 요약
 * HubSpot 스타일의 엔터프라이즈 SaaS 워크스페이스
 */

'use client'

import { useRouter } from 'next/navigation'
import type { Project } from '@/types'

interface RestaurantReadiness {
  hasPlace: boolean
  reviewCount: number
  hasDigest: boolean
  isComplete: boolean
}

interface InformationalReadiness {
  hasTopic: boolean
  sourceCount: number
  hasOutline: boolean
  isComplete: boolean
}

interface ResearchHeaderProps {
  project: Project
  restaurantReadiness: RestaurantReadiness | null
  informationalReadiness: InformationalReadiness | null
}

export function ResearchHeader({ 
  project, 
  restaurantReadiness, 
  informationalReadiness 
}: ResearchHeaderProps) {
  const router = useRouter()
  const readiness = restaurantReadiness || informationalReadiness
  const isComplete = readiness?.isComplete ?? false

  const handleContinue = () => {
    router.push(`/projects/${project.id}/draft/settings`)
  }

  return (
    <div className="border-b" style={{ backgroundColor: 'var(--workspace)', borderColor: 'var(--border-primary)' }}>
      <div className="px-6 py-4">
        {/* Top Row: Title & Meta */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge ${project.type === 'restaurant' ? 'badge-warning' : 'badge-info'}`}>
                {project.type === 'restaurant' ? '맛집' : '정보성'}
              </span>
              {isComplete && (
                <span className="badge badge-success">준비 완료</span>
              )}
            </div>
            <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {project.title}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {project.type === 'restaurant' 
                ? '매장 검색 → 리뷰 입력 → 요약 생성' 
                : '주제 설정 → 소스 수집 → 아웃라인 작성'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isComplete && (
              <button onClick={handleContinue} className="btn-primary text-xs">
                초안 작성 →
              </button>
            )}
          </div>
        </div>

        {/* Readiness Summary Row */}
        <div className="flex flex-wrap items-center gap-2">
          {project.type === 'restaurant' && restaurantReadiness && (
            <RestaurantReadinessPills readiness={restaurantReadiness} />
          )}
          {project.type === 'informational' && informationalReadiness && (
            <InformationalReadinessPills readiness={informationalReadiness} />
          )}
        </div>
      </div>
    </div>
  )
}

function RestaurantReadinessPills({ readiness }: { readiness: RestaurantReadiness }) {
  return (
    <>
      <ReadinessPill 
        status={readiness.hasPlace ? 'complete' : 'pending'}
        label="매장 선택"
        icon="store"
      />
      <ReadinessPill 
        status={readiness.reviewCount > 0 ? 'complete' : 'pending'}
        label={`리뷰 ${readiness.reviewCount}개`}
        icon="reviews"
      />
      <ReadinessPill 
        status={readiness.hasDigest ? 'complete' : 'pending'}
        label="요약 생성"
        icon="summarize"
      />
    </>
  )
}

function InformationalReadinessPills({ readiness }: { readiness: InformationalReadiness }) {
  return (
    <>
      <ReadinessPill 
        status={readiness.hasTopic ? 'complete' : 'pending'}
        label="주제 설정"
        icon="topic"
      />
      <ReadinessPill 
        status={readiness.sourceCount > 0 ? 'complete' : 'pending'}
        label={`소스 ${readiness.sourceCount}개`}
        icon="folder_open"
      />
      <ReadinessPill 
        status={readiness.hasOutline ? 'complete' : 'pending'}
        label="아웃라인"
        icon="format_list_numbered"
      />
    </>
  )
}

interface ReadinessPillProps {
  status: 'complete' | 'pending'
  label: string
  icon: string
}

function ReadinessPill({ status, label, icon }: ReadinessPillProps) {
  return (
    <div 
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
      style={{ 
        backgroundColor: status === 'complete' ? 'var(--accent-secondary-light)' : 'var(--workspace-secondary)',
        color: status === 'complete' ? 'var(--accent-secondary)' : 'var(--text-tertiary)',
        border: `1px solid ${status === 'complete' ? 'var(--accent-secondary)' : 'var(--border-secondary)'}`,
        borderLeftWidth: '3px',
        borderLeftColor: status === 'complete' ? 'var(--accent-secondary)' : 'var(--border-secondary)'
      }}
    >
      <span className="material-symbols-outlined text-sm">
        {status === 'complete' ? 'check_circle' : 'radio_button_unchecked'}
      </span>
      <span>{label}</span>
    </div>
  )
}
