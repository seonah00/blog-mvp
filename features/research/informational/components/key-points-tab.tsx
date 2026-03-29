/**
 * Key Points Tab
 * 
 * 추출된 핵심 포인트 관리 탭
 */

'use client'

import { useProjectStore } from '@/stores/project-store'
import { EmptyState } from '@/components/ui/empty-state'
import { extractKeyPoints } from '@/lib/ai/informational-research'
import { useState } from 'react'
import type { KeyPointCategory } from '@/types'

interface KeyPointsTabProps {
  projectId: string
}

const CATEGORY_COLORS: Record<KeyPointCategory, string> = {
  fact: 'bg-blue-100 text-blue-700',
  opinion: 'bg-yellow-100 text-yellow-700',
  statistic: 'bg-green-100 text-green-700',
  example: 'bg-purple-100 text-purple-700',
}

const CATEGORY_LABELS: Record<KeyPointCategory, string> = {
  fact: '사실',
  opinion: '의견',
  statistic: '통계',
  example: '예시',
}

export function KeyPointsTab({ projectId }: KeyPointsTabProps) {
  const keyPoints = useProjectStore((state) => state.getKeyPoints(projectId))
  const setKeyPoints = useProjectStore((state) => state.setKeyPoints)
  const sourceDocs = useProjectStore((state) => state.getSourceDocuments(projectId))
  const sources = useProjectStore((state) => state.getSources(projectId))

  const [isExtracting, setIsExtracting] = useState(false)

  const handleExtract = async () => {
    if (sourceDocs.length === 0) return
    
    setIsExtracting(true)
    
    // TODO: 실제 AI 호출
    // const extracted = await extractKeyPoints(sourceDocs, '주제 키워드')
    
    // 임시 결과
    const extracted = sourceDocs.flatMap((doc, i) => 
      doc.keyPoints.slice(0, 2).map((point, j) => ({
        id: `kp-${Date.now()}-${i}-${j}`,
        content: point,
        sourceIds: [doc.sourceId],
        category: (['fact', 'opinion', 'example'] as const)[j % 3],
        extractedAt: new Date().toISOString(),
      }))
    )
    
    setKeyPoints(projectId, [...keyPoints, ...extracted])
    setIsExtracting(false)
  }

  const facts = keyPoints.filter(kp => kp.category === 'fact')
  const opinions = keyPoints.filter(kp => kp.category === 'opinion')
  const statistics = keyPoints.filter(kp => kp.category === 'statistic')
  const examples = keyPoints.filter(kp => kp.category === 'example')

  const getSourceUrl = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId)
    return source?.url || sourceId
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">핵심 포인트</h3>
          <p className="text-sm text-gray-500">소스에서 추출한 핵심 정보</p>
        </div>
        <button
          onClick={handleExtract}
          disabled={sourceDocs.length === 0 || isExtracting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isExtracting ? '추출 중...' : '소스에서 추출'}
        </button>
      </div>

      {keyPoints.length === 0 ? (
        <EmptyState
          icon="star"
          title="추출된 핵심 포인트가 없습니다"
          description={
            sourceDocs.length === 0 
              ? '먼저 소스 관리 탭에서 참고 자료를 추가해주세요.' 
              : '"소스에서 추출" 버튼을 클릭하여 핵심 정보를 추출하세요.'
          }
          tone="info"
        />
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* By Category */}
          {[
            { title: '사실 (Facts)', items: facts, icon: '📋' },
            { title: '의견 (Opinions)', items: opinions, icon: '💭' },
            { title: '통계 (Statistics)', items: statistics, icon: '📊' },
            { title: '예시 (Examples)', items: examples, icon: '💡' },
          ].map(({ title, items, icon }) => (
            items.length > 0 && (
              <div key={title} className="bg-white rounded-xl border p-6">
                <h4 className="font-medium text-gray-700 mb-4">
                  {icon} {title} ({items.length})
                </h4>
                <div className="space-y-3">
                  {items.map((kp) => (
                    <div key={kp.id} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{kp.content}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded ${CATEGORY_COLORS[kp.category]}`}>
                          {CATEGORY_LABELS[kp.category]}
                        </span>
                        {kp.sourceIds.map((sid) => (
                          <a
                            key={sid}
                            href={getSourceUrl(sid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            [출처]
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
