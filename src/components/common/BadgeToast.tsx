import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export interface ToastPayload {
  key: number
  emoji: string
  title: string
  desc?: string
  tone?: 'badge' | 'info' | 'warn'
}

const TONE: Record<NonNullable<ToastPayload['tone']>, string> = {
  badge: 'from-zout to-[#F2B33D]',
  info: 'from-zproc to-zin',
  warn: 'from-[#F97316] to-[#EF4444]',
}

interface BadgeToastProps {
  toast: ToastPayload | null
  onClose: () => void
  /** 自动关闭时间（毫秒），设为 0 表示不自动关闭 */
  autoCloseMs?: number
}

/** 徽章 / 得分弹出的轻提示，出现在右上角，不打断操作 */
export function BadgeToast({ toast, onClose, autoCloseMs = 3600 }: BadgeToastProps) {
  useEffect(() => {
    if (!toast || autoCloseMs <= 0) return
    const timer = window.setTimeout(onClose, autoCloseMs)
    return () => window.clearTimeout(timer)
  }, [toast, autoCloseMs, onClose])

  return (
    <div className="pointer-events-none fixed right-5 top-20 z-50 flex w-[300px] flex-col gap-2">
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-gradient-to-br ${TONE[toast.tone ?? 'badge']} p-[2px] shadow-cardHover`}
          >
            <div className="flex items-start gap-3 rounded-[14px] bg-white/95 px-4 py-3">
              <span className="text-3xl leading-none">{toast.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-ink">{toast.title}</p>
                {toast.desc ? <p className="mt-0.5 text-xs text-ink2">{toast.desc}</p> : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭提示"
                className="cursor-pointer rounded-lg p-1 text-ink2 transition hover:bg-black/5 hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
