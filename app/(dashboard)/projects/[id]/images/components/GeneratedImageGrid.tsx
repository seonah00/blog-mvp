'use client'

import { GeneratedImage } from '@/types'

interface GeneratedImageGridProps {
  images: GeneratedImage[]
  selectedImageId?: string
  onSelect: (imageId: string) => void
  loading?: boolean
}

export function GeneratedImageGrid({
  images,
  selectedImageId,
  onSelect,
  loading = false,
}: GeneratedImageGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative rounded-xl overflow-hidden border bg-gray-100 animate-pulse"
          >
            <div className="aspect-video" />
          </div>
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">이미지를 생성해주세요</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {images.map((image, index) => (
        <div
          key={image.id}
          onClick={() => onSelect(image.id)}
          className={`relative rounded-xl overflow-hidden cursor-pointer transition ${
            selectedImageId === image.id
              ? 'ring-2 ring-blue-600 shadow-lg'
              : 'border border-gray-200 hover:shadow-md'
          }`}
        >
          <div className="aspect-video bg-gray-100">
            <img
              src={image.url}
              alt={`Generated ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          {selectedImageId === image.id && (
            <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          <div
            className={`px-4 py-3 ${
              selectedImageId === image.id ? 'bg-blue-50' : 'bg-white'
            }`}
          >
            <span
              className={`text-xs ${
                selectedImageId === image.id
                  ? 'font-bold text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              이미지 {index + 1}
              {selectedImageId === image.id && (
                <span className="ml-2 text-[10px] uppercase">선택됨</span>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
