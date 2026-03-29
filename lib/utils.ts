/**
 * 유틸리티 함수
 */

/**
 * 고유 ID 생성 (prefix 지원)
 * 형식: {prefix}_{timestamp}_{random}
 */
export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${random}`
}

/**
 * 고유 ID 생성 (간단한 구현, 이전 버전 호환)
 * 형식: timestamp-random
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 현재 시간을 ISO 문자열로 반환
 */
export function now(): string {
  return new Date().toISOString()
}

/**
 * 현재 시간을 ISO 문자열로 반환 (alias)
 */
export function nowIso(): string {
  return new Date().toISOString()
}

/**
 * 단어 수 계산
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

/**
 * 키워드 문자열 파싱
 * 쉼표로 구분된 키워드를 배열로 변환
 */
export function parseKeywords(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * 문자열 자르기 (최대 길이)
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * 배열 토글 (추가/제거)
 */
export function toggleArrayItem<T>(array: T[], item: T): T[] {
  const index = array.indexOf(item)
  if (index === -1) {
    return [...array, item]
  }
  return array.filter((_, i) => i !== index)
}

/**
 * 상대 시간 포맷팅
 * "방금 전", "2분 전", "1시간 전" 등으로 변환
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)

  if (diffInSeconds < 10) {
    return '방금 전'
  }

  if (diffInSeconds < 60) {
    return `${diffInSeconds}초 전`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}일 전`
  }

  return target.toLocaleDateString('ko-KR')
}
