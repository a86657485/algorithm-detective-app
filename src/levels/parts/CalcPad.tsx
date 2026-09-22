import { cn } from '../../lib/cn'
import { playSound } from '../../lib/sound'

interface Key {
  label: string
  value?: string
  action?: 'clear' | 'back' | 'check'
  span?: number
  tone: 'num' | 'op' | 'fn' | 'ok'
}

const KEYS: Key[] = [
  { label: '1', value: '1', tone: 'num' },
  { label: '2', value: '2', tone: 'num' },
  { label: '3', value: '3', tone: 'num' },
  { label: '+', value: '+', tone: 'op' },
  { label: '4', value: '4', tone: 'num' },
  { label: '5', value: '5', tone: 'num' },
  { label: '6', value: '6', tone: 'num' },
  { label: '−', value: '-', tone: 'op' },
  { label: '7', value: '7', tone: 'num' },
  { label: '8', value: '8', tone: 'num' },
  { label: '9', value: '9', tone: 'num' },
  { label: '×', value: '*', tone: 'op' },
  { label: '(', value: '(', tone: 'op' },
  { label: '0', value: '0', tone: 'num' },
  { label: ')', value: ')', tone: 'op' },
  { label: '÷', value: '/', tone: 'op' },
  { label: '清空', action: 'clear', tone: 'fn', span: 2 },
  { label: '⌫', action: 'back', tone: 'fn' },
  { label: '=', action: 'check', tone: 'ok' },
]

const TONE: Record<Key['tone'], string> = {
  num: 'bg-white border-black/10 text-ink hover:border-zproc hover:text-zproc-dark',
  op: 'bg-zout-light border-zout/40 text-zout-dark hover:brightness-105',
  fn: 'bg-black/5 border-black/10 text-ink2 hover:bg-black/10',
  ok: 'bg-gradient-to-r from-zin to-zproc border-transparent text-white hover:brightness-105',
}

interface CalcPadProps {
  value: string
  onChange: (next: string) => void
  onCheck: () => void
  className?: string
}

/** 自建计算器键盘：比键盘打字更省事，也避免学生输入一堆没用的符号 */
export function CalcPad({ value, onChange, onCheck, className }: CalcPadProps) {
  const press = (key: Key) => {
    if (key.action === 'clear') {
      playSound('click')
      onChange('')
      return
    }
    if (key.action === 'back') {
      playSound('click')
      onChange(value.slice(0, -1))
      return
    }
    if (key.action === 'check') {
      playSound('click')
      onCheck()
      return
    }
    playSound('pop')
    onChange(value + key.value)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className="flex min-h-[62px] flex-wrap items-center gap-1 rounded-2xl border-2 border-black/10 bg-paper px-4 py-3 text-[24px] font-bold tabular-nums text-ink"
        aria-live="polite"
      >
        {value ? (
          value.split('').map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              className={cn(
                'leading-none',
                ch === '*' || ch === '/' || ch === '+' || ch === '-'
                  ? 'text-zout-dark'
                  : ch === '(' || ch === ')'
                    ? 'text-zproc'
                    : '',
              )}
            >
              {ch === '*' ? '×' : ch === '/' ? '÷' : ch === '-' ? '−' : ch}
            </span>
          ))
        ) : (
          <span className="text-[16px] font-normal text-black/30">
            点下面的按钮，把四个数写成一个算式…
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {KEYS.map((key) => (
          <button
            key={key.label}
            type="button"
            onClick={() => press(key)}
            style={key.span ? { gridColumn: `span ${key.span}` } : undefined}
            className={cn(
              'h-[52px] cursor-pointer select-none rounded-xl border-2 text-[21px] font-bold shadow-sm transition active:translate-y-px active:scale-[0.98]',
              TONE[key.tone],
            )}
          >
            {key.label}
          </button>
        ))}
      </div>
    </div>
  )
}
