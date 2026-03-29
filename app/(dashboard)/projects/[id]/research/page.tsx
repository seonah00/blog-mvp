'use client'

import { useParams, useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { RestaurantResearchWorkspace } from '@/features/research/restaurant/workspace'
import { InformationalResearchWorkspace } from '@/features/research/informational/workspace'
import { ResearchHeader } from './components/research-header'

export default function ResearchPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const hasHydrated = useProjectStore((state) => state.hasHydrated)
  const project = useProjectStore((state) => state.getProject(projectId))

  // Readiness data for header
  const selectedPlace = useProjectStore((state) => 
    project?.type === 'restaurant' ? state.getSelectedPlace(projectId) : null
  )
  const reviews = useProjectStore((state) => 
    project?.type === 'restaurant' ? state.getReviewInputs(projectId) : []
  )
  const digest = useProjectStore((state) => 
    project?.type === 'restaurant' ? state.getReviewDigest(projectId) : undefined
  )
  
  const sources = useProjectStore((state) => 
    project?.type === 'informational' ? state.getSources(projectId) : []
  )
  const outline = useProjectStore((state) => 
    project?.type === 'informational' ? state.getOutline(projectId) : undefined
  )

  if (!hasHydrated) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          <span className="text-sm">프로젝트를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="panel max-w-md mx-auto">
          <div className="panel-body text-center py-8">
            <span className="material-symbols-outlined text-4xl mb-3" style={{ color: 'var(--text-muted)' }}>folder_off</span>
            <h1 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>프로젝트를 찾을 수 없습니다</h1>
            <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
              먼저 프로젝트를 생성한 뒤 다시 접근해 주세요.
            </p>
            <button
              onClick={() => router.push('/projects/new')}
              className="btn-primary"
            >
              새 프로젝트 만들기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Calculate readiness
  const restaurantReadiness = {
    hasPlace: !!selectedPlace,
    reviewCount: reviews.length,
    hasDigest: !!digest,
    isComplete: !!selectedPlace && reviews.length > 0 && !!digest,
  }

  const informationalReadiness = {
    hasTopic: !!project.informationalMeta?.mainKeyword,
    sourceCount: sources.length,
    hasOutline: !!outline,
    isComplete: !!project.informationalMeta?.mainKeyword && sources.length > 0 && !!outline,
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--workspace)' }}>
      {/* Header with Readiness Summary */}
      <ResearchHeader
        project={project}
        restaurantReadiness={project.type === 'restaurant' ? restaurantReadiness : null}
        informationalReadiness={project.type === 'informational' ? informationalReadiness : null}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {project.type === 'restaurant' ? (
          <RestaurantResearchWorkspace 
            projectId={projectId} 
            readiness={restaurantReadiness}
          />
        ) : (
          <InformationalResearchWorkspace 
            projectId={projectId}
            readiness={informationalReadiness}
          />
        )}
      </div>
    </div>
  )
}
