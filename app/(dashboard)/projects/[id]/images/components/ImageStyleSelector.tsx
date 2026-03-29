'use client'

interface ImageStyleSelectorProps {
  selectedStyle: string
  onStyleChange: (style: string) => void
  compact?: boolean
}

const styles = [
  { id: 'realistic', label: 'Realistic' },
  { id: 'illustration', label: 'Illustration' },
  { id: 'infographic', label: 'Infographic' },
  { id: 'minimal', label: 'Minimal' },
]

export function ImageStyleSelector({
  selectedStyle,
  onStyleChange,
  compact = false,
}: ImageStyleSelectorProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onStyleChange(style.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
              selectedStyle === style.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {styles.map((style) => (
        <div
          key={style.id}
          onClick={() => onStyleChange(style.id)}
          className={`cursor-pointer border rounded-lg p-2 transition-all ${
            selectedStyle === style.id
              ? 'border-2 border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-blue-400'
          }`}
        >
          <div className="aspect-video rounded bg-gray-100 overflow-hidden mb-2 relative">
            {selectedStyle === style.id && (
              <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
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
          </div>
          <span
            className={`text-[10px] text-center block ${
              selectedStyle === style.id
                ? 'font-bold text-blue-600'
                : 'font-medium text-gray-600'
            }`}
          >
            {style.label}
          </span>
        </div>
      ))}
    </div>
  )
}
