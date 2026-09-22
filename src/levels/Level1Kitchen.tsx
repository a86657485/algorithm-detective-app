import { motion } from 'framer-motion'
import { ArrowRight, Check, Lightbulb, RotateCcw, Undo2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Stage } from '../types/game'
import {
  KITCHEN_CARDS,
  KITCHEN_STEP_ORDER,
  KITCHEN_STEPS,
  KITCHEN_STEPS_SCRAMBLED,
} from '../data/kitchen'
import { getLevel } from '../data/levels'
import { useGameStore } from '../store/useGameStore'
import { toastBadge, useUiStore } from '../store/useUiStore'
import { playSound } from '../lib/sound'
import { cn } from '../lib/cn'
import { moveItem, useDragDrop, useReorder } from '../hooks/useDragDrop'
import { useElapsed } from '../hooks/useElapsed'
import { GameButton } from '../components/common/GameButton'
import { NotebookLayout } from '../components/common/NotebookLayout'
import { StickyNote } from '../components/common/StickyNote'
import { LevelFrame } from '../components/shell/LevelFrame'

const ZONE_TITLE: Record<Stage, string> = {
  input: '输入：准备原材料',
  process: '处理：照着菜谱炒',
  output: '输出：端上那盘菜',
}

const ALL_IDS = KITCHEN_CARDS.map((c) => c.id)

export function Level1Kitchen() {
  const completeLevel = useGameStore((s) => s.completeLevel)
  const addRecord = useGameStore((s) => s.addRecord)
  const addBadge = useGameStore((s) => s.addBadge)
  const goLevel = useGameStore((s) => s.goLevel)
  const fireConfetti = useUiStore((s) => s.fireConfetti)
  const unlocked = useGameStore((s) => s.unlockedLevels)

  const elapsed = useElapsed(true, 'kitchen')
  const [phase, setPhase] = useState<'sort' | 'order'>('sort')
  const [placed, setPlaced] = useState<Record<string, Stage>>({})
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null)
  const [shakeZone, setShakeZone] = useState<Stage | null>(null)
  const [mistakes, setMistakes] = useState(0)

  const [order, setOrder] = useState<string[]>(KITCHEN_STEPS_SCRAMBLED)
  const [orderTries, setOrderTries] = useState(0)
  const [orderOk, setOrderOk] = useState(false)

  const pool = useMemo(() => ALL_IDS.filter((id) => !placed[id]), [placed])
  const placedCount = ALL_IDS.length - pool.length

  const { activeId, hotZone, cardHandlers, zoneHandlers, clear, select } =
    useDragDrop<Stage>((cardId, zone) => {
    const card = KITCHEN_CARDS.find((c) => c.id === cardId)
    if (!card) return
    if (card.zone === zone) {
      playSound('pop')
      setPlaced((prev) => ({ ...prev, [cardId]: zone }))
      setFeedback({ text: card.why, ok: true })
      if (placedCount + 1 === ALL_IDS.length) {
        playSound('success')
        fireConfetti()
        setPhase('order')
      }
      return
    }
    playSound('error')
    setMistakes((m) => m + 1)
    setShakeZone(zone)
    window.setTimeout(() => setShakeZone(null), 520)
    setFeedback({ text: card.wrongTip, ok: false })
  })

  const reorder = useReorder((from, to) => {
    setOrder((o) => moveItem(o, from, to))
    if (orderOk) setOrderOk(false)
  })

  const orderCorrect = order.every((id, i) => id === KITCHEN_STEP_ORDER[i])

  const takeBack = (cardId: string) => {
    playSound('click')
    setPlaced((prev) => {
      const next = { ...prev }
      delete next[cardId]
      return next
    })
    setFeedback(null)
  }

  const checkOrder = () => {
    setOrderTries((t) => t + 1)
    if (orderCorrect) {
      setOrderOk(true)
      playSound('success')
      fireConfetti()
      return
    }
    playSound('error')
    setFeedback({
      text: '顺序还不太对。想一想：是不是应该先把材料处理好，再下锅？',
      ok: false,
    })
  }

  const finishLevel = () => {
    const penalty = Math.min(20, mistakes * 2 + orderTries * 2)
    const score = Math.max(20, 60 - penalty)
    const stars = score >= 52 ? 3 : score >= 40 ? 2 : 1
    addRecord({
      levelId: 'kitchen',
      levelTitle: '第一关 · 厨房现场',
      group: '厨房现场',
      input: '鸡蛋、西红柿、食用油、调味料',
      process: '打蛋 → 切西红柿 → 热油 → 炒蛋 → 炒西红柿 → 合炒装盘',
      output: '一盘西红柿炒鸡蛋',
    })
    completeLevel('kitchen', { score, stars, usedMs: elapsed * 1000 })
    addBadge('kitchen-master')
    toastBadge('🍅', '获得徽章：厨房勘察员', `本关用时 ${elapsed} 秒，得分 ${score} 分`)
    playSound('badge')
    goLevel('addition')
  }

  const nextLevel = getLevel('addition')

  return (
    <LevelFrame
      levelId="kitchen"
      taskTitle={
        phase === 'sort' ? '把 10 张卡片放进正确的箱子' : '把打乱的炒菜步骤排成正确顺序'
      }
      taskHint={
        phase === 'sort'
          ? '按住卡片拖到箱子里；也可以先点一下卡片，再点一下箱子。放错了没关系，点箱子里的卡片可以拿回来重放。'
          : '按住步骤卡上下拖动，或者用卡片右侧的 ▲ ▼ 按钮调顺序。'
      }
      steps={{ total: 2, current: phase === 'sort' ? 0 : 1, done: phase === 'order' ? [0] : [] }}
      elapsedSeconds={elapsed}
      score={ALL_IDS.length * 4 + placedCount * 2 - mistakes * 2}
      actions={
        <>
          <GameButton
            variant="secondary"
            icon={<RotateCcw size={17} />}
            onClick={() => {
              setPlaced({})
              setOrder(KITCHEN_STEPS_SCRAMBLED)
              setOrderOk(false)
              setOrderTries(0)
              setMistakes(0)
              setFeedback(null)
              setPhase('sort')
            }}
          >
            重新开始本关
          </GameButton>
          {phase === 'order' ? (
            <GameButton variant="primary" size="lg" icon={<Check size={19} />} onClick={checkOrder}>
              检查顺序
            </GameButton>
          ) : null}
          <GameButton
            variant="gold"
            size="lg"
            icon={<ArrowRight size={19} />}
            disabled={!orderOk}
            onClick={finishLevel}
          >
            前往 {nextLevel.title}
          </GameButton>
        </>
      }
      banner={
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-zin-light px-3 py-1 text-xs font-bold text-zin-dark">
            已归档 {placedCount} / {ALL_IDS.length} 张
          </span>
          {mistakes > 0 ? (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500">
              放错 {mistakes} 次
            </span>
          ) : null}
          {activeId ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zproc px-3 py-1 text-xs font-bold text-white">
              已选中卡片，现在点一个箱子放入
              <button
                type="button"
                onClick={clear}
                className="cursor-pointer rounded px-1 text-white/80 hover:text-white"
              >
                ✕
              </button>
            </span>
          ) : null}
        </div>
      }
    >
      {phase === 'sort' ? (
        <div className="grid gap-4">
          <NotebookLayout
            zones={(['input', 'process', 'output'] as Stage[]).map((stage) => ({
              stage,
              title: ZONE_TITLE[stage],
              badge: (
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink2 tabular-nums">
                  {Object.values(placed).filter((z) => z === stage).length} 张
                </span>
              ),
              hot: hotZone === stage,
              shake: shakeZone === stage,
              handlers: zoneHandlers(stage),
              children: (
                <>
                  {ALL_IDS.filter((id) => placed[id] === stage).map((id) => {
                    const card = KITCHEN_CARDS.find((c) => c.id === id)
                    if (!card) return null
                    return (
                      <motion.button
                        key={id}
                        type="button"
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          takeBack(id)
                        }}
                        title="点击拿回卡池"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border-2 border-black/5 bg-white px-3.5 py-2.5 text-[15px] font-semibold text-ink shadow-sm transition hover:border-red-300 hover:text-red-500"
                      >
                        <span className="text-xl">{card.emoji}</span>
                        {card.label}
                        <Undo2 size={14} className="text-black/25" />
                      </motion.button>
                    )
                  })}
                  {ALL_IDS.filter((id) => placed[id] === stage).length === 0 ? (
                    <p className="w-full py-6 text-center text-sm text-black/25">
                      把「{ZONE_TITLE[stage].split('：')[1]}」的卡片拖进来
                    </p>
                  ) : null}
                </>
              ),
            }))}
          />

          <section className="relative rounded-notebook border-2 border-dashed border-zproc bg-white/70 p-4 shadow-card">
            <span className="z-tape -top-3 left-10 -rotate-2" aria-hidden />
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-ink">待归类卡片</h3>
              <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-bold text-ink2 tabular-nums">
                还剩 {pool.length} 张
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {pool.map((id) => {
                const card = KITCHEN_CARDS.find((c) => c.id === id)
                if (!card) return null
                const active = activeId === card.id
                return (
                  <button
                    key={card.id}
                    type="button"
                    {...cardHandlers(card.id)}
                    onClick={() => {
                      // 点击选中 / 取消选中，作为拖拽之外的备用操作方式
                      playSound('click')
                      select(card.id)
                    }}
                    className={cn(
                      'inline-flex cursor-grab items-center gap-2 rounded-2xl border-2 bg-white px-4 py-3 text-[16px] font-semibold text-ink shadow-card transition duration-200 active:cursor-grabbing',
                      active
                        ? '-rotate-2 scale-105 border-zproc ring-4 ring-zproc/25'
                        : 'border-black/5 hover:-translate-y-0.5 hover:border-zproc/60 hover:shadow-cardHover',
                    )}
                  >
                    <span className="text-2xl">{card.emoji}</span>
                    {card.label}
                  </button>
                )
              })}
              {pool.length === 0 ? (
                <p className="w-full py-6 text-center text-sm font-semibold text-zin-dark">
                  全部归档完毕！下面进入第二步：把炒菜步骤排好顺序。
                </p>
              ) : null}
            </div>
          </section>

          {feedback ? (
            <motion.div
              key={feedback.text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex items-start gap-2.5 rounded-2xl border-2 px-4 py-3 text-[15px] leading-relaxed',
                feedback.ok
                  ? 'border-zin bg-zin-pale text-zin-dark'
                  : 'border-red-200 bg-red-50 text-red-600',
              )}
            >
              <Lightbulb size={18} className="mt-[3px] shrink-0" />
              <span>{feedback.text}</span>
            </motion.div>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-notebook border-2 border-zproc-light bg-white p-4 shadow-card">
            <h3 className="mb-3 text-[17px] font-bold text-ink">
              炒菜步骤（拖动卡片重新排序）
            </h3>
            <ol className="space-y-2">
              {order.map((id, i) => {
                const step = KITCHEN_STEPS.find((s) => s.id === id)
                if (!step) return null
                const handlers = reorder.itemHandlers(id)
                const isOver = reorder.overId === id
                const isDrag = reorder.draggingId === id
                return (
                  <li key={id}>
                    <div
                      {...handlers}
                      className={cn(
                        'flex cursor-grab items-center gap-3 rounded-2xl border-2 bg-white px-3.5 py-3 shadow-sm transition active:cursor-grabbing',
                        isDrag ? '-rotate-1 scale-[1.01] border-zproc shadow-cardHover' : 'border-black/5',
                        isOver && !isDrag ? 'border-zproc bg-zproc-pale' : '',
                        orderOk ? 'border-zin bg-zin-pale' : '',
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zproc-light text-base font-bold text-zproc-dark tabular-nums">
                        {i + 1}
                      </span>
                      <span className="text-2xl">{step.emoji}</span>
                      <span className="flex-1 text-[16px] font-semibold text-ink">{step.text}</span>
                      <span className="flex shrink-0 flex-col gap-0.5">
                        <button
                          type="button"
                          aria-label="上移"
                          disabled={i === 0}
                          onClick={() => setOrder((o) => moveItem(o, id, o[Math.max(0, i - 1)]))}
                          className="cursor-pointer rounded-md px-1.5 text-xs text-ink2 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          aria-label="下移"
                          disabled={i === order.length - 1}
                          onClick={() =>
                            setOrder((o) => moveItem(o, id, o[Math.min(o.length - 1, i + 1)]))
                          }
                          className="cursor-pointer rounded-md px-1.5 text-xs text-ink2 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </span>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="space-y-4">
            {orderOk ? (
              <StickyNote tone="green" tape title="顺序正确！这就是处理过程">
                从处理鸡蛋和西红柿，到下锅翻炒，再到装盘——这一串有先有后的步骤，就是"处理"。
                换个顺序，菜就做不成了，这正是算法的讲究。
              </StickyNote>
            ) : (
              <StickyNote tone="tape" title="排顺序的小窍门">
                先问自己三个问题：<br />
                ① 哪些事必须准备好才能开始？<br />
                ② 哪些事必须等前一件事做完？<br />
                ③ 最后一件事做完，会得到什么？
              </StickyNote>
            )}
            {feedback ? (
              <StickyNote tone={feedback.ok ? 'green' : 'orange'} title="侦探笔记">
                {feedback.text}
              </StickyNote>
            ) : null}
          </div>
        </div>
      )}
    </LevelFrame>
  )
}
