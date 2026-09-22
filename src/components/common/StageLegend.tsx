import type { Stage } from '../../types/game'
import { STAGE_THEMES } from '../../data/levels'
import { cn } from '../../lib/cn'

/** 三区图例：在顶栏、底栏和结算页反复出现，强化"三色 = 三个环节" */
export function StageLegend({ className, compact = false }: { className?: string; compact?: boolean }) {
  const stages: Stage[] = ['input', 'process', 'output']
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {stages.map((s, i) => {
        const t = STAGE_THEMES[s]
        return (
          <div key={s} className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
                t.chip,
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', t.bg)} />
              {t.label}
            </span>
            {!compact && i < stages.length - 1 ? <span className="text-xs text-ink2">→</span> : null}
          </div>
        )
      })}
    </div>
  )
}

export function StageChip({ stage, className }: { stage: Stage; className?: string }) {
  const t = STAGE_THEMES[stage]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold', t.chip, className)}>
      {t.emoji} {t.label}
    </span>
  )
}
