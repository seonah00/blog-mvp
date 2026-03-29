'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import type { ThumbnailSettings } from '@/types'

const filters = ['Original', 'Dark', 'Blur', 'Tinted']

export default function ThumbnailEditorPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const projectId = params.id

  // Store
  const hasHydrated = useProjectStore((state) => state.hasHydrated)
  const project = useProjectStore((state) => state.getProject(projectId))
  const draft = useProjectStore((state) => state.getDraft(projectId))
  const imagePrompts = useProjectStore((state) => state.getImagePrompts(projectId))
  const thumbnailSettings = useProjectStore((state) => state.getThumbnailSettings(projectId))
  const saveThumbnailSettings = useProjectStore((state) => state.saveThumbnailSettings)

  // Local state
  const [activeTab, setActiveTab] = useState('background')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [brightness, setBrightness] = useState(100)
  const [selectedFilter, setSelectedFilter] = useState('Original')
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [selectedImagePrompt, setSelectedImagePrompt] = useState<string>('')
  const [isMounted, setIsMounted] = useState(false)

  // Hydration mismatch 방지
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize from draft and settings
  useEffect(() => {
    if (draft) {
      setTitle(thumbnailSettings?.title || draft.title)
      setSubtitle(thumbnailSettings?.subtitle || '')
      setBrightness(thumbnailSettings?.brightness || 100)
      setSelectedFilter(thumbnailSettings?.style || 'Original')
    }
  }, [draft?.projectId, thumbnailSettings])

  // Find selected image from prompts (separate effect to react to imagePrompts changes)
  useEffect(() => {
    if (imagePrompts.length > 0) {
      for (const prompt of imagePrompts) {
        if (prompt.selectedImageId) {
          const image = prompt.generatedImages.find(
            (img) => img.id === prompt.selectedImageId
          )
          if (image) {
            setSelectedImageUrl(image.url)
            // @ts-expect-error - promptText is added by generateMockImagesFromPrompts
            setSelectedImagePrompt(image.promptText || '')
            return
          }
        }
      }
    }
    setSelectedImageUrl(null)
    setSelectedImagePrompt('')
  }, [imagePrompts])

  // Save settings
  const handleSave = useCallback(() => {
    const settings: ThumbnailSettings = {
      projectId,
      title,
      subtitle,
      selectedImageId: imagePrompts.find((p) => p.selectedImageId)?.selectedImageId,
      style: selectedFilter,
      brightness,
    }
    saveThumbnailSettings(projectId, settings)
    alert('썸네일 설정이 저장되었습니다.')
  }, [
    projectId,
    title,
    subtitle,
    brightness,
    selectedFilter,
    imagePrompts,
    saveThumbnailSettings,
  ])

  // Generate background with AI
  const handleGenerateBackground = useCallback(async () => {
    // TODO: PROMPT_GUIDE.md 섹션 4 (Image Prompt 생성) 연동
    // 현재는 placeholder 동작
    // 실제 연동 시 외부 이미지 생성 API 호출
    alert('AI 배경 생성 기능은 준비 중입니다.')
  }, [])

  // Loading states
  if (!hasHydrated || !isMounted) {
    return <div className="p-6 text-sm text-gray-500">로딩 중...</div>
  }

  if (!project || !draft) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">프로젝트를 찾을 수 없습니다.</h1>
        <p className="mt-2 text-gray-600">초안부터 먼저 생성해주세요.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Canvas Preview Area */}
      <section className="flex-1 bg-gray-100 p-10 flex flex-col items-center justify-center overflow-auto">
        <div className="w-full max-w-[1000px] flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Canvas Preview
              </h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs text-gray-500">v1 편집 중</span>
              </div>
            </div>
          </div>

          {/* 16:9 Canvas */}
          <div
            className="relative w-full shadow-2xl rounded-xl overflow-hidden aspect-video border"
            style={{
              backgroundImage: selectedImageUrl ? `url(${selectedImageUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: `${selectedFilter === 'Dark' ? 'brightness(0.5)' : ''} ${
                selectedFilter === 'Blur' ? 'blur(4px)' : ''
              } brightness(${brightness}%)`,
            }}
          >
            {/* Overlay for Tinted filter */}
            {selectedFilter === 'Tinted' && (
              <div className="absolute inset-0 bg-blue-900/40"></div>
            )}

            {/* Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative border-2 border-blue-500 cursor-move p-6 group bg-black/30 rounded-lg">
                <h2 className="text-5xl font-extrabold text-white text-center leading-tight drop-shadow-lg">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-4 text-2xl text-white/90 text-center drop-shadow-md">
                    {subtitle}
                  </p>
                )}
                {/* Resize Handles */}
                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm"></div>
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm"></div>
                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm"></div>
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm"></div>
              </div>
            </div>
          </div>

          {!selectedImageUrl && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg">
              <p className="text-sm">이미지 생성 단계에서 이미지를 선택해주세요.</p>
              <button
                onClick={() => router.push(`/projects/${projectId}/images/simple`)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
              >
                이미지 생성하러 가기
              </button>
            </div>
          )}

          {selectedImageUrl && selectedImagePrompt && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                선택된 이미지 정보
              </h4>
              <p className="text-xs text-gray-500 line-clamp-2">
                {selectedImagePrompt}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Right Control Panel */}
      <aside className="w-[320px] bg-white border-l flex flex-col h-full">
        {/* Tabs */}
        <div className="flex border-b">
          {['배경', '텍스트', '템플릿'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Text Settings */}
          {activeTab === '텍스트' && (
            <section className="space-y-4">
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                텍스트 설정
              </h4>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">
                  부제목
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="부제목을 입력하세요 (선택)"
                />
              </div>
            </section>
          )}

          {/* Background Settings */}
          {(activeTab === '배경' || activeTab === '템플릿') && (
            <>
              <section>
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  AI 배경 생성
                </h4>
                <textarea
                  className="w-full h-24 text-sm p-3 bg-gray-50 rounded-lg border resize-none"
                  placeholder="프롬프트 입력 (예: 푸른 톤의 미래지향적 오피스)"
                />
                <button
                  onClick={handleGenerateBackground}
                  className="w-full mt-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  ✨ AI 배경 생성
                </button>
              </section>

              <section>
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">
                  배경 편집
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-medium text-gray-600">
                      <label>밝기</label>
                      <span>{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="150"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-gray-600 block mb-2">
                      필터
                    </span>
                    <div className="flex p-1 bg-gray-100 rounded-lg">
                      {filters.map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setSelectedFilter(filter)}
                          className={`flex-1 py-1.5 text-[11px] rounded transition ${
                            selectedFilter === filter
                              ? 'bg-white shadow-sm text-blue-600 font-bold'
                              : 'text-gray-600'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Save Button */}
        <div className="p-6 border-t">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-lg hover:bg-blue-700 transition"
          >
            썸네일 저장
          </button>
        </div>
      </aside>
    </div>
  )
}
