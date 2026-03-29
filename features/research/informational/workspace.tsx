/**
 * Informational Research Workspace - HubSpot Enterprise Style
 * 
 * 정보성 글쓰기 리서치 워크스페이스
 * 4개 서브 탭: 주제 설정, 소스 관리, 핵심 포인트, 아웃라인
 */

'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { TopicSetupTab } from './components/topic-setup-tab'
import { SourceManagerTab } from './components/source-manager-tab'
import { KeyPointsTab } from './components/key-points-tab'
import { OutlineTab } from './components/outline-tab'

interface InformationalResearchWorkspaceProps {
  projectId: string
  readiness: {
    hasTopic: boolean
    sourceCount: number
    hasOutline: boolean
    isComplete: boolean
  }
}

type TabId = 'topic' | 'sources' | 'points' | 'outline'

const TABS: { id: TabId; label: string; icon: string; description: string }[] = [
  { 
    id: 'topic', 
    label: '주제 설정', 
    icon: 'lightbulb',
    description: '키워드 분석 및 독자 페르소나' 
  },
  { 
    id: 'sources', 
    label: '소스 관리', 
    icon: 'folder_open',
    description: '참고 자료 등록 및 분석' 
  },
  { 
    id: 'points', 
    label: '핵심 포인트', 
    icon: 'star',
    description: '소스에서 추출한 핵심 정보' 
  },
  { 
    id: 'outline', 
    label: '아웃라인', 
    icon: 'format_list_numbered',
    description: '글 구조 및 섹션별 계획' 
  },
]

export function InformationalResearchWorkspace({ projectId, readiness }: InformationalResearchWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabId>('topic')
  
  const project = useProjectStore((state) => state.getProject(projectId))
  const meta = project?.informationalMeta
  const mainKeyword = meta?.mainKeyword || ''
  const subKeywords = meta?.subKeywords || []

  // 탭 상태 계산
  const getTabStatus = (tabId: TabId): 'complete' | 'active' | 'pending' => {
    switch (tabId) {
      case 'topic':
        return readiness.hasTopic ? 'complete' : 'active'
      case 'sources':
        if (readiness.sourceCount > 0) return 'complete'
        return readiness.hasTopic ? 'active' : 'pending'
      case 'points':
        return readiness.sourceCount > 0 ? 'active' : 'pending'
      case 'outline':
        if (readiness.hasOutline) return 'complete'
        return readiness.sourceCount > 0 ? 'active' : 'pending'
      default:
        return 'pending'
    }
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--workspace)' }}>
      {/* Tab Navigation - Compact */}
      <div className="border-b px-6" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--workspace-secondary)' }}>
        <div className="flex gap-1">
          {TABS.map((tab, index) => {
            const status = getTabStatus(tab.id)
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium transition-all relative -mb-px border border-b-0 rounded-t-md"
                style={{
                  backgroundColor: isActive ? 'var(--workspace)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : status === 'pending' ? 'var(--text-muted)' : 'var(--text-secondary)',
                  borderColor: isActive ? 'var(--border-primary)' : 'transparent',
                  borderBottomColor: isActive ? 'var(--workspace)' : 'transparent',
                  cursor: status === 'pending' ? 'not-allowed' : 'pointer',
                  opacity: status === 'pending' ? 0.6 : 1,
                }}
                disabled={status === 'pending'}
              >
                <span className="material-symbols-outlined text-sm">
                  {status === 'complete' ? 'check_circle' : tab.icon}
                </span>
                <span>{tab.label}</span>
                {status !== 'complete' && (
                  <span 
                    className="ml-1 w-4 h-4 flex items-center justify-center rounded-full text-[10px]"
                    style={{ 
                      backgroundColor: isActive ? 'var(--accent-interactive-light)' : 'var(--workspace-secondary)',
                      color: isActive ? 'var(--accent-interactive)' : 'var(--text-tertiary)'
                    }}
                  >
                    {index + 1}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'topic' && <TopicSetupTab projectId={projectId} />}
          {activeTab === 'sources' && (
            <SourceManagerTab 
              projectId={projectId} 
              mainKeyword={mainKeyword}
              subKeywords={subKeywords}
            />
          )}
          {activeTab === 'points' && <KeyPointsTab projectId={projectId} />}
          {activeTab === 'outline' && <OutlineTab projectId={projectId} />}
        </div>
      </div>
    </div>
  )
}
