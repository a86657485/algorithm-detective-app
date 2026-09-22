import { motion } from 'framer-motion'
import { Clock, Lock, Play, Star, Target } from 'lucide-react'
import { useGameStore, selectTotalScore } from '../../store/useGameStore'
import { useUiStore } from '../../store/useUiStore'
import { BADGES, getBadge, LEVELS } from '../../data/levels'
import { cn } from '../../lib/cn'
import { playSound } from '../../lib/sound'
import { Mascot } from '../common/Mascot'
import { ProgressBar } from '../common/ProgressBar'
import { StageLegend } from '../common/StageLegend'
import { StickyNote } from '../common/StickyNote'

/** 侦探事务所的关卡地图：五张案件卡 + 徽章墙 */
export function LevelMap() {
  const unlocked = useGameStore((s) => s.unlockedLevels)
  const progress = useGameStore((s) => s.progress)
  const badges = useGameStore((s) => s.badges)
  const goLevel = useGameStore((s) => s.goLevel)
  const playerName = useGameStore((s) => s.playerName)
  const totalScore = useGameStore(selectTotalScore)
  const closeMap = useUiStore((s) => s.closeMap)

  const finished = LEVELS.filter((l) => progress[l.id]?.finishedAt).length

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-6">
      {/* 事务所欢迎横幅 */}
      <section className="relative mb-6 overflow-hidden rounded-notebook border-2 border-zproc-light bg-white p-6 shadow-card">
        <span className="z-tape -top-2 left-12 -rotate-3" aria-hidden />
        <span className="z-tape -top-2 right-14 rotate-2" aria-hidden />
        <div className="flex flex-wrap items-center gap-6">
          <Mascot size={118} mood="happy" className="animate-floatY" />
          <div className="min-w-[260px] flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zproc">
              Case Board · 案件看板
            </p>
            <h1 className="mt-1 text-[34px] font-extrabold leading-tight text-ink">
              {playerName ? `${playerName}，今天办哪个案子？` : '先登记姓名，再挑选案件'}
            </h1>
            <p className="mt-2 max-w-[720px] text-[15px] leading-relaxed text-ink2">
              五个案件，都藏着同一个秘密：<b className="text-ink">输入 → 处理 → 输出</b>。
              每破一个案子，你就会更懂"算法"一点。
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StageLegend />
              <span className="rounded-full bg-zout-light px-3 py-1 text-xs font-bold text-zout-dark">
                累计 {totalScore} 分 · 徽章 {badges.length} / {BADGES.length}
              </span>
            </div>
          </div>
          <div className="w-full max-w-[260px]">
            <ProgressBar value={finished} max={LEVELS.length} label="办案进度" />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {BADGES.map((b) => {
                const owned = badges.includes(b.id)
                return (
                  <span
                    key={b.id}
                    title={`${b.name}：${b.desc}`}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl border-2 text-lg transition',
                      owned
                        ? 'border-zout bg-zout-light'
                        : 'border-black/5 bg-black/5 opacity-35 grayscale',
                    )}
                  >
                    {b.emoji}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 案件卡网格 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {LEVELS.map((level, i) => {
          const isUnlocked = unlocked.includes(level.id)
          const p = progress[level.id]
          const isDone = Boolean(p?.finishedAt)
          const isNow = isUnlocked && !isDone

          return (
            <motion.button
              key={level.id}
              type="button"
              disabled={!isUnlocked}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 220, damping: 22 }}
              onClick={() => {
                playSound('click')
                goLevel(level.id)
                closeMap()
              }}
              className={cn(
                'group relative flex flex-col rounded-notebook border-2 bg-white p-5 text-left shadow-card transition-all duration-200',
                isUnlocked
                  ? 'cursor-pointer border-black/5 hover:-translate-y-1 hover:border-zproc/60 hover:shadow-cardHover'
                  : 'cursor-not-allowed border-black/5 opacity-60',
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl',
                    isDone ? 'bg-zin-light' : isUnlocked ? 'bg-zproc-light' : 'bg-black/5',
                  )}
                >
                  {isUnlocked ? level.emoji : <Lock size={22} className="text-black/35" />}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[19px] font-bold leading-snug text-ink">{level.title}</h3>
                  <p className="text-[13px] text-ink2">{level.subtitle}</p>
                </div>
                {isDone ? (
                  <span className="flex shrink-0 items-center gap-0.5 text-zout">
                    {Array.from({ length: p?.stars ?? 0 }).map((_, k) => (
                      <Star key={k} size={15} fill="currentColor" strokeWidth={0} />
                    ))}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 flex items-start gap-1.5 text-[13px] leading-relaxed text-ink2">
                <Target size={14} className="mt-1 shrink-0 text-zproc" />
                {level.goal}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-dashed border-black/10 pt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-ink2">
                  <Clock size={13} />
                  约 {level.estMinutes} 分钟
                </span>
                {isDone ? (
                  <span className="rounded-full bg-zin-light px-2.5 py-1 text-xs font-bold text-zin-dark">
                    已通关 · {p?.score ?? 0} 分
                  </span>
                ) : isUnlocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zproc px-3 py-1 text-xs font-bold text-white transition group-hover:bg-zproc-dark">
                    <Play size={12} fill="currentColor" strokeWidth={0} />
                    {isNow ? '开始办案' : '继续'}
                  </span>
                ) : (
                  <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-bold text-black/40">
                    需要先完成上一关
                  </span>
                )}
              </div>
            </motion.button>
          )
        })}

        <StickyNote tone="tape" tape title="侦探手册 · 三区色卡" className="self-stretch">
          <ul className="space-y-2">
            <li>
              <b className="text-zin-dark">📥 输入</b>：做这件事之前要准备的东西。
            </li>
            <li>
              <b className="text-zproc-dark">⚙️ 处理</b>：按照步骤、一步一步地做。
            </li>
            <li>
              <b className="text-zout-dark">📤 输出</b>：做完之后得到的结果。
            </li>
          </ul>
          <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs">
            小提示：算法不一定要有输入。比如自动感应灯，它自己"看见"天黑了就开始亮——这就是"零输入"。
          </p>
        </StickyNote>
      </div>

      {badges.length > 0 ? (
        <p className="mt-5 text-center text-sm text-ink2">
          最新徽章：
          <b className="text-ink">{getBadge(badges[badges.length - 1])?.name}</b>
        </p>
      ) : null}
    </div>
  )
}
