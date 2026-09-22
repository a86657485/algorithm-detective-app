import { motion } from 'framer-motion'
import { ArrowRight, Dices, Eye, Lightbulb, RotateCcw, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { GUIDE_QUESTIONS, PRESET_SETS, TIPS_24 } from '../data/tips24'
import { getLevel } from '../data/levels'
import { useGameStore, type RecordInput } from '../store/useGameStore'
import { toastBadge, useUiStore } from '../store/useUiStore'
import { evaluateExpression, validateNumbers } from '../lib/expression'
import { ratToString } from '../lib/rational'
import { buildHint, find24Solutions, has24Solution, pickSolvableNumbers, type StrategyHint } from '../lib/solve24'
import { playSound } from '../lib/sound'
import { cn } from '../lib/cn'
import { useElapsed } from '../hooks/useElapsed'
import { GameButton } from '../components/common/GameButton'
import { StickyNote } from '../components/common/StickyNote'
import { LevelFrame } from '../components/shell/LevelFrame'
import { CalcPad } from './parts/CalcPad'

const MIN_ROUNDS = 3
const MAX_ROUNDS = 5

export function Level4TwentyFour() {
  const completeLevel = useGameStore((s) => s.completeLevel)
  const addRecord = useGameStore((s) => s.addRecord)
  const addBadge = useGameStore((s) => s.addBadge)
  const goLevel = useGameStore((s) => s.goLevel)
  const fireConfetti = useUiStore((s) => s.fireConfetti)

  const elapsed = useElapsed(true, 'twentyFour')
  const [numbers, setNumbers] = useState<number[]>(() => [2, 4, 6, 9])
  const [expr, setExpr] = useState('')
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [hint, setHint] = useState<StrategyHint | null>(null)
  const [answer, setAnswer] = useState<string | null>(null)
  const [combo, setCombo] = useState(0)
  const [rounds, setRounds] = useState<RecordInput[]>([])
  const [roundStart, setRoundStart] = useState(() => Date.now())
  const [roundSeconds, setRoundSeconds] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [solvedThisRound, setSolvedThisRound] = useState(false)

  const level = getLevel('twentyFour')
  const roundNo = rounds.length + 1
  const solvable = useMemo(() => has24Solution(numbers), [numbers])
  const numCheck = expr ? validateNumbers(expr, numbers) : null
  const evalRes = expr ? evaluateExpression(expr) : null

  const liveValue = evalRes?.ok ? ratToString(evalRes.value) : evalRes ? evalRes.reason : '等待算式'

  const resetRoundState = (next: number[]) => {
    setNumbers(next)
    setExpr('')
    setMessage(null)
    setHint(null)
    setAnswer(null)
    setSolvedThisRound(false)
    setRoundStart(Date.now())
    setRoundSeconds(0)
  }

  const randNumbers = () => {
    playSound('click')
    resetRoundState(pickSolvableNumbers())
  }

  const updateNumber = (idx: number, value: number) => {
    const next = numbers.slice()
    next[idx] = Math.min(10, Math.max(1, Math.round(value) || 1))
    resetRoundState(next)
  }

  const check = () => {
    if (!expr) {
      setMessage({ text: '先在计算器上写出一个算式吧。', ok: false })
      playSound('error')
      return
    }
    if (numCheck && !numCheck.ok) {
      const detail =
        numCheck.missing.length > 0
          ? `还没用到 ${numCheck.missing.join('、')}`
          : `多用了 ${numCheck.extra.join('、')}`
      setMessage({ text: `四个数必须用而且只能用一次：${detail}。`, ok: false })
      playSound('error')
      return
    }
    if (!evalRes || !evalRes.ok) {
      setMessage({ text: evalRes ? evalRes.reason : '算式有问题，再检查一下。', ok: false })
      playSound('error')
      return
    }
    if (evalRes.value.n !== 24 * evalRes.value.d) {
      setMessage({ text: `这个算式的结果是 ${ratToString(evalRes.value)}，还不是 24，换一种算法试试。`, ok: false })
      playSound('error')
      return
    }

    // 成功
    const seconds = Math.round((Date.now() - roundStart) / 1000)
    const gain = 10 + (hint ? 0 : 5) + (answer ? 0 : 5) + Math.min(6, combo * 2)
    const nextCombo = combo + 1
    const record: RecordInput = {
      levelId: 'twentyFour',
      levelTitle: '第四关 · 24点终局',
      group: '24点',
      input: numbers.join('、'),
      process: expr.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−'),
      output: '24',
    }
    setRounds((r) => [...r, record])
    setTotalScore((s) => s + gain)
    setCombo(nextCombo)
    setSolvedThisRound(true)
    setRoundSeconds(seconds)
    setMessage({
      text: `漂亮！${record.process} = 24，用时 ${seconds} 秒，本局 +${gain} 分，连击 ×${nextCombo}。`,
      ok: true,
    })
    playSound('success')
    fireConfetti()
  }

  const nextRound = () => {
    playSound('click')
    resetRoundState(pickSolvableNumbers())
  }

  const finishLevel = () => {
    const score = Math.min(80, Math.max(20, totalScore))
    const stars = score >= 65 ? 3 : score >= 45 ? 2 : 1
    rounds.forEach((r) => addRecord(r))
    completeLevel('twentyFour', { score, stars, usedMs: elapsed * 1000 })
    addBadge('twentyfour-king')
    addBadge('perfect-detective')
    toastBadge('👑', '获得徽章：24点高手', `完成 ${rounds.length} 局 · 本关 ${score} 分`)
    playSound('badge')
    goLevel('quiz')
  }

  const nextLevel = getLevel('quiz')

  return (
    <LevelFrame
      levelId="twentyFour"
      taskTitle={`第 ${roundNo} 局：用 ${numbers.join('、')} 算出 24`}
      taskHint="每个数必须用而且只能用一次。先想乘法：能不能凑出 3 和 8、4 和 6，或者 2 和 12？在下面点按钮写算式，写完按「=」检查。"
      steps={{
        total: MAX_ROUNDS,
        current: Math.min(rounds.length, MAX_ROUNDS - 1),
        done: Array.from({ length: rounds.length }, (_, i) => i),
      }}
      elapsedSeconds={elapsed}
      score={Math.min(80, totalScore)}
      actions={
        <>
          <GameButton variant="secondary" icon={<RotateCcw size={17} />} onClick={() => resetRoundState(numbers)}>
            重开本局
          </GameButton>
          <GameButton
            variant="secondary"
            icon={<Lightbulb size={17} />}
            onClick={() => {
              playSound('click')
              setHint(buildHint(numbers))
            }}
          >
            给我提示
          </GameButton>
          <GameButton
            variant="secondary"
            icon={<Eye size={17} />}
            onClick={() => {
              playSound('click')
              const sols = find24Solutions(numbers)
              setAnswer(sols.length > 0 ? sols[0] : null)
              if (sols.length === 0) setHint(buildHint(numbers))
            }}
          >
            显示答案
          </GameButton>
          <GameButton
            variant="primary"
            icon={<Dices size={17} />}
            disabled={!solvedThisRound}
            onClick={nextRound}
          >
            换一组数字
          </GameButton>
          <GameButton
            variant="gold"
            size="lg"
            icon={<ArrowRight size={19} />}
            disabled={rounds.length < MIN_ROUNDS}
            onClick={finishLevel}
          >
            {rounds.length < MIN_ROUNDS
              ? `再完成 ${MIN_ROUNDS - rounds.length} 局即可通关`
              : `交卷，前往 ${nextLevel.title}`}
          </GameButton>
        </>
      }
      banner={
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-zout-light px-3 py-1 text-xs font-bold text-zout-dark">
            已完成 {rounds.length} / {MIN_ROUNDS} 局（最多可挑战 {MAX_ROUNDS} 局）
          </span>
          <span className="rounded-full bg-zproc-light px-3 py-1 text-xs font-bold text-zproc-dark">
            连击 ×{Math.max(1, combo)}
          </span>
          <span className="text-xs text-ink2">{level.point}</span>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        <div className="space-y-4">
          {/* 数字方块 */}
          <section className="rounded-notebook border-2 border-zout-light bg-white p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-ink">本局的四个数字</h3>
              <span className="text-xs text-ink2">点数字可手动修改</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {numbers.map((n, i) => (
                <input
                  key={i}
                  type="number"
                  min={1}
                  max={10}
                  value={n}
                  aria-label={`第 ${i + 1} 个数字`}
                  onChange={(e) => updateNumber(i, Number(e.target.value))}
                  className="h-[68px] w-[68px] rounded-2xl border-2 border-zout bg-gradient-to-br from-zout-light to-white text-center text-[30px] font-extrabold text-ink outline-none transition focus:border-zproc focus:ring-4 focus:ring-zproc/20"
                />
              ))}
              <span className="flex h-[68px] flex-col items-center justify-center rounded-2xl bg-zproc-pale px-4">
                <span className="text-[11px] font-bold text-zproc-dark">目标</span>
                <span className="text-[28px] font-extrabold leading-none text-zproc-dark">24</span>
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SETS.slice(0, 4).map((set) => (
                  <button
                    key={set.join('-')}
                    type="button"
                    onClick={() => {
                      playSound('click')
                      resetRoundState([...set])
                    }}
                    className="cursor-pointer rounded-full border-2 border-black/10 bg-white px-3 py-1 text-xs font-bold text-ink2 transition hover:border-zproc hover:text-zproc-dark"
                  >
                    {set.join(' ')}
                  </button>
                ))}
              </div>
              <GameButton size="sm" variant="secondary" icon={<Dices size={14} />} onClick={randNumbers}>
                随机四个数
              </GameButton>
            </div>

            {!solvable ? (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-500">
                小提示：这四个数凑不出 24，换一组再来吧。
              </p>
            ) : null}
          </section>

          {/* 计算器 */}
          <section className="rounded-notebook border-2 border-zproc-light bg-white p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-ink">计算器</h3>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-bold tabular-nums',
                  evalRes?.ok ? 'bg-zproc-light text-zproc-dark' : 'bg-black/5 text-ink2',
                )}
              >
                当前结果：{liveValue}
              </span>
            </div>
            <CalcPad value={expr} onChange={setExpr} onCheck={check} />
            {numCheck ? (
              <p className="mt-3 text-[13px] text-ink2">
                数字使用情况：
                <b className={numCheck.ok ? 'text-zin-dark' : 'text-zout-dark'}>
                  {numCheck.ok
                    ? '四个数都用上了，正好一次'
                    : numCheck.missing.length > 0
                      ? `还差 ${numCheck.missing.join('、')}`
                      : `多用了 ${numCheck.extra.join('、')}`}
                </b>
              </p>
            ) : null}
          </section>
        </div>

        <div className="space-y-4">
          {message ? (
            <motion.div
              key={message.text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-2xl border-2 px-4 py-3 text-[15px] leading-relaxed',
                message.ok ? 'border-zin bg-zin-pale text-zin-dark' : 'border-red-200 bg-red-50 text-red-600',
              )}
            >
              {message.text}
            </motion.div>
          ) : null}

          {hint ? (
            <StickyNote
              tone={hint.strategy === 'none' ? 'orange' : 'blue'}
              tape
              title={`提示 · ${hint.title}`}
            >
              {hint.detail}
            </StickyNote>
          ) : null}

          {answer ? (
            <StickyNote tone="green" title="参考答案">
              <p className="text-[17px] font-bold text-zin-dark">
                {answer.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−')} = 24
              </p>
              <p className="mt-1.5 text-xs">
                这只是其中一种解法。想一想：还有别的写法吗？把顺序换一换，结果会不会不一样？
              </p>
            </StickyNote>
          ) : null}

          <div className="rounded-notebook border-2 border-black/5 bg-white p-5 shadow-card">
            <h3 className="flex items-center gap-2 text-[17px] font-bold text-ink">
              <Sparkles size={18} className="text-zout" />
              教材给的破题思路
            </h3>
            <ul className="mt-3 space-y-2">
              {TIPS_24.map((t) => (
                <li key={t.title} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink2">
                  <span className="text-lg leading-none">{t.emoji}</span>
                  <span>
                    <b className="text-ink">{t.title}：</b>
                    {t.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <StickyNote tone="tape" title="算法流程表（本关要记录的内容）">
            <div className="overflow-hidden rounded-xl border-2 border-black/10">
              <div className="grid grid-cols-3 bg-black/5 text-center text-xs font-bold text-ink">
                <span className="border-r border-black/10 py-1.5">输入</span>
                <span className="border-r border-black/10 py-1.5">处理</span>
                <span className="py-1.5">输出</span>
              </div>
              {(rounds.length > 0 ? rounds : [{ input: '—', process: '—', output: '—' }]).map((r, i) => (
                <div key={i} className="grid grid-cols-3 border-t border-black/10 text-center text-xs text-ink2">
                  <span className="border-r border-black/10 px-1 py-1.5 tabular-nums">{r.input}</span>
                  <span className="truncate border-r border-black/10 px-1 py-1.5" title={r.process}>
                    {r.process}
                  </span>
                  <span className="px-1 py-1.5">{r.output}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs">
              每成功一局，这里就会自动记下一行。结业时可以打印成完整任务单。
            </p>
          </StickyNote>

          <StickyNote tone="green" title="想一想（教材思考题）">
            <ul className="list-disc space-y-1 pl-5">
              {GUIDE_QUESTIONS.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </StickyNote>
        </div>
      </div>
    </LevelFrame>
  )
}
