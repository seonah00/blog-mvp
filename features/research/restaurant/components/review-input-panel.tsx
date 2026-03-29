/**
 * Review Input Panel - HubSpot Enterprise Style
 * 
 * 사용자 직접 입력 리뷰 작성 패널
 * 정책: 자동 크롤링 금지, 허용된 입력만 사용
 */

'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/project-store'
import type { ReviewSourceType } from '@/types'

interface ReviewInputPanelProps {
  projectId: string
}

export function ReviewInputPanel({ projectId }: ReviewInputPanelProps) {
  const [content, setContent] = useState('')
  const [source, setSource] = useState<ReviewSourceType>('direct')
  const [tags, setTags] = useState('')
  const [rating, setRating] = useState<number | undefined>(undefined)

  const addReview = useProjectStore((state) => state.addReviewInput)
  const reviews = useProjectStore((state) => state.getReviewInputs(projectId))

  const handleSubmit = () => {
    if (!content.trim()) return

    addReview(projectId, {
      source,
      content: content.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      rating,
      author: source === 'direct' ? '작성자' : undefined,
    })

    // Reset form
    setContent('')
    setTags('')
    setRating(undefined)
  }

  const sourceOptions = [
    { value: 'direct', label: '직접 방문', icon: 'person' },
    { value: 'owner', label: '점주 제공', icon: 'store' },
    { value: 'permitted', label: '허용된 소스', icon: 'verified' },
  ] as const

  return (
    <div className="space-y-4">
      {/* Review Input Form */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>리뷰 추가</h3>
        </div>
        
        <div className="panel-body space-y-4">
          {/* Source Selection */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>입력 소스</label>
            <div className="flex flex-wrap gap-2">
              {sourceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSource(option.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    source === option.value 
                      ? 'text-white' 
                      : ''
                  }`}
                  style={{
                    backgroundColor: source === option.value ? 'var(--accent-interactive)' : 'var(--workspace-secondary)',
                    color: source === option.value ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  <span className="material-symbols-outlined text-sm">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>별점 (선택)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star === rating ? undefined : star)}
                  className="text-xl transition-colors"
                  style={{ 
                    color: rating && star <= rating ? 'var(--accent-warning)' : 'var(--border-secondary)'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>리뷰 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="방문 경험을 작성해주세요..."
              rows={4}
              className="input w-full text-sm resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>태그 (쉼표로 구분)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="메뉴, 분위기, 서비스"
              className="input w-full text-sm"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="btn-primary w-full text-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            리뷰 추가
          </button>
        </div>
      </div>

      {/* Review List */}
      {reviews.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>입력된 리뷰</h3>
            <span className="badge badge-domain">{reviews.length}개</span>
          </div>
          <div className="panel-body space-y-3">
            {reviews.map((review) => (
              <div 
                key={review.id} 
                className="p-3 rounded-md border"
                style={{ backgroundColor: 'var(--workspace-secondary)', borderColor: 'var(--border-primary)' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <SourceBadge source={review.source} />
                    {review.rating && (
                      <span style={{ color: 'var(--accent-warning)' }}>{'★'.repeat(review.rating)}</span>
                    )}
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{review.content}</p>
                {review.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {review.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ 
                          backgroundColor: 'var(--workspace-tertiary)',
                          color: 'var(--text-tertiary)'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SourceBadge({ source }: { source: ReviewSourceType }) {
  const styles: Record<ReviewSourceType, { bg: string; text: string; label: string; icon: string }> = {
    direct: { 
      bg: 'var(--accent-interactive-light)', 
      text: 'var(--accent-interactive)',
      label: '직접',
      icon: 'person'
    },
    owner: { 
      bg: 'var(--accent-secondary-light)', 
      text: 'var(--accent-secondary)',
      label: '점주',
      icon: 'store'
    },
    permitted: { 
      bg: 'var(--accent-info-light)', 
      text: 'var(--accent-info)',
      label: '허용',
      icon: 'verified'
    },
  }

  const style = styles[source]

  return (
    <span 
      className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <span className="material-symbols-outlined text-xs">{style.icon}</span>
      <span>{style.label}</span>
    </span>
  )
}
