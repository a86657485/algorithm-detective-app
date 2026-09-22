import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'tape' | 'blue' | 'green' | 'orange' | 'plain'

const TONE: Record<Tone, string> = {
  tape: 'bg-[#FFF9DC] border-[#EBDCA0]',
  blue: 'bg-zproc-pale border-zproc-light',
  green: 'bg-zin-pale border-zin-light',
  orange: 'bg-zout-pale border-zout-light',
  plain: 'bg-white border-black/10',
}

interface StickyNoteProps {
  title?: string
  icon?: ReactNode
  tone?: Tone
  /** 右上角斜贴的胶带 */
  tape?: boolean
  className?: string
  children: ReactNode
}

/** 便签卡片：右上角带一小段胶带，用来承载知识点、提示和解题思路 */
export function StickyNote({
  title,
  icon,
  tone = 'tape',
  tape = false,
  className,
  children,
}: StickyNoteProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border-2 px-4 py-3.5 shadow-card',
        TONE[tone],
        className,
      )}
    >
      {tape ? (
        <span className="z-tape -top-3 left-1/2 -translate-x-1/2 -rotate-2" aria-hidden />
      ) : null}
      {title ? (
        <div className="mb-1.5 flex items-center gap-2 text-[15px] font-bold text-ink">
          {icon}
          <span>{title}</span>
        </div>
      ) : null}
      <div className="text-sm leading-relaxed text-ink2">{children}</div>
    </div>
  )
}
