'use client'

interface ImageRatioSelectorProps {
  selectedRatio: string
  onRatioChange: (ratio: string) => void
  compact?: boolean
}

const ratios = [
  { id: '16:9', label: '16:9 와이드' },
  { id: '1:1', label: '1:1 정사각형' },
  { id: '9:16', label: '9:16 세로' },
]

export function ImageRatioSelector({
  selectedRatio,
  onRatioChange,
  compact = false,
}: ImageRatioSelectorProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {ratios.map((ratio) => (
          <button
            key={ratio.id}
            onClick={() => onRatioChange(ratio.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
              selectedRatio === ratio.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {ratio.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      {ratios.map((ratio) => (
        <button
          key={ratio.id}
          onClick={() => onRatioChange(ratio.id)}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition ${
            selectedRatio === ratio.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {ratio.id}
        </button>
      ))}
    </div>
  )
}
