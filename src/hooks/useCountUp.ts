import { useEffect, useRef, useState } from 'react'

/** 数字滚动动画：得分、面积、结果值变化时更有反馈感 */
export function useCountUp(target: number, duration = 620): number {
  const [display, setDisplay] = useState(target)
  const shownRef = useRef(target)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const from = shownRef.current
    if (from === target) return

    const startAt = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - startAt) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const value = from + (target - from) * eased
      setDisplay(value)
      shownRef.current = value
      if (p < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        shownRef.current = target
        setDisplay(target)
      }
    }

    frameRef.current = requestAnimationFrame(step)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      shownRef.current = target
    }
  }, [target, duration])

  return display
}
