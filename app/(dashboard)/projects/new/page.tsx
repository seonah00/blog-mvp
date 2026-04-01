'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { parseKeywords } from '@/lib/utils'
import type { ProjectTone, ProjectType, ThreadsContentPurpose, KarrotContentPurpose, ThreadsStrategyType } from '@/types'

type NewProjectForm = {
  title: string
  topic: string
  targetAudience: string
  tone: ProjectTone
  keywordsText: string
  type: ProjectType
  // Restaurant specific
  placeName?: string
  region?: string
  category?: string
  // Informational specific
  mainKeyword?: string
  // Threads specific (NEW)
  threadsPurpose?: ThreadsContentPurpose
  threadsStrategyType?: ThreadsStrategyType
  threadsTone?: 'casual' | 'witty' | 'professional'
  threadsHook?: string
  threadsBenchmarkLinks?: string
  // Threads Business Info (선택)
  threadsBrandName?: string
  threadsOneLiner?: string
  threadsCoreValue?: string
  threadsDifferentiation?: string
  threadsStoryBefore?: string
  threadsTurningPoint?: string
  threadsStoryAfter?: string
  threadsGoals?: string
  // Karrot specific (NEW)
  karrotPurpose?: KarrotContentPurpose
  karrotRegion?: string
  karrotBusinessType?: string
}

const initialForm: NewProjectForm = {
  title: '',
  topic: '',
  targetAudience: '',
  tone: 'professional',
  keywordsText: '',
  type: 'informational',
}

const PROJECT_TYPES: { value: ProjectType; label: string; description: string }[] = [
  {
    value: 'informational',
    label: '정보성 글',
    description: '가이드, 리뷰, 팁 등 정보 전달형 콘텐츠',
  },
  {
    value: 'restaurant',
    label: '맛집 글',
    description: '매장 리뷰, 음식점 소개 등 장소 기반 콘텐츠',
  },
  {
    value: 'threads',
    label: '스레드 글',
    description: 'Threads용 짧은 글 (맛집/정보/브랜딩)',
  },
  {
    value: 'karrot',
    label: '당근 글',
    description: '당근마켓 동네생활 글 (광고/맛집/소통)',
  },
]

const THREADS_PURPOSES: { value: ThreadsContentPurpose; label: string; description: string }[] = [
  { value: 'food', label: '맛집형', description: '맛집 소개, 음식 리뷰' },
  { value: 'info', label: '정보형', description: '팁, 가이드, 유용한 정보' },
  { value: 'branding', label: '브랜딩형', description: '스토리, 감성, 브랜드' },
]

const THREADS_STRATEGIES: { value: ThreadsStrategyType; label: string; description: string }[] = [
  { value: 'story', label: '스토리형', description: 'Before → Turning Point → After 스토리텔링' },
  { value: 'tip', label: '꿀팁형', description: '실용적 팁, 노하우, 정보 제공' },
  { value: 'engage', label: '공감형', description: '일상적 순간, 공감대 형성, 질문 유도' },
]

const KARROT_PURPOSES: { value: KarrotContentPurpose; label: string; description: string }[] = [
  { value: 'ad', label: '광고형', description: '가게 홍보, 할인 정보' },
  { value: 'food', label: '맛집형', description: '동네 맛집 소개' },
  { value: 'community', label: '동네소통형', description: '동네 정보, 질문, 소통' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const createProject = useProjectStore((state) => state.createProject)
  const hasHydrated = useProjectStore((state) => state.hasHydrated)

  const [form, setForm] = useState<NewProjectForm>(initialForm)

  const handleChange = <K extends keyof NewProjectForm>(
    key: K,
    value: NewProjectForm[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!form.title.trim() || !form.topic.trim()) {
      window.alert('프로젝트 제목과 주제는 필수입니다.')
      return
    }

    const baseInput = {
      title: form.title,
      topic: form.topic,
      targetAudience: form.targetAudience,
      tone: form.tone,
      keywords: parseKeywords(form.keywordsText),
      type: form.type,
    }

    // Type-specific metadata
    let projectInput
    
    switch (form.type) {
      case 'restaurant':
        projectInput = {
          ...baseInput,
          restaurantMeta: {
            placeName: form.placeName || form.title,
            region: form.region || '',
            category: form.category || '음식점',
            visitPurpose: '',
            targetAudience: form.targetAudience,
          },
        }
        break
        
      case 'threads':
        projectInput = {
          ...baseInput,
          threadsMeta: {
            purpose: form.threadsPurpose || 'info',
            strategyType: (form.threadsStrategyType || 'tip') as ThreadsStrategyType,
            targetAudience: form.targetAudience,
            tone: form.threadsTone || 'casual',
            hook: form.threadsHook || '',
            topic: form.topic,
            benchmarkLinks: form.threadsBenchmarkLinks || '',
            businessInfo: form.threadsBrandName || form.threadsOneLiner ? {
              brandName: form.threadsBrandName,
              oneLiner: form.threadsOneLiner,
              coreValue: form.threadsCoreValue,
              differentiation: form.threadsDifferentiation,
              storyBefore: form.threadsStoryBefore,
              turningPoint: form.threadsTurningPoint,
              storyAfter: form.threadsStoryAfter,
              goals: form.threadsGoals,
            } : undefined,
          },
        }
        break
        
      case 'karrot':
        projectInput = {
          ...baseInput,
          karrotMeta: {
            purpose: form.karrotPurpose || 'community',
            region: form.karrotRegion || '',
            targetAudience: form.targetAudience,
            businessType: form.karrotBusinessType || '',
            topic: form.topic,
          },
        }
        break
        
      case 'informational':
      default:
        projectInput = {
          ...baseInput,
          informationalMeta: {
            mainKeyword: form.mainKeyword || form.topic,
            subKeywords: parseKeywords(form.keywordsText),
            searchIntent: '',
            audienceLevel: 'intermediate' as const,
            goal: '',
          },
        }
        break
    }

    const project = createProject(projectInput)

    router.push(`/projects/${project.id}/research`)
  }

  if (!hasHydrated) {
    return <div className="p-6 text-sm text-gray-500">스토어를 불러오는 중...</div>
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-8">
        <p className="text-sm font-medium text-blue-600">New Project</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">새 프로젝트 생성</h1>
        <p className="mt-2 text-gray-600">
          콘텐츠 유형을 선택하고 기본 정보를 입력하세요.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Project Type Selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-800">
            프로젝트 유형 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleChange('type', type.value)}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  form.type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-500 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            프로젝트 제목
          </label>
          <input
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder={
              form.type === 'restaurant' ? '예: 강남역 파스타 맛집 소개' :
              form.type === 'threads' ? '예: 강남역 숨은 맛집 TOP 5' :
              form.type === 'karrot' ? '예: 역삼동 새로 오픈한 카페' :
              '예: AI 블로그 자동화 MVP'
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-blue-500"
          />
        </div>

        {/* Type-specific fields - Restaurant */}
        {form.type === 'restaurant' && (
          <div className="space-y-4 p-4 bg-orange-50 rounded-xl">
            <h3 className="font-medium text-orange-900">맛집 정보</h3>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-orange-800">
                매장명
              </label>
              <input
                value={form.placeName || ''}
                onChange={(e) => handleChange('placeName', e.target.value)}
                placeholder="예: 파스타 하우스"
                className="w-full rounded-xl border border-orange-200 px-4 py-3 outline-none ring-0 focus:border-orange-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-orange-800">
                  지역
                </label>
                <input
                  value={form.region || ''}
                  onChange={(e) => handleChange('region', e.target.value)}
                  placeholder="예: 강남역"
                  className="w-full rounded-xl border border-orange-200 px-4 py-3 outline-none ring-0 focus:border-orange-500 bg-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-orange-800">
                  카테고리
                </label>
                <input
                  value={form.category || ''}
                  onChange={(e) => handleChange('category', e.target.value)}
                  placeholder="예: 이탈리안"
                  className="w-full rounded-xl border border-orange-200 px-4 py-3 outline-none ring-0 focus:border-orange-500 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Type-specific fields - Informational */}
        {form.type === 'informational' && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-xl">
            <h3 className="font-medium text-blue-900">주제 정보</h3>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-blue-800">
                주요 키워드
              </label>
              <input
                value={form.mainKeyword || ''}
                onChange={(e) => handleChange('mainKeyword', e.target.value)}
                placeholder="예: 노션 블로그"
                className="w-full rounded-xl border border-blue-200 px-4 py-3 outline-none ring-0 focus:border-blue-500 bg-white"
              />
            </div>
          </div>
        )}

        {/* Type-specific fields - Threads (NEW) */}
        {form.type === 'threads' && (
          <div className="space-y-4 p-4 bg-purple-50 rounded-xl">
            <h3 className="font-medium text-purple-900">스레드 설정</h3>
            
            {/* Purpose Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-purple-800">
                목적 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {THREADS_PURPOSES.map((purpose) => (
                  <button
                    key={purpose.value}
                    type="button"
                    onClick={() => handleChange('threadsPurpose', purpose.value)}
                    className={`p-3 rounded-lg border-2 text-center transition ${
                      form.threadsPurpose === purpose.value
                        ? 'border-purple-500 bg-purple-100'
                        : 'border-purple-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="font-medium text-sm text-purple-900">{purpose.label}</div>
                    <div className="text-xs text-purple-600 mt-1">{purpose.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-purple-800">
                톤
              </label>
              <select
                value={form.threadsTone || 'casual'}
                onChange={(e) => handleChange('threadsTone', e.target.value as 'casual' | 'witty' | 'professional')}
                className="w-full rounded-xl border border-purple-200 px-4 py-3 outline-none focus:border-purple-500 bg-white"
              >
                <option value="casual">캐주얼 (편안한)</option>
                <option value="witty">위티 (재치있는)</option>
                <option value="professional">프로페셔널 (전문적인)</option>
              </select>
            </div>

            {/* Strategy Type Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-purple-800">
                전개 전략 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {THREADS_STRATEGIES.map((strategy) => (
                  <button
                    key={strategy.value}
                    type="button"
                    onClick={() => handleChange('threadsStrategyType', strategy.value)}
                    className={`p-3 rounded-lg border-2 text-center transition ${
                      form.threadsStrategyType === strategy.value
                        ? 'border-purple-500 bg-purple-100'
                        : 'border-purple-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="font-medium text-sm text-purple-900">{strategy.label}</div>
                    <div className="text-xs text-purple-600 mt-1">{strategy.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hook Input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-purple-800">
                첫 문장 훅 (선택)
              </label>
              <input
                value={form.threadsHook || ''}
                onChange={(e) => handleChange('threadsHook', e.target.value)}
                placeholder="예: 강남역에서 가장 인기있는 파스타집을 찾고 있다면"
                className="w-full rounded-xl border border-purple-200 px-4 py-3 outline-none ring-0 focus:border-purple-500 bg-white"
              />
              <p className="mt-1 text-xs text-purple-600">
                첫 스레드에 들어갈 인상적인 문장 아이디어
              </p>
            </div>

            {/* Benchmark Links */}
            <div>
              <label className="mb-2 block text-sm font-medium text-purple-800">
                벤치마크 링크 (선택)
              </label>
              <input
                value={form.threadsBenchmarkLinks || ''}
                onChange={(e) => handleChange('threadsBenchmarkLinks', e.target.value)}
                placeholder="예: https://threads.net/@example/post/123"
                className="w-full rounded-xl border border-purple-200 px-4 py-3 outline-none ring-0 focus:border-purple-500 bg-white"
              />
              <p className="mt-1 text-xs text-purple-600">
                참고할 Threads 게시물 링크 (있는 경우)
              </p>
            </div>

            {/* Business Info (Optional) */}
            <div className="border-t border-purple-200 pt-4 mt-4">
              <h4 className="font-medium text-purple-900 mb-3">브랜드/비즈니스 정보 (선택)</h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-purple-700">브랜드명</label>
                    <input
                      value={form.threadsBrandName || ''}
                      onChange={(e) => handleChange('threadsBrandName', e.target.value)}
                      placeholder="예: 카페 봄"
                      className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-purple-700">한 줄 소개</label>
                    <input
                      value={form.threadsOneLiner || ''}
                      onChange={(e) => handleChange('threadsOneLiner', e.target.value)}
                      placeholder="예: 감성적인 공간에서 즐기는 특별한 커피"
                      className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-purple-700">핵심 가치</label>
                  <input
                    value={form.threadsCoreValue || ''}
                    onChange={(e) => handleChange('threadsCoreValue', e.target.value)}
                    placeholder="예: 정직한 원두, 따뜻한 서비스"
                    className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-purple-700">차별화 포인트</label>
                  <input
                    value={form.threadsDifferentiation || ''}
                    onChange={(e) => handleChange('threadsDifferentiation', e.target.value)}
                    placeholder="예: 직접 로스팅한 원두, 1:1 바리스타 클래스"
                    className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white"
                  />
                </div>

                {/* Story Structure (for story strategy) */}
                {(form.threadsStrategyType === 'story' || form.threadsStrategyType === undefined) && (
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-purple-700">Before (문제)</label>
                      <input
                        value={form.threadsStoryBefore || ''}
                        onChange={(e) => handleChange('threadsStoryBefore', e.target.value)}
                        placeholder="시작 전 상황"
                        className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-purple-700">Turning Point</label>
                      <input
                        value={form.threadsTurningPoint || ''}
                        onChange={(e) => handleChange('threadsTurningPoint', e.target.value)}
                        placeholder="전환점/계기"
                        className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-purple-700">After (결과)</label>
                      <input
                        value={form.threadsStoryAfter || ''}
                        onChange={(e) => handleChange('threadsStoryAfter', e.target.value)}
                        placeholder="현재 성과/변화"
                        className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-purple-700">콘텐츠 목표</label>
                  <input
                    value={form.threadsGoals || ''}
                    onChange={(e) => handleChange('threadsGoals', e.target.value)}
                    placeholder="예: 브랜드 인지도 향상, 신메뉴 홍보"
                    className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Type-specific fields - Karrot (NEW) */}
        {form.type === 'karrot' && (
          <div className="space-y-4 p-4 bg-green-50 rounded-xl">
            <h3 className="font-medium text-green-900">당근 설정</h3>
            
            {/* Purpose Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-green-800">
                목적 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {KARROT_PURPOSES.map((purpose) => (
                  <button
                    key={purpose.value}
                    type="button"
                    onClick={() => handleChange('karrotPurpose', purpose.value)}
                    className={`p-3 rounded-lg border-2 text-center transition ${
                      form.karrotPurpose === purpose.value
                        ? 'border-green-500 bg-green-100'
                        : 'border-green-200 hover:border-green-300 bg-white'
                    }`}
                  >
                    <div className="font-medium text-sm text-green-900">{purpose.label}</div>
                    <div className="text-xs text-green-600 mt-1">{purpose.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Region Input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-green-800">
                동네 <span className="text-red-500">*</span>
              </label>
              <input
                value={form.karrotRegion || ''}
                onChange={(e) => handleChange('karrotRegion', e.target.value)}
                placeholder="예: 역삼동, 홍제동"
                className="w-full rounded-xl border border-green-200 px-4 py-3 outline-none ring-0 focus:border-green-500 bg-white"
              />
            </div>

            {/* Business Type (only for ad) */}
            {form.karrotPurpose === 'ad' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-green-800">
                  업종
                </label>
                <input
                  value={form.karrotBusinessType || ''}
                  onChange={(e) => handleChange('karrotBusinessType', e.target.value)}
                  placeholder="예: 카페, 헤어샵, 식당"
                  className="w-full rounded-xl border border-green-200 px-4 py-3 outline-none ring-0 focus:border-green-500 bg-white"
                />
              </div>
            )}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">주제</label>
          <input
            value={form.topic}
            onChange={(e) => handleChange('topic', e.target.value)}
            placeholder={
              form.type === 'restaurant' ? '예: 분위기 좋은 데이트 맛집' :
              form.type === 'threads' ? '예: 강남역 파스타 추천' :
              form.type === 'karrot' ? '예: 역삼동 신규 오픈 카페 소개' :
              '예: 블로그 글 자동 생성 워크플로'
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            타깃 독자
          </label>
          <input
            value={form.targetAudience}
            onChange={(e) => handleChange('targetAudience', e.target.value)}
            placeholder="예: 1인 창업자, 마케터, 콘텐츠 운영자"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">톤</label>
          <select
            value={form.tone}
            onChange={(e) => handleChange('tone', e.target.value as ProjectTone)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="professional">professional</option>
            <option value="friendly">friendly</option>
            <option value="casual">casual</option>
            <option value="expert">expert</option>
            <option value="persuasive">persuasive</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            키워드
          </label>
          <textarea
            value={form.keywordsText}
            onChange={(e) => handleChange('keywordsText', e.target.value)}
            placeholder="쉼표(,)로 구분해서 입력하세요. 예: SEO, 블로그, 자동화, AI"
            rows={4}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            프로젝트 만들고 리서치로 이동
          </button>
        </div>
      </form>
    </div>
  )
}
