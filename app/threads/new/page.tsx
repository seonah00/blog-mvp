'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import type { ThreadsContentPurpose, ThreadsStrategyType } from '@/types'

type ThreadsForm = {
  topic: string
  purpose: ThreadsContentPurpose
  strategyType: ThreadsStrategyType
  tone: 'casual' | 'friendly' | 'professional'
  hook: string
  benchmarkLinks: string
  // Business Info (optional)
  brandName: string
  oneLiner: string
  coreValue: string
  differentiation: string
  storyBefore: string
  turningPoint: string
  storyAfter: string
  goals: string
}

const initialForm: ThreadsForm = {
  topic: '',
  purpose: 'info',
  strategyType: 'tip',
  tone: 'friendly',
  hook: '',
  benchmarkLinks: '',
  brandName: '',
  oneLiner: '',
  coreValue: '',
  differentiation: '',
  storyBefore: '',
  turningPoint: '',
  storyAfter: '',
  goals: '',
}

const PURPOSES: { value: ThreadsContentPurpose; label: string; description: string; icon: string }[] = [
  { value: 'food', label: '맛집형', description: '맛집 소개, 음식 리뷰', icon: 'restaurant' },
  { value: 'info', label: '정보형', description: '팁, 가이드, 유용한 정보', icon: 'lightbulb' },
  { value: 'branding', label: '브랜딩형', description: '스토리, 감성, 브랜드', icon: 'auto_awesome' },
]

const STRATEGIES: { value: ThreadsStrategyType; label: string; description: string }[] = [
  { value: 'story', label: '스토리형', description: 'Before → Turning Point → After' },
  { value: 'tip', label: '꿀팁형', description: '실용적 팁, 노하우, 정보 제공' },
  { value: 'engage', label: '공감형', description: '일상적 순간, 공감대 형성, 질문 유도' },
]

// 추천 전략 매핑
const RECOMMENDED_STRATEGY: Record<ThreadsContentPurpose, ThreadsStrategyType> = {
  food: 'story',
  info: 'tip',
  branding: 'story',
}

export default function NewThreadsPage() {
  const router = useRouter()
  const createProject = useProjectStore((state) => state.createProject)
  const hasHydrated = useProjectStore((state) => state.hasHydrated)

  const [form, setForm] = useState<ThreadsForm>(initialForm)

  const handleChange = <K extends keyof ThreadsForm>(
    key: K,
    value: ThreadsForm[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // 주제 변경 시 추천 전략 자동 적용
  const handlePurposeChange = (purpose: ThreadsContentPurpose) => {
    setForm((prev) => ({
      ...prev,
      purpose,
      strategyType: RECOMMENDED_STRATEGY[purpose],
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!form.topic.trim()) {
      window.alert('주제를 입력해주세요.')
      return
    }

    // 주제 기반으로 title 자동 생성
    const autoTitle = form.topic

    const project = createProject({
      title: autoTitle,
      topic: form.topic,
      targetAudience: '', // 제거됨
      tone: form.tone,
      keywords: [],
      type: 'threads',
      threadsMeta: {
        purpose: form.purpose,
        strategyType: form.strategyType,
        targetAudience: '', // 제거됨
        tone: form.tone,
        hook: form.hook || undefined,
        topic: form.topic,
        benchmarkLinks: form.benchmarkLinks || undefined,
        businessInfo: form.brandName || form.oneLiner ? {
          brandName: form.brandName || undefined,
          oneLiner: form.oneLiner || undefined,
          coreValue: form.coreValue || undefined,
          differentiation: form.differentiation || undefined,
          storyBefore: form.storyBefore || undefined,
          turningPoint: form.turningPoint || undefined,
          storyAfter: form.storyAfter || undefined,
          goals: form.goals || undefined,
        } : undefined,
      },
    })

    router.push(`/projects/${project.id}/draft/settings`)
  }

  if (!hasHydrated) {
    return <div className="p-6 text-sm text-gray-500">스토어를 불러오는 중...</div>
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-8">
        <p className="text-sm font-medium text-purple-600">Threads</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">스레드 글쓰기</h1>
        <p className="mt-2 text-gray-600">
          주제와 전략을 선택하여 Threads 콘텐츠를 생성하세요.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Topic */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            주제 <span className="text-red-500">*</span>
          </label>
          <input
            value={form.topic}
            onChange={(e) => handleChange('topic', e.target.value)}
            placeholder="예: 강남역에서 가장 인기있는 파스타집"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-purple-500"
          />
        </div>

        {/* Purpose Selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-800">
            목적 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {PURPOSES.map((purpose) => (
              <button
                key={purpose.value}
                type="button"
                onClick={() => handlePurposeChange(purpose.value)}
                className={`p-4 rounded-xl border-2 text-center transition ${
                  form.purpose === purpose.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <span className="material-symbols-outlined text-2xl mb-1" style={{ color: form.purpose === purpose.value ? '#A855F7' : '#9CA3AF' }}>
                  {purpose.icon}
                </span>
                <div className="font-medium text-gray-900 text-sm">{purpose.label}</div>
                <div className="text-xs text-gray-500 mt-1">{purpose.description}</div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-blue-600">
            💡 <strong>{PURPOSES.find(p => p.value === form.purpose)?.label}</strong>에는 <strong>{STRATEGIES.find(s => s.value === RECOMMENDED_STRATEGY[form.purpose])?.label}</strong>를 추천합니다
          </p>
        </div>

        {/* Strategy Selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-800">
            전개 전략 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {STRATEGIES.map((strategy) => (
              <button
                key={strategy.value}
                type="button"
                onClick={() => handleChange('strategyType', strategy.value)}
                className={`p-3 rounded-xl border-2 text-center transition ${
                  form.strategyType === strategy.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="font-medium text-gray-900 text-sm">{strategy.label}</div>
                <div className="text-xs text-gray-500 mt-1">{strategy.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview Box */}
        <div className="p-4 bg-purple-50 rounded-xl border-l-4 border-purple-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-purple-500">visibility</span>
            <span className="text-sm font-medium text-purple-700">선택 조합 미리보기</span>
          </div>
          <p className="text-sm text-gray-600">
            {{
              food: '맛집/음식',
              info: '정보/팁',
              branding: '브랜딩',
            }[form.purpose]} × {{
              story: '스토리텔링',
              tip: '실용정보',
              engage: '공감소통',
            }[form.strategyType]} 조합으로 스레드가 생성됩니다.
          </p>
        </div>

        {/* Tone Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">톤</label>
          <div className="flex gap-2">
            {(['casual', 'friendly', 'professional'] as const).map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => handleChange('tone', tone)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                  form.tone === tone
                    ? 'border-gray-800 bg-gray-800 text-white'
                    : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700'
                }`}
              >
                {tone === 'casual' && '캐주얼'}
                {tone === 'friendly' && '친근한'}
                {tone === 'professional' && '프로페셔널'}
              </button>
            ))}
          </div>
        </div>

        {/* Hook Input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            첫 문장 훅 (선택)
          </label>
          <input
            value={form.hook}
            onChange={(e) => handleChange('hook', e.target.value)}
            placeholder="예: 강남역에서 가장 인기있는 파스타집을 찾고 있다면"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-purple-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            첫 스레드에 들어갈 인상적인 문장 아이디어
          </p>
        </div>

        {/* Benchmark Links */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            벤치마크 링크 (선택)
          </label>
          <input
            value={form.benchmarkLinks}
            onChange={(e) => handleChange('benchmarkLinks', e.target.value)}
            placeholder="예: https://threads.net/@example/post/123"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-purple-500"
          />
        </div>

        {/* Optional Business Info */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-800 mb-4">브랜드 정보 (선택)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">브랜드명</label>
              <input
                value={form.brandName}
                onChange={(e) => handleChange('brandName', e.target.value)}
                placeholder="예: 카페 봄"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">한 줄 소개</label>
              <input
                value={form.oneLiner}
                onChange={(e) => handleChange('oneLiner', e.target.value)}
                placeholder="예: 감성적인 공간에서 즐기는 특별한 커피"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Story Structure (only for story strategy) */}
          {form.strategyType === 'story' && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Before (시작)</label>
                <input
                  value={form.storyBefore}
                  onChange={(e) => handleChange('storyBefore', e.target.value)}
                  placeholder="시작 전 상황"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Turning Point</label>
                <input
                  value={form.turningPoint}
                  onChange={(e) => handleChange('turningPoint', e.target.value)}
                  placeholder="전환점/계기"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">After (결과)</label>
                <input
                  value={form.storyAfter}
                  onChange={(e) => handleChange('storyAfter', e.target.value)}
                  placeholder="현재 성과"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="w-full rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            스레드 글 생성하기
          </button>
          <p className="mt-2 text-xs text-center text-gray-400">
            프로젝트 제목은 주제로 자동 설정됩니다
          </p>
        </div>
      </form>
    </div>
  )
}
