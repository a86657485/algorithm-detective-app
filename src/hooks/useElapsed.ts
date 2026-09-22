import { useEffect, useRef, useState } from 'react'

/** 秒表：running 为 true 时开始计时，返回值单位是秒（用于界面展示） */
export function useElapsed(running: boolean, resetKey?: string | number): number {
  const [seconds, setSeconds] = useState(0)
  const startRef = useRef<number>(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    setSeconds(0)
  }, [resetKey])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running, resetKey])

  return seconds
}

/** 把毫秒格式化成"1 分 05 秒" */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  if (m === 0) return `${s} 秒`
  return `${m} 分 ${String(s).padStart(2, '0')} 秒`
}
