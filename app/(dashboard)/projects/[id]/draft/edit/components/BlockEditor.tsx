'use client'

import { useState, useRef, useCallback } from 'react'

export type BlockType = 'heading' | 'paragraph' | 'quote' | 'list'

export interface Block {
  id: string
  type: BlockType
  content: string
}

interface BlockEditorProps {
  block: Block
  onChange: (id: string, content: string) => void
  onFocus?: (id: string) => void
  isActive?: boolean
}

export function BlockEditor({
  block,
  onChange,
  onFocus,
  isActive = false,
}: BlockEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [localContent, setLocalContent] = useState(block.content)

  // TODO: heading이나 매우 짧은 문단 처리 개선 필요
  // 현재는 모든 block을 textarea로 처리하고 있음
  // 향후 heading은 h2/h3 태그로, 짧은 문단은 특별한 UI로 처리할 수 있음
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value
      setLocalContent(newContent)
      onChange(block.id, newContent)
    },
    [block.id, onChange]
  )

  const handleFocus = useCallback(() => {
    onFocus?.(block.id)
  }, [block.id, onFocus])

  // block 타입에 따른 스타일
  const getBlockStyles = () => {
    switch (block.type) {
      case 'heading':
        return 'text-2xl font-bold text-gray-900'
      case 'quote':
        return 'border-l-4 border-gray-300 pl-4 italic text-gray-700'
      case 'list':
        return 'list-disc pl-5'
      default:
        return 'text-gray-800'
    }
  }

  return (
    <div
      className={`group relative rounded-xl transition ${
        isActive ? 'bg-blue-50/50' : 'hover:bg-gray-50'
      }`}
    >
      {/* block 타입 표시 (호버 시) */}
      <div className="absolute -left-8 top-2 hidden opacity-0 transition group-hover:opacity-100 lg:block">
        <span className="text-xs font-medium text-gray-400">
          {block.type === 'heading' && 'H'}
          {block.type === 'paragraph' && '¶'}
          {block.type === 'quote' && '"'}
          {block.type === 'list' && '•'}
        </span>
      </div>

      <textarea
        ref={textareaRef}
        value={localContent}
        onChange={handleChange}
        onFocus={handleFocus}
        rows={Math.max(3, Math.ceil(localContent.length / 40))}
        className={`w-full resize-none rounded-xl border-0 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 ${getBlockStyles()}`}
        placeholder={
          block.type === 'heading'
            ? '제목을 입력하세요...'
            : '내용을 입력하세요...'
        }
      />
    </div>
  )
}

// block 분리 유틸리티
export function splitContentIntoBlocks(content: string): Block[] {
  const lines = content.split('\n')
  const blocks: Block[] = []
  let currentBlock: string[] = []
  let blockId = 0

  const flushBlock = (type: BlockType = 'paragraph') => {
    if (currentBlock.length > 0) {
      blocks.push({
        id: `block-${blockId++}`,
        type,
        content: currentBlock.join('\n'),
      })
      currentBlock = []
    }
  }

  for (const line of lines) {
    // heading 감지 (# 로 시작)
    if (line.startsWith('# ')) {
      flushBlock()
      blocks.push({
        id: `block-${blockId++}`,
        type: 'heading',
        content: line.slice(2),
      })
    } else if (line.startsWith('## ')) {
      flushBlock()
      blocks.push({
        id: `block-${blockId++}`,
        type: 'heading',
        content: line.slice(3),
      })
    } else if (line.startsWith('### ')) {
      flushBlock()
      blocks.push({
        id: `block-${blockId++}`,
        type: 'heading',
        content: line.slice(4),
      })
    } else if (line.startsWith('> ')) {
      flushBlock()
      blocks.push({
        id: `block-${blockId++}`,
        type: 'quote',
        content: line.slice(2),
      })
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      flushBlock()
      blocks.push({
        id: `block-${blockId++}`,
        type: 'list',
        content: line,
      })
    } else if (line === '' && currentBlock.length > 0) {
      // 빈 줄을 만나면 현재 block 종료
      flushBlock()
    } else {
      currentBlock.push(line)
    }
  }

  // 남은 내용 flush
  flushBlock()

  return blocks
}

// blocks를 content로 병합
export function mergeBlocksIntoContent(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'heading':
          return `# ${block.content}`
        case 'quote':
          return `> ${block.content}`
        case 'list':
          return block.content
        default:
          return block.content
      }
    })
    .join('\n\n')
}
