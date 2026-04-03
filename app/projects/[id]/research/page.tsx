'use client'

import { useMemo } from 'react'
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

  // 배열/객체 자체가 아닌 primitive 값만 구독
  const hasPlace = useProjectStore((state) => !!state.getSelectedPlace(projectId))
  const reviewCount = useProjectStore((state) => state.getReviewInputs(projectId).length)
  const hasDigest = useProjectStore((state) => !!state.getReviewDigest(projectId))

  const sourceCount = useProjectStore((state) => state.getSources(projectId).length)
  const hasOutline = useProjectStore((state) => !!state.getOutline(projectId))
  const hasTopic = useProjectStore(
    (state) => !!state.getProject(projectId)?.informationalMeta?.mainKeyword
  )

  const restaurantReadiness = useMemo(
    () => ({
      hasPlace,
      reviewCount,
      hasDigest,
      isComplete: hasPlace && reviewCount > 0 && hasDigest,
    }),
    [hasPlace, reviewCount, hasDigest]
  )

  const informationalReadiness = useMemo(
    () => ({
      hasTopic,
      sourceCount,
      hasOutline,
      isComplete: hasTopic && sourceCount > 0 && hasOutline,
    }),
    [hasTopic, sourceCount, hasOutline]
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
            <span
              className="material-symbols-outlined text-4xl mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              folder_off
            </span>
            <h1 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              프로젝트를 찾을 수 없습니다
            </h1>
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

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--workspace)' }}>
      <ResearchHeader
        project={project}
        restaurantReadiness={project.type === 'restaurant' ? restaurantReadiness : null}
        informationalReadiness={project.type === 'informational' ? informationalReadiness : null}
      />

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
