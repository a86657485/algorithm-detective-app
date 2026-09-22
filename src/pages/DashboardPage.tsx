import { Activity, ArrowLeft, KeyRound, RefreshCw, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CLASS_IDS, CLASS_LABELS, ROSTER, TOTAL_STUDENTS } from '../../shared/roster.mjs'
import type { ClassId } from '../../shared/roster.mjs'
import { QUIZ_QUESTIONS } from '../../shared/quiz-data.mjs'
import { fetchDashboard, openStream, teacherLogin } from '../lib/api'
import type { DashboardData, DashboardStudent } from '../lib/api'
import { LEVELS } from '../data/levels'
import { playSound } from '../lib/sound'
import { cn } from '../lib/cn'
import { GameButton } from '../components/common/GameButton'

const TOKEN_KEY = 'algo-teacher-token'
const LEVEL_SHORT: Record<string, string> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l.title.split(' · ')[1] ?? l.title]),
)

function clock(ts: number | null | undefined): string {
  if (!ts) return '—'
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}

function minutes(ms: number): string {
  if (!ms) return '—'
  const s = Math.max(1, Math.round(ms / 1000))
  if (s < 60) return `${s} 秒`
  return `${Math.floor(s / 60)} 分 ${s % 60} 秒`
}

type SortKey = 'name' | 'entered' | 'progress' | 'quiz'

export function DashboardPage() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [classId, setClassId] = useState<string>('all')
  const [data, setData] = useState<DashboardData | null>(null)
  const [live, setLive] = useState(false)
  const [updated, setUpdated] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('entered')
  const [onlyUnfinished, setOnlyUnfinished] = useState(false)
  const timerRef = useRef<number | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    const r = await fetchDashboard(classId, token)
    if (r?.ok && r.data) {
      setData(r.data)
      setUpdated(Date.now())
      setError('')
      return
    }
    if (r && !r.ok) {
      setError(r.error ?? '看板数据加载失败')
      if (r.error?.includes('过期')) {
        localStorage.removeItem(TOKEN_KEY)
        setToken('')
      }
    }
  }, [classId, token])

  useEffect(() => {
    void load()
  }, [load])

  // 实时推送；若 8 秒内没有连上，就退化成 5 秒轮询
  useEffect(() => {
    if (!token) return
    const close = openStream(token, () => void load())
    const probe = window.setTimeout(() => {
      setLive(true)
    }, 1200)
    timerRef.current = window.setInterval(() => void load(), 5000)
    return () => {
      window.clearTimeout(probe)
      if (timerRef.current) window.clearInterval(timerRef.current)
      close()
    }
  }, [token, load])

  const doLogin = async () => {
    playSound('click')
    const r = await teacherLogin(password)
    if (r?.ok && r.data?.token) {
      localStorage.setItem(TOKEN_KEY, r.data.token)
      setToken(r.data.token)
      setPassword('')
      setError('')
      return
    }
    setError(r?.ok === false ? (r.error ?? '口令不正确') : '连不上后端服务，请确认已运行 npm run start')
  }

  const students = useMemo(() => {
    if (!data) return []
    const kw = keyword.trim()
    let list = data.students
    if (kw) list = list.filter((s) => s.name.includes(kw))
    if (onlyUnfinished) list = list.filter((s) => !s.quiz)
    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'zh')
      if (sortKey === 'progress') return b.doneCount - a.doneCount
      if (sortKey === 'quiz') return (b.quiz?.score ?? -1) - (a.quiz?.score ?? -1)
      if (!a.enteredAt) return 1
      if (!b.enteredAt) return -1
      return a.enteredAt - b.enteredAt
    })
    return sorted
  }, [data, keyword, onlyUnfinished, sortKey])

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[80vh] w-full max-w-[520px] items-center px-5">
        <section className="w-full rounded-notebook border-2 border-zproc-light bg-white p-6 shadow-card">
          <p className="flex items-center gap-2 text-[22px] font-extrabold text-ink">
            <KeyRound size={22} className="text-zout" />
            教师数据看板
          </p>
          <p className="mt-1.5 text-[14px] text-ink2">
            输入教师口令后进入。默认口令 <b className="text-ink">teacher</b>，
            可用环境变量 <code className="rounded bg-black/5 px-1">TEACHER_PASSWORD</code> 修改。
          </p>
          <div className="mt-4 flex gap-2">
            <input
              type="password"
              value={password}
              autoFocus
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void doLogin()
              }}
              placeholder="教师口令"
              className="h-12 flex-1 rounded-xl border-2 border-black/10 bg-paper px-3 text-[16px] text-ink outline-none transition placeholder:text-black/30 focus:border-zproc focus:bg-white"
            />
            <GameButton size="lg" onClick={doLogin}>
              进入
            </GameButton>
          </div>
          {error ? <p className="mt-2 text-sm font-semibold text-red-500">{error}</p> : null}
          <button
            type="button"
            onClick={() => {
              window.location.hash = ''
            }}
            className="mt-4 flex cursor-pointer items-center gap-1.5 text-sm text-ink2 transition hover:text-ink"
          >
            <ArrowLeft size={15} /> 返回学生登录页
          </button>
        </section>
      </div>
    )
  }

  const s = data?.summary

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 py-6">
      <header className="mb-4 flex flex-wrap items-center gap-4 rounded-notebook border-2 border-black/5 bg-white px-5 py-4 shadow-card">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-zproc">Dashboard</p>
          <h1 className="text-[28px] font-extrabold leading-tight text-ink">班级数据看板</h1>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold',
            live ? 'bg-zin-light text-zin-dark' : 'bg-black/5 text-ink2',
          )}
        >
          <span className={cn('h-2 w-2 rounded-full', live ? 'animate-pulse bg-zin' : 'bg-black/30')} />
          {live ? '实时更新中' : '正在连接'}
        </span>
        <span className="text-xs text-ink2">最后更新：{clock(updated)}</span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...CLASS_IDS] as string[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  playSound('click')
                  setClassId(id)
                }}
                className={cn(
                  'h-9 cursor-pointer rounded-xl border-2 px-3.5 text-sm font-bold transition',
                  classId === id
                    ? 'border-zproc bg-zproc text-white'
                    : 'border-black/10 bg-white text-ink2 hover:border-zproc/60',
                )}
              >
                {id === 'all' ? '全部班级' : `${id} 班`}
              </button>
            ))}
          </div>
          <GameButton size="sm" variant="secondary" icon={<RefreshCw size={14} />} onClick={() => void load()}>
            刷新
          </GameButton>
          <GameButton
            size="sm"
            variant="ghost"
            icon={<ArrowLeft size={14} />}
            onClick={() => {
              localStorage.removeItem(TOKEN_KEY)
              setToken('')
              window.location.hash = ''
            }}
          >
            退出看板
          </GameButton>
        </div>
      </header>

      {error ? (
        <p className="mb-4 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {/* 汇总 */}
      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="应到人数" value={s?.expectedTotal ?? TOTAL_STUDENTS} tone="plain" />
        <Stat label="已进入" value={s?.joined ?? 0} tone="blue" />
        <Stat label="当前在线" value={s?.onlineCount ?? 0} tone="blue" />
        <Stat label="已通关 5 关" value={s?.finished ?? 0} tone="green" />
        <Stat label="已完成考核" value={s?.quizzed ?? 0} tone="orange" />
        <Stat
          label="考核平均分"
          value={s ? `${s.avgScore}` : 0}
          hint={s && s.quizzed > 0 ? `最高 ${s.maxScore} / 最低 ${s.minScore}` : '还没有人提交'}
          tone="orange"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* 学生明细 */}
        <section className="rounded-notebook border-2 border-black/5 bg-white shadow-card">
          <div className="flex flex-wrap items-center gap-3 border-b-2 border-black/5 px-5 py-3.5">
            <h2 className="text-[18px] font-bold text-ink">
              学生明细（{students.length} 人）
            </h2>
            <div className="relative ml-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜姓名"
                className="h-9 w-[150px] rounded-xl border-2 border-black/10 bg-paper pl-8 pr-3 text-sm outline-none focus:border-zproc focus:bg-white"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ink2">
              <input
                type="checkbox"
                checked={onlyUnfinished}
                onChange={(e) => setOnlyUnfinished(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-zproc"
              />
              只看未考核
            </label>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 cursor-pointer rounded-xl border-2 border-black/10 bg-paper px-2 text-xs font-bold text-ink2 outline-none focus:border-zproc"
            >
              <option value="entered">按进入时间</option>
              <option value="name">按姓名</option>
              <option value="progress">按关卡进度</option>
              <option value="quiz">按考核得分</option>
            </select>
          </div>

          <div className="z-scroll max-h-[560px] overflow-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead className="sticky top-0 z-10 bg-paper text-left text-xs font-bold text-ink2">
                <tr>
                  <th className="px-3 py-2.5">姓名</th>
                  {classId === 'all' ? <th className="px-2 py-2.5">班级</th> : null}
                  <th className="px-2 py-2.5">进入</th>
                  <th className="px-2 py-2.5">关卡</th>
                  <th className="px-2 py-2.5">游戏分</th>
                  <th className="px-2 py-2.5">考核</th>
                  <th className="px-3 py-2.5">状态</th>
                </tr>
              </thead>
              <tbody>
                {students.map((stu, i) => (
                  <StudentRow key={stu.key} stu={stu} showClass={classId === 'all'} zebra={i % 2 === 1} />
                ))}
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-ink2">
                      没有匹配的学生
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {/* 右侧：关卡 + 错题 */}
        <div className="space-y-4">
          <section className="rounded-notebook border-2 border-black/5 bg-white p-5 shadow-card">
            <h2 className="text-[18px] font-bold text-ink">各关卡完成情况</h2>
            <div className="mt-3 space-y-2.5">
              {(data?.levels ?? []).map((lv) => (
                <div key={lv.key}>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="font-semibold text-ink">{LEVEL_SHORT[lv.key] ?? lv.key}</span>
                    <span className="tabular-nums text-ink2">
                      {lv.done} / {lv.total}（{lv.rate}%）
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-zin to-zproc transition-[width] duration-500"
                      style={{ width: `${lv.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-notebook border-2 border-black/5 bg-white p-5 shadow-card">
            <h2 className="text-[18px] font-bold text-ink">最易错的 5 道题</h2>
            <p className="mt-1 text-xs text-ink2">按正确率从低到高排，讲评时优先看这几题</p>
            <div className="mt-3 space-y-2.5">
              {[...(data?.questions ?? [])]
                .filter((q) => q.answered > 0)
                .sort((a, b) => a.correctRate - b.correctRate)
                .slice(0, 5)
                .map((q) => (
                  <div key={q.id} className="rounded-2xl border-2 border-black/5 bg-paper px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zproc-dark">第 {q.index} 题 · {q.tagLabel}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
                          q.correctRate >= 80
                            ? 'bg-zin-light text-zin-dark'
                            : q.correctRate >= 50
                              ? 'bg-zout-light text-zout-dark'
                              : 'bg-red-100 text-red-600',
                        )}
                      >
                        正确率 {q.correctRate}%
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink">{q.stem}</p>
                    <p className="mt-1 text-[11px] text-ink2 tabular-nums">
                      答对 {q.right} / 作答 {q.answered}
                    </p>
                  </div>
                ))}
              {(data?.questions ?? []).every((q) => q.answered === 0) ? (
                <p className="py-6 text-center text-sm text-ink2">还没有学生提交答卷</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-notebook border-2 border-black/5 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-[18px] font-bold text-ink">
              <Activity size={18} className="text-zin" />
              班级对比
            </h2>
            <div className="mt-3 space-y-2">
              {(data?.perClass ?? CLASS_IDS.map((id) => ({ classId: id, label: CLASS_LABELS[id as ClassId], summary: null }))).map(
                (c) => (
                  <div key={c.classId} className="flex items-center gap-3 text-[13px]">
                    <span className="w-16 shrink-0 font-bold text-ink">{c.classId} 班</span>
                    <span className="w-20 shrink-0 tabular-nums text-ink2">
                      {(ROSTER as Record<string, string[]>)[c.classId]?.length ?? 0} 人
                    </span>
                    <span className="tabular-nums text-ink2">
                      进入 {c.summary?.joined ?? 0} · 通关 {c.summary?.finished ?? 0} · 考核{' '}
                      {c.summary?.quizzed ?? 0}
                    </span>
                    <span className="ml-auto font-bold tabular-nums text-zout-dark">
                      均分 {c.summary?.avgScore ?? 0}
                    </span>
                  </div>
                ),
              )}
            </div>
          </section>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-ink2">
        共 {QUIZ_QUESTIONS.length} 道考核题 · 数据实时来自 server/data/db.json ·
        学生端刷新页面不影响统计
      </p>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: number | string
  hint?: string
  tone: 'plain' | 'blue' | 'green' | 'orange'
}) {
  const ring: Record<string, string> = {
    plain: 'border-black/10 bg-white text-ink',
    blue: 'border-zproc bg-zproc-pale text-zproc-dark',
    green: 'border-zin bg-zin-pale text-zin-dark',
    orange: 'border-zout bg-zout-pale text-zout-dark',
  }
  return (
    <div className={cn('rounded-notebook border-2 px-4 py-3 shadow-card', ring[tone])}>
      <p className="text-xs font-bold opacity-80">{label}</p>
      <p className="mt-0.5 text-[28px] font-extrabold leading-tight tabular-nums">{value}</p>
      {hint ? <p className="text-[11px] opacity-80">{hint}</p> : null}
    </div>
  )
}

function StudentRow({ stu, showClass, zebra }: { stu: DashboardStudent; showClass: boolean; zebra: boolean }) {
  return (
    <tr className={cn('border-t border-black/5', zebra && 'bg-black/2')}>
      <td className="px-3 py-2">
        <span className="flex items-center gap-1.5 font-semibold text-ink">
          {stu.online ? <span className="h-2 w-2 shrink-0 rounded-full bg-zin" /> : null}
          {stu.name}
        </span>
      </td>
      {showClass ? <td className="px-2 py-2 text-ink2">{stu.classId}</td> : null}
      <td className="px-2 py-2 tabular-nums text-ink2">{clock(stu.enteredAt)}</td>
      <td className="px-2 py-2">
        <span className="tabular-nums text-ink2">{stu.doneCount}/5</span>
      </td>
      <td className="px-2 py-2 font-semibold tabular-nums text-ink">{stu.enteredAt ? stu.totalScore : '—'}</td>
      <td className="px-2 py-2">
        {stu.quiz ? (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
              stu.quiz.score >= 80
                ? 'bg-zin-light text-zin-dark'
                : stu.quiz.score >= 60
                  ? 'bg-zout-light text-zout-dark'
                  : 'bg-red-100 text-red-600',
            )}
          >
            {stu.quiz.score} 分
          </span>
        ) : (
          <span className="text-ink2">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        {stu.quiz ? (
          <span className="text-xs text-ink2">已考核 {minutes(stu.quiz.durationMs)}</span>
        ) : stu.finished ? (
          <span className="rounded-full bg-zproc-light px-2 py-0.5 text-xs font-bold text-zproc-dark">
            待考核
          </span>
        ) : stu.enteredAt ? (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-bold text-ink2">
            闯关中
          </span>
        ) : (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-ink2">未进入</span>
        )}
      </td>
    </tr>
  )
}
