/**
 * Deep Research Panel with Question Expansion
 * 
 * Perplexity로 정보를 찾고 → 궁금한 질문 추출 → 추가 리서치 → 통합
 */

'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/project-store'
import type { SourceDocument } from '@/types'
import { 
  performDeepResearchWithExpansion,
  expandSpecificQuestion,
  type ResearchQuestion,
  type ExpandedResearchResult,
} from '@/app/actions/perplexity-deep-research'

interface DeepResearchPanelProps {
  projectId: string
  mainKeyword: string
  subKeywords?: string[]
}

export function DeepResearchPanel({ 
  projectId, 
  mainKeyword,
  subKeywords = [],
}: DeepResearchPanelProps) {
  const [topic, setTopic] = useState(mainKeyword)
  const [isResearching, setIsResearching] = useState(false)
  const [result, setResult] = useState<ExpandedResearchResult | null>(null)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [expandedResults, setExpandedResults] = useState<SourceDocument[]>([])
  const [isExpanding, setIsExpanding] = useState(false)

  const addSource = useProjectStore((state) => state.addSource)
  const setSourceDocument = useProjectStore((state) => state.setSourceDocument)

  // 딥 리서치 실행
  const handleDeepResearch = async () => {
    if (!topic.trim()) return

    setIsResearching(true)
    setResult(null)
    setExpandedResults([])

    try {
      const researchResult = await performDeepResearchWithExpansion({
        topic,
        projectId,
        mainKeyword,
        subKeywords,
        maxDepth: 2,
      })

      if (researchResult.success) {
        setResult(researchResult)
      } else {
        alert(researchResult.error || '리서치 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Deep research error:', error)
      alert('리서치 중 오류가 발생했습니다.')
    } finally {
      setIsResearching(false)
    }
  }

  // 특정 질문에 대해 추가 리서치
  const handleExpandQuestion = async (question: string) => {
    setIsExpanding(true)

    try {
      const expandedDoc = await expandSpecificQuestion(
        question,
        projectId,
        result?.topic
      )

      if (expandedDoc) {
        setExpandedResults(prev => [...prev, expandedDoc])
        setSelectedQuestions(prev => [...prev, question])
      }
    } catch (error) {
      console.error('Expand error:', error)
    } finally {
      setIsExpanding(false)
    }
  }

  // 소스로 추가
  const handleAddToSources = (doc: SourceDocument, isMain = false) => {
    addSource(projectId, {
      url: doc.url || 'https://perplexity.ai',
      title: isMain ? `${doc.title} (메인)` : doc.title,
      type: doc.type || 'article',
      note: isMain 
        ? `딥 리서치 메인 보고서: ${topic}`
        : `확장 질문: ${doc.metadata?.researchQuestion || ''}`,
    })

    setSourceDocument(projectId, doc)

    // UI에서 제거
    if (isMain && result) {
      setResult({ ...result, mainSource: { ...doc, title: doc.title + ' (추가됨)' } })
    } else {
      setExpandedResults(prev => prev.filter(d => d.id !== doc.id))
    }
  }

  // 전체 추가
  const handleAddAll = () => {
    if (!result) return

    // 메인 소스 추가
    handleAddToSources(result.mainSource, true)

    // 확장 소스들 추가
    result.expandedSources.forEach(doc => {
      handleAddToSources(doc, false)
    })

    // 추가 확장된 것들도 추가
    expandedResults.forEach(doc => {
      handleAddToSources(doc, false)
    })

    alert('모든 소스가 추가되었습니다!')
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🧠</span>
        <div>
          <h3 className="font-semibold text-gray-900">딥 리서치 (Deep Research)</h3>
          <p className="text-sm text-gray-500">
            Perplexity로 정보를 찾고 → 궁금한 질문 추출 → 추가 리서치 → 통합
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            리서치 주제
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 2024년 생성형 AI 트렌드"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleDeepResearch()}
          />
        </div>

        <button
          onClick={handleDeepResearch}
          disabled={!topic.trim() || isResearching}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isResearching ? (
            <>
              <span className="animate-spin text-xl">⏳</span>
              <div className="text-left">
                <div>딥 리서치 진행 중...</div>
                <div className="text-xs opacity-80">정보 수집 → 질문 생성 → 추가 분석</div>
              </div>
            </>
          ) : (
            <>
              <span className="text-xl">🔍</span>
              딥 리서치 시작
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result?.success && (
        <div className="space-y-6 border-t pt-6">
          {/* Main Source */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>📊</span>
                종합 리서치 보고서
              </h4>
              <button
                onClick={() => handleAddToSources(result.mainSource, true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
              >
                소스에 추가
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-2">{result.mainSource.summary}</p>
            <div className="flex flex-wrap gap-1">
              {result.mainSource.keyPoints.slice(0, 5).map((point, i) => (
                <span 
                  key={i}
                  className="text-xs bg-white/70 text-gray-700 px-2 py-1 rounded"
                >
                  {point.slice(0, 40)}...
                </span>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              출처: {result.mainSource.citations?.length || 0}개 | 
              확장 분석: {result.expandedSources.length}개
            </div>
          </div>

          {/* Generated Questions */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <span>💡</span>
              생성된 궁금한 질문들 ({result.questions.length}개)
            </h4>
            <div className="space-y-2">
              {result.questions.map((q, i) => (
                <QuestionItem
                  key={i}
                  question={q}
                  isSelected={selectedQuestions.includes(q.question)}
                  onExpand={() => handleExpandQuestion(q.question)}
                  isExpanding={isExpanding}
                />
              ))}
            </div>
          </div>

          {/* Expanded Results */}
          {expandedResults.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span>📚</span>
                추가 확장된 분석 ({expandedResults.length}개)
              </h4>
              <div className="space-y-3">
                {expandedResults.map((doc) => (
                  <ExpandedSourceCard
                    key={doc.id}
                    doc={doc}
                    onAdd={() => handleAddToSources(doc, false)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add All Button */}
          <button
            onClick={handleAddAll}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <span>✨</span>
            전체 소스로 추가하기
          </button>
        </div>
      )}
    </div>
  )
}

// 질문 아이템 컴포넌트
function QuestionItem({ 
  question, 
  isSelected,
  onExpand,
  isExpanding,
}: { 
  question: ResearchQuestion
  isSelected: boolean
  onExpand: () => void
  isExpanding: boolean
}) {
  const categoryColors: Record<ResearchQuestion['category'], string> = {
    basic: 'bg-green-100 text-green-700',
    deep: 'bg-blue-100 text-blue-700',
    practical: 'bg-orange-100 text-orange-700',
    trend: 'bg-purple-100 text-purple-700',
  }

  const categoryLabels: Record<ResearchQuestion['category'], string> = {
    basic: '기본',
    deep: '심층',
    practical: '실용',
    trend: '트렌드',
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      isSelected 
        ? 'bg-green-50 border-green-300' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[question.category]}`}>
            {categoryLabels[question.category]}
          </span>
          <span className="text-xs text-gray-400">
            우선순위: {question.priority}/10
          </span>
        </div>
        <p className="text-sm text-gray-800">{question.question}</p>
      </div>
      {!isSelected ? (
        <button
          onClick={onExpand}
          disabled={isExpanding}
          className="ml-4 px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
        >
          {isExpanding ? '⏳' : '🔍'} 분석
        </button>
      ) : (
        <span className="ml-4 text-green-600 text-sm">✓ 완료</span>
      )}
    </div>
  )
}

// 확장 소스 카드
function ExpandedSourceCard({ 
  doc, 
  onAdd,
}: { 
  doc: SourceDocument
  onAdd: () => void
}) {
  return (
    <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-gray-900 mb-1">{doc.title}</h5>
          <p className="text-sm text-gray-600 line-clamp-2">{doc.summary}</p>
          {doc.keyPoints.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {doc.keyPoints.slice(0, 3).map((point, i) => (
                <span 
                  key={i}
                  className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                >
                  {point.slice(0, 30)}...
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onAdd}
          className="ml-4 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
        >
          추가
        </button>
      </div>
    </div>
  )
}
