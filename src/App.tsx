import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { LevelId } from './types/game'
import { useGameStore } from './store/useGameStore'
import { useUiStore } from './store/useUiStore'
import { reportProgress, startOutboxRetry } from './lib/api'
import { BadgeToast } from './components/common/BadgeToast'
import { Confetti } from './components/common/Confetti'
import { BottomBar } from './components/shell/BottomBar'
import { LevelMap } from './components/shell/LevelMap'
import { TopBar } from './components/shell/TopBar'
import { Level0Intro } from './levels/Level0Intro'
import { Level1Kitchen } from './levels/Level1Kitchen'
import { Level2Addition } from './levels/Level2Addition'
import { Level3Rectangle } from './levels/Level3Rectangle'
import { Level4TwentyFour } from './levels/Level4TwentyFour'
import { Level5Report } from './levels/Level5Report'
import { LoginPage } from './pages/LoginPage'
import { QuizPage } from './pages/QuizPage'
import { DashboardPage } from './pages/DashboardPage'

function renderLevel(id: LevelId) {
  switch (id) {
    case 'kitchen':
      return <Level1Kitchen />
    case 'addition':
      return <Level2Addition />
    case 'rectangle':
      return <Level3Rectangle />
    case 'twentyFour':
      return <Level4TwentyFour />
    case 'quiz':
      return <QuizPage />
    case 'report':
      return <Level5Report />
    case 'intro':
    default:
      return <Level0Intro />
  }
}

export default function App() {
  const currentLevel = useGameStore((s) => s.currentLevel)
  const classId = useGameStore((s) => s.classId)
  const playerName = useGameStore((s) => s.playerName)
  const progress = useGameStore((s) => s.progress)
  const badges = useGameStore((s) => s.badges)
  const finishedAt = useGameStore((s) => s.finishedAt)
  const markFinished = useGameStore((s) => s.markFinished)

  const toast = useUiStore((s) => s.toast)
  const closeToast = useUiStore((s) => s.closeToast)
  const confettiKey = useUiStore((s) => s.confettiKey)
  const mapOpen = useUiStore((s) => s.mapOpen)
  const closeMap = useUiStore((s) => s.closeMap)

  const [hash, setHash] = useState(() => (typeof window === 'undefined' ? '' : window.location.hash))

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    startOutboxRetry()
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (currentLevel === 'report' && !finishedAt) markFinished()
  }, [currentLevel, finishedAt, markFinished])

  // 进度上报：登录后每次学到新东西就同步给后端；外加 45 秒心跳，老师能看出谁还在线
  useEffect(() => {
    if (!classId || !playerName) return
    reportProgress(classId, playerName, progress, badges)
  }, [classId, playerName, progress, badges])

  useEffect(() => {
    if (!classId || !playerName) return
    const t = window.setInterval(() => {
      reportProgress(classId, playerName, progress, badges)
    }, 45000)
    return () => window.clearInterval(t)
  }, [classId, playerName, progress, badges])

  useEffect(() => {
    if (!mapOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMap()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mapOpen, closeMap])

  /* ------------------ 教师看板（独立视图，不显示学生界面） ------------------ */
  if (hash.startsWith('#/dashboard')) {
    return (
      <div className="relative min-h-screen">
        <DashboardPage />
        <BadgeToast toast={toast} onClose={closeToast} />
      </div>
    )
  }

  /* ------------------------------ 学生登录 ------------------------------ */
  if (!classId || !playerName) {
    return (
      <div className="relative min-h-screen">
        <LoginPage />
        <BadgeToast toast={toast} onClose={closeToast} />
        {hash.startsWith('#/dashboard') ? null : null}
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <TopBar />

      <main className="relative z-10 pb-[60px] pt-[68px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLevel}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            {renderLevel(currentLevel)}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomBar />

      <AnimatePresence>
        {mapOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="no-print fixed inset-0 z-40 overflow-y-auto bg-notebook/45 pt-[68px] backdrop-blur-sm"
            onClick={closeMap}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-auto my-5 w-full max-w-[1400px] rounded-[26px] bg-paper pb-6 shadow-cardHover"
            >
              <div className="flex items-center justify-between px-5 pt-5">
                <h2 className="text-[22px] font-extrabold text-ink">🗂 案件看板</h2>
                <button
                  type="button"
                  onClick={closeMap}
                  className="cursor-pointer rounded-xl border-2 border-black/10 bg-white px-4 py-2 text-sm font-bold text-ink2 transition hover:border-zproc hover:text-zproc-dark"
                >
                  收起看板
                </button>
              </div>
              <LevelMap />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Confetti fireKey={confettiKey} />
      <BadgeToast toast={toast} onClose={closeToast} />
    </div>
  )
}
