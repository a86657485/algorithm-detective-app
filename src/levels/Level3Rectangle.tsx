import { ArrowRight, Check, Ruler, RotateCcw, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getLevel } from '../data/levels'
import { useGameStore } from '../store/useGameStore'
import { toastBadge, useUiStore } from '../store/useUiStore'
import { playSound } from '../lib/sound'
import { cn } from '../lib/cn'
import { useCountUp } from '../hooks/useCountUp'
import { useElapsed } from '../hooks/useElapsed'
import { GameButton } from '../components/common/GameButton'
import { NotebookLayout } from '../components/common/NotebookLayout'
import { StickyNote } from '../components/common/StickyNote'
import { LevelFrame } from '../components/shell/LevelFrame'

const TARGETS = [24, 36, 48, 18, 30, 20, 42, 16]

interface RectCanvasProps {
  length: number
  width: number
  area: number
}

/** 按比例画出长方形，并标注长、宽和面积（内联 SVG，投影放大不糊） */
function RectCanvas({ length, width, area }: RectCanvasProps) {
  const VW = 360
  const VH = 250
  const PAD = 52
  const scale = Math.min((VW - PAD * 2) / Math.max(length, 1), (VH - PAD * 2) / Math.max(width, 1))
  const w = Math.max(6, length * scale)
  const h = Math.max(6, width * scale)
  const x = (VW - w) / 2
  const y = (VH - h) / 2

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full max-w-[380px]" role="img" aria-label="长方形示意图">
      <defs>
        <linearGradient id="rectFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4A86E8" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#6AA84F" stopOpacity="0.72" />
        </linearGradient>
      </defs>

      <rect x={x} y={y} width={w} height={h} rx="4" fill="url(#rectFill)" stroke="#2563EB" strokeWidth="3" />

      {/* 长：上方双向箭头 */}
      <line x1={x} y1={y - 22} x2={x + w} y2={y - 22} stroke="#22272E" strokeWidth="1.6" />
      <polygon points={`${x},${y - 22} ${x + 9},${y - 26} ${x + 9},${y - 18}`} fill="#22272E" />
      <polygon points={`${x + w},${y - 22} ${x + w - 9},${y - 26} ${x + w - 9},${y - 18}`} fill="#22272E" />
      <text x={x + w / 2} y={y - 30} textAnchor="middle" fontSize="15" fontWeight="700" fill="#22272E">
        {length} cm
      </text>

      {/* 宽：左侧双向箭头 */}
      <line x1={x - 22} y1={y} x2={x - 22} y2={y + h} stroke="#22272E" strokeWidth="1.6" />
      <polygon points={`${x - 22},${y} ${x - 26},${y + 9} ${x - 18},${y + 9}`} fill="#22272E" />
      <polygon points={`${x - 22},${y + h} ${x - 26},${y + h - 9} ${x - 18},${y + h - 9}`} fill="#22272E" />
      <text
        x={x - 30}
        y={y + h / 2}
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill="#22272E"
        transform={`rotate(-90 ${x - 30} ${y + h / 2})`}
      >
        {width} cm
      </text>

      {/* 面积写在中间 */}
      <text x={x + w / 2} y={y + h / 2 + 8} textAnchor="middle" fontSize="26" fontWeight="800" fill="#FFFFFF">
        {area}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 28} textAnchor="middle" fontSize="12" fontWeight="600" fill="#FFFFFF">
        cm²
      </text>
    </svg>
  )
}

export function Level3Rectangle() {
  const completeLevel = useGameStore((s) => s.completeLevel)
  const addRecord = useGameStore((s) => s.addRecord)
  const addBadge = useGameStore((s) => s.addBadge)
  const goLevel = useGameStore((s) => s.goLevel)
  const fireConfetti = useUiStore((s) => s.fireConfetti)

  const elapsed = useElapsed(true, 'rectangle')
  const [phase, setPhase] = useState<'formula' | 'reverse' | 'done'>('formula')
  const [length, setLength] = useState(10)
  const [width, setWidth] = useState(5)
  const [target, setTarget] = useState(() => TARGETS[Math.floor(Math.random() * TARGETS.length)])
  const [targetHits, setTargetHits] = useState(0)
  const [tries, setTries] = useState(0)

  const area = length * width
  const animatedArea = useCountUp(area, 420)
  const nextTarget = useMemo(
    () => () => TARGETS[Math.floor(Math.random() * TARGETS.length)],
    [],
  )
  const level = getLevel('rectangle')

  const clamp = (v: number) => Math.min(50, Math.max(1, Math.round(v) || 1))

  const hitTarget = area === target

  const checkTarget = () => {
    setTries((t) => t + 1)
    if (hitTarget) {
      playSound('success')
      fireConfetti()
      if (targetHits + 1 >= 3) {
        setTargetHits(3)
        setPhase('done')
      } else {
        setTargetHits((n) => n + 1)
        window.setTimeout(() => {
          setTarget(nextTarget())
          setLength(6)
          setWidth(4)
        }, 800)
      }
      return
    }
    playSound('error')
  }

  const finishLevel = () => {
    const penalty = Math.min(20, tries * 3)
    const score = Math.max(25, 65 - penalty)
    const stars = score >= 58 ? 3 : score >= 45 ? 2 : 1
    addRecord({
      levelId: 'rectangle',
      levelTitle: '第三关 · 密室测量',
      group: '长方形面积',
      input: `长 ${length} cm，宽 ${width} cm`,
      process: `面积 = 长 × 宽 = ${length} × ${width}`,
      output: `${area} cm²`,
    })
    completeLevel('rectangle', { score, stars, usedMs: elapsed * 1000 })
    addBadge('measure-expert')
    toastBadge('📐', '获得徽章：测量专家', `反推挑战成功 ${targetHits} 次 · 得分 ${score} 分`)
    playSound('badge')
    goLevel('twentyFour')
  }

  const nextLevel = getLevel('twentyFour')

  return (
    <LevelFrame
      levelId="rectangle"
      taskTitle={
        phase === 'done'
          ? '三个环节全部走通，可以前往下一关了'
          : phase === 'formula'
            ? '调整长和宽，观察"处理"和"输出"怎么跟着变'
            : `反推挑战：让面积正好等于 ${target} cm²`
      }
      taskHint={
        phase === 'formula'
          ? '拖动滑块或直接输入数字。每换一组输入，处理过程和输出结果都会立刻跟着变——这就是"同一个算法，不同输入、不同输出"。'
          : '这次的输入不再是随便填的，而是由目标倒推出来的。试试把长或宽拆成两个数的乘积吧。'
      }
      steps={{
        total: 2,
        current: phase === 'formula' ? 0 : 1,
        done: phase === 'done' ? [0, 1] : phase === 'reverse' ? [0] : [],
      }}
      elapsedSeconds={elapsed}
      score={Math.max(0, 65 - tries * 3)}
      actions={
        <>
          <GameButton
            variant="secondary"
            icon={<RotateCcw size={17} />}
            onClick={() => {
              setLength(10)
              setWidth(5)
              setPhase('formula')
              setTargetHits(0)
              setTries(0)
            }}
          >
            重置尺寸
          </GameButton>
          {phase === 'reverse' ? (
            <>
              <GameButton variant="secondary" icon={<Ruler size={17} />} onClick={checkTarget}>
                检查面积
              </GameButton>
              <GameButton
                variant="secondary"
                icon={<Target size={17} />}
                onClick={() => {
                  playSound('click')
                  setTarget(nextTarget())
                }}
              >
                换一个目标
              </GameButton>
            </>
          ) : phase === 'formula' ? (
            <GameButton
              variant="primary"
              size="lg"
              icon={<Ruler size={19} />}
              onClick={() => {
                playSound('click')
                setPhase('reverse')
                setLength(6)
                setWidth(4)
              }}
            >
              接受反推挑战
            </GameButton>
          ) : (
            <span className="rounded-full bg-zin-light px-4 py-2 text-sm font-bold text-zin-dark">
              三个目标全部达成！
            </span>
          )}
          <GameButton
            variant="gold"
            size="lg"
            icon={<ArrowRight size={19} />}
            disabled={phase !== 'done'}
            onClick={finishLevel}
          >
            前往 {nextLevel.title}
          </GameButton>
        </>
      }
      banner={
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-zout-light px-3 py-1 text-xs font-bold text-zout-dark">
            反推挑战已完成 {targetHits} / 3
          </span>
          {phase === 'reverse' ? (
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-bold tabular-nums',
                hitTarget ? 'bg-zin-light text-zin-dark' : 'bg-red-50 text-red-500',
              )}
            >
              当前面积 {area} cm² / 目标 {target} cm²
            </span>
          ) : null}
          <span className="text-xs text-ink2">{level.point}</span>
        </div>
      }
    >
      <NotebookLayout
        zones={[
          {
            stage: 'input',
            title: '输入：长方形的尺寸',
            children: (
              <div className="w-full space-y-4">
                {[
                  { key: 'length', label: '长（cm）', value: length, set: setLength },
                  { key: 'width', label: '宽（cm）', value: width, set: setWidth },
                ].map((item) => (
                  <div key={item.key} className="rounded-2xl border-2 border-black/5 bg-paper p-3.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`rect-${item.key}`} className="text-sm font-bold text-ink">
                        {item.label}
                      </label>
                      <input
                        id={`rect-${item.key}`}
                        type="number"
                        min={1}
                        max={50}
                        value={item.value}
                        onChange={(e) => item.set(clamp(Number(e.target.value)))}
                        className="h-11 w-20 rounded-xl border-2 border-black/10 bg-white text-center text-[20px] font-bold text-ink outline-none transition focus:border-zin focus:ring-4 focus:ring-zin/20"
                      />
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={item.value}
                      aria-label={`${item.label} 滑块`}
                      onChange={(e) => item.set(clamp(Number(e.target.value)))}
                      className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-zin-light accent-zin"
                    />
                  </div>
                ))}
                <p className="text-[13px] leading-relaxed text-ink2">
                  提示：输入就是"要告诉计算器的数据"。数据一变，后面的处理和输出都会跟着变。
                </p>
              </div>
            ),
          },
          {
            stage: 'process',
            title: '处理：套用面积公式',
            children: (
              <div className="w-full space-y-3">
                <div className="rounded-2xl border-2 border-dashed border-zproc bg-zproc-pale px-4 py-3 text-center">
                  <p className="text-[13px] font-bold text-zproc-dark">长方形面积公式</p>
                  <p className="mt-1 text-[24px] font-extrabold text-ink">面积 = 长 × 宽</p>
                </div>
                <div className="rounded-2xl border-2 border-black/5 bg-white px-4 py-3">
                  <p className="text-[13px] font-bold text-ink2">代入数据：</p>
                  <ul className="mt-2 space-y-1.5 text-[15px] text-ink">
                    <li>
                      第 1 步 · 读出输入：长 = <b>{length}</b> cm，宽 = <b>{width}</b> cm
                    </li>
                    <li>
                      第 2 步 · 代入公式：<b>{length} × {width}</b>
                    </li>
                    <li>
                      第 3 步 · 算出结果：<b>{area}</b>
                    </li>
                  </ul>
                </div>
                <p className="text-[13px] leading-relaxed text-ink2">
                  同样的三个步骤，我们做多少道题都是一样的——这正是算法能交给计算机去做的原因。
                </p>
              </div>
            ),
          },
          {
            stage: 'output',
            title: '输出：图形和面积',
            children: (
              <div className="flex w-full flex-col items-center gap-3">
                <RectCanvas length={length} width={width} area={area} />
                <div className="w-full rounded-2xl bg-gradient-to-r from-zin to-zproc px-4 py-3 text-center text-white">
                  <p className="text-[13px] opacity-90">长方形面积</p>
                  <p className="text-[34px] font-extrabold leading-tight tabular-nums">
                    {Math.round(animatedArea)}
                    <span className="ml-1 text-base font-semibold">cm²</span>
                  </p>
                </div>
                <p className="text-[13px] text-ink2">
                  当前尺寸：{length} cm × {width} cm
                </p>
              </div>
            ),
          },
        ]}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <StickyNote tone="blue" tape title="输入不一定是数字">
          只要是"交给算法开始处理的东西"，都算输入。做菜时是鸡蛋和西红柿，这里就是长和宽。
        </StickyNote>
        <StickyNote tone="orange" title="反推的小窍门">
          想让面积等于 {target}？先想一想 {target} 能拆成哪两个数相乘：
          {target === 24
            ? '3×8、4×6、2×12 都可以。'
            : target === 36
              ? '4×9、6×6、3×12 都可以。'
              : '把它拆成两个因数就行。'}
        </StickyNote>
        <StickyNote tone={phase === 'done' ? 'green' : 'tape'} title="本关结论">
          {phase === 'done' ? (
            <>
              <b className="text-zin-dark">算法 = 固定的步骤 + 变化的输入。</b>
              换一组长宽，跟着变的只有输出。
            </>
          ) : (
            <>
              观察一下：当长或宽变成 0 会怎样？所以在程序里，我们常常要先检查输入是否合理。
            </>
          )}
        </StickyNote>
      </div>

      {hitTarget && phase === 'reverse' ? (
        <p className="mt-3 flex items-center justify-center gap-2 text-[15px] font-bold text-zin-dark">
          <Check size={18} /> 正好 {target} cm²，反推成功！点「检查面积」记一次成绩。
        </p>
      ) : null}
    </LevelFrame>
  )
}
