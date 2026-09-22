import type { ReactNode } from 'react'
import { Clock, Target, Trophy } from 'lucide-react'
import type { LevelId } from '../../types/game'
import { getLevel } from '../../data/levels'
import { cn } from '../../lib/cn'
import { formatDuration } from '../../hooks/useElapsed'
import { StepDots } from '../common/ProgressBar'

interface LevelFrameProps {
  levelId: LevelId
  /** 当前小任务名称 */
  taskTitle: string
  /** 当前小任务的引导语 */
  taskHint?: string
  /** 步骤总数 / 当前步骤 / 已完成步骤 */
  steps?: { total: number; current: number; done?: number[] }
  /** 计时（秒） */
  elapsedSeconds?: number
  /** 本关已获得的临时得分 */
  score?: number
  /** 关卡底部的操作区 */
  actions?: ReactNode
  /** 顶部的补充信息条 */
  banner?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * 关卡外框：所有关卡共用同一套"案件编号 + 任务目标 + 计时/得分 + 操作区"结构，
 * 保证学生在不同关卡里总能找到同样的信息位置。
 */
export function LevelFrame({
  levelId,
  taskTitle,
  taskHint,
  steps,
  elapsedSeconds,
  score,
  actions,
  banner,
  className,
  children,
}: LevelFrameProps) {
  const level = getLevel(levelId)

  return (
    <div className={cn('mx-auto w-full max-w-[1500px] px-5 py-5', className)}>
      <header className="relative mb-4 overflow-hidden rounded-notebook border-2 border-black/5 bg-white px-5 py-4 shadow-card">
        <span className="z-tape -top-2 left-10 -rotate-3" aria-hidden />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-zproc to-zin text-2xl text-white shadow-card">
            {level.emoji}
          </span>
          <div className="min-w-[240px] flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zproc">
              Case {level.index} / 5
            </p>
            <h1 className="text-[26px] font-extrabold leading-tight text-ink">{level.title}</h1>
          </div>

          {steps ? (
            <StepDots total={steps.total} current={steps.current} done={steps.done} className="shrink-0" />
          ) : null}

          <div className="flex shrink-0 items-center gap-2">
            {typeof elapsedSeconds === 'number' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-sm font-bold text-ink2 tabular-nums">
                <Clock size={15} />
                {formatDuration(elapsedSeconds * 1000)}
              </span>
            ) : null}
            {typeof score === 'number' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zout-light px-3 py-1.5 text-sm font-bold text-zout-dark tabular-nums">
                <Trophy size={15} />
                {score} 分
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-zproc-pale px-3.5 py-2.5">
          <Target size={16} className="mt-[3px] shrink-0 text-zproc" />
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-ink">{taskTitle}</p>
            {taskHint ? <p className="mt-0.5 text-[13px] leading-relaxed text-ink2">{taskHint}</p> : null}
          </div>
        </div>

        {banner ? <div className="mt-3">{banner}</div> : null}
      </header>

      {children}

      {actions ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 rounded-notebook border-2 border-black/5 bg-white px-5 py-4 shadow-card">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
