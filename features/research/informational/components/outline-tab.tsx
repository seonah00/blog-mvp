/**
 * Outline Tab
 * 
 * 아웃라인 생성 및 편집 탭
 */

'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { EmptyState } from '@/components/ui/empty-state'
import { generateOutline } from '@/lib/ai/informational-research'
import type { InformationalOutline } from '@/types'

interface OutlineTabProps {
  projectId: string
}

export function OutlineTab({ projectId }: OutlineTabProps) {
  const outline = useProjectStore((state) => state.getOutline(projectId))
  const setOutline = useProjectStore((state) => state.setOutline)
  const topicAnalysis = useProjectStore((state) => state.getTopicAnalysis(projectId))
  const keyPoints = useProjectStore((state) => state.getKeyPoints(projectId))

  const [isGenerating, setIsGenerating] = useState(false)
  const [targetWordCount, setTargetWordCount] = useState(2000)

  const handleGenerate = async () => {
    if (!topicAnalysis) return
    
    setIsGenerating(true)
    
    // TODO: 실제 AI 호출
    // const newOutline = await generateOutline(topicAnalysis, keyPoints, targetWordCount)
    
    // 임시 결과
    const sections = Math.ceil(targetWordCount / 500)
    const newOutline: InformationalOutline = {
      title: `${topicAnalysis.mainKeyword} 완벽 가이드`,
      targetAudience: topicAnalysis.readerPersonas.map(p => p.type).join(', '),
      sections: Array.from({ length: sections }, (_, i) => ({
        id: `sec-${i}`,
        heading: `${i === 0 ? '도입' : i === sections - 1 ? '결론' : `본론 ${i}`}`,
        keyPoints: keyPoints.slice(i * 2, (i + 1) * 2).map(kp => kp.content),
        sourceIds: [],
        estimatedWordCount: Math.floor(targetWordCount / sections),
      })),
      suggestedFaqs: [
        { question: '자주 묻는 질문 1', answer: '답변 1' },
        { question: '자주 묻는 질문 2', answer: '답변 2' },
      ],
      generatedAt: new Date().toISOString(),
    }
    
    setOutline(projectId, newOutline)
    setIsGenerating(false)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between bg-white rounded-xl border p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">목표 분량</label>
            <select
              value={targetWordCount}
              onChange={(e) => setTargetWordCount(Number(e.target.value))}
              className="mt-1 px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value={1500}>약 1,500자</option>
              <option value={2000}>약 2,000자</option>
              <option value={3000}>약 3,000자</option>
              <option value={5000}>약 5,000자</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            예상 섹션 수: {Math.ceil(targetWordCount / 500)}개
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={!topicAnalysis || isGenerating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isGenerating ? '생성 중...' : '아웃라인 생성'}
        </button>
      </div>

      {!outline ? (
        <EmptyState
          icon="format_list_numbered"
          title="아직 아웃라인이 없습니다"
          description={
            !topicAnalysis 
              ? '먼저 주제 설정 탭에서 분석을 완료한 후 아웃라인을 생성하세요.' 
              : '목표 분량을 선택하고 아웃라인 생성 버튼을 클릭하세요.'
          }
          tone="info"
        />
      ) : (
        <div className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-xl border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
            <input
              type="text"
              value={outline.title}
              onChange={(e) => setOutline(projectId, { ...outline, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
            />
          </div>

          {/* Sections */}
          <div className="bg-white rounded-xl border p-6">
            <h4 className="font-medium text-gray-900 mb-4">섹션 구성</h4>
            <div className="space-y-4">
              {outline.sections.map((section, index) => (
                <div key={section.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={section.heading}
                      onChange={(e) => {
                        const updated = outline.sections.map((s, i) => 
                          i === index ? { ...s, heading: e.target.value } : s
                        )
                        setOutline(projectId, { ...outline, sections: updated })
                      }}
                      className="flex-1 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-400">
                      {section.estimatedWordCount}자
                    </span>
                  </div>
                  
                  {section.keyPoints.length > 0 && (
                    <div className="pl-11">
                      <p className="text-sm text-gray-500 mb-2">포함될 핵심 포인트:</p>
                      <ul className="space-y-1">
                        {section.keyPoints.map((kp, i) => (
                          <li key={i} className="text-sm text-gray-700 pl-4 relative">
                            <span className="absolute left-0 text-blue-400">•</span>
                            {kp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Suggested FAQs */}
          {outline.suggestedFaqs && outline.suggestedFaqs.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h4 className="font-medium text-gray-900 mb-4">추천 FAQ</h4>
              <div className="space-y-3">
                {outline.suggestedFaqs.map((faq, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-700">Q. {faq.question}</p>
                    <p className="text-sm text-gray-600 mt-1">A. {faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
