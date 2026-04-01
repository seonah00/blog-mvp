'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { parseKeywords } from '@/lib/utils'
import { searchPlacesAction } from '@/features/research/actions'
import type { ProjectType, PlaceCandidate, CanonicalPlace } from '@/types'

type NewProjectForm = {
  type: ProjectType
  // Informational specific
  topic: string
  keywordsText: string
  // Restaurant specific
  placeName: string
  region: string
  selectedPlace: PlaceCandidate | null
}

const initialForm: NewProjectForm = {
  type: 'informational',
  topic: '',
  keywordsText: '',
  placeName: '',
  region: '',
  selectedPlace: null,
}

const PROJECT_TYPES: { value: 'informational' | 'restaurant'; label: string; description: string; icon: string }[] = [
  {
    value: 'informational',
    label: '정보성 글',
    description: '가이드, 리뷰, 팁 등 정보 전달형 콘텐츠',
    icon: 'article',
  },
  {
    value: 'restaurant',
    label: '맛집 글',
    description: '매장 리뷰, 음식점 소개 등 장소 기반 콘텐츠',
    icon: 'restaurant',
  },
]

export default function NewProjectPage() {
  const router = useRouter()
  const createProject = useProjectStore((state) => state.createProject)
  const hasHydrated = useProjectStore((state) => state.hasHydrated)

  const [form, setForm] = useState<NewProjectForm>(initialForm)
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'empty'>('idle')
  const [searchResults, setSearchResults] = useState<PlaceCandidate[]>([])
  const [canonicalPlaces, setCanonicalPlaces] = useState<CanonicalPlace[]>([])

  const handleChange = <K extends keyof NewProjectForm>(
    key: K,
    value: NewProjectForm[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
    // Reset search when placeName changes significantly
    if (key === 'placeName' && searchStatus !== 'idle') {
      setSearchStatus('idle')
      setSearchResults([])
    }
  }

  const handleSearchPlaces = async () => {
    const trimmedName = form.placeName.trim()
    if (!trimmedName) {
      window.alert('매장명을 입력해주세요.')
      return
    }

    setSearchStatus('loading')
    setSearchResults([])

    try {
      const result = await searchPlacesAction(trimmedName, form.region.trim())
      
      if (result.success) {
        setSearchResults(result.candidates)
        setCanonicalPlaces(result.canonicalPlaces || [])
        
        if (result.candidates.length === 0) {
          setSearchStatus('empty')
        } else {
          setSearchStatus('success')
        }
      } else {
        setSearchStatus('error')
      }
    } catch (error) {
      setSearchStatus('error')
      console.error('[PlaceSearch] Error:', error)
    }
  }

  const handleSelectPlace = (place: PlaceCandidate) => {
    setForm((prev) => ({
      ...prev,
      selectedPlace: place,
      // 선택한 매장 정보로 자동 채움
      placeName: place.name,
      region: place.address?.split(' ')[0] || prev.region,
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (form.type === 'informational') {
      if (!form.topic.trim()) {
        window.alert('주제를 입력해주세요.')
        return
      }

      // 정보성 글: 주제 기반으로 title 자동 생성
      const autoTitle = form.topic

      const project = createProject({
        title: autoTitle,
        topic: form.topic,
        targetAudience: '', // 제거됨
        tone: 'professional', // 기본값
        keywords: parseKeywords(form.keywordsText),
        type: 'informational',
        informationalMeta: {
          mainKeyword: form.topic,
          subKeywords: parseKeywords(form.keywordsText),
          searchIntent: '',
          audienceLevel: 'intermediate',
          goal: '',
        },
      })

      router.push(`/projects/${project.id}/research`)
    } else {
      // 맛집 글
      if (!form.selectedPlace && !form.placeName.trim()) {
        window.alert('매장을 검색하고 선택해주세요.')
        return
      }

      // 선택된 매장명 또는 입력된 매장명으로 title 자동 생성
      const autoTitle = form.selectedPlace?.name || form.placeName

      const project = createProject({
        title: autoTitle,
        topic: form.selectedPlace?.category || '맛집 리뷰',
        targetAudience: '', // 제거됨
        tone: 'friendly', // 기본값
        keywords: [],
        type: 'restaurant',
        restaurantMeta: {
          placeName: autoTitle,
          region: form.region || (form.selectedPlace?.address?.split(' ')[0] || ''),
          category: form.selectedPlace?.category || '음식점',
          visitPurpose: '',
          targetAudience: '', // 제거됨
        },
      })

      // 선택된 매장이 있으면 store에 후보로 저장 (research 단계에서 사용)
      if (form.selectedPlace) {
        const store = useProjectStore.getState()
        store.setPlaceCandidates(project.id, [form.selectedPlace], canonicalPlaces)
      }

      router.push(`/projects/${project.id}/research`)
    }
  }

  if (!hasHydrated) {
    return <div className="p-6 text-sm text-gray-500">스토어를 불러오는 중...</div>
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-8">
        <p className="text-sm font-medium text-blue-600">New Project</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">새 글쓰기</h1>
        <p className="mt-2 text-gray-600">
          작성할 콘텐츠 유형을 선택하고 필요한 정보를 입력하세요.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Project Type Selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-800">
            콘텐츠 유형 <span className="text-red-500">*</span>
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
                <span className="material-symbols-outlined text-2xl mb-2" style={{ color: form.type === type.value ? '#3B82F6' : '#9CA3AF' }}>
                  {type.icon}
                </span>
                <div className="font-medium text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-500 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Informational Form */}
        {form.type === 'informational' && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">
                주제 <span className="text-red-500">*</span>
              </label>
              <input
                value={form.topic}
                onChange={(e) => handleChange('topic', e.target.value)}
                placeholder="예: 노션으로 블로그 운영하는 방법"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                이 주제가 프로젝트 제목으로 자동 설정됩니다.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">
                관련 키워드 (선택)
              </label>
              <input
                value={form.keywordsText}
                onChange={(e) => handleChange('keywordsText', e.target.value)}
                placeholder="쉼표(,)로 구분해서 입력하세요. 예: 노션, 블로그, 워크플로우"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Restaurant Form */}
        {form.type === 'restaurant' && (
          <div className="space-y-4">
            {/* Place Name Search */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">
                매장명 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={form.placeName}
                  onChange={(e) => handleChange('placeName', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSearchPlaces()
                    }
                  }}
                  placeholder="예: 파스타 하우스"
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleSearchPlaces}
                  disabled={searchStatus === 'loading' || !form.placeName.trim()}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {searchStatus === 'loading' ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">refresh</span>
                      검색 중...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">search</span>
                      검색
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Region Input (Optional) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">
                지역 (선택)
              </label>
              <input
                value={form.region}
                onChange={(e) => handleChange('region', e.target.value)}
                placeholder="예: 강남역, 홍대"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none ring-0 focus:border-orange-500"
              />
            </div>

            {/* Search Results */}
            {searchStatus === 'success' && searchResults.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">
                  검색 결과에서 선택 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelectPlace(place)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition ${
                        form.selectedPlace?.id === place.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{place.name}</div>
                          <div className="text-sm text-gray-500 mt-0.5">{place.category}</div>
                          <div className="text-sm text-gray-400 mt-0.5">{place.address}</div>
                        </div>
                        {form.selectedPlace?.id === place.id && (
                          <span className="material-symbols-outlined text-orange-500">check_circle</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {searchStatus === 'empty' && (
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-600">검색 결과가 없습니다.</p>
                <p className="text-xs text-gray-400 mt-1">다른 매장명이나 지역으로 시도해보세요.</p>
              </div>
            )}

            {/* Error State */}
            {searchStatus === 'error' && (
              <div className="p-4 bg-red-50 rounded-xl text-center">
                <p className="text-sm text-red-600">검색 중 오류가 발생했습니다.</p>
                <p className="text-xs text-red-400 mt-1">잠시 후 다시 시도해주세요.</p>
              </div>
            )}

            {/* Selected Place Summary */}
            {form.selectedPlace && (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 text-orange-800">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span className="font-medium">선택된 매장</span>
                </div>
                <div className="mt-2 text-sm text-orange-900">
                  <strong>{form.selectedPlace.name}</strong>
                  <span className="text-orange-600 ml-2">({form.selectedPlace.category})</span>
                </div>
                <p className="text-xs text-orange-600 mt-1">{form.selectedPlace.address}</p>
              </div>
            )}

            {/* Manual Input Fallback */}
            {(searchStatus === 'empty' || searchStatus === 'error') && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">직접 입력하여 계속하기:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">매장명</label>
                    <input
                      value={form.placeName}
                      onChange={(e) => handleChange('placeName', e.target.value)}
                      placeholder="매장명 입력"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">카테고리</label>
                    <input
                      value={form.selectedPlace?.category || ''}
                      onChange={(e) => {
                        // 카테고리만 수정하는 경우 별도 처리
                        const updatedPlace = form.selectedPlace 
                          ? { ...form.selectedPlace, category: e.target.value }
                          : null
                        setForm(prev => ({ ...prev, selectedPlace: updatedPlace }))
                      }}
                      placeholder="예: 이탈리안 레스토랑"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">arrow_forward</span>
            {form.type === 'informational' ? '글쓰기 시작하기' : '맛집 리뷰 시작하기'}
          </button>
          <p className="mt-2 text-xs text-center text-gray-400">
            프로젝트 제목은 자동으로 생성됩니다
          </p>
        </div>
      </form>
    </div>
  )
}
