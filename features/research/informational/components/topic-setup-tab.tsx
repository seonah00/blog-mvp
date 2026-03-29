/**
 * Topic Setup Tab - HubSpot Enterprise Style
 * 
 * 주제 설정 및 분석 탭
 */

'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { FieldLabel, HelperText, InlineHint } from '@/components/ui'

interface TopicSetupTabProps {
  projectId: string
}

export function TopicSetupTab({ projectId }: TopicSetupTabProps) {
  const project = useProjectStore((state) => state.getProject(projectId))
  const updateProject = useProjectStore((state) => state.updateProject)
  const setTopicAnalysis = useProjectStore((state) => state.setTopicAnalysis)
  const topicAnalysis = useProjectStore((state) => state.getTopicAnalysis(projectId))

  const [mainKeyword, setMainKeyword] = useState(project?.informationalMeta?.mainKeyword || '')
  const [subKeywords, setSubKeywords] = useState(project?.informationalMeta?.subKeywords?.join(', ') || '')
  const [searchIntent, setSearchIntent] = useState(project?.informationalMeta?.searchIntent || '')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!mainKeyword.trim()) return
    
    setIsAnalyzing(true)
    
    // 키워드 저장
    updateProject(projectId, {
      informationalMeta: {
        mainKeyword: mainKeyword.trim(),
        subKeywords: subKeywords.split(',').map((s: string) => s.trim()).filter(Boolean),
        searchIntent: searchIntent.trim(),
        audienceLevel: 'intermediate',
        goal: '',
      }
    })

    // 임시 분석 결과
    setTopicAnalysis(projectId, {
      mainKeyword: mainKeyword.trim(),
      topicScope: `${mainKeyword.trim()}에 대한 종합 가이드`,
      readerPersonas: [
        { type: 'beginner', needs: '기본 개념 이해' },
        { type: 'practitioner', needs: '실전 적용법' },
      ],
      contentGaps: ['경쟁 콘텐츠에서 빠진 정보 1', '빠진 정보 2'],
      differentiation: '실제 사례 중심의 실용적 접근',
      suggestedStructure: [
        { section: '도입', focus: '문제 제기' },
        { section: '본론', focus: '핵심 내용' },
        { section: '결론', focus: '요약 및 다음 단계' },
      ],
      analyzedAt: new Date().toISOString(),
    })
    
    setIsAnalyzing(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Input Form */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>주제 설정</h3>
        </div>
        
        <div className="panel-body space-y-4">
          <FieldLabel label="주요 키워드" required>
            <input
              type="text"
              value={mainKeyword}
              onChange={(e) => setMainKeyword(e.target.value)}
              placeholder="예: 노션으로 블로그 운영하기"
              className="input w-full text-sm"
            />
          </FieldLabel>

          <FieldLabel 
            label="보조 키워드"
            action={<InlineHint tone="neutral">선택 사항</InlineHint>}
          >
            <input
              type="text"
              value={subKeywords}
              onChange={(e) => setSubKeywords(e.target.value)}
              placeholder="예: 노션 템플릿, 콘텐츠 관리"
              className="input w-full text-sm"
            />
            <HelperText tone="subtle" compact>
              쉼표로 구분해서 여러 키워드를 입력할 수 있어요.
            </HelperText>
          </FieldLabel>

          <FieldLabel 
            label="검색 의도"
            action={<InlineHint tone="neutral">선택 사항</InlineHint>}
          >
            <textarea
              value={searchIntent}
              onChange={(e) => setSearchIntent(e.target.value)}
              placeholder="사용자가 이 키워드를 검색할 때 무엇을 찾고 있을까요?"
              rows={3}
              className="input w-full text-sm resize-none"
            />
            <HelperText tone="info" compact icon="lightbulb">
              검색 의도를 구체적으로 적을수록 독자 중심의 콘텐츠가 만들어져요.
            </HelperText>
          </FieldLabel>

          <button
            onClick={handleAnalyze}
            disabled={!mainKeyword.trim() || isAnalyzing}
            className="btn-primary w-full text-sm"
          >
            {isAnalyzing ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                분석 중...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">analytics</span>
                주제 분석하기
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Result */}
      <div>
        {topicAnalysis ? (
          <div className="space-y-4">
            {/* Topic Scope */}
            <div className="panel">
              <div className="panel-header">
                <h4 className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>주제 범위</h4>
              </div>
              <div className="panel-body">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{topicAnalysis.topicScope}</p>
              </div>
            </div>

            {/* Reader Personas */}
            <div className="panel">
              <div className="panel-header">
                <h4 className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>독자 페르소나</h4>
              </div>
              <div className="panel-body space-y-2">
                {topicAnalysis.readerPersonas.map((persona, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span 
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ backgroundColor: 'var(--accent-interactive-light)', color: 'var(--accent-interactive)' }}
                    >
                      {persona.type}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{persona.needs}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Gaps */}
            <div className="panel">
              <div className="panel-header">
                <h4 className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>차별화 포인트</h4>
              </div>
              <div className="panel-body space-y-2">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{topicAnalysis.differentiation}</p>
                <div className="pt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                  <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>경쟁 콘텐츠에서 빠진 각도:</p>
                  {topicAnalysis.contentGaps.map((gap, i) => (
                    <p key={i} className="text-xs pl-2" style={{ color: 'var(--text-tertiary)' }}>• {gap}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Suggested Structure */}
            <div className="panel">
              <div className="panel-header">
                <h4 className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>추천 구조</h4>
              </div>
              <div className="panel-body space-y-2">
                {topicAnalysis.suggestedStructure.map((section, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span 
                      className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-medium"
                      style={{ backgroundColor: 'var(--accent-interactive-light)', color: 'var(--accent-interactive)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{section.section}</span>
                    <span style={{ color: 'var(--text-muted)' }}>|</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>{section.focus}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="text-center py-12 rounded-md border-2 border-dashed"
            style={{ backgroundColor: 'var(--workspace-secondary)', borderColor: 'var(--border-secondary)' }}
          >
            <span className="material-symbols-outlined text-3xl mb-2" style={{ color: 'var(--text-muted)' }}>analytics</span>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>주제 분석 결과가 여기에 표시됩니다.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>주요 키워드를 입력하고 분석하기를 클릭하세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
