/**
 * Source Manager Tab
 * 
 * 소스 문서 등록 및 관리 탭
 * @policy: 스크래핑 금지 - 사용자가 직접 콘텐츠를 입력
 * @feature: Perplexity 자동 리서치 지원
 */

'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { EmptyState, FieldLabel, HelperText, InlineHint } from '@/components/ui'
import type { SourceInput, SourceType, SourceDocument } from '@/types'
import { 
  researchWithPerplexityAction, 
  deepResearchWithPerplexityAction,
  generateRelatedQuestionsAction,
} from '@/app/actions/perplexity-research'
import { DeepResearchPanel } from './deep-research-panel'

interface SourceManagerTabProps {
  projectId: string
}

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: 'article', label: '아티클' },
  { value: 'doc', label: '문서' },
  { value: 'video', label: '동영상' },
  { value: 'memo', label: '메모' },
  { value: 'paper', label: '논문' },
]

interface ExtendedSourceManagerTabProps extends SourceManagerTabProps {
  mainKeyword?: string
  subKeywords?: string[]
}

export function SourceManagerTab({ 
  projectId, 
  mainKeyword = '',
  subKeywords = [],
}: ExtendedSourceManagerTabProps) {
  const sources = useProjectStore((state) => state.getSources(projectId))
  const sourceDocs = useProjectStore((state) => state.getSourceDocuments(projectId))
  const addSource = useProjectStore((state) => state.addSource)
  const setSourceDocument = useProjectStore((state) => state.setSourceDocument)
  const removeSource = useProjectStore((state) => state.removeSource)

  // Manual input states
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<SourceType>('article')
  const [note, setNote] = useState('')
  const [content, setContent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Perplexity research states
  const [researchQuery, setResearchQuery] = useState('')
  const [isResearching, setIsResearching] = useState(false)
  const [researchResults, setResearchResults] = useState<SourceDocument[]>([])
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'manual' | 'perplexity' | 'deep-research'>('manual')

  const handleAddSource = async () => {
    if (!url || !content) return

    setIsProcessing(true)

    addSource(projectId, {
      url,
      title: title || undefined,
      type,
      note: note || undefined,
    })

    setUrl('')
    setTitle('')
    setNote('')
    setContent('')
    setIsProcessing(false)
  }

  // Perplexity로 리서치 수행
  const handlePerplexityResearch = async () => {
    if (!researchQuery.trim()) return

    setIsResearching(true)
    setResearchResults([])

    try {
      // 관련 질문 생성
      const questionsResult = await generateRelatedQuestionsAction(researchQuery, 3)
      if (questionsResult.success) {
        setRelatedQuestions(questionsResult.questions)
      }

      // Perplexity로 리서치
      const result = await researchWithPerplexityAction({
        query: researchQuery,
        projectId,
        maxResults: 5,
        sourceType: 'article',
      })

      if (result.success) {
        setResearchResults(result.sources)
      } else {
        alert(result.error || '리서치 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Research error:', error)
      alert('리서치 중 오류가 발생했습니다.')
    } finally {
      setIsResearching(false)
    }
  }

  // Perplexity 결과를 소스로 추가
  const handleAddPerplexitySource = (doc: SourceDocument) => {
    // SourceInput으로 변환하여 추가
    addSource(projectId, {
      url: doc.url || 'https://perplexity.ai',
      title: doc.title,
      type: doc.type || 'article',
      note: `Perplexity 검색: ${researchQuery}`,
    })

    // SourceDocument로도 추가
    setSourceDocument(projectId, doc)

    // 목록에서 제거
    setResearchResults(prev => prev.filter(s => s.sourceId !== doc.sourceId))
  }

  // 심층 리서치 수행
  const handleDeepResearch = async () => {
    if (!researchQuery.trim()) return

    setIsResearching(true)

    try {
      const result = await deepResearchWithPerplexityAction({
        query: researchQuery,
        projectId,
        context: '블로그 글쓰기를 위한 심층 리서치',
      })

      if (result.success) {
        setResearchResults(result.sources)
      } else {
        alert(result.error || '심층 리서치 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Deep research error:', error)
      alert('심층 리서치 중 오류가 발생했습니다.')
    } finally {
      setIsResearching(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Left Column - Input Methods */}
      <div className="space-y-6">
        {/* Tab Switcher */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
              activeTab === 'manual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            직접 입력
          </button>
          <button
            onClick={() => setActiveTab('perplexity')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition flex items-center justify-center gap-2 ${
              activeTab === 'perplexity'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🔍</span>
            검색
          </button>
          <button
            onClick={() => setActiveTab('deep-research')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition flex items-center justify-center gap-2 ${
              activeTab === 'deep-research'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🧠</span>
            딥 리서치
          </button>
        </div>

        {/* Manual Input Form */}
        {activeTab === 'manual' && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">소스 추가</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL 또는 출처
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 (선택)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="출처 제목"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  유형
                </label>
                <div className="flex flex-wrap gap-2">
                  {SOURCE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition ${
                        type === t.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메모 (선택)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="이 소스에 대한 간단한 메모"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <FieldLabel label="내용" required>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="여기에 참고할 내용을 직접 붙여넣기하세요...&#10;(스크래핑 없이 사용자가 직접 입력)"
                  rows={8}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <HelperText tone="info" compact icon="info">
                  웹사이트에서 직접 복사하여 붙여넣기 해주세요. 자동 스크래핑은 지원하지 않습니다.
                </HelperText>
              </FieldLabel>

              <button
                onClick={handleAddSource}
                disabled={!url || !content || isProcessing}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? '처리 중...' : '소스 추가'}
              </button>
            </div>
          </div>
        )}

        {/* Perplexity Research Form */}
        {activeTab === 'perplexity' && (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤖</span>
              <h3 className="font-semibold text-gray-900">Perplexity 자동 리서치</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  검색 키워드 또는 질문
                </label>
                <input
                  type="text"
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  placeholder="예: 2024년 AI 트렌드, 최신 웹 개발 기술..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handlePerplexityResearch()}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePerplexityResearch}
                  disabled={!researchQuery.trim() || isResearching}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isResearching ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      검색 중...
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      일반 검색
                    </>
                  )}
                </button>
                <button
                  onClick={handleDeepResearch}
                  disabled={!researchQuery.trim() || isResearching}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isResearching ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      분석 중...
                    </>
                  ) : (
                    <>
                      <span>🧠</span>
                      심층 리서치
                    </>
                  )}
                </button>
              </div>

              {/* Related Questions */}
              {relatedQuestions.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">💡 관련 질문</p>
                  <div className="space-y-2">
                    {relatedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setResearchQuery(q)}
                        className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Research Results */}
              {researchResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    검색 결과 ({researchResults.length}개)
                  </p>
                  {researchResults.map((doc) => (
                    <PerplexityResultCard
                      key={doc.sourceId}
                      doc={doc}
                      onAdd={() => handleAddPerplexitySource(doc)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deep Research Tab */}
        {activeTab === 'deep-research' && (
          <DeepResearchPanel
            projectId={projectId}
            mainKeyword={mainKeyword}
            subKeywords={subKeywords}
          />
        )}

        {/* Policy Notice */}
        <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-800">
          <p className="font-medium mb-1">⚠️ 정책 안내</p>
          <p>자동 웹 스크래핑은 금지되어 있습니다. 모든 소스 콘텐츠는 사용자가 직접 복사하여 입력하거나, Perplexity API를 통해 수집해야 합니다.</p>
        </div>
      </div>

      {/* Right Column - Source List */}
      <div>
        <h3 className="font-medium text-gray-700 mb-4">
          등록된 소스 ({sources.length}개)
        </h3>
        
        {sources.length === 0 ? (
          <EmptyState
            icon="folder_open"
            title="등록된 소스가 없습니다"
            description="좌측에서 직접 입력하거나 Perplexity 검색을 이용해 참고 자료를 추가하세요."
            tone="neutral"
          />
        ) : (
          <div className="space-y-3">
            {sources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                onRemove={() => removeSource(projectId, source.id)}
              />
            ))}
          </div>
        )}

        {/* Source Documents Preview */}
        {sourceDocs.length > 0 && (
          <div className="mt-8">
            <h3 className="font-medium text-gray-700 mb-4">
              처리된 소스 문서 ({sourceDocs.length}개)
            </h3>
            <div className="space-y-3">
              {sourceDocs.map((doc) => (
                <SourceDocCard key={doc.sourceId} doc={doc} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Perplexity 검색 결과 카드
function PerplexityResultCard({ 
  doc, 
  onAdd 
}: { 
  doc: SourceDocument
  onAdd: () => void 
}) {
  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
            {doc.title}
          </h4>
          <a 
            href={doc.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline truncate block mb-2"
          >
            {doc.url}
          </a>
          <p className="text-sm text-gray-600 line-clamp-3">
            {doc.summary}
          </p>
          {doc.keyPoints.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {doc.keyPoints.slice(0, 3).map((point, i) => (
                <span 
                  key={i}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                >
                  {point.slice(0, 30)}...
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onAdd}
          className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
        >
          추가
        </button>
      </div>
    </div>
  )
}

// 수동 입력 소스 카드
function SourceCard({ 
  source, 
  onRemove 
}: { 
  source: SourceInput
  onRemove: () => void 
}) {
  const typeColors: Record<SourceType, string> = {
    article: 'bg-blue-100 text-blue-700',
    doc: 'bg-green-100 text-green-700',
    video: 'bg-red-100 text-red-700',
    memo: 'bg-yellow-100 text-yellow-700',
    paper: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded ${typeColors[source.type]}`}>
              {source.type}
            </span>
            {source.title && (
              <span className="font-medium text-gray-900 truncate">{source.title}</span>
            )}
          </div>
          <a 
            href={source.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline truncate block"
          >
            {source.url}
          </a>
          {source.note && (
            <p className="text-sm text-gray-500 mt-1">{source.note}</p>
          )}
        </div>
        <button
          onClick={onRemove}
          className="ml-4 text-gray-400 hover:text-red-500 transition"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// 처리된 소스 문서 카드
function SourceDocCard({ doc }: { doc: SourceDocument }) {
  return (
    <div className="bg-gray-50 rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📄</span>
        <h4 className="font-medium text-gray-900">{doc.title}</h4>
      </div>
      <p className="text-sm text-gray-600 mb-2">{doc.summary}</p>
      <div className="flex flex-wrap gap-1">
        {doc.keyPoints.slice(0, 3).map((point, i) => (
          <span 
            key={i}
            className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded"
          >
            {point.slice(0, 20)}...
          </span>
        ))}
      </div>
    </div>
  )
}
