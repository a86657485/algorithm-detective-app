import { cn } from '../../lib/cn'

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  /** 右侧显示的文字，例如 "3 / 5" */
  suffix?: string
  className?: string
}

export function ProgressBar({ value, max, label, suffix, className }: ProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      {label || suffix ? (
        <div className="mb-1 flex items-baseline justify-between text-xs font-semibold text-ink2">
          <span>{label}</span>
          <span className="tabular-nums">{suffix ?? `${value} / ${max}`}</span>
        </div>
      ) : null}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-zin via-zproc to-zout transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

interface StepDotsProps {
  total: number
  current: number
  /** 已完成的步骤索引集合 */
  done?: number[]
  className?: string
}

/** 关卡内步骤指示点 */
export function StepDots({ total, current, done = [], className }: StepDotsProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {Array.from({ length: total }).map((_, i) => {
        const isDone = done.includes(i)
        const isNow = i === current
        return (
          <span
            key={i}
            className={cn(
              'rounded-full transition-all duration-300',
              isNow
                ? 'h-2.5 w-6 bg-zproc'
                : isDone
                  ? 'h-2.5 w-2.5 bg-zin'
                  : 'h-2.5 w-2.5 bg-black/20',
            )}
          />
        )
      })}
    </div>
  )
}
