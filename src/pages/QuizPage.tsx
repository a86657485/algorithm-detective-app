import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, RotateCcw, Send, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { QUIZ_MAX_SCORE, QUIZ_QUESTIONS, QUIZ_TAGS, gradeQuiz, publicQuestions } from '../../shared/quiz-data.mjs'
import type { QuizTag } from '../../shared/quiz-data.mjs'
import { getLevel } from '../data/levels'
import { useGameStore } from '../store/useGameStore'
import { toastBadge, useUiStore } from '../store/useUiStore'
import { submitQuiz } from '../lib/api'
import { playSound } from '../lib/sound'
import { cn } from '../lib/cn'
import { GameButton } from '../components/common/GameButton'
import { LevelFrame } from '../components/shell/LevelFrame'

const QUESTIONS = publicQuestions()
const ANSWERS = new Map(QUIZ_QUESTIONS.map((q) => [q.id, q]))
const TAG_LABEL = QUIZ_TAGS as Record<QuizTag, string>

export function QuizPage() {
  const classId = useGameStore((s) => s.classId)
  const playerName = useGameStore((s) => s.playerName)
  const quizResult = useGameStore((s) => s.quizResult)
  const setQuizResult = useGameStore((s) => s.setQuizResult)
  const completeLevel = useGameStore((s) => s.completeLevel)
  const addRecord = useGameStore((s) => s.addRecord)
  const addBadge = useGameStore((s) => s.addBadge)
  const goLevel = useGameStore((s) => s.goLevel)
  const fireConfetti = useUiStore((s) => s.fireConfetti)

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const startRef = useRef(Date.now())

  const total = QUESTIONS.length
  const answeredCount = Object.keys(answers).length
  const current = QUESTIONS[index]
  const full = ANSWERS.get(current.id)
  const result = quizResult

  const progress = useMemo(() => Math.round((answeredCount / total) * 100), [answeredCount, total])

  const pick = (optionIndex: number) => {
    if (result) return
    playSound('pop')
    setAnswers((a) => ({ ...a, [current.id]: optionIndex }))
    if (index < total - 1) window.setTimeout(() => setIndex((i) => i + 1), 260)
  }

  const submit = async () => {
    if (result || submitting) return
    setSubmitting(true)
    playSound('success')
    const durationMs = Date.now() - startRef.current
    const server = await submitQuiz(classId, playerName, answers, durationMs)
    const graded =
      server?.ok && server.data
        ? (server.data as { result: ReturnType<typeof gradeQuiz> }).result
        : gradeQuiz(answers)
    const snapshot = { ...graded, durationMs, submittedAt: Date.now() }
    setQuizResult(snapshot)
    completeLevel('quiz', { score: graded.score, stars: graded.score >= 90 ? 3 : graded.score >= 75 ? 2 : 1, usedMs: durationMs })
    addRecord({
      levelId: 'quiz',
      levelTitle: '结业考核 · 20 题闯关',
      group: '结业考核',
      input: `20 道选择题，作答 ${Object.keys(answers).length} 题`,
      process: `答对 ${graded.correct} 题 / 共 ${graded.total} 题`,
      output: `${graded.score} 分（满分 ${QUIZ_MAX_SCORE}）`,
    })
    addBadge('perfect-detective')
    fireConfetti()
    toastBadge('📝', '结业考核完成', `得分 ${graded.score} 分，答对 ${graded.correct} / ${graded.total} 题`)
    setSubmitting(false)
  }

  /* ------------------------- 成绩单视图 ------------------------- */
  if (result) {
    const wrong = RESULTS_DETAIL(result)
    return (
      <div className="mx-auto w-full max-w-[1100px] px-5 py-6">
        <section className="relative overflow-hidden rounded-notebook border-2 border-zout bg-white p-6 shadow-card">
          <span className="z-tape -top-2 left-12 -rotate-3" aria-hidden />
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative flex h-[130px] w-[130px] shrink-0 items-center justify-center">
              <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#00000012" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#E69138"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(result.score / QUIZ_MAX_SCORE) * 327} 327`}
                />
              </svg>
              <div className="text-center">
                <p className="text-[40px] font-extrabold leading-none text-zout-dark tabular-nums">
                  {result.score}
                </p>
                <p className="text-xs text-ink2">/ {QUIZ_MAX_SCORE} 分</p>
              </div>
            </div>
            <div className="min-w-[260px] flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-zout-dark">Result</p>
              <h1 className="mt-1 text-[30px] font-extrabold leading-tight text-ink">
                {playerName} 的结业考核成绩
              </h1>
              <p className="mt-2 text-[15px] text-ink2">
                共 {result.total} 题，答对 <b className="text-ink">{result.correct}</b> 题，
                答错 <b className="text-ink">{result.total - result.correct}</b> 题。
                用时 {Math.max(1, Math.round((result.durationMs ?? 0) / 1000))} 秒。
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <GameButton variant="gold" size="lg" icon={<ArrowRight size={19} />} onClick={() => goLevel('report')}>
                  前往领取侦探证
                </GameButton>
                <GameButton
                  variant="secondary"
                  icon={<RotateCcw size={17} />}
                  onClick={() => {
                    playSound('click')
                    setQuizResult(null)
                    setAnswers({})
                    setIndex(0)
                    startRef.current = Date.now()
                  }}
                >
                  再做一遍
                </GameButton>
              </div>
            </div>
          </div>
        </section>

        {wrong.length > 0 ? (
          <section className="mt-4 rounded-notebook border-2 border-black/5 bg-white p-5 shadow-card">
            <h2 className="text-[19px] font-bold text-ink">
              错题回顾（{wrong.length} 题）—— 对照教材再看一遍
            </h2>
            <div className="mt-4 space-y-3">
              {wrong.map(({ q, picked }) => (
                <div key={q.id} className="rounded-2xl border-2 border-red-200 bg-red-50/60 p-4">
                  <p className="flex items-start gap-2 text-[16px] font-semibold text-ink">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      <X size={13} />
                    </span>
                    {q.stem}
                  </p>
                  <div className="mt-2 space-y-1 pl-8 text-[15px]">
                    <p className="text-red-600">
                      你选了：{picked >= 0 ? q.options[picked] : '（未作答）'}
                    </p>
                    <p className="text-zin-dark">
                      正确答案：{q.options[q.answer]}
                    </p>
                  </div>
                  <p className="mt-2 rounded-xl bg-white/80 px-3 py-2 pl-3 text-[14px] leading-relaxed text-ink2">
                    <b className="text-ink">教材依据：</b>
                    {q.explain}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-zproc-light px-2.5 py-0.5 text-xs font-bold text-zproc-dark">
                    {TAG_LABEL[q.tag]}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <p className="mt-4 rounded-2xl border-2 border-zin bg-zin-pale px-5 py-4 text-center text-[16px] font-bold text-zin-dark">
            全部答对！你已经把这一课的知识点都拿下了 🎉
          </p>
        )}
      </div>
    )
  }

  /* ------------------------- 答题视图 ------------------------- */
  return (
    <LevelFrame
      levelId="quiz"
      taskTitle={`第 ${index + 1} / ${total} 题 · ${TAG_LABEL[current.tag as QuizTag]}`}
      taskHint="每题只有一个正确答案，选完会自动翻到下一题。右边的小格子可以跳回任意一题，全部答完再提交。"
      steps={{ total, current: index, done: QUESTIONS.map((q, i) => (answers[q.id] !== undefined ? i : -1)).filter((i) => i >= 0) }}
      score={answeredCount * 5}
      actions={
        <>
          <GameButton
            variant="secondary"
            icon={<ArrowLeft size={17} />}
            disabled={index === 0}
            onClick={() => {
              playSound('click')
              setIndex((i) => Math.max(0, i - 1))
            }}
          >
            上一题
          </GameButton>
          <GameButton
            variant="secondary"
            icon={<ArrowRight size={17} />}
            disabled={index === total - 1}
            onClick={() => {
              playSound('click')
              setIndex((i) => Math.min(total - 1, i + 1))
            }}
          >
            下一题
          </GameButton>
          <GameButton
            variant="gold"
            size="lg"
            icon={<Send size={19} />}
            disabled={answeredCount < total || submitting}
            onClick={submit}
          >
            {submitting ? '正在提交…' : answeredCount < total ? `还有 ${total - answeredCount} 题没答` : '提交答卷'}
          </GameButton>
        </>
      }
      banner={
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-zproc-light px-3 py-1 text-xs font-bold text-zproc-dark tabular-nums">
            已作答 {answeredCount} / {total}
          </span>
          <div className="h-2 min-w-[160px] flex-1 overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-zin via-zproc to-zout transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <motion.section
          key={current.id}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
          className="rounded-notebook border-2 border-black/5 bg-white p-6 shadow-card"
        >
          <p className="text-[21px] font-bold leading-relaxed text-ink">
            <span className="mr-2 text-zproc">Q{index + 1}.</span>
            {current.stem}
          </p>
          <div className="mt-5 space-y-2.5">
            {current.options.map((opt, i) => {
              const active = answers[current.id] === i
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  className={cn(
                    'flex w-full cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition',
                    active
                      ? 'border-zproc bg-zproc-pale shadow-card'
                      : 'border-black/10 bg-white hover:border-zproc/60 hover:bg-zproc-pale/50',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      active ? 'bg-zproc text-white' : 'bg-black/8 text-ink2',
                    )}
                  >
                    {active ? <Check size={15} /> : String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-[17px] leading-relaxed text-ink">{opt}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-4 text-xs text-ink2">
            知识点：{full ? TAG_LABEL[full.tag] : ''}
          </p>
        </motion.section>

        <aside className="rounded-notebook border-2 border-black/5 bg-white p-5 shadow-card">
          <h3 className="text-[17px] font-bold text-ink">答题卡</h3>
          <p className="mt-1 text-xs text-ink2">绿色=已作答，点一下可以跳到那一题</p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {QUESTIONS.map((q, i) => {
              const done = answers[q.id] !== undefined
              const now = i === index
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    'flex h-11 cursor-pointer items-center justify-center rounded-xl border-2 text-[15px] font-bold transition',
                    now
                      ? 'border-zproc bg-zproc text-white'
                      : done
                        ? 'border-zin bg-zin-light text-zin-dark'
                        : 'border-black/10 bg-white text-ink2 hover:border-zproc/60',
                  )}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>

          <div className="mt-5 rounded-2xl bg-zout-pale px-4 py-3 text-[13px] leading-relaxed text-ink2">
            <b className="text-zout-dark">答题小提示</b>
            <br />
            遇到不确定的题，先想一想这一课学过的"输入—处理—输出"，把题目里的场景套进去判断。
          </div>
        </aside>
      </div>
    </LevelFrame>
  )
}

/* 从成绩单里挑出错题，配上完整题面与解析 */
function RESULTS_DETAIL(result: { detail: Array<{ id: string; picked: number; ok: boolean }> }) {
  return result.detail
    .filter((d) => !d.ok)
    .map((d) => ({ q: ANSWERS.get(d.id)!, picked: d.picked }))
    .filter((x) => Boolean(x.q))
}
