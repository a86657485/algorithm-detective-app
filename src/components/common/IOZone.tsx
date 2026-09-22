import type { ReactNode } from 'react'
import type { Stage } from '../../types/game'
import type { ZoneHandlers } from '../../hooks/useDragDrop'
import { STAGE_THEMES } from '../../data/levels'
import { cn } from '../../lib/cn'

interface IOZoneProps {
  stage: Stage
  /** 覆盖默认标题，例如"输入：准备原材料" */
  title?: string
  /** 标题右侧的小标签，例如数量 */
  badge?: ReactNode
  /** 区域下方的即时反馈 */
  footer?: ReactNode
  /** 拖拽悬停高亮 */
  hot?: boolean
  /** 校验失败时抖动 */
  shake?: boolean
  /** 拖放 / 点击放置的事件处理器，由 useDragDrop 提供 */
  handlers?: ZoneHandlers
  className?: string
  children: ReactNode
}

/**
 * 单个区域卡片——三区版式的积木。
 * 编号徽标、边框配色、标题样式全部由 stage 决定，保证全应用"三色 = 三个环节"。
 */
export function IOZone({
  stage,
  title,
  badge,
  footer,
  hot = false,
  shake = false,
  handlers,
  className,
  children,
}: IOZoneProps) {
  const theme = STAGE_THEMES[stage]

  return (
    <section
      {...handlers}
      className={cn(
        'relative flex min-h-[240px] flex-col rounded-notebook border-2 bg-white shadow-card transition-all duration-200',
        theme.border,
        hot && 'z-drop-hot scale-[1.012] shadow-cardHover',
        hot && theme.ring,
        shake && 'animate-shakeX',
        className,
      )}
    >
      <header
        className={cn(
          'flex items-center gap-3 rounded-t-[16px] border-b-2 px-4 py-3',
          theme.border,
          theme.bgSoft,
        )}
      >
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm',
            theme.bg,
          )}
        >
          {theme.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={cn('truncate text-[19px] font-bold leading-tight', theme.text)}>
            {title ?? theme.label}
          </h3>
          <p className="truncate text-[13px] text-ink2">{theme.hint}</p>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </header>

      <div className="z-scroll flex flex-1 flex-wrap content-start gap-2.5 overflow-y-auto p-4">
        {children}
      </div>

      {footer ? (
        <footer className={cn('rounded-b-[16px] border-t-2 px-4 py-2.5 text-sm', theme.border, theme.bgSoft, theme.text)}>
          {footer}
        </footer>
      ) : null}
    </section>
  )
}
