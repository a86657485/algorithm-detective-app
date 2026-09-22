import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { playSound } from '../../lib/sound'
import { GameButton } from '../common/GameButton'
import { Mascot } from '../common/Mascot'

export interface StoryLine {
  who: 'mascot' | 'narrator'
  text: string
  mood?: 'normal' | 'happy' | 'think'
}

interface StoryDialogProps {
  lines: StoryLine[]
  /** 全部台词读完后点按钮触发 */
  onFinish: () => void
  finishLabel?: string
  className?: string
}

const TYPE_INTERVAL = 26

/**
 * 剧情对话框：打字机逐字显示。
 * 点一下正文可以立刻显示整句，再点一下翻到下一句；空格 / 回车同样有效，
 * 方便老师站在讲台用键盘控场。
 */
export function StoryDialog({ lines, onFinish, finishLabel = '继续', className }: StoryDialogProps) {
  const [index, setIndex] = useState(0)
  const [shown, setShown] = useState(0)
  const timerRef = useRef<number | null>(null)

  const safeIndex = Math.min(index, lines.length - 1)
  const current = lines[safeIndex]
  const isLast = safeIndex >= lines.length - 1
  const completed = shown >= current.text.length
  const mood = current.mood ?? (current.who === 'mascot' ? 'normal' : 'think')

  useEffect(() => {
    setShown(0)
  }, [safeIndex])

  useEffect(() => {
    if (completed) return
    timerRef.current = window.setInterval(() => {
      setShown((n) => (n >= current.text.length ? n : n + 1))
    }, TYPE_INTERVAL)
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
    }
  }, [current.text, completed])

  const advance = useCallback(() => {
    if (!completed) {
      setShown(current.text.length)
      return
    }
    if (isLast) {
      onFinish()
      return
    }
    playSound('pop')
    setIndex((i) => i + 1)
  }, [completed, current.text.length, isLast, onFinish])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance])

  const visible = useMemo(() => current.text.slice(0, shown), [current.text, shown])

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-end gap-4">
        <motion.div
          key={`${safeIndex}-${mood}`}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 20 }}
          className="hidden shrink-0 sm:block"
        >
          <Mascot size={132} mood={mood} className={cn(!completed && 'animate-floatY')} />
        </motion.div>

        <div className="relative min-h-[172px] flex-1">
          <button
            type="button"
            onClick={advance}
            className="relative block w-full cursor-pointer rounded-3xl border-2 border-zproc-light bg-white px-6 py-5 text-left shadow-card transition hover:shadow-cardHover"
          >
            <span className="z-tape -top-3 left-8 -rotate-3" aria-hidden />
            <span
              className={cn(
                'mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold',
                current.who === 'mascot'
                  ? 'bg-zproc-light text-zproc-dark'
                  : 'bg-zin-light text-zin-dark',
              )}
            >
              {current.who === 'mascot' ? '侦探阿算' : '案件旁白'}
            </span>
            <p className="min-h-[64px] text-[19px] leading-relaxed text-ink">
              {visible}
              {!completed ? (
                <span className="ml-0.5 inline-block h-[19px] w-2 animate-pulse bg-zproc align-middle" />
              ) : null}
            </p>
            <span className="absolute bottom-3 right-4 text-xs font-semibold text-ink2">
              第 {safeIndex + 1} / {lines.length} 句 · 点击可加速
            </span>
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        {!isLast ? (
          <GameButton
            variant="ghost"
            size="sm"
            icon={<span className="text-base">⏭</span>}
            onClick={() => {
              playSound('click')
              setIndex(lines.length - 1)
            }}
          >
            跳过剧情
          </GameButton>
        ) : null}
        <GameButton size="lg" variant={isLast ? 'gold' : 'secondary'} onClick={advance} className="min-w-[150px]">
          {isLast ? finishLabel : '下一句'}
        </GameButton>
      </div>
    </div>
  )
}
