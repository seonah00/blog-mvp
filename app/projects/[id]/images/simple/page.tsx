'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { splitContentIntoBlocks } from '../../draft/edit/components/BlockEditor'

// Components
import { ImageStyleSelector } from '../components/ImageStyleSelector'
import { ImageRatioSelector } from '../components/ImageRatioSelector'
import { GeneratedImageGrid } from '../components/GeneratedImageGrid'

// AI Layer
import { generateSimpleImagePrompt } from '../actions'
import { generateMockImagesFromPrompts, generateSimplePrompt } from '../lib/mock-images'
import type { ImagePrompt, GeneratedImage } from '@/types'
import type { ImageStyle, ImageRatio } from '@/lib/ai'

export default function SimpleImageGenerationPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  // Store
  const hasHydrated = useProjectStore((state) => state.hasHydrated)
  const project = useProjectStore((state) => state.getProject(projectId))
  const draft = useProjectStore((state) => state.getDraft(projectId))
  const imagePrompts = useProjectStore((state) => state.getImagePrompts(projectId))
  const generateImagePrompts = useProjectStore((state) => state.generateImagePrompts)
  const updateImagePrompt = useProjectStore((state) => state.updateImagePrompt)
  const selectGeneratedImage = useProjectStore((state) => state.selectGeneratedImage)

  // Local state
  const [style, setStyle] = useState<string>('illustration')
  const [ratio, setRatio] = useState<string>('16:9')
  const [prompt, setPrompt] = useState<string>('')
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [blocks, setBlocks] = useState<{ id: string; content: string }[]>([])

  // Hydration mismatch 방지
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize from draft content and generate prompts if needed
  // draft.content와 promptCount 변경 시에만 실행
  const draftContent = draft?.content
  const promptCount = imagePrompts.length
  useEffect(() => {
    if (draftContent == null) return
    const initialBlocks = splitContentIntoBlocks(draftContent)
    setBlocks(initialBlocks)

    // Generate prompts if not exists
    if (promptCount === 0 && initialBlocks.length > 0) {
      generateImagePrompts(
        projectId,
        initialBlocks.map((b) => ({ id: b.id, content: b.content }))
      )
    }

    // Generate simple prompt from all blocks
    const simplePrompt = generateSimplePrompt(initialBlocks.map((b) => b.content))
    setPrompt(simplePrompt)
  }, [draftContent, promptCount, generateImagePrompts, projectId])

  // Get first prompt for selection tracking
  const firstPrompt = imagePrompts[0]

  // Sync with store when images are generated
  useEffect(() => {
    if (firstPrompt?.generatedImages.length) {
      setGeneratedImages(firstPrompt.generatedImages)
    }
    if (firstPrompt?.selectedImageId) {
      setSelectedImageId(firstPrompt.selectedImageId)
    }
  }, [firstPrompt?.generatedImages, firstPrompt?.selectedImageId])

  // Generate images using AI layer
  const handleGenerate = useCallback(async () => {
    setLoading(true)

    try {
      /**
       * AI Image Prompt Generation (Simple Mode)
       * @see PROMPT_GUIDE.md Section 4
       */
      const result = await generateSimpleImagePrompt({
        projectId,
        blocks: blocks.map((b) => ({
          id: b.id,
          heading: b.content.slice(0, 30) + '...',
          content: b.content,
        })),
        style: style as ImageStyle,
        ratio: ratio as ImageRatio,
        purpose: 'hero',
      })

      if (result.success && result.data) {
        // Convert ImagePromptOutput to GeneratedImages
        const promptId = firstPrompt?.id || `prompt_${Date.now()}`
        const images = generateMockImagesFromPrompts({
          projectId,
          promptId,
          promptOutput: result.data,
        })

        setGeneratedImages(images)

        // Update store
        if (firstPrompt) {
          updateImagePrompt(projectId, firstPrompt.id, {
            prompt,
            style: style as ImagePrompt['style'],
            ratio: ratio as ImagePrompt['ratio'],
            generatedImages: images,
            status: 'completed',
          })
        }
      } else {
        console.error('Image prompt generation failed:', result.error)
        alert(result.error?.message || '이미지 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error generating images:', error)
      alert('이미지 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [prompt, style, ratio, projectId, firstPrompt, blocks, updateImagePrompt])

  // Handle image selection
  const handleSelectImage = useCallback(
    (imageId: string) => {
      setSelectedImageId(imageId)
      if (firstPrompt) {
        selectGeneratedImage(projectId, firstPrompt.id, imageId)
      }
    },
    [projectId, firstPrompt, selectGeneratedImage]
  )

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
    <div className="px-8 py-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900">이미지 생성 (간단 모드)</h1>
        <p className="text-sm text-gray-600 mt-1">
          아티클에 사용할 AI 이미지를 간단하게 생성하세요
        </p>
      </div>

      <div className="space-y-8">
        {/* Prompt Settings */}
        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">이미지 프롬프트</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                아티클 내용을 기반으로 자동 생성됩니다
              </p>
            </div>
            <button
              onClick={() => {
                const blocks = splitContentIntoBlocks(draft.content)
                const newPrompt = generateSimplePrompt(blocks.map((b) => b.content))
                setPrompt(newPrompt)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-gray-50"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              프롬프트 재생성
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm outline-none resize-none"
            rows={3}
          />

          {/* Style & Ratio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div>
              <label className="block text-xs font-semibold mb-3">이미지 스타일</label>
              <ImageStyleSelector
                selectedStyle={style}
                onStyleChange={setStyle}
                compact
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-3">이미지 비율</label>
              <ImageRatioSelector
                selectedRatio={ratio}
                onRatioChange={setRatio}
                compact
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold shadow-lg disabled:opacity-50"
            >
              {loading ? '생성 중...' : '이미지 4장 생성하기 ✨'}
            </button>
          </div>
        </section>

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-900">생성된 이미지</h2>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[11px] font-bold">
                  {generatedImages.length}장
                </span>
              </div>
            </div>
            <GeneratedImageGrid
              images={generatedImages}
              selectedImageId={selectedImageId}
              onSelect={handleSelectImage}
              loading={loading}
            />
          </section>
        )}
      </div>
    </div>
  )
}
