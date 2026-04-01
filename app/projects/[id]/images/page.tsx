'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { mergeBlocksIntoContent, type Block } from '../draft/edit/components/BlockEditor'
import { splitContentIntoBlocks } from '../draft/edit/components/BlockEditor'

// Components
import { ImageStyleSelector } from './components/ImageStyleSelector'
import { ImageRatioSelector } from './components/ImageRatioSelector'
import { ImagePromptEditor } from './components/ImagePromptEditor'
import { GeneratedImageGrid } from './components/GeneratedImageGrid'

// AI Layer
import { generateImagePrompts as generateImagePromptsAction } from './actions'
import { generateMockImagesFromPrompts, type MockImageGenerationParams } from './lib/mock-images'
import type { ImagePrompt } from '@/types'
import type { ImageStyle, ImageRatio, ImagePurpose } from '@/lib/ai'

export default function ImageGenerationPage() {
  const router = useRouter()
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
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
  const [activePromptId, setActivePromptId] = useState<string | null>(null)
  const [generating, setGenerating] = useState<Set<string>>(new Set())

  // Initialize blocks from draft
  useEffect(() => {
    if (draft) {
      const initialBlocks = splitContentIntoBlocks(draft.content)
      setBlocks(initialBlocks)

      // Generate prompts if not exists
      const prompts = imagePrompts
      if (prompts.length === 0 && initialBlocks.length > 0) {
        generateImagePrompts(
          projectId,
          initialBlocks.map((b) => ({ id: b.id, content: b.content }))
        )
      }
    }
  }, [draft?.projectId])

  // Toggle block selection
  const toggleBlockSelection = useCallback((blockId: string) => {
    setSelectedBlockIds((prev) => {
      const next = new Set(prev)
      if (next.has(blockId)) {
        next.delete(blockId)
      } else {
        next.add(blockId)
      }
      return next
    })
  }, [])

  // Select all blocks
  const selectAllBlocks = useCallback(() => {
    setSelectedBlockIds(new Set(blocks.map((b) => b.id)))
  }, [blocks])

  // Handle style change
  const handleStyleChange = useCallback(
    (promptId: string, style: string) => {
      updateImagePrompt(projectId, promptId, { style: style as ImagePrompt['style'] })
    },
    [projectId, updateImagePrompt]
  )

  // Handle ratio change
  const handleRatioChange = useCallback(
    (promptId: string, ratio: string) => {
      updateImagePrompt(projectId, promptId, { ratio: ratio as ImagePrompt['ratio'] })
    },
    [projectId, updateImagePrompt]
  )

  // Handle prompt change
  const handlePromptChange = useCallback(
    (promptId: string, prompt: string) => {
      updateImagePrompt(projectId, promptId, { prompt })
    },
    [projectId, updateImagePrompt]
  )

  // Generate images for a prompt using AI layer
  const handleGenerateImages = useCallback(
    async (prompt: ImagePrompt) => {
      if (!prompt.blockId) return

      setGenerating((prev) => new Set(prev).add(prompt.id))

      try {
        /**
         * AI Image Prompt Generation
         * @see PROMPT_GUIDE.md Section 4
         */
        const block = blocks.find((b) => b.id === prompt.blockId)
        if (!block) {
          console.error('Block not found:', prompt.blockId)
          return
        }

        const results = await generateImagePromptsAction({
          projectId,
          blocks: [{
            id: block.id,
            heading: block.content.slice(0, 30) + '...',
            content: block.content,
          }],
          style: prompt.style as ImageStyle,
          ratio: prompt.ratio as ImageRatio,
          purpose: 'section',
        })

        const result = results[0]

        if (result.success && result.data) {
          // Convert ImagePromptOutput to GeneratedImages using mock URLs
          const images = generateMockImagesFromPrompts({
            projectId,
            promptId: prompt.id,
            blockId: prompt.blockId,
            promptOutput: result.data,
          })

          updateImagePrompt(projectId, prompt.id, {
            generatedImages: images,
            status: 'completed',
          })
        } else {
          console.error('Image prompt generation failed:', result.error)
          alert(result.error?.message || '이미지 생성에 실패했습니다.')
        }
      } catch (error) {
        console.error('Error generating images:', error)
        alert('이미지 생성 중 오류가 발생했습니다.')
      } finally {
        setGenerating((prev) => {
          const next = new Set(prev)
          next.delete(prompt.id)
          return next
        })
      }
    },
    [projectId, blocks, updateImagePrompt]
  )

  // Handle image selection
  const handleSelectImage = useCallback(
    (promptId: string, imageId: string) => {
      selectGeneratedImage(projectId, promptId, imageId)
    },
    [projectId, selectGeneratedImage]
  )

  // Get active prompt
  const activePrompt = imagePrompts.find((p) => p.id === activePromptId)

  // Loading states
  if (!hasHydrated) {
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
    <div className="flex h-full gap-6 p-6">
      {/* Left Panel: Block Selection */}
      <section className="w-[400px] bg-white rounded-xl shadow-sm border flex flex-col h-full">
        <div className="p-5 border-b">
          <h3 className="font-bold text-sm">문단 선택</h3>
          <p className="text-xs text-gray-500 mt-1">생성할 문단을 선택하세요</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {blocks.map((block, index) => {
            const prompt = imagePrompts.find((p) => p.blockId === block.id)
            const isSelected = selectedBlockIds.has(block.id)
            const hasGeneratedImages = prompt?.generatedImages.length || 0

            return (
              <div
                key={block.id}
                onClick={() => {
                  toggleBlockSelection(block.id)
                  if (prompt) setActivePromptId(prompt.id)
                }}
                className={`p-4 flex gap-4 items-start border-b cursor-pointer transition ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="mt-1 rounded text-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                        대표 이미지
                      </span>
                    )}
                    <span className="text-xs font-bold text-gray-700 truncate">
                      {block.content.slice(0, 30)}...
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {hasGeneratedImages > 0
                      ? `${hasGeneratedImages}장 생성됨`
                      : '미생성'}
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded">
                  {index + 1}장
                </span>
              </div>
            )
          })}
        </div>
        <div className="p-4 bg-gray-50 flex justify-between items-center">
          <button
            onClick={selectAllBlocks}
            className="text-[11px] font-bold text-blue-600"
          >
            전체 선택
          </button>
          <span className="text-[11px] text-gray-600">
            {selectedBlockIds.size} / {blocks.length} 선택됨
          </span>
        </div>
      </section>

      {/* Right Panel: Generation Settings */}
      <section className="flex-1 bg-white rounded-xl shadow-sm border flex flex-col h-full overflow-y-auto">
        {activePrompt ? (
          <>
            {/* Selected Block Info */}
            <div className="p-4 bg-blue-50 m-5 rounded-lg flex items-start gap-3 border border-blue-100">
              <span className="text-lg">✏️</span>
              <div>
                <h4 className="text-xs font-bold text-blue-900">
                  선택된 문단
                </h4>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  {blocks.find((b) => b.id === activePrompt.blockId)?.content.slice(0, 50)}...
                </p>
              </div>
            </div>

            {/* Style Selection */}
            <div className="px-5 pb-6">
              <h4 className="text-xs font-bold mb-3">스타일 선택</h4>
              <ImageStyleSelector
                selectedStyle={activePrompt.style}
                onStyleChange={(style) => handleStyleChange(activePrompt.id, style)}
              />
            </div>

            {/* Prompt Editor */}
            <div className="px-5 pb-6">
              <ImagePromptEditor
                value={activePrompt.prompt}
                onChange={(prompt) => handlePromptChange(activePrompt.id, prompt)}
              />
            </div>

            {/* Ratio Selection */}
            <div className="px-5 pb-6">
              <h4 className="text-xs font-bold mb-3">비율</h4>
              <ImageRatioSelector
                selectedRatio={activePrompt.ratio}
                onRatioChange={(ratio) => handleRatioChange(activePrompt.id, ratio)}
              />
            </div>

            {/* Generate Button */}
            <div className="px-5 pb-6">
              <button
                onClick={() => handleGenerateImages(activePrompt)}
                disabled={generating.has(activePrompt.id)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg shadow-lg disabled:opacity-50"
              >
                {generating.has(activePrompt.id)
                  ? '생성 중...'
                  : '이미지 4장 생성하기 ✨'}
              </button>
            </div>

            {/* Generated Images */}
            {activePrompt.generatedImages.length > 0 && (
              <div className="p-5 border-t">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold">생성된 이미지</h2>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                    {activePrompt.generatedImages.length}장 생성완료
                  </span>
                </div>
                <GeneratedImageGrid
                  images={activePrompt.generatedImages}
                  selectedImageId={activePrompt.selectedImageId}
                  onSelect={(imageId) => handleSelectImage(activePrompt.id, imageId)}
                  loading={generating.has(activePrompt.id)}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>왼쪽에서 문단을 선택하세요</p>
          </div>
        )}
      </section>
    </div>
  )
}
