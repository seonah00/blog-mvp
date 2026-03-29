'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { parseKeywords } from '@/lib/utils'
import type { ProjectTone, ProjectType } from '@/types'

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
    const projectInput = form.type === 'restaurant'
      ? {
          ...baseInput,
          restaurantMeta: {
            placeName: form.placeName || form.title,
            region: form.region || '',
            category: form.category || '음식점',
            visitPurpose: '',
            targetAudience: form.targetAudience,
          },
        }
      : {
          ...baseInput,
          informationalMeta: {
            mainKeyword: form.mainKeyword || form.topic,
            subKeywords: parseKeywords(form.keywordsText),
            searchIntent: '',
            audienceLevel: 'intermediate' as const,
            goal: '',
          },
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
            placeholder={form.type === 'restaurant' ? '예: 강남역 파스타 맛집 소개' : '예: AI 블로그 자동화 MVP'}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-blue-500"
          />
        </div>

        {/* Type-specific fields */}
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

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">주제</label>
          <input
            value={form.topic}
            onChange={(e) => handleChange('topic', e.target.value)}
            placeholder={form.type === 'restaurant' ? '예: 분위기 좋은 데이트 맛집' : '예: 블로그 글 자동 생성 워크플로'}
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
