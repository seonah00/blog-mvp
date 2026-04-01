'use client'

import { useEffect, useState } from 'react'
import { formatRelativeTime } from '@/lib/utils'

interface LastSavedTimeProps {
  lastSavedAt: string | undefined
}

export function LastSavedTime({ lastSavedAt }: LastSavedTimeProps) {
  const [displayTime, setDisplayTime] = useState<string>('')

  useEffect(() => {
    if (!lastSavedAt) {
      setDisplayTime('')
      return
    }

    const updateDisplay = () => {
      setDisplayTime(formatRelativeTime(lastSavedAt))
    }

    updateDisplay()

    // 10초마다 업데이트 (더 자주 갱신)
    const interval = setInterval(updateDisplay, 10000)

    return () => clearInterval(interval)
  }, [lastSavedAt])

  if (!displayTime) {
    return null
  }

  return (
    <span className="text-sm text-gray-500">
      마지막 저장: {displayTime}
    </span>
  )
}
