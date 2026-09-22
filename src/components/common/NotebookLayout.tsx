import type { ReactNode } from 'react'
import type { Stage } from '../../types/game'
import type { ZoneHandlers } from '../../hooks/useDragDrop'
import { STAGE_THEMES } from '../../data/levels'
import { cn } from '../../lib/cn'
import { IOZone } from './IOZone'
import { ArrowRight } from 'lucide-react'

export interface ZoneSpec {
  stage: Stage
  title?: string
  badge?: ReactNode
  footer?: ReactNode
  hot?: boolean
  shake?: boolean
  /** 需要支持拖放时，把 useDragDrop 的 zoneHandlers 传进来 */
  handlers?: ZoneHandlers
  children: ReactNode
}

interface NotebookLayoutProps {
  zones: ZoneSpec[]
  /** 是否显示三区之间的箭头 */
  showArrows?: boolean
  className?: string
}

/**
 * 输入 → 处理 → 输出 三区版式。
 * 这是本应用的核心视觉语言：每一关、以及结算页的任务单，都复用同一套结构，
 * 让学生在反复操作中把"三个环节"变成条件反射。
 */
export function NotebookLayout({ zones, showArrows = true, className }: NotebookLayoutProps) {
  return (
    <div
      className={cn(
        'grid gap-3 lg:gap-4',
        zones.length === 3 ? 'grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr]' : 'grid-cols-1',
        className,
      )}
    >
      {zones.map((zone, i) => (
        <ZoneWithArrow
          key={zone.stage}
          zone={zone}
          showArrow={showArrows && i < zones.length - 1 && zones.length === 3}
        />
      ))}
    </div>
  )
}

function ZoneWithArrow({ zone, showArrow }: { zone: ZoneSpec; showArrow: boolean }) {
  return (
    <>
      <IOZone
        stage={zone.stage}
        title={zone.title}
        badge={zone.badge}
        footer={zone.footer}
        hot={zone.hot}
        shake={zone.shake}
        handlers={zone.handlers}
      >
        {zone.children}
      </IOZone>
      {showArrow ? (
        <div className="flex items-center justify-center py-1 lg:py-0">
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm',
              STAGE_THEMES['process'].bg,
            )}
            aria-hidden
          >
            <ArrowRight size={20} strokeWidth={2.6} className="rotate-90 lg:rotate-0" />
          </span>
        </div>
      ) : null}
    </>
  )
}
