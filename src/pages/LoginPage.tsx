import { motion } from 'framer-motion'
import { KeyRound, LogIn, Search, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CLASS_IDS, CLASS_LABELS, ROSTER, TOTAL_STUDENTS } from '../../shared/roster.mjs'
import type { ClassId } from '../../shared/roster.mjs'
import { useGameStore } from '../store/useGameStore'
import { useUiStore } from '../store/useUiStore'
import { reportLogin, teacherLogin } from '../lib/api'
import { playSound } from '../lib/sound'
import { cn } from '../lib/cn'
import { GameButton } from '../components/common/GameButton'
import { Mascot } from '../components/common/Mascot'
import { StageLegend } from '../components/common/StageLegend'

export function LoginPage() {
  const setStudent = useGameStore((s) => s.setStudent)
  const fireConfetti = useUiStore((s) => s.fireConfetti)

  const [classId, setClassId] = useState<ClassId | ''>('')
  const [keyword, setKeyword] = useState('')
  const [picked, setPicked] = useState('')
  const [busy, setBusy] = useState(false)

  const [teacherOpen, setTeacherOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [teacherError, setTeacherError] = useState('')

  const names = useMemo(() => {
    if (!classId) return []
    const list = (ROSTER as Record<string, string[]>)[classId] ?? []
    const kw = keyword.trim()
    return kw ? list.filter((n) => n.includes(kw)) : list
  }, [classId, keyword])

  const enter = async () => {
    if (!classId || !picked || busy) return
    setBusy(true)
    playSound('success')
    await reportLogin(classId, picked)
    setStudent(classId, picked)
    fireConfetti()
    setBusy(false)
  }

  const doTeacherLogin = async () => {
    playSound('click')
    const r = await teacherLogin(password)
    if (r?.ok && r.data?.token) {
      localStorage.setItem('algo-teacher-token', r.data.token)
      window.location.hash = '#/dashboard'
      return
    }
    setTeacherError(r?.error ?? (r?.ok ? '口令不正确' : '连不上后端服务，请先启动 npm run start'))
  }

  return (
    <div className="relative min-h-screen px-5 py-8">
      <div className="mx-auto w-full max-w-[1180px]">
        {/* 顶部 */}
        <header className="relative mb-6 overflow-hidden rounded-notebook border-2 border-zproc-light bg-white px-6 py-6 shadow-card">
          <span className="z-tape -top-2 left-14 -rotate-3" aria-hidden />
          <span className="z-tape -top-2 right-16 rotate-2" aria-hidden />
          <div className="flex flex-wrap items-center gap-6">
            <Mascot size={116} mood="happy" className="animate-floatY" />
            <div className="min-w-[280px] flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-zproc">
                Sign in · 侦探登记处
              </p>
              <h1 className="mt-1 text-[38px] font-extrabold leading-tight text-ink">
                算法小侦探事务所
              </h1>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink2">
                五年级信息科技 · 第 2 课 算法认识与体验。
                请先选好班级和姓名，你的闯关进度会记在这位同学名下。
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StageLegend />
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-ink2">
                  共 {TOTAL_STUDENTS} 名同学
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr]">
          {/* 选班级 */}
          <section className="rounded-notebook border-2 border-black/5 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-[19px] font-bold text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zproc text-sm font-bold text-white">
                1
              </span>
              选择班级
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(CLASS_IDS as ClassId[]).map((id) => {
                const active = classId === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      playSound('click')
                      setClassId(id)
                      setPicked('')
                      setKeyword('')
                    }}
                    className={cn(
                      'cursor-pointer rounded-2xl border-2 px-4 py-5 text-left transition',
                      active
                        ? '-translate-y-0.5 border-zproc bg-zproc-pale shadow-cardHover'
                        : 'border-black/10 bg-white hover:border-zproc/60 hover:shadow-card',
                    )}
                  >
                    <p className={cn('text-[26px] font-extrabold tabular-nums', active ? 'text-zproc-dark' : 'text-ink')}>
                      {id}
                    </p>
                    <p className="text-[13px] text-ink2">{(CLASS_LABELS as Record<string, string>)[id]}</p>
                    <p className="mt-1 text-[12px] text-ink2">
                      {(ROSTER as Record<string, string[]>)[id].length} 人
                    </p>
                  </button>
                )
              })}
            </div>
          </section>

          {/* 选姓名 */}
          <section className="rounded-notebook border-2 border-black/5 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-[19px] font-bold text-ink">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zin text-sm font-bold text-white">
                  2
                </span>
                选择我的姓名
              </h2>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
                <input
                  value={keyword}
                  disabled={!classId}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜名字"
                  className="h-10 w-[170px] rounded-xl border-2 border-black/10 bg-paper pl-9 pr-3 text-[15px] text-ink outline-none transition placeholder:text-black/30 focus:border-zproc focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {!classId ? (
              <p className="mt-6 rounded-2xl bg-black/5 py-10 text-center text-sm text-ink2">
                先在上面选一个班级
              </p>
            ) : names.length === 0 ? (
              <p className="mt-6 rounded-2xl bg-red-50 py-10 text-center text-sm text-red-500">
                这个班里没有找到「{keyword}」，检查一下有没有写错字
              </p>
            ) : (
              <div className="z-scroll mt-4 grid max-h-[330px] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
                {names.map((n) => {
                  const active = picked === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        playSound('pop')
                        setPicked(n)
                      }}
                      className={cn(
                        'h-11 cursor-pointer truncate rounded-xl border-2 px-2 text-[15px] font-semibold transition',
                        active
                          ? 'border-zin bg-zin text-white shadow-card'
                          : 'border-black/10 bg-white text-ink hover:border-zin hover:bg-zin-pale',
                      )}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t-2 border-dashed border-black/10 pt-4">
              <span className="flex items-center gap-1.5 text-[15px] text-ink2">
                <UserRound size={16} />
                {classId && picked ? (
                  <>
                    我是 <b className="text-ink">{classId} 班</b> 的{' '}
                    <b className="text-ink">{picked}</b>
                  </>
                ) : (
                  '还没有选好哦'
                )}
              </span>
              <GameButton
                size="lg"
                variant="gold"
                className="ml-auto min-w-[210px]"
                icon={<LogIn size={19} />}
                disabled={!classId || !picked || busy}
                onClick={enter}
              >
                {busy ? '正在进入…' : '进入侦探事务所'}
              </GameButton>
            </div>
          </section>
        </div>

        {/* 教师入口 */}
        <div className="mt-6 flex justify-end">
          {teacherOpen ? (
            <div className="w-full max-w-[420px] rounded-2xl border-2 border-black/10 bg-white p-4 shadow-card">
              <p className="flex items-center gap-2 text-[15px] font-bold text-ink">
                <KeyRound size={16} className="text-zout" />
                教师入口
              </p>
              <p className="mt-1 text-xs text-ink2">输入口令后进入班级数据看板</p>
              <div className="mt-3 flex gap-2">
                <input
                  type="password"
                  value={password}
                  autoFocus
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setTeacherError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void doTeacherLogin()
                  }}
                  placeholder="教师口令"
                  className="h-11 flex-1 rounded-xl border-2 border-black/10 bg-paper px-3 text-[15px] text-ink outline-none transition placeholder:text-black/30 focus:border-zproc focus:bg-white"
                />
                <GameButton onClick={doTeacherLogin}>进入看板</GameButton>
              </div>
              {teacherError ? (
                <p className="mt-2 text-xs font-semibold text-red-500">{teacherError}</p>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setTeacherOpen(true)}
              className="cursor-pointer text-xs text-black/25 transition hover:text-ink2"
            >
              教师入口
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
