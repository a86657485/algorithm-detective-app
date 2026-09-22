import { motion } from 'framer-motion'
import { Home, Printer, RotateCcw, Stamp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BADGES, LEVELS, STAGE_THEMES } from '../data/levels'
import { TIPS_24 } from '../data/tips24'
import { useGameStore, selectTotalScore } from '../store/useGameStore'
import { formatDuration } from '../hooks/useElapsed'
import { playSound } from '../lib/sound'
import { cn } from '../lib/cn'
import { GameButton } from '../components/common/GameButton'
import { Mascot } from '../components/common/Mascot'
import { CertificateModal } from '../components/shell/CertificateModal'

const SHEET_ROWS = 5

export function Level5Report() {
  const playerName = useGameStore((s) => s.playerName)
  const records = useGameStore((s) => s.records)
  const progress = useGameStore((s) => s.progress)
  const badges = useGameStore((s) => s.badges)
  const startedAt = useGameStore((s) => s.startedAt)
  const finishedAt = useGameStore((s) => s.finishedAt)
  const markFinished = useGameStore((s) => s.markFinished)
  const resetAll = useGameStore((s) => s.resetAll)
  const goLevel = useGameStore((s) => s.goLevel)
  const totalScore = useGameStore(selectTotalScore)

  const [showCert, setShowCert] = useState(true)

  const today = new Date()
  const dateText = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`
  const usedMs = startedAt ? (finishedAt ?? Date.now()) - startedAt : 0

  const rows24 = useMemo(() => {
    const list = records.filter((r) => r.group === '24点')
    const padded = [...list]
    while (padded.length < SHEET_ROWS) {
      padded.push({
        id: `blank-${padded.length}`,
        levelId: 'twentyFour',
        levelTitle: '',
        group: '24点',
        input: '',
        process: '',
        output: '',
        createdAt: 0,
      })
    }
    return padded.slice(0, SHEET_ROWS)
  }, [records])

  const otherRecords = records.filter((r) => r.group !== '24点')

  const handlePrint = () => {
    playSound('click')
    if (!finishedAt) markFinished()
    window.setTimeout(() => window.print(), 120)
  }

  const handleRestart = () => {
    playSound('click')
    resetAll()
    goLevel('intro')
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-6">
      <CertificateModal
        open={showCert}
        onClose={() => setShowCert(false)}
        onPrint={handlePrint}
        onRestart={handleRestart}
      />

      {/* 页面操作条 */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 rounded-notebook border-2 border-black/5 bg-white px-5 py-4 shadow-card">
        <div className="flex items-center gap-3">
          <Mascot size={64} mood="happy" />
          <div>
            <h1 className="text-[24px] font-extrabold leading-tight text-ink">结业颁证 · 算法任务单</h1>
            <p className="text-[13px] text-ink2">
              第 2 课 算法认识与体验 · {playerName || '小小侦探'} · {dateText}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <GameButton variant="secondary" icon={<Stamp size={17} />} onClick={() => setShowCert(true)}>
            查看侦探证
          </GameButton>
          <GameButton variant="gold" size="lg" icon={<Printer size={19} />} onClick={handlePrint}>
            打印任务单
          </GameButton>
          <GameButton variant="secondary" icon={<Home size={17} />} onClick={() => goLevel('intro')}>
            回到序章
          </GameButton>
          <GameButton variant="ghost" icon={<RotateCcw size={17} />} onClick={handleRestart}>
            重新开始
          </GameButton>
        </div>
      </div>

      {/* 成绩总览 */}
      <section className="no-print mb-5 grid gap-3 md:grid-cols-4">
        <StatCard label="总得分" value={`${totalScore}`} unit="分" tone="zout" />
        <StatCard label="通关用时" value={formatDuration(usedMs)} tone="zproc" />
        <StatCard label="徽章" value={`${badges.length} / ${BADGES.length}`} tone="zin" />
        <StatCard label="算法记录" value={`${records.length}`} unit="条" tone="zproc" />
      </section>

      <section className="no-print mb-5 grid gap-3 md:grid-cols-5">
        {LEVELS.map((l) => {
          const p = progress[l.id]
          return (
            <div
              key={l.id}
              className="rounded-2xl border-2 border-black/5 bg-white px-3 py-3 text-center shadow-card"
            >
              <div className="text-2xl">{l.emoji}</div>
              <p className="mt-1 text-[13px] font-bold leading-tight text-ink">{l.title.split(' · ')[1]}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-zin to-zproc"
                  style={{ width: `${Math.min(100, ((p?.score ?? 0) / 80) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-ink2 tabular-nums">
                {p?.finishedAt ? `${p.score} 分 · ${'★'.repeat(p.stars)}` : '未完成'}
              </p>
            </div>
          )
        })}
      </section>

      {/* ============ 可打印区域 ============ */}
      <section className="print-area rounded-notebook border-2 border-black/5 bg-white p-7 shadow-card print-page">
        <header className="border-b-4 border-double border-ink/30 pb-4 text-center">
          <h2 className="text-[28px] font-extrabold tracking-tight text-ink">24 点游戏任务单</h2>
          <p className="mt-1 text-[14px] text-ink2">
            五年级信息科技 · 第 2 课 算法认识与体验 —— 算法流程表（输入 → 处理 → 输出）
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-8 gap-y-1 text-[14px] text-ink">
            <span>
              侦探名：<b>{(playerName || '__________').padEnd(10, ' ')}</b>
            </span>
            <span>日期：<b>{dateText}</b></span>
            <span>用时：<b>{formatDuration(usedMs)}</b></span>
            <span>总得分：<b>{totalScore}</b></span>
          </div>
        </header>

        <div className="mt-5 space-y-3">
          <h3 className="text-[18px] font-bold text-ink">一、游戏规则</h3>
          <p className="text-[15px] leading-relaxed text-ink">
            24 点游戏是一种益智游戏，要求在 1 至 10 中任意抽取 4 个数，通过加（+）、减（−）、乘（×）、除（÷）运算
            将 4 个数计算后得出 <b>24</b>。
          </p>
          <p className="text-[15px] leading-relaxed text-ink">
            要求：抽取的每个数必须用而且只能用一次。例如，抽取的数是 2、4、6、9，那么算式为
            <b className="mx-1">（9 − 6）× 4 × 2 = 24</b>。
          </p>
          <p className="text-[15px] leading-relaxed text-ink">
            任务：请按照算法的基本流程，用"输入—处理—输出"的格式记录每一次计算步骤。
          </p>

          <div className="mt-3 rounded-xl border-2 border-zout/40 bg-zout-pale px-4 py-3">
            <p className="text-[14px] font-bold text-zout-dark">解题小提示</p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink">
              乘法很重要，24 是 30 以下（不含 30）公因数最多的自然数。常见的方法是优先凑出
              <b> 3×8、4×6、2×12 </b>
              ！一般情况已有其中一个数，可用其他 3 个数去凑另一个数。
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-[18px] font-bold text-ink">二、24 点游戏算法流程表</h3>
          <p className="mt-1 text-[14px] text-ink2">
            下方第一行是示例，其余各行是你在本应用中实际完成的计算记录。
          </p>

          <table className="mt-3 w-full border-collapse text-[15px]">
            <thead>
              <tr>
                <th className="w-[70px] border-2 border-ink/25 bg-black/5 px-2 py-2 text-ink">次数</th>
                <th className={cn('border-2 border-ink/25 px-2 py-2 text-ink', STAGE_THEMES.input.bgSoft)}>
                  {STAGE_THEMES.input.emoji} 输入
                </th>
                <th className={cn('border-2 border-ink/25 px-2 py-2 text-ink', STAGE_THEMES.process.bgSoft)}>
                  {STAGE_THEMES.process.emoji} 处理
                </th>
                <th className={cn('border-2 border-ink/25 px-2 py-2 text-ink', STAGE_THEMES.output.bgSoft)}>
                  {STAGE_THEMES.output.emoji} 输出
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-ink2">
                <td className="border-2 border-ink/25 px-2 py-2 text-center font-semibold">示例</td>
                <td className="border-2 border-ink/25 px-2 py-2 text-center tabular-nums">2, 4, 6, 9</td>
                <td className="border-2 border-ink/25 px-2 py-2 text-center">（9 − 6）× 4 × 2</td>
                <td className="border-2 border-ink/25 px-2 py-2 text-center tabular-nums">24</td>
              </tr>
              {rows24.map((r, i) => (
                <tr key={r.id} className="text-ink">
                  <td className="border-2 border-ink/25 px-2 py-2 text-center font-semibold">
                    第 {i + 1} 次
                  </td>
                  <td className="border-2 border-ink/25 px-2 py-2 text-center tabular-nums">
                    {r.input || '\u00A0'}
                  </td>
                  <td className="border-2 border-ink/25 px-2 py-2 text-center">{r.process || '\u00A0'}</td>
                  <td className="border-2 border-ink/25 px-2 py-2 text-center tabular-nums">
                    {r.output || '\u00A0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-7">
          <h3 className="text-[18px] font-bold text-ink">三、其他关卡的算法流程（自动记录）</h3>
          <table className="mt-3 w-full border-collapse text-[14px]">
            <thead>
              <tr>
                <th className="w-[130px] border-2 border-ink/25 bg-black/5 px-2 py-2 text-ink">活动</th>
                <th className="border-2 border-ink/25 bg-zin-pale px-2 py-2 text-ink">输入</th>
                <th className="border-2 border-ink/25 bg-zproc-pale px-2 py-2 text-ink">处理</th>
                <th className="border-2 border-ink/25 bg-zout-pale px-2 py-2 text-ink">输出</th>
              </tr>
            </thead>
            <tbody>
              {otherRecords.length > 0 ? (
                otherRecords.map((r) => (
                  <tr key={r.id}>
                    <td className="border-2 border-ink/25 px-2 py-2 text-center font-semibold text-ink">
                      {r.group}
                    </td>
                    <td className="border-2 border-ink/25 px-2 py-2 text-ink">{r.input}</td>
                    <td className="border-2 border-ink/25 px-2 py-2 text-ink">{r.process}</td>
                    <td className="border-2 border-ink/25 px-2 py-2 text-ink">{r.output}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="border-2 border-ink/25 px-2 py-3 text-center text-ink2">
                    还没有其他关卡的记录，回到前面的关卡完成即可自动生成。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border-2 border-zproc/30 bg-zproc-pale px-4 py-3">
            <p className="text-[15px] font-bold text-zproc-dark">知识点回顾 · 算法的基本流程</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink">
              我们解决问题时，通常遵循"<b>输入 — 处理 — 输出</b>"的基本流程。
              做不同的事情往往有不同的方法，但做事情的基本过程有很多共同之处，这些共同之处就是算法的思想所在。
            </p>
          </div>
          <div className="rounded-xl border-2 border-zin/30 bg-zin-pale px-4 py-3">
            <p className="text-[15px] font-bold text-zin-dark">知识拓展 · 什么是算法</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink">
              在信息科技领域，算法指的是利用计算机或其他数字设备，根据要完成的任务或待解决问题的条件和要求
              所实施的一系列步骤。算法的思想并不局限于特定设备或工具，而是一种数字化的思维方式。
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-ink/20 pt-4 text-[13px] text-ink2">
          <span>算法小侦探事务所 · 第 2 课结业任务单</span>
          <span>教师评价：____________________</span>
          <span className="text-2xl tracking-widest">★★★★★</span>
        </div>
      </section>

      {/* 给教师的说明（不打印） */}
      <section className="no-print mt-5 grid gap-3 md:grid-cols-3">
        {TIPS_24.slice(0, 3).map((t) => (
          <div key={t.title} className="rounded-2xl border-2 border-black/5 bg-white px-4 py-3 shadow-card">
            <p className="text-[15px] font-bold text-ink">
              {t.emoji} {t.title}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink2">{t.body}</p>
          </div>
        ))}
      </section>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="no-print mt-5 text-center text-[14px] text-ink2"
      >
        五关全部完成，你已经掌握了本课的学习目标。点上面的「打印任务单」把成果交给老师吧。
      </motion.p>
    </div>
  )
}

function StatCard({
  label,
  value,
  unit,
  tone,
}: {
  label: string
  value: string
  unit?: string
  tone: 'zin' | 'zproc' | 'zout'
}) {
  const ring: Record<string, string> = {
    zin: 'border-zin bg-zin-pale text-zin-dark',
    zproc: 'border-zproc bg-zproc-pale text-zproc-dark',
    zout: 'border-zout bg-zout-pale text-zout-dark',
  }
  return (
    <div className={cn('rounded-notebook border-2 px-4 py-3 shadow-card', ring[tone])}>
      <p className="text-xs font-bold opacity-80">{label}</p>
      <p className="mt-0.5 text-[26px] font-extrabold leading-tight tabular-nums">
        {value}
        {unit ? <span className="ml-1 text-sm font-bold">{unit}</span> : null}
      </p>
    </div>
  )
}
