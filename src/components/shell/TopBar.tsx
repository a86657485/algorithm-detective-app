import { LayoutGrid, RotateCcw, Search, Trophy, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { useGameStore, selectTotalScore } from '../../store/useGameStore'
import { useUiStore } from '../../store/useUiStore'
import { getLevel, LEVEL_ORDER } from '../../data/levels'
import { playSound } from '../../lib/sound'
import { GameButton } from '../common/GameButton'
import { ProgressBar } from '../common/ProgressBar'
import { cn } from '../../lib/cn'

/** 顶栏：侦探名 · 当前进度 · 得分 · 音效开关 · 重置 */
export function TopBar() {
  const playerName = useGameStore((s) => s.playerName)
  const classId = useGameStore((s) => s.classId)
  const currentLevel = useGameStore((s) => s.currentLevel)
  const progress = useGameStore((s) => s.progress)
  const soundOn = useGameStore((s) => s.soundOn)
  const toggleSound = useGameStore((s) => s.toggleSound)
  const resetAll = useGameStore((s) => s.resetAll)
  const totalScore = useGameStore(selectTotalScore)
  const openMap = useUiStore((s) => s.openMap)
  const [confirmReset, setConfirmReset] = useState(false)

  const level = getLevel(currentLevel)
  const finishedCount = LEVEL_ORDER.filter((id) => progress[id]?.finishedAt).length

  return (
    <header className="no-print fixed inset-x-0 top-0 z-30 border-b-2 border-black/5 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] w-full max-w-[1500px] items-center gap-4 px-5">
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-zproc to-zin text-white shadow-card">
            <Search size={22} strokeWidth={2.6} />
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-extrabold tracking-tight text-ink">算法小侦探事务所</p>
            <p className="text-[11px] text-ink2">
              {playerName ? `${classId ? `${classId} 班 · ` : ''}${playerName}` : '等你来入职'}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
          <span
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-bold',
              'bg-zproc-light text-zproc-dark',
            )}
          >
            {level.emoji} {level.title}
          </span>
          <ProgressBar
            value={finishedCount}
            max={LEVEL_ORDER.length}
            suffix={`已通关 ${finishedCount} / ${LEVEL_ORDER.length}`}
            className="max-w-[320px]"
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zout-light px-3 py-1.5 text-sm font-bold text-zout-dark tabular-nums">
            <Trophy size={15} strokeWidth={2.6} />
            {totalScore} 分
          </span>

          <button
            type="button"
            onClick={() => {
              playSound('click')
              openMap()
            }}
            title="打开案件看板"
            aria-label="打开案件看板"
            className="flex h-10 cursor-pointer items-center gap-1.5 rounded-2xl border-2 border-black/10 bg-white px-3 text-sm font-bold text-ink2 transition hover:border-zproc hover:text-zproc-dark"
          >
            <LayoutGrid size={17} />
            看板
          </button>

          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundOn ? '关闭音效' : '打开音效'}
            title={soundOn ? '关闭音效' : '打开音效'}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border-2 border-black/10 bg-white text-ink2 transition hover:border-zproc/60 hover:text-zproc-dark"
          >
            {soundOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>

          {confirmReset ? (
            <div className="flex items-center gap-1.5">
              <GameButton size="sm" variant="danger" onClick={resetAll}>
                确认清空
              </GameButton>
              <GameButton size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                取消
              </GameButton>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              aria-label="重新开始"
              title="重新开始（清空进度）"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border-2 border-black/10 bg-white text-ink2 transition hover:border-red-400 hover:text-red-500"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
