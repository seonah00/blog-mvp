'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Panel, PanelHeader, PanelBody } from '@/components/ui/panel'
import { Notice, FieldLabel, EmptyState, HelperText, FieldError, InlineHint } from '@/components/ui'
import type { 
  DraftSettings, 
  ProjectTone, 
  DraftLength,
  RestaurantDraftSettings,
  InformationalDraftSettings,
  ReviewDigest,
  NormalizedPlaceProfile 
} from '@/types'

const defaultSettings: DraftSettings = {
  category: '블로그 포스트',
  goal: '',
  tone: 'professional',
  length: 'medium',
  cta: '',
  customPrompt: '',
  includeFaq: true,
}

// 프리셋 정의
const PROMPT_PRESETS = [
  { id: 'blog-standard', name: '표준 블로그', description: '일반적인 블로그 글 스타일' },
  { id: 'expert-guide', name: '전문가 가이드', description: '심층 분석과 전문성 강조' },
  { id: 'beginner-friendly', name: '입문자 친화', description: '초보자도 쉽게 이해하는 쉬운 설명' },
  { id: 'storytelling', name: '스토리텔링', description: '이야기 형식으로 풀어내는 글' },
  { id: 'listicle', name: '리스트icle', description: '숫자와 포인트로 정리하는 형식' },
  { id: 'comparison', name: '비교 분석', description: '두 가지 이상을 비교하는 글' },
] as const

export default function DraftSettingsPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const hasHydrated = useProjectStore((state) => state.hasHydrated)
  const project = useProjectStore((state) => state.getProject(projectId))

  if (!hasHydrated) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          <span className="text-sm">불러오는 중...</span>
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
            <button onClick={() => router.push('/projects/new')} className="btn-primary">새 프로젝트 만들기</button>
          </div>
        </div>
      </div>
    )
  }

  const handleComplete = () => {
    router.push(`/projects/${projectId}/draft/edit`)
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--workspace)' }}>
      {/* Header */}
      <div className="border-b px-6 py-4" style={{ backgroundColor: 'var(--workspace)', borderColor: 'var(--border-primary)' }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge ${project.type === 'restaurant' ? 'badge-warning' : 'badge-info'}`}>
                {project.type === 'restaurant' ? '맛집' : '정보성'}
              </span>
            </div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>초안 설정</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              AI가 초안을 생성할 때 적용할 설정을 선택하세요
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-3xl mx-auto">
          {project.type === 'restaurant' ? (
            <RestaurantDraftSettingsForm 
              projectId={projectId} 
              project={project}
              onComplete={handleComplete}
            />
          ) : (
            <InformationalDraftSettingsForm 
              projectId={projectId} 
              project={project}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Restaurant Settings Form
function RestaurantDraftSettingsForm({ 
  projectId, 
  project,
  onComplete 
}: { 
  projectId: string
  project: { title: string; topic: string; targetAudience: string; keywords: string[] }
  onComplete: () => void
}) {
  const [settings, setSettings] = useState<RestaurantDraftSettings>({
    channel: 'blog',
    tone: 'friendly',
    focusPoints: ['menu', 'atmosphere'],
    prohibitedExpressions: [],
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reviewDigest = useProjectStore((state) => state.getReviewDigest(projectId))
  const placeProfile = useProjectStore((state) => state.getSelectedPlace(projectId))
  const saveDraftSettings = useProjectStore((state) => state.saveDraftSettings)
  const createRestaurantDraft = useProjectStore((state) => state.createRestaurantDraft)

  const canGenerate = !!reviewDigest && !!placeProfile

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canGenerate) return
    
    setIsGenerating(true)
    setError(null)

    try {
      saveDraftSettings(projectId, {
        ...defaultSettings,
        goal: `[맛집] ${project.title} - ${settings.focusPoints.join(', ')} 중심`,
        customPrompt: `톤: ${settings.tone}, 채널: ${settings.channel}, 포커스: ${settings.focusPoints.join(', ')}`,
      })

      const draft = await createRestaurantDraft(projectId)
      if (draft) {
        onComplete()
      } else {
        setError('초안 생성에 실패했습니다. 리서치 데이터를 확인해주세요.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Research Data Summary */}
      <Panel>
        <PanelHeader 
          title="리서치 데이터" 
          action={!canGenerate ? <span className="badge badge-warning">데이터 필요</span> : undefined}
        />
        <PanelBody className="space-y-3">
          {placeProfile ? (
            <div 
              className="p-3 rounded-md border-l-3"
              style={{ backgroundColor: 'var(--workspace-secondary)', borderLeftColor: 'var(--accent-secondary)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-sm" style={{ color: 'var(--accent-secondary)' }}>restaurant</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{placeProfile.name}</span>
                <span 
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--accent-secondary-light)', color: 'var(--accent-secondary)' }}
                >
                  {placeProfile.category}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{placeProfile.address}</p>
            </div>
          ) : (
            <Notice variant="warning">
              매장 정보가 없습니다. 리서치 탭에서 매장을 선택해주세요.
            </Notice>
          )}

          {reviewDigest ? (
            <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--workspace-secondary)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>리뷰 요약</span>
                <SentimentBadge sentiment={reviewDigest.sentiment} />
              </div>
              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{reviewDigest.summary}</p>
            </div>
          ) : (
            <Notice variant="warning">
              리뷰 요약이 없습니다. 리서치 탭에서 리뷰를 입력하고 요약을 생성해주세요.
            </Notice>
          )}
        </PanelBody>
      </Panel>

      {/* Settings */}
      <Panel>
        <PanelHeader title="초안 작성 설정" />
        <PanelBody>
          {/* Channel */}
          <FieldLabel label="게시 채널">
            <div className="flex flex-wrap gap-2">
              {(['blog', 'threads', 'daangn'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setSettings({ ...settings, channel: ch })}
                  className="px-3 py-1.5 rounded-md border text-xs font-medium transition-all"
                  style={{
                    backgroundColor: settings.channel === ch ? 'var(--accent-primary)' : 'var(--workspace)',
                    color: settings.channel === ch ? 'white' : 'var(--text-secondary)',
                    borderColor: settings.channel === ch ? 'var(--accent-primary)' : 'var(--border-secondary)',
                  }}
                >
                  {ch === 'blog' && '블로그'}
                  {ch === 'threads' && '스레드'}
                  {ch === 'daangn' && '당근'}
                </button>
              ))}
            </div>
          </FieldLabel>

          {/* Tone */}
          <FieldLabel label="글 톤">
            <select
              value={settings.tone}
              onChange={(e) => setSettings({ ...settings, tone: e.target.value as RestaurantDraftSettings['tone'] })}
              className="select w-full text-sm"
            >
              <option value="friendly">친근한</option>
              <option value="informative">정보 전달형</option>
              <option value="recommendation">추천형</option>
            </select>
          </FieldLabel>

          {/* Focus Points */}
          <FieldLabel 
            label="강조할 포인트"
            action={<InlineHint tone="neutral">선택 사항</InlineHint>}
          >
            <HelperText tone="subtle" compact className="mb-2">
              초안에서 특별히 다룰 매장 특징을 선택해주세요. 선택하지 않으면 AI가 자동으로 결정합니다.
            </HelperText>
            <div className="flex flex-wrap gap-2">
              {(['menu', 'atmosphere', 'location', 'price', 'waiting', 'parking'] as const).map((point) => {
                const isSelected = settings.focusPoints.includes(point)
                const labels: Record<string, string> = {
                  menu: '메뉴', atmosphere: '분위기', location: '위치', 
                  price: '가격', waiting: '대기', parking: '주차'
                }
                return (
                  <button
                    key={point}
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        focusPoints: isSelected
                          ? settings.focusPoints.filter((p) => p !== point)
                          : [...settings.focusPoints, point],
                      })
                    }}
                    className="px-3 py-1.5 rounded-md border text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-interactive-light)' : 'var(--workspace)',
                      color: isSelected ? 'var(--accent-interactive)' : 'var(--text-secondary)',
                      borderColor: isSelected ? 'var(--accent-interactive)' : 'var(--border-secondary)',
                    }}
                  >
                    {labels[point]}
                  </button>
                )
              })}
            </div>
          </FieldLabel>
        </PanelBody>
      </Panel>

      {/* Error */}
      {error && (
        <Notice variant="warning" title="초안 생성 오류">
          {error}
        </Notice>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-3 pt-2">
        <button type="button" onClick={() => window.history.back()} className="btn-secondary text-sm">
          이전 단계
        </button>
        <button
          type="submit"
          disabled={isGenerating || !canGenerate}
          className="btn-primary text-sm"
        >
          {isGenerating ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
              생성 중...
            </>
          ) : !canGenerate ? (
            '리서치 데이터 필요'
          ) : (
            <>
              초안 생성
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

// Informational Settings Form
function InformationalDraftSettingsForm({ 
  projectId, 
  project,
  onComplete 
}: { 
  projectId: string
  project: { title: string; topic: string; targetAudience: string; keywords: string[]; informationalMeta?: { mainKeyword: string } }
  onComplete: () => void
}) {
  const [settings, setSettings] = useState<InformationalDraftSettings>({
    channel: 'blog',
    style: 'guide',
    includeFaq: true,
    includeChecklist: false,
    keywordHighlight: 'bold',
    promptMode: 'auto',
    customPrompt: '',
    presetId: undefined,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sources = useProjectStore((state) => state.getSourceDocuments(projectId))
  const outline = useProjectStore((state) => state.getOutline(projectId))
  const existingInfoSettings = useProjectStore((state) => state.getInformationalDraftSettings(projectId))
  const saveDraftSettings = useProjectStore((state) => state.saveDraftSettings)
  const saveInformationalDraftSettings = useProjectStore((state) => state.saveInformationalDraftSettings)
  const createInformationalDraft = useProjectStore((state) => state.createInformationalDraft)

  useEffect(() => {
    if (existingInfoSettings) {
      setSettings(existingInfoSettings)
    }
  }, [existingInfoSettings])

  const mainKeyword = project.informationalMeta?.mainKeyword || project.topic
  const isSensitiveDomain = mainKeyword.match(/의료|건강|병원|치료|금융|투자|주식|보험|교육|학원|합격|성적/i)

  const canGenerate = settings.promptMode !== 'custom' || (settings.customPrompt?.trim() || '').length > 0
  const isCustomEmpty = settings.promptMode === 'custom' && !(settings.customPrompt?.trim())
  const isPresetEmpty = settings.promptMode === 'preset' && !settings.presetId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (settings.promptMode === 'custom' && !(settings.customPrompt?.trim())) {
      setError('커스텀 프롬프트를 입력해주세요.')
      return
    }
    if (settings.promptMode === 'preset' && !settings.presetId) {
      setError('프리셋을 선택해주세요.')
      return
    }
    
    setIsGenerating(true)
    setError(null)

    try {
      saveInformationalDraftSettings(projectId, settings)
      saveDraftSettings(projectId, {
        ...defaultSettings,
        goal: `[정보성] ${project.title} - ${project.targetAudience}를 위한 ${settings.style} 타입`,
        customPrompt: settings.promptMode === 'custom' 
          ? (settings.customPrompt ?? '') 
          : settings.promptMode === 'preset'
            ? `프리셋: ${settings.presetId ?? ''}`
            : `스타일: ${settings.style}, 키워드 강조: ${settings.keywordHighlight}`,
        includeFaq: settings.includeFaq,
      })

      const draft = await createInformationalDraft(projectId)
      if (draft) {
        onComplete()
      } else {
        setError('초안 생성에 실패했습니다.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const hasSources = sources.length > 0
  const hasOutline = !!outline

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Research Data */}
      <Panel>
        <PanelHeader title="리서치 데이터" />
        <PanelBody className="space-y-3">
          {hasSources ? (
            <div 
              className="p-3 rounded-md border-l-3"
              style={{ backgroundColor: 'var(--workspace-secondary)', borderLeftColor: 'var(--accent-secondary)' }}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" style={{ color: 'var(--accent-secondary)' }}>folder_open</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>소스 문서</span>
                <span 
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--accent-secondary-light)', color: 'var(--accent-secondary)' }}
                >
                  {sources.length}개
                </span>
              </div>
            </div>
          ) : (
            <Notice variant="info" compact>
              등록된 소스가 없습니다. 소스를 추가하면 더 풍부한 초안을 만들 수 있습니다.
            </Notice>
          )}

          {hasOutline ? (
            <div 
              className="p-3 rounded-md border-l-3"
              style={{ backgroundColor: 'var(--workspace-secondary)', borderLeftColor: 'var(--accent-secondary)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>아웃라인</span>
                <span 
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--accent-secondary-light)', color: 'var(--accent-secondary)' }}
                >
                  준비됨
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{outline?.title}</p>
            </div>
          ) : (
            <Notice variant="info" compact>
              아웃라인이 없습니다. 아웃라인을 생성하면 더 구조화된 초안을 만들 수 있습니다.
            </Notice>
          )}
        </PanelBody>
      </Panel>

      {/* Sensitive Domain Warning */}
      {isSensitiveDomain && (
        <Notice variant="warning" title="민감 도메인 안내">
          의료/건강/금융/교육 관련 콘텐츠는 제공된 출처를 바탕으로 보수적으로 작성됩니다.
          진단, 처방, 투자 권유, 결과 보장 등의 표현은 제외됩니다.
        </Notice>
      )}

      {/* Prompt Mode */}
      <Panel>
        <PanelHeader title="AI 프롬프트 설정" />
        <PanelBody className="space-y-4">
          {/* Mode Selection */}
          <FieldLabel 
            label="프롬프트 모드"
            description={
              settings.promptMode === 'auto' ? 'AI가 자동으로 최적의 프롬프트를 생성합니다.' :
              settings.promptMode === 'custom' ? '직접 작성한 프롬프트로 글을 생성합니다.' :
              '미리 정의된 템플릿 중 하나를 선택합니다.'
            }
          >
            <div className="flex flex-wrap gap-2">
              {(['auto', 'custom', 'preset'] as const).map((mode) => {
                const labels = { auto: '자동 생성', custom: '커스텀', preset: '프리셋' }
                const isSelected = settings.promptMode === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSettings({ ...settings, promptMode: mode })}
                    className="px-3 py-1.5 rounded-md border text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-interactive)' : 'var(--workspace)',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      borderColor: isSelected ? 'var(--accent-interactive)' : 'var(--border-secondary)',
                    }}
                  >
                    {labels[mode]}
                  </button>
                )
              })}
            </div>
          </FieldLabel>

          {/* Custom Prompt */}
          {settings.promptMode === 'custom' && (
            <div>
              <FieldLabel label="커스텀 프롬프트" required>
                <textarea
                  value={settings.customPrompt || ''}
                  onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
                  placeholder="AI가 글을 작성할 때 참고할 구체적인 지침을 입력해주세요."
                  rows={4}
                  className="input w-full text-sm resize-none"
                />
              </FieldLabel>
              <HelperText tone="info" compact icon="lightbulb">
                원하는 문처이나 설명 방향, 포함해야 할/피해야 할 내용을 자유롭게 적어주세요.
              </HelperText>
              {isCustomEmpty && (
                <FieldError compact>커스텀 모드에서는 프롬프트를 입력해야 생성할 수 있어요.</FieldError>
              )}
            </div>
          )}

          {/* Preset Selection */}
          {settings.promptMode === 'preset' && (
            <div>
              <FieldLabel label="프리셋 선택" required>
                <HelperText tone="info" compact className="mb-2">
                  프리셋은 문체와 구조 방향을 빠르게 설정할 때 유용해요.
                </HelperText>
                <div className="space-y-2">
                {PROMPT_PRESETS.map((preset) => {
                  const isSelected = settings.presetId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSettings({ ...settings, presetId: preset.id })}
                      className="w-full flex items-center justify-between p-3 rounded-md border text-left transition-all"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-interactive-light)' : 'var(--workspace)',
                        borderColor: isSelected ? 'var(--accent-interactive)' : 'var(--border-secondary)',
                      }}
                    >
                      <div>
                        <span className="text-sm font-medium" style={{ color: isSelected ? 'var(--accent-interactive)' : 'var(--text-primary)' }}>
                          {preset.name}
                        </span>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{preset.description}</p>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-sm" style={{ color: 'var(--accent-interactive)' }}>check_circle</span>
                      )}
                    </button>
                  )
                })}
              </div>
              {isPresetEmpty && (
                <FieldError compact>프리셋을 하나 선택해야 생성할 수 있어요.</FieldError>
              )}
            </FieldLabel>
          </div>
          )}
        </PanelBody>
      </Panel>

      {/* Settings */}
      <Panel>
        <PanelHeader title="초안 작성 설정" />
        <PanelBody className="space-y-4">
          {/* Channel */}
          <FieldLabel label="게시 채널">
            <div className="flex flex-wrap gap-2">
              {(['blog', 'threads'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setSettings({ ...settings, channel: ch })}
                  className="px-3 py-1.5 rounded-md border text-xs font-medium transition-all"
                  style={{
                    backgroundColor: settings.channel === ch ? 'var(--accent-primary)' : 'var(--workspace)',
                    color: settings.channel === ch ? 'white' : 'var(--text-secondary)',
                    borderColor: settings.channel === ch ? 'var(--accent-primary)' : 'var(--border-secondary)',
                  }}
                >
                  {ch === 'blog' ? '블로그' : '스레드'}
                </button>
              ))}
            </div>
          </FieldLabel>

          {/* Style */}
          <FieldLabel 
            label="글 스타일"
            action={<InlineHint tone="info">요약 품질에 영향을 줘요</InlineHint>}
          >
            <select
              value={settings.style}
              onChange={(e) => setSettings({ ...settings, style: e.target.value as InformationalDraftSettings['style'] })}
              className="select w-full text-sm"
            >
              <option value="explainer">설명형 - 개념과 원리 설명</option>
              <option value="comparison">비교형 - 장단점 비교</option>
              <option value="guide">가이드형 - 단계별 안내</option>
              <option value="problem-solving">해결형 - 문제 및 해결책</option>
            </select>
          </FieldLabel>

          {/* Options */}
          <FieldLabel 
            label="추가 옵션"
            action={<InlineHint tone="neutral">선택 사항</InlineHint>}
          >
            <HelperText tone="subtle" compact className="mb-2">
              독자의 이해를 돕는 추가 요소를 넣을 수 있어요.
            </HelperText>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.includeFaq}
                  onChange={(e) => setSettings({ ...settings, includeFaq: e.target.checked })}
                  className="rounded border"
                  style={{ borderColor: 'var(--border-secondary)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>FAQ 포함</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.includeChecklist}
                  onChange={(e) => setSettings({ ...settings, includeChecklist: e.target.checked })}
                  className="rounded border"
                  style={{ borderColor: 'var(--border-secondary)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>체크리스트 포함</span>
              </label>
            </div>
          </FieldLabel>

          {/* Keyword Highlight */}
          <FieldLabel label="키워드 강조 방식">
            <HelperText tone="subtle" compact className="mb-2">
              주요 키워드를 어떻게 강조할지 선택해주세요. SEO와 가독성에 영향을 줘요.
            </HelperText>
            <div className="flex flex-wrap gap-2">
              {(['none', 'bold', 'heading'] as const).map((hl) => {
                const labels = { none: '없음', bold: '볼드체', heading: '헤딩' }
                const isSelected = settings.keywordHighlight === hl
                return (
                  <button
                    key={hl}
                    type="button"
                    onClick={() => setSettings({ ...settings, keywordHighlight: hl })}
                    className="px-3 py-1.5 rounded-md border text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-interactive-light)' : 'var(--workspace)',
                      color: isSelected ? 'var(--accent-interactive)' : 'var(--text-secondary)',
                      borderColor: isSelected ? 'var(--accent-interactive)' : 'var(--border-secondary)',
                    }}
                  >
                    {labels[hl]}
                  </button>
                )
              })}
            </div>
          </FieldLabel>
        </PanelBody>
      </Panel>

      {/* Error */}
      {error && (
        <Notice variant="warning" title="초안 생성 오류">
          {error}
        </Notice>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-3 pt-2">
        <button type="button" onClick={() => window.history.back()} className="btn-secondary text-sm">
          이전 단계
        </button>
        <button
          type="submit"
          disabled={isGenerating || !canGenerate}
          className="btn-primary text-sm"
        >
          {isGenerating ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
              생성 중...
            </>
          ) : (
            <>
              초안 생성
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

// Sentiment Badge Helper
function SentimentBadge({ sentiment }: { sentiment: ReviewDigest['sentiment'] }) {
  if (!sentiment) return null
  
  const styles = {
    positive: { bg: 'var(--accent-secondary-light)', text: 'var(--accent-secondary)', label: '긍정적' },
    mixed: { bg: 'var(--warning-light)', text: 'var(--accent-warning)', label: '복합적' },
    neutral: { bg: 'var(--workspace-secondary)', text: 'var(--text-tertiary)', label: '중립' },
  }

  const style = styles[sentiment]

  return (
    <span 
      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  )
}
