'use client'

interface ImagePromptEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function ImagePromptEditor({
  value,
  onChange,
  label = '이미지 프롬프트',
}: ImagePromptEditorProps) {
  return (
    <div>
      <label className="text-xs font-bold block mb-2">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-24 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs focus:ring-1 focus:ring-blue-500 outline-none resize-none"
        placeholder="프롬프트를 입력하세요..."
      />
    </div>
  )
}
