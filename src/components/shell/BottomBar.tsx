import { Lightbulb } from 'lucide-react'
import { useGameStore } from '../../store/useGameStore'
import { getLevel, LEVEL_ORDER } from '../../data/levels'
import { StageLegend } from '../common/StageLegend'
import { cn } from '../../lib/cn'

/** 底栏：三区图例 + 本关知识要点 + 关卡导航点 */
export function BottomBar() {
  const currentLevel = useGameStore((s) => s.currentLevel)
  const goLevel = useGameStore((s) => s.goLevel)
  const unlocked = useGameStore((s) => s.unlockedLevels)
  const progress = useGameStore((s) => s.progress)
  const level = getLevel(currentLevel)

  return (
    <footer className="no-print fixed inset-x-0 bottom-0 z-30 border-t-2 border-black/5 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] w-full max-w-[1500px] items-center gap-4 px-5">
        <StageLegend className="hidden shrink-0 md:flex" />

        <div className="flex min-w-0 flex-1 items-center gap-2 justify-center md:justify-start">
          <Lightbulb size={16} className="shrink-0 text-zout" strokeWidth={2.6} />
          <p className="truncate text-[13px] text-ink2">
            <span className="font-bold text-ink">本关要点：</span>
            {level.point}
          </p>
        </div>

        <nav className="flex shrink-0 items-center gap-1.5" aria-label="关卡导航">
          {LEVEL_ORDER.map((id) => {
            const meta = getLevel(id)
            const isUnlocked = unlocked.includes(id)
            const isDone = Boolean(progress[id]?.finishedAt)
            const isNow = id === currentLevel
            return (
              <button
                key={id}
                type="button"
                disabled={!isUnlocked}
                title={isUnlocked ? meta.title : '先完成前面的关卡'}
                aria-label={meta.title}
                onClick={() => goLevel(id)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm transition',
                  isNow
                    ? 'scale-110 border-zproc bg-zproc text-white shadow-card'
                    : isDone
                      ? 'border-zin bg-zin-light text-zin-dark'
                      : isUnlocked
                        ? 'cursor-pointer border-black/10 bg-white text-ink2 hover:border-zproc/60'
                        : 'cursor-not-allowed border-black/5 bg-black/5 text-black/25',
                )}
              >
                {isDone ? '✓' : meta.index}
              </button>
            )
          })}
        </nav>
      </div>
    </footer>
  )
}
