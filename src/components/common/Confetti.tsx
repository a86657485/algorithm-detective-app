import { motion } from 'framer-motion'
import { useMemo } from 'react'

const COLORS = ['#6AA84F', '#4A86E8', '#E69138', '#F2B33D', '#E06666', '#8E7CC3']

interface ConfettiProps {
  /** 每次触发换一个 key，动画会重新播放 */
  fireKey: number
  count?: number
}

/** 纯 DOM 撒花，不依赖任何图片资源，离线机房也能正常播放 */
export function Confetti({ fireKey, count = 42 }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: `${fireKey}-${i}`,
        x: Math.random() * 100,
        delay: Math.random() * 0.35,
        duration: 1.5 + Math.random() * 1.1,
        rotate: Math.random() * 360,
        size: 7 + Math.random() * 9,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.55,
      })),
    [fireKey, count],
  )

  if (!fireKey) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '105vh', rotate: p.rotate + 540, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          className="absolute top-0 block"
          style={{
            width: p.size,
            height: p.round ? p.size : p.size * 1.8,
            borderRadius: p.round ? '50%' : 3,
            background: p.color,
          }}
        />
      ))}
    </div>
  )
}
