/**
 * Informational Draft Helper - HubSpot Enterprise Style
 * 
 * 정보성 글쓰기를 위한 사이드바 헬퍼 패널
 * - 핵심 키워드
 * - 소스 요약
 * - 개요 구조
 * - FAQ 후보
 * - 스타일별 재생성 버튼
 */

'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/project-store'
import type { InformationalOutline, SourceDocument, KeyPoint } from '@/types'

interface InformationalDraftHelperProps {
  projectId: string
}

// Mock: 키포인트 생성
function useMockKeyPoints(projectId: string): KeyPoint[] {
  const sources = useProjectStore((state) => state.getSources(projectId))
  
  if (sources.length === 0) return []
  
  return [
    {
      id: 'kp-1',
      content: '노션 데이터베이스로 블로그 콘텐츠를 체계적으로 관리할 수 있다',
      sourceIds: sources.slice(0, 1).map(s => s.id),
      category: 'fact',
      extractedAt: new Date().toISOString(),
    },
    {
      id: 'kp-2',
      content: '캘린더 뷰로 발행 일정을 시각적으로 파악하는 것이 효율적이다',
      sourceIds: sources.slice(0, 1).map(s => s.id),
      category: 'opinion',
      extractedAt: new Date().toISOString(),
    },
    {
      id: 'kp-3',
      content: '2024년 기준 73%의 콘텐츠 크리에이터가 노션을 워크플로우 도구로 사용 중이다',
      sourceIds: sources.slice(0, 1).map(s => s.id),
      category: 'statistic',
      extractedAt: new Date().toISOString(),
    },
  ]
}

// Mock: 개요 조회
function useMockOutline(projectId: string): InformationalOutline | undefined {
  const topicAnalysis = useProjectStore((state) => state.getTopicAnalysis(projectId))
  
  if (!topicAnalysis) return undefined
  
  return {
    title: `${topicAnalysis.mainKeyword} 완벽 가이드`,
    targetAudience: '초보자',
    sections: [
      {
        id: 'sec-1',
        heading: '도입: 왜 노션으로 블로그를 관리해야 하는가?',
        keyPoints: ['기존 블로그 운영의 문제점', '노션의 장점'],
        sourceIds: [],
        estimatedWordCount: 300,
      },
      {
        id: 'sec-2',
        heading: '노션 데이터베이스 설정하기',
        keyPoints: ['데이터베이스 생성', '속성 설정', '뷰 구성'],
        sourceIds: [],
        estimatedWordCount: 500,
      },
      {
        id: 'sec-3',
        heading: '콘텐츠 파이프라인 구축',
        keyPoints: ['아이디어 수집', '초안 작성', '발행 관리'],
        sourceIds: [],
        estimatedWordCount: 400,
      },
    ],
    suggestedFaqs: [
      { question: '노션 묶인 플랜이 필요한가요?', answer: '개인용 묶인 플랜으로도 충분합니다.' },
      { question: '워드프레스와 연동할 수 있나요?', answer: 'API를 통해 자동 발행이 가능합니다.' },
    ],
    generatedAt: new Date().toISOString(),
  }
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

// Keywords Section
function KeywordsSection({ mainKeyword, subKeywords }: { mainKeyword: string; subKeywords: string[] }) {
  return (
    <Section title="핵심 키워드">
      <div className="space-y-2">
        <div>
          <span className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)' }}>메인 키워드</span>
          <span className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{mainKeyword}</span>
        </div>
        {subKeywords.length > 0 && (
          <div>
            <span className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)' }}>서브 키워드</span>
            <div className="flex flex-wrap gap-1">
              {subKeywords.map((kw, i) => (
                <span 
                  key={i} 
                  className="text-xs px-2 py-1 rounded-md"
                  style={{ 
                    backgroundColor: 'var(--workspace-tertiary)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

// Source Summary Section
function SourceSummarySection({ sources }: { sources: SourceDocument[] }) {
  if (sources.length === 0) {
    return (
      <Section title="소스">
        <div className="text-center py-4">
          <span className="material-symbols-outlined text-2xl mb-2" style={{ color: 'var(--text-muted)' }}>folder_open</span>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>등록된 소스가 없습니다</p>
        </div>
      </Section>
    )
  }
  
  return (
    <Section title={`소스 (${sources.length})`}>
      <div className="space-y-2">
        {sources.slice(0, 3).map((doc) => (
          <div 
            key={doc.id} 
            className="p-2 rounded-md"
            style={{ backgroundColor: 'var(--workspace-secondary)' }}
          >
            <p className="text-xs font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>
              {doc.title || '제목 없음'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              키포인트 {doc.keyPoints.length}개
            </p>
          </div>
        ))}
        {sources.length > 3 && (
          <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
            + {sources.length - 3}개 더보기
          </p>
        )}
      </div>
    </Section>
  )
}

// Citation Section
function CitationSection({ 
  usedSourceIds, 
  sourceInputs 
}: { 
  usedSourceIds?: string[]
  sourceInputs: import('@/types').SourceInput[] 
}) {
  if (!usedSourceIds || usedSourceIds.length === 0) {
    return (
      <Section title="인용" collapsed>
        <div className="flex items-start gap-2 p-2 rounded-md" style={{ backgroundColor: 'var(--workspace-secondary)' }}>
          <span className="material-symbols-outlined text-sm" style={{ color: 'var(--text-muted)' }}>info</span>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            인용 정보가 기록되지 않았습니다
          </p>
        </div>
      </Section>
    )
  }

  const usedSources = sourceInputs.filter(s => usedSourceIds.includes(s.id))
  const unusedCount = sourceInputs.length - usedSources.length

  return (
    <Section 
      title="인용"
      action={<span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--accent-secondary-light)', color: 'var(--accent-secondary)' }}>{usedSourceIds.length}</span>}
      collapsed={usedSources.length > 3}
    >
      <div className="space-y-1.5">
        {usedSources.slice(0, 5).map((source, index) => (
          <div key={source.id} className="flex items-start gap-2 text-xs">
            <span 
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded text-[10px] font-medium"
              style={{ 
                backgroundColor: 'var(--accent-secondary-light)',
                color: 'var(--accent-secondary)'
              }}
            >
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{source.title || '제목 없음'}</p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{source.url}</p>
            </div>
          </div>
        ))}
      </div>

      {unusedCount > 0 && (
        <p className="mt-2 pt-2 text-[10px] border-t" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}>
          미사용: {unusedCount}개
        </p>
      )}
    </Section>
  )
}

// Key Points Section
function KeyPointsSection({ keyPoints }: { keyPoints: KeyPoint[] }) {
  const categoryColors: Record<KeyPoint['category'], { bg: string; text: string }> = {
    fact: { bg: 'var(--accent-interactive-light)', text: 'var(--accent-interactive)' },
    opinion: { bg: 'var(--warning-light)', text: '#946F00' },
    statistic: { bg: 'var(--accent-secondary-light)', text: 'var(--accent-secondary)' },
    example: { bg: 'var(--workspace-tertiary)', text: 'var(--text-secondary)' },
  }
  
  const categoryLabels: Record<KeyPoint['category'], string> = {
    fact: '사실',
    opinion: '의견',
    statistic: '통계',
    example: '예시',
  }

  return (
    <Section title={`추출 포인트 (${keyPoints.length})`}>
      <div className="space-y-2">
        {keyPoints.map((kp) => (
          <div 
            key={kp.id} 
            className="p-2.5 rounded-md"
            style={{ backgroundColor: 'var(--workspace-secondary)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{kp.content}</p>
            <span 
              className="inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ 
                backgroundColor: categoryColors[kp.category].bg,
                color: categoryColors[kp.category].text
              }}
            >
              {categoryLabels[kp.category]}
            </span>
          </div>
        ))}
      </div>
    </Section>
  )
}

// Outline Section
function OutlineSection({ outline }: { outline: InformationalOutline }) {
  return (
    <Section title="글 구조">
      <div className="space-y-2">
        {outline.sections.map((section, index) => (
          <div key={section.id} className="flex gap-2">
            <span 
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: 'var(--accent-interactive-light)',
                color: 'var(--accent-interactive)'
              }}
            >
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium line-clamp-2" style={{ color: 'var(--text-primary)' }}>{section.heading}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{section.estimatedWordCount}자</span>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>포인트 {section.keyPoints.length}개</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {outline.targetAudience && (
        <div className="mt-3 pt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            타겟: <span style={{ color: 'var(--text-secondary)' }}>{outline.targetAudience}</span>
          </p>
        </div>
      )}
    </Section>
  )
}

// FAQ Section
function FAQSection({ faqs }: { faqs?: { question: string; answer: string }[] }) {
  if (!faqs || faqs.length === 0) return null
  
  return (
    <Section title="추천 FAQ">
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div 
            key={i} 
            className="p-2.5 rounded-md"
            style={{ backgroundColor: 'var(--workspace-secondary)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Q. {faq.question}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>A. {faq.answer}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// Regenerate Section
function RegenerateSection({ onRegenerate }: { onRegenerate: (style: string) => void }) {
  const styles = [
    { id: 'explainer', label: '설명형', desc: '개념 중심', icon: '📖' },
    { id: 'comparison', label: '비교형', desc: '장단점 비교', icon: '⚖️' },
    { id: 'guide', label: '가이드형', desc: '단계별 안내', icon: '📋' },
    { id: 'problem-solving', label: '해결형', desc: '문제-해결', icon: '🎯' },
  ]

  return (
    <Section title="재생성">
      <div className="grid grid-cols-2 gap-2">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onRegenerate(style.id)}
            className="text-left p-2.5 rounded-md border text-xs transition-all hover:border-[var(--accent-interactive)] hover:bg-[var(--accent-interactive-light)]"
            style={{ 
              borderColor: 'var(--border-secondary)',
              backgroundColor: 'var(--workspace)'
            }}
          >
            <span className="block text-base mb-0.5">{style.icon}</span>
            <span className="font-medium block" style={{ color: 'var(--text-primary)' }}>{style.label}</span>
            <span style={{ color: 'var(--text-tertiary)' }}>{style.desc}</span>
          </button>
        ))}
      </div>
    </Section>
  )
}

// Main Component
export function InformationalDraftHelper({ projectId }: InformationalDraftHelperProps) {
  const project = useProjectStore((state) => state.getProject(projectId))
  const sources = useProjectStore((state) => state.getSourceDocuments(projectId))
  const sourceInputs = useProjectStore((state) => state.getSources(projectId))
  const draft = useProjectStore((state) => state.getDraft(projectId))
  const keyPoints = useMockKeyPoints(projectId)
  const outline = useMockOutline(projectId)
  
  const mainKeyword = project?.informationalMeta?.mainKeyword || project?.topic || '키워드'
  const subKeywords = project?.informationalMeta?.subKeywords || []

  const handleRegenerate = (style: string) => {
    console.log(`[Mock] Regenerating draft for style: ${style}`)
    window.alert(`${style} 스타일로 재생성합니다. (AI 연동 TODO)`)
  }

  return (
    <div className="py-2">
      <KeywordsSection mainKeyword={mainKeyword} subKeywords={subKeywords} />
      <SourceSummarySection sources={sources} />
      <CitationSection usedSourceIds={draft?.usedSourceIds} sourceInputs={sourceInputs} />
      
      {keyPoints.length > 0 && <KeyPointsSection keyPoints={keyPoints} />}
      
      {outline ? (
        <>
          <OutlineSection outline={outline} />
          <FAQSection faqs={outline.suggestedFaqs} />
        </>
      ) : (
        <Section title="아웃라인">
          <div className="text-center py-4">
            <span className="material-symbols-outlined text-2xl mb-2" style={{ color: 'var(--text-muted)' }}>format_list_numbered</span>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>아직 아웃라인이 없습니다</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>리서치 탭에서 생성해주세요</p>
          </div>
        </Section>
      )}
      
      <RegenerateSection onRegenerate={handleRegenerate} />
    </div>
  )
}
