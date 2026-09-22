import { AnimatePresence, motion } from 'framer-motion'
import { Printer, RotateCcw, X } from 'lucide-react'
import { BADGES, LEVELS } from '../../data/levels'
import { useGameStore, selectTotalScore } from '../../store/useGameStore'
import { formatDuration } from '../../hooks/useElapsed'
import { cn } from '../../lib/cn'
import { GameButton } from '../common/GameButton'
import { Mascot } from '../common/Mascot'

interface CertificateModalProps {
  open: boolean
  onClose: () => void
  onPrint: () => void
  onRestart: () => void
}

/** 结业颁发侦探证：盖章动效 + 徽章墙 */
export function CertificateModal({ open, onClose, onPrint, onRestart }: CertificateModalProps) {
  const playerName = useGameStore((s) => s.playerName)
  const progress = useGameStore((s) => s.progress)
  const badges = useGameStore((s) => s.badges)
  const startedAt = useGameStore((s) => s.startedAt)
  const finishedAt = useGameStore((s) => s.finishedAt)
  const totalScore = useGameStore(selectTotalScore)

  const usedMs = startedAt ? (finishedAt ?? Date.now()) - startedAt : 0
  const today = new Date()
  const dateText = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-notebook/55 p-5 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.86, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-[26px] border-[3px] border-zout bg-paper p-6 shadow-stamp"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="absolute right-4 top-4 cursor-pointer rounded-xl p-1.5 text-ink2 transition hover:bg-black/5 hover:text-ink"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-zout-dark">
                Certificate
              </p>
              <h2 className="mt-1 text-[32px] font-extrabold tracking-tight text-ink">
                首席算法侦探聘书
              </h2>
              <p className="mt-1 text-sm text-ink2">Algorithm Detective Appointment</p>
            </div>

            <div className="mt-5 flex items-center gap-5 rounded-2xl border-2 border-dashed border-zout bg-white/80 p-5">
              <Mascot size={110} mood="happy" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-relaxed text-ink">
                  兹聘请
                  <span className="mx-1 border-b-2 border-zout px-3 text-[20px] font-extrabold text-zout-dark">
                    {playerName || '小小侦探'}
                  </span>
                  同学为
                  <b>首席算法侦探</b>。
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink2">
                  在 <b className="text-ink">{formatDuration(usedMs)}</b> 内完成 {LEVELS.length} 个案件，
                  累计 <b className="text-ink">{totalScore}</b> 分，已经掌握
                  <b className="text-ink">输入 → 处理 → 输出</b> 的基本流程。
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {LEVELS.map((l) => {
                const p = progress[l.id]
                return (
                  <div
                    key={l.id}
                    className={cn(
                      'rounded-xl border-2 px-2 py-2 text-center',
                      p?.finishedAt ? 'border-zin bg-zin-pale' : 'border-black/10 bg-white/60',
                    )}
                  >
                    <div className="text-xl">{l.emoji}</div>
                    <div className="mt-0.5 text-[11px] font-bold leading-tight text-ink">{l.title.split(' · ')[1]}</div>
                    <div className="text-[11px] text-ink2 tabular-nums">{p?.score ?? 0} 分</div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-bold text-ink">徽章墙</p>
              <div className="flex flex-wrap gap-2">
                {BADGES.map((b) => {
                  const owned = badges.includes(b.id)
                  return (
                    <span
                      key={b.id}
                      title={`${b.name}：${b.desc}`}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition',
                        owned
                          ? 'border-zout bg-zout-light text-zout-dark'
                          : 'border-black/10 bg-white/50 text-black/30',
                      )}
                    >
                      <span className="text-base">{owned ? b.emoji : '🔒'}</span>
                      {b.name}
                    </span>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <p className="text-sm text-ink2">
                颁发日期：{dateText}
                <br />
                算法小侦探事务所（盖章生效）
              </p>
              <motion.div
                initial={{ scale: 2.4, rotate: -26, opacity: 0 }}
                animate={{ scale: 1, rotate: -10, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-full border-[3px] border-red-400 text-center text-red-500"
                style={{ boxShadow: 'inset 0 0 0 3px rgba(248,113,113,0.35)' }}
              >
                <div className="leading-tight">
                  <div className="text-[11px] font-bold tracking-widest">事务所</div>
                  <div className="text-[19px] font-extrabold tracking-wider">认证</div>
                  <div className="text-[9px] tracking-widest">APPROVED</div>
                </div>
              </motion.div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <GameButton variant="gold" size="lg" icon={<Printer size={19} />} onClick={onPrint}>
                打印我的任务单
              </GameButton>
              <GameButton variant="secondary" size="lg" onClick={onClose}>
                去任务单页面
              </GameButton>
              <GameButton variant="ghost" size="lg" icon={<RotateCcw size={18} />} onClick={onRestart}>
                再玩一次
              </GameButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
