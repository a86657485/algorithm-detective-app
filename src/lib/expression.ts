/**
 * 安全表达式求值。
 *
 * 原《24点游戏》直接用 eval() 计算学生输入的算式，既有安全风险，也会因为浮点误差
 * 把正确算式判错。这里改成三步：词法分析 → 调度场算法转逆波兰 → 有理数精确求值。
 * 全程不抛异常，所有问题都以结构化错误返回，方便界面直接提示学生。
 */
import {
  type Rational,
  rat,
  addRat,
  subRat,
  mulRat,
  divRat,
  negRat,
  isValidRat,
} from './rational'

export type EvalResult = { ok: true; value: Rational } | { ok: false; reason: string }

type OpChar = '+' | '-' | '*' | '/' | 'u'

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: OpChar }
  | { kind: 'lparen' }
  | { kind: 'rparen' }

const PREC: Record<OpChar, number> = { '+': 1, '-': 1, '*': 2, '/': 2, u: 3 }
const RIGHT_ASSOC: Record<OpChar, boolean> = { '+': false, '-': false, '*': false, '/': false, u: true }

/** 把中文/全角符号统一成半角，方便学生用键盘随意输入 */
function normalize(s: string): string {
  return s
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[－−–—﹣−]/g, '-')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/＋/g, '+')
}

function tokenize(input: string): { ok: true; tokens: Token[] } | { ok: false; reason: string } {
  const s = normalize(input)
  const tokens: Token[] = []
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i += 1
      continue
    }
    if (ch >= '0' && ch <= '9') {
      let j = i
      while (j < s.length && s[j] >= '0' && s[j] <= '9') j += 1
      tokens.push({ kind: 'num', value: Number(s.slice(i, j)) })
      i = j
      continue
    }
    if (ch === '(') {
      tokens.push({ kind: 'lparen' })
      i += 1
      continue
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen' })
      i += 1
      continue
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      if (ch === '-') {
        const prev = tokens[tokens.length - 1]
        const isUnary = !prev || prev.kind === 'op' || prev.kind === 'lparen'
        tokens.push({ kind: 'op', value: isUnary ? 'u' : '-' })
      } else {
        tokens.push({ kind: 'op', value: ch })
      }
      i += 1
      continue
    }
    return { ok: false, reason: `算式里有个我不认识的符号「${ch}」` }
  }
  return { ok: true, tokens }
}

function toRpn(tokens: Token[]): { ok: true; rpn: Token[] } | { ok: false; reason: string } {
  const out: Token[] = []
  const ops: Token[] = []
  for (const tk of tokens) {
    if (tk.kind === 'num') {
      out.push(tk)
      continue
    }
    if (tk.kind === 'op') {
      const o1 = tk.value
      while (ops.length > 0) {
        const top = ops[ops.length - 1]
        if (top.kind !== 'op') break
        const o2 = top.value
        const shouldPop = RIGHT_ASSOC[o1] ? PREC[o2] > PREC[o1] : PREC[o2] >= PREC[o1]
        if (!shouldPop) break
        out.push(ops.pop() as Token)
      }
      ops.push(tk)
      continue
    }
    if (tk.kind === 'lparen') {
      ops.push(tk)
      continue
    }
    let matched = false
    while (ops.length > 0) {
      const top = ops.pop() as Token
      if (top.kind === 'lparen') {
        matched = true
        break
      }
      out.push(top)
    }
    if (!matched) return { ok: false, reason: '括号没配对，多了一个「)」' }
  }
  while (ops.length > 0) {
    const top = ops.pop() as Token
    if (top.kind === 'lparen') return { ok: false, reason: '括号没配对，少了一个「)」' }
    out.push(top)
  }
  return { ok: true, rpn: out }
}

export function evaluateExpression(input: string): EvalResult {
  const lex = tokenize(input)
  if (!lex.ok) return { ok: false, reason: lex.reason }
  if (lex.tokens.length === 0) return { ok: false, reason: '算式还空着呢，先按几个数字吧' }

  const rpnRes = toRpn(lex.tokens)
  if (!rpnRes.ok) return { ok: false, reason: rpnRes.reason }

  const stack: Rational[] = []
  for (const tk of rpnRes.rpn) {
    if (tk.kind === 'num') {
      stack.push(rat(tk.value))
      continue
    }
    if (tk.kind !== 'op') return { ok: false, reason: '算式的格式好像不对' }

    if (tk.value === 'u') {
      if (stack.length < 1) return { ok: false, reason: '负号前面还缺一个数字' }
      stack.push(negRat(stack.pop() as Rational))
      continue
    }
    if (stack.length < 2) return { ok: false, reason: '运算符左右两边都要有数字才行' }
    const b = stack.pop() as Rational
    const a = stack.pop() as Rational
    if (tk.value === '+') stack.push(addRat(a, b))
    else if (tk.value === '-') stack.push(subRat(a, b))
    else if (tk.value === '*') stack.push(mulRat(a, b))
    else {
      if (b.n === 0) return { ok: false, reason: '除数不能是 0 哦' }
      stack.push(divRat(a, b))
    }
  }

  if (stack.length !== 1) return { ok: false, reason: '算式好像还没写完' }
  const value = stack[0]
  if (!isValidRat(value)) return { ok: false, reason: '这个算式算不出结果' }
  return { ok: true, value }
}

/** 抽出算式里用到的所有数字（按出现顺序） */
export function extractNumbers(input: string): number[] {
  const lex = tokenize(input)
  if (!lex.ok) return []
  return lex.tokens
    .filter((t): t is { kind: 'num'; value: number } => t.kind === 'num')
    .map((t) => t.value)
}

export interface NumberCheck {
  ok: boolean
  /** 题目给了、但算式里没用到的数字 */
  missing: number[]
  /** 算式里用了、但题目没给的多余数字 */
  extra: number[]
}

/** 校验算式是否"恰好"把给定的 4 个数各用一次（游戏中反复用到的规则） */
export function validateNumbers(input: string, numbers: number[]): NumberCheck {
  const used = extractNumbers(input)
  const missing: number[] = []
  for (const n of numbers) {
    const idx = used.indexOf(n)
    if (idx >= 0) used.splice(idx, 1)
    else missing.push(n)
  }
  return { ok: missing.length === 0 && used.length === 0, missing, extra: used }
}
