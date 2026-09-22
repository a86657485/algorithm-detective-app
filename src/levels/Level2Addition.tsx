import { ArrowRight, Check, Lightbulb, RotateCcw, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ADDITION_PROBLEMS, buildColumns, CARRY_TRAPS, REFLECT_QUESTIONS } from '../data/addition'
import { getLevel } from '../data/levels'
import { useGameStore } from '../store/useGameStore'
import { toastBadge, useUiStore } from '../store/useUiStore'
import { playSound } from '../lib/sound'
import { cn } from '../lib/cn'
import { useElapsed } from '../hooks/useElapsed'
import { GameButton } from '../components/common/GameButton'
import { StickyNote } from '../components/common/StickyNote'
import { LevelFrame } from '../components/shell/LevelFrame'
import { VerticalAdd } from './parts/VerticalAdd'

const TEXBOOK_STEPS = [
  '把两个自然数按个位上下对齐排列',
  '从个位开始',
  '把数位上的两个数字相加：满十就把 1 进到前一位',
  '向左移动一位，如果有进位也要加上',
  '最下面一行的数，就是两个自然数的和',
]

const PROBLEMS = [ADDITION_PROBLEMS[0], ADDITION_PROBLEMS[3]]
const TRAP = CARRY_TRAPS[2]

export function Level2Addition() {
  const completeLevel = useGameStore((s) => s.completeLevel)
  const addRecord = useGameStore((s) => s.addRecord)
  const addBadge = useGameStore((s) => s.addBadge)
  const goLevel = useGameStore((s) => s.goLevel)
  const fireConfetti = useUiStore((s) => s.fireConfetti)

  const elapsed = useElapsed(true, 'addition')
  const [stage, setStage] = useState<'solve' | 'trap'>('solve')
  const [problemIdx, setProblemIdx] = useState(0)
  const [currentCol, setCurrentCol] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [wrongCol, setWrongCol] = useState<number | null>(null)
  const [solveMistakes, setSolveMistakes] = useState(0)
  const [pickedCol, setPickedCol] = useState<number | null>(null)
  const [trapFound, setTrapFound] = useState(false)
  const [trapMisses, setTrapMisses] = useState(0)
  const [showStepHelp, setShowStepHelp] = useState(true)

  const problem = PROBLEMS[problemIdx]
  const columns = problem.columns
  const cur = columns[currentCol]

  const explain = useMemo(() => {
    if (!cur) return ''
    const parts = [`${cur.label}上：${cur.aDigit} + ${cur.bDigit}`]
    if (cur.carryIn > 0) parts.push(`+ ${cur.carryIn}（进位）`)
    parts.push(`= ${cur.sum}`)
    const tail =
      cur.carryOut > 0
        ? `，写 ${cur.writeDigit}，并向${columns[cur.index + 1]?.label ?? '前一位'}进 ${cur.carryOut}`
        : `，直接写 ${cur.writeDigit}`
    return parts.join(' ') + tail
  }, [cur, columns])

  const handleAnswer = (col: number, value: string) => {
    const target = columns.find((c) => c.index === col)
    if (!target) return
    setAnswers((a) => ({ ...a, [col]: value }))
    if (!value) return

    if (value === String(target.writeDigit)) {
      playSound(target.carryOut > 0 ? 'carry' : 'pop')
      if (col + 1 >= columns.length) {
        playSound('success')
        fireConfetti()
        if (problemIdx + 1 < PROBLEMS.length) {
          window.setTimeout(() => {
            setProblemIdx((i) => i + 1)
            setCurrentCol(0)
            setAnswers({})
          }, 900)
        } else {
          setStage('trap')
        }
      } else {
        setCurrentCol(col + 1)
      }
      return
    }

    playSound('error')
    setSolveMistakes((m) => m + 1)
    setWrongCol(col)
    window.setTimeout(() => {
      setWrongCol(null)
      setAnswers((a) => ({ ...a, [col]: '' }))
    }, 620)
  }

  const resetSolve = () => {
    setProblemIdx(0)
    setCurrentCol(0)
    setAnswers({})
    setSolveMistakes(0)
    setStage('solve')
    setPickedCol(null)
    setTrapFound(false)
    setTrapMisses(0)
  }

  const handlePickColumn = (col: number) => {
    setPickedCol(col)
    if (col === TRAP.wrongColumnIndex) {
      setTrapFound(true)
      playSound('success')
      fireConfetti()
      return
    }
    playSound('error')
    setTrapMisses((m) => m + 1)
  }

  const finishLevel = () => {
    const penalty = Math.min(24, solveMistakes * 2 + trapMisses * 3)
    const score = Math.max(20, 70 - penalty)
    const stars = score >= 60 ? 3 : score >= 45 ? 2 : 1
    addRecord({
      levelId: 'addition',
      levelTitle: '第二关 · 数字迷宫',
      group: '竖式加法',
      input: `${problem.a} 和 ${problem.b}`,
      process: `个位相加 → 满十向前一位进 1 → 逐位向左计算并加上进位 → 得到每一位的结果`,
      output: String(problem.sum),
    })
    addRecord({
      levelId: 'addition',
      levelTitle: '第二关 · 数字迷宫',
      group: '竖式加法',
      input: `${TRAP.a} 和 ${TRAP.b}`,
      process: '排查漏加进位：个位满十进 1 后，前一位必须把这个 1 加进去',
      output: `${TRAP.shownSum}（错）→ ${TRAP.rightSum}（对）`,
    })
    completeLevel('addition', { score, stars, usedMs: elapsed * 1000 })
    addBadge('carry-hunter')
    toastBadge('➕', '获得徽章：进位猎手', `用时 ${elapsed} 秒 · 得分 ${score} 分`)
    playSound('badge')
    goLevel('rectangle')
  }

  const trapColumns = useMemo(() => buildColumns(TRAP.a, TRAP.b), [])
  const trapDigits = useMemo(() => {
    const shown = TRAP.shownSum.padStart(trapColumns.length, ' ').split('')
    const map: Record<number, string> = {}
    trapColumns.forEach((c, i) => {
      map[c.index] = shown[trapColumns.length - 1 - i] ?? ' '
    })
    return map
  }, [trapColumns])

  const score = stage === 'solve' ? 70 - solveMistakes * 2 : 70 - solveMistakes * 2 - trapMisses * 3
  const nextLevel = getLevel('rectangle')

  return (
    <LevelFrame
      levelId="addition"
      taskTitle={
        stage === 'solve'
          ? `第 ${problemIdx + 1} / ${PROBLEMS.length} 题：算出 ${problem.a} + ${problem.b}`
          : stage === 'trap'
            ? '错题排查：找出漏加进位的那一位'
            : '真棒！本关完成'
      }
      taskHint={
        stage === 'solve'
          ? '从个位开始，一位一位往左算。在虚线框里填上这一位应该写的数字，填对了才会跳到下一位。'
          : stage === 'trap'
            ? `有人在算 ${TRAP.a} + ${TRAP.b} 时写成了 ${TRAP.shownSum}。点一下你认为算错的那一位。`
            : '我们已经把竖式加法的每一步都走完了，这就是"处理"的过程。'
      }
      steps={{
        total: PROBLEMS.length + 1,
        current: stage === 'solve' ? problemIdx : PROBLEMS.length,
        done: Array.from({ length: PROBLEMS.length }, (_, i) => i).filter(
          (i) => stage !== 'solve' || i < problemIdx,
        ),
      }}
      elapsedSeconds={elapsed}
      score={Math.max(0, score)}
      actions={
        <>
          <GameButton variant="secondary" icon={<RotateCcw size={17} />} onClick={resetSolve}>
            重新来一遍
          </GameButton>
          <GameButton
            variant="secondary"
            icon={<Lightbulb size={17} />}
            onClick={() => {
              playSound('click')
              setShowStepHelp((v) => !v)
            }}
          >
            {showStepHelp ? '隐藏' : '显示'}步骤说明
          </GameButton>
          <GameButton
            variant="gold"
            size="lg"
            icon={<ArrowRight size={19} />}
            disabled={!trapFound}
            onClick={finishLevel}
          >
            前往 {nextLevel.title}
          </GameButton>
        </>
      }
      banner={
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-zproc-light px-3 py-1 text-xs font-bold text-zproc-dark">
            {stage === 'trap' ? '排查阶段' : `正在逐位计算 ${problem.a} + ${problem.b}`}
          </span>
          {solveMistakes + trapMisses > 0 ? (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500">
              出错 {solveMistakes + trapMisses} 次
            </span>
          ) : null}
          <span className="text-xs text-ink2">
            提示：发现算式不对劲，先回个位重新检查一遍。
          </span>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4">
          {stage !== 'trap' ? (
            <>
              <VerticalAdd
                a={problem.a}
                b={problem.b}
                columns={columns}
                currentCol={currentCol}
                answers={answers}
                wrongCol={wrongCol}
                onAnswer={handleAnswer}
              />
              <StickyNote tone="blue" tape title={`正在计算：${cur?.label ?? ''}`}>
                <p className="text-[16px] font-semibold text-ink">{explain}</p>
                <p className="mt-1.5 text-[13px]">
                  {cur?.carryOut
                    ? '注意：满十要进位，进上去的那个 1 下一位一定要加上，这是最容易漏的地方。'
                    : '这一位没有满十，直接把结果写下来就好。'}
                </p>
              </StickyNote>
            </>
          ) : (
            <>
              <VerticalAdd
                a={TRAP.a}
                b={TRAP.b}
                columns={trapColumns}
                currentCol={trapColumns.length}
                answers={{}}
                wrongCol={null}
                readOnly
                pickedCol={pickedCol}
                overrideDigits={trapDigits}
                onPickColumn={handlePickColumn}
              />
              {trapFound ? (
                <StickyNote tone="green" tape title="找到了！就是这一位">
                  <p className="text-[15px] text-ink">{TRAP.explain}</p>
                  <p className="mt-2 text-[13px]">
                    所以正确答案是 <b className="text-zin-dark">{TRAP.rightSum}</b>，不是 {TRAP.shownSum}。
                  </p>
                </StickyNote>
              ) : (
                <StickyNote tone="orange" tape title="侦探线索">
                  {TRAP.hint}
                  {trapMisses > 0 ? (
                    <span className="mt-1 block text-red-500">
                      刚才点的那一位是对的，再想想别的位。
                    </span>
                  ) : null}
                </StickyNote>
              )}
            </>
          )}

          {trapFound ? (
            <StickyNote tone="tape" title="再想一想（教材探究题）">
              <ul className="list-disc space-y-1 pl-5">
                {REFLECT_QUESTIONS.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </StickyNote>
          ) : null}
        </div>

        <div className="space-y-4">
          {showStepHelp ? (
            <div className="rounded-notebook border-2 border-black/5 bg-white p-5 shadow-card">
              <h3 className="flex items-center gap-2 text-[17px] font-bold text-ink">
                <Search size={18} className="text-zproc" />
                竖式加法的五个步骤
              </h3>
              <ol className="mt-3 space-y-2">
                {TEXBOOK_STEPS.map((s, i) => {
                  const activeStep =
                    stage === 'solve' ? Math.min(2 + (currentCol > 0 ? 1 : 0), 3) : 4
                  const isActive = i === activeStep
                  const isDone = i < activeStep
                  return (
                    <li
                      key={s}
                      className={cn(
                        'flex items-start gap-2.5 rounded-xl border-2 px-3 py-2 text-[14px] leading-relaxed transition',
                        isActive
                          ? 'border-zproc bg-zproc-pale font-semibold text-zproc-dark'
                          : isDone
                            ? 'border-zin-light bg-zin-pale text-zin-dark'
                            : 'border-black/5 bg-paper text-ink2',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          isActive
                            ? 'bg-zproc text-white'
                            : isDone
                              ? 'bg-zin text-white'
                              : 'bg-black/10 text-ink2',
                        )}
                      >
                        {isDone ? <Check size={13} /> : i + 1}
                      </span>
                      <span>
                        第 {i + 1} 步：{s}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>
          ) : null}

          <StickyNote tone="green" title="算法的三个环节在哪里？">
            <ul className="space-y-1.5">
              <li>
                <b className="text-zin-dark">输入</b>：题目给的两个数 —— {problem.a} 和 {problem.b}
              </li>
              <li>
                <b className="text-zproc-dark">处理</b>：从个位开始逐位相加，满十进一，下一位记得加上进位
              </li>
              <li>
                <b className="text-zout-dark">输出</b>：写在横线下面的那个和 —— {problem.sum}
              </li>
            </ul>
          </StickyNote>

          <p className="flex items-start gap-1.5 px-1 text-xs leading-relaxed text-ink2">
            <Sparkles size={13} className="mt-[3px] shrink-0 text-zout" />
            减法、乘法、除法的计算过程，也都有各自的步骤。课后试着写出其中一种的步骤吧。
          </p>
        </div>
      </div>
    </LevelFrame>
  )
}
