import { motion } from 'framer-motion'
import { BadgeCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { Stage } from '../types/game'
import { STAGE_THEMES } from '../data/levels'
import { useGameStore } from '../store/useGameStore'
import { toastBadge } from '../store/useUiStore'
import { playSound } from '../lib/sound'
import { GameButton } from '../components/common/GameButton'
import { Mascot } from '../components/common/Mascot'
import { StageLegend } from '../components/common/StageLegend'
import { StickyNote } from '../components/common/StickyNote'
import { StoryDialog, type StoryLine } from '../components/shell/StoryDialog'

const LINES: StoryLine[] = [
  {
    who: 'mascot',
    text: '你好呀！我是侦探阿算。有人说，生活里到处都藏着"算法"，可到底什么是算法呢？',
    mood: 'normal',
  },
  {
    who: 'narrator',
    text: '上一课我们已经发现：做菜有菜谱，上学有路线，很多事情都在按一定的步骤完成。',
  },
  {
    who: 'mascot',
    text: '没错！这些"做事的步骤"，就是算法。而每一件事，几乎都能拆成三个箱子：输入、处理、输出。',
    mood: 'happy',
  },
  {
    who: 'narrator',
    text: '做西红柿炒鸡蛋：准备原材料是输入，照着菜谱炒菜是处理，端上桌的那盘菜就是输出。',
  },
  {
    who: 'mascot',
    text: '今天有五个案子等着你。每破一个，你就离"首席算法侦探"更近一步。先登记一下名字吧！',
    mood: 'happy',
  },
]

const CARD_ORDER: Stage[] = ['input', 'process', 'output']

export function Level0Intro() {
  const playerName = useGameStore((s) => s.playerName)
  const classId = useGameStore((s) => s.classId)
  const addBadge = useGameStore((s) => s.addBadge)
  const completeLevel = useGameStore((s) => s.completeLevel)
  const goLevel = useGameStore((s) => s.goLevel)
  const markStarted = useGameStore((s) => s.markStarted)

  const [startedAt] = useState(() => Date.now())
  const [storyDone, setStoryDone] = useState(false)

  const finishIntro = () => {
    markStarted()
    addBadge('rookie')
    completeLevel('intro', { score: 20, stars: 3, usedMs: Date.now() - startedAt })
    playSound('success')
    toastBadge('🕵️', '获得徽章：实习侦探', '侦探手册已发放，快去第一关吧！')
    goLevel('kitchen')
  }

  if (!storyDone) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-5 py-8">
        <div className="mb-5 text-center">
          <span className="inline-block rounded-full bg-zproc-light px-4 py-1 text-xs font-bold tracking-widest text-zproc-dark">
            PROLOGUE · 序章
          </span>
          <h1 className="mt-3 text-[38px] font-extrabold leading-tight text-ink">
            算法小侦探事务所
          </h1>
          <p className="mt-1 text-[15px] text-ink2">
            五年级信息科技 · 第 2 课 算法认识与体验
          </p>
        </div>
        <StoryDialog lines={LINES} onFinish={() => setStoryDone(true)} finishLabel="领取侦探手册" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-8">
      <div className="mb-6 text-center">
        <span className="inline-block rounded-full bg-zin-light px-4 py-1 text-xs font-bold tracking-widest text-zin-dark">
          DETECTIVE HANDBOOK · 侦探手册
        </span>
        <h1 className="mt-3 text-[36px] font-extrabold leading-tight text-ink">
          记住这三个箱子
        </h1>
        <p className="mt-1 text-[15px] text-ink2">
          以后每破一个案子，都问自己：输入是什么？处理是什么？输出是什么？
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {CARD_ORDER.map((stage, i) => {
          const t = STAGE_THEMES[stage]
          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 26, rotateX: -18 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.12 * i, type: 'spring', stiffness: 220, damping: 20 }}
              className={`relative overflow-hidden rounded-notebook border-2 bg-white p-5 shadow-card ${t.border}`}
            >
              <span className="z-tape -top-2 right-8 rotate-3" aria-hidden />
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl text-white shadow-sm ${t.bg}`}
                >
                  {t.emoji}
                </span>
                <div>
                  <p className="text-[11px] font-bold tracking-widest text-ink2">
                    第 {i + 1} 步
                  </p>
                  <h3 className={`text-[24px] font-extrabold leading-tight ${t.text}`}>{t.label}</h3>
                </div>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">{t.hint}</p>
              <div className={`mt-3 rounded-xl px-3 py-2 text-[13px] leading-relaxed ${t.chip}`}>
                {stage === 'input'
                  ? '例：西红柿炒鸡蛋里的鸡蛋、西红柿、油和调味料。'
                  : stage === 'process'
                    ? '例：切西红柿、搅拌鸡蛋、倒入锅里翻炒。'
                    : '例：端上桌的那一盘西红柿炒鸡蛋。'}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-notebook border-2 border-black/5 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <Mascot size={84} mood="think" />
            <div>
              <h3 className="text-[20px] font-bold text-ink">登记名字</h3>
              <p className="text-[13px] text-ink2">名字会印在你的侦探证上</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border-2 border-dashed border-zin bg-zin-pale px-4 py-3">
            <p className="text-[13px] font-bold text-zin-dark">已登记的小侦探</p>
            <p className="mt-0.5 text-[20px] font-extrabold text-ink">
              {classId ? `${classId} 班` : ''} {playerName || '小小侦探'}
            </p>
          </div>
          <GameButton
            size="lg"
            variant="gold"
            className="mt-4 w-full"
            icon={<BadgeCheck size={20} />}
            onClick={finishIntro}
          >
            领取侦探手册，开始办案
          </GameButton>
          <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-ink2">
            <Sparkles size={13} className="mt-[3px] shrink-0 text-zout" />
            进度会自动保存在这台电脑上，刷新页面也不会丢。想重新开始，点右上角的 ↺ 就可以。
          </p>
        </div>

        <div className="space-y-4">
          <StickyNote tone="blue" tape title="什么是算法？">
            在信息科技里，算法指的是：<b>利用计算机或其他数字设备，根据要完成的任务或待解决问题的条件和要求，所实施的一系列步骤。</b>
            <p className="mt-2">
              它不挑工具——无论是人来做，还是计算机来做，那些"共同的步骤"就是算法的思想。
            </p>
          </StickyNote>
          <StickyNote tone="green" title="三区色卡随身带">
            <StageLegend className="pt-1" />
            <p className="mt-2">
              看到绿色想"准备"，看到蓝色想"步骤"，看到橙色想"结果"——这一课我们会一直用到它。
            </p>
          </StickyNote>
        </div>
      </div>
    </div>
  )
}
