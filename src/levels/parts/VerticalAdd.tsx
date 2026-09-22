import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'
import type { AddColumn } from '../../data/addition'

interface VerticalAddProps {
  a: number
  b: number
  columns: AddColumn[]
  /** 当前轮到哪一列（0 = 个位） */
  currentCol: number
  /** 每一列学生填写的数字 */
  answers: Record<number, string>
  /** 刚刚填错、需要抖动的列 */
  wrongCol: number | null
  /** 只读复盘模式（错题排查用） */
  readOnly?: boolean
  /** 只读模式下，被学生点中的列 */
  pickedCol?: number | null
  onAnswer?: (col: number, value: string) => void
  onPickColumn?: (col: number) => void
  /** 只读模式下直接指定每一列要显示的数字（用于展示错误答案） */
  overrideDigits?: Record<number, string>
}

const COL_W = 'minmax(0, 1fr)'

/** 竖式加法演算板：逐位点亮、进位飞入 */
export function VerticalAdd({
  a,
  b,
  columns,
  currentCol,
  answers,
  wrongCol,
  readOnly = false,
  pickedCol = null,
  onAnswer,
  onPickColumn,
  overrideDigits,
}: VerticalAddProps) {
  const display = [...columns].reverse() // 高位在左
  const cols = display.length
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (readOnly) return
    const col = columns[currentCol]
    if (!col) return
    const pos = display.findIndex((c) => c.index === col.index)
    inputsRef.current[pos]?.focus()
  }, [currentCol, columns, display, readOnly])

  const digitRow = (value: number, pad = true) => {
    const s = String(value).padStart(cols, ' ')
    return s.split('').reverse()
  }

  const aDigits = digitRow(a)
  const bDigits = digitRow(b)

  return (
    <div className="rounded-2xl border-2 border-zproc-light bg-white px-4 py-5 shadow-inner1">
      <div className="mx-auto w-fit">
        {/* 进位行 */}
        <div className="grid gap-x-1" style={{ gridTemplateColumns: `repeat(${cols}, ${COL_W})` }}>
          {display.map((col) => {
            const revealed = !readOnly && currentCol >= col.index && col.carryIn > 0
            const revealedReadOnly = readOnly && col.carryIn > 0
            const show = revealed || revealedReadOnly
            return (
              <div key={`carry-${col.index}`} className="flex h-7 items-end justify-center">
                {show ? (
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[13px] font-bold text-white shadow-sm',
                      !readOnly && currentCol === col.index && 'animate-popIn',
                    )}
                    title="进位"
                  >
                    {col.carryIn}
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* 被加数 */}
        <div className="grid gap-x-1" style={{ gridTemplateColumns: `repeat(${cols}, ${COL_W})` }}>
          {aDigits
            .slice()
            .reverse()
            .map((d, i) => (
              <div
                key={`a-${i}`}
                className="flex h-12 w-12 items-center justify-center text-[30px] font-bold tabular-nums text-ink"
              >
                {d.trim()}
              </div>
            ))}
        </div>

        {/* 加数（带 + 号） */}
        <div className="relative grid gap-x-1" style={{ gridTemplateColumns: `repeat(${cols}, ${COL_W})` }}>
          <span className="absolute -left-9 top-1/2 -translate-y-1/2 text-[30px] font-bold text-zout">
            +
          </span>
          {bDigits
            .slice()
            .reverse()
            .map((d, i) => (
              <div
                key={`b-${i}`}
                className="flex h-12 w-12 items-center justify-center text-[30px] font-bold tabular-nums text-ink"
              >
                {d.trim()}
              </div>
            ))}
        </div>

        {/* 横线 */}
        <div className="mt-1 h-[3px] w-full rounded-full bg-ink/70" />

        {/* 结果行：逐位填写 */}
        <div className="mt-1.5 grid gap-x-1" style={{ gridTemplateColumns: `repeat(${cols}, ${COL_W})` }}>
          {display.map((col, pos) => {
            const done = readOnly || col.index < currentCol
            const isNow = !readOnly && col.index === currentCol
            const value = readOnly
              ? (overrideDigits?.[col.index] ?? String(col.writeDigit))
              : (answers[col.index] ?? '')
            const picked = readOnly && pickedCol === col.index

            if (readOnly) {
              return (
                <button
                  key={`r-${col.index}`}
                  type="button"
                  onClick={() => onPickColumn?.(col.index)}
                  className={cn(
                    'flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border-2 text-[30px] font-bold tabular-nums transition',
                    picked
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-transparent text-zin-dark hover:border-zproc hover:bg-zproc-pale',
                  )}
                >
                  {value}
                </button>
              )
            }

            return (
              <input
                key={`r-${col.index}`}
                ref={(el) => {
                  inputsRef.current[pos] = el
                }}
                value={value}
                disabled={!isNow && !done}
                inputMode="numeric"
                maxLength={1}
                aria-label={`${col.label}的结果`}
                onChange={(e) => onAnswer?.(col.index, e.target.value.replace(/[^0-9]/g, ''))}
                className={cn(
                  'h-12 w-12 rounded-xl border-2 text-center text-[30px] font-bold tabular-nums outline-none transition',
                  wrongCol === col.index
                    ? 'animate-shakeX border-red-400 bg-red-50 text-red-600'
                    : isNow
                      ? 'border-zproc bg-zproc-pale text-zproc-dark ring-4 ring-zproc/20'
                      : value
                        ? 'border-zin bg-zin-pale text-zin-dark'
                        : 'border-dashed border-black/15 bg-paper text-ink',
                  !isNow && !done && 'opacity-45',
                )}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
