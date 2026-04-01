'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import type { KarrotContentPurpose } from '@/types'

type KarrotForm = {
  topic: string
  purpose: KarrotContentPurpose
  region: string
  businessType: string
}

const initialForm: KarrotForm = {
  topic: '',
  purpose: 'community',
  region: '',
  businessType: '',
}

const PURPOSES: { value: KarrotContentPurpose; label: string; description: string; icon: string }[] = [
  { value: 'ad', label: '광고형', description: '가게 홍보, 할인 정보', icon: 'campaign' },
  { value: 'food', label: '맛집형', description: '동네 맛집 소개', icon: 'restaurant' },
  { value: 'community', label: '동네소통형', description: '동네 정보, 질문, 소통', icon: 'forum' },
]

export default function NewKarrotPage() {
  const router = useRouter()
  const createProject = useProjectStore((state) => state.createProject)
  const hasHydrated = useProjectStore((state) => state.hasHydrated)

  const [form, setForm] = useState<KarrotForm>(initialForm)

  const handleChange = <K extends keyof KarrotForm>(
    key: K,
    value: KarrotForm[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!form.topic.trim()) {
      window.alert('주제를 입력해주세요.')
      return
    }

    if (!form.region.trim()) {
      window.alert('동네를 입력해주세요.')
      return
    }

    // 주제 + 동네 기반으로 title 자동 생성
    const autoTitle = `[${form.region}] ${form.topic}`

    const project = createProject({
      title: autoTitle,
      topic: form.topic,
      targetAudience: '', // 제거됨
      tone: 'friendly', // 기본값
      keywords: [],
      type: 'karrot',
      karrotMeta: {
        purpose: form.purpose,
        region: form.region,
        targetAudience: '', // 제거됨
        businessType: form.businessType || undefined,
        topic: form.topic,
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
        <p className="text-sm font-medium text-green-600">당근마켓</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">당근 글쓰기</h1>
        <p className="mt-2 text-gray-600">
          동네 기반 콘텐츠를 생성하세요.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
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
                onClick={() => handleChange('purpose', purpose.value)}
                className={`p-4 rounded-xl border-2 text-center transition ${
                  form.purpose === purpose.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <span className="material-symbols-outlined text-2xl mb-1" style={{ color: form.purpose === purpose.value ? '#22C55E' : '#9CA3AF' }}>
                  {purpose.icon}
                </span>
                <div className="font-medium text-gray-900 text-sm">{purpose.label}</div>
                <div className="text-xs text-gray-500 mt-1">{purpose.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Region Input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            동네 <span className="text-red-500">*</span>
          </label>
          <input
            value={form.region}
            onChange={(e) => handleChange('region', e.target.value)}
            placeholder="예: 역삼동, 홍제동, 부산 해울대구"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-green-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            동네 이름이 제목에 포함됩니다.
          </p>
        </div>

        {/* Topic Input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            주제 <span className="text-red-500">*</span>
          </label>
          <input
            value={form.topic}
            onChange={(e) => handleChange('topic', e.target.value)}
            placeholder={
              form.purpose === 'ad' ? '예: 신규 오픈 기념 20% 할인 이벤트' :
              form.purpose === 'food' ? '예: 동네에서 가장 맛있는 칼국수집' :
              '예: 아파트 근처 주차 정보 공유해요'
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-green-500"
          />
        </div>

        {/* Business Type (only for ad) */}
        {form.purpose === 'ad' && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              업종 (선택)
            </label>
            <input
              value={form.businessType}
              onChange={(e) => handleChange('businessType', e.target.value)}
              placeholder="예: 카페, 헤어샵, 식당"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-green-500"
            />
          </div>
        )}

        {/* Preview Box */}
        <div className="p-4 bg-green-50 rounded-xl border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-green-500">visibility</span>
            <span className="text-sm font-medium text-green-700">미리보기</span>
          </div>
          <p className="text-sm text-gray-600">
            [{form.region || '동네'}] {form.topic || '주제'} - {PURPOSES.find(p => p.value === form.purpose)?.label} 글로 생성됩니다.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="w-full rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            당근 글 생성하기
          </button>
          <p className="mt-2 text-xs text-center text-gray-400">
            프로젝트 제목은 [동네] + 주제로 자동 설정됩니다
          </p>
        </div>
      </form>
    </div>
  )
}
