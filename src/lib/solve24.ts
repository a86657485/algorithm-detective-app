/**
 * 24 点求解。
 *
 * 思路沿用原《24点游戏》的穷举法：4 个数字的全排列 × 4³ 种运算符组合 × 5 种括号结构。
 * 改进点：
 * 1. 不再用字符串拼表达式 + eval，而是直接构建二叉树并用有理数求值；
 * 2. 用"规范化树形"去重，去掉了大量只是交换律变形的重复解法；
 * 3. 按排序后的数字组合缓存结果，同一组数字只算一次。
 *
 * 规模：4! × 64 × 5 = 7680 次有理数求值，毫秒级完成。
 */
import {
  type Rational,
  rat,
  addRat,
  subRat,
  mulRat,
  divRat,
  isValidRat,
  eqInt,
  toNumber,
} from './rational'

export type BinOp = '+' | '-' | '*' | '/'

export type Node =
  | { kind: 'num'; value: number }
  | { kind: 'bin'; op: BinOp; left: Node; right: Node }

export const OP_SYMBOL: Record<BinOp, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' }

const BIN_PREC: Record<BinOp, number> = { '+': 1, '-': 1, '*': 2, '/': 2 }
const OPS: BinOp[] = ['+', '-', '*', '/']

/** 计算表达式树的值；除零等无意义情况返回 null */
export function evalNode(node: Node): Rational | null {
  if (node.kind === 'num') return rat(node.value)
  const l = evalNode(node.left)
  if (!l) return null
  const r = evalNode(node.right)
  if (!r) return null
  if (node.op === '+') return addRat(l, r)
  if (node.op === '-') return subRat(l, r)
  if (node.op === '*') return mulRat(l, r)
  if (r.n === 0) return null
  const v = divRat(l, r)
  return isValidRat(v) ? v : null
}

/** 渲染成学生看得懂的算式（尽量少用括号） */
export function renderNode(node: Node, parentOp?: BinOp, isRight = false): string {
  if (node.kind === 'num') return String(node.value)
  const myPrec = BIN_PREC[node.op]
  let text = `${renderNode(node.left, node.op, false)} ${OP_SYMBOL[node.op]} ${renderNode(
    node.right,
    node.op,
    true,
  )}`
  if (parentOp) {
    const pPrec = BIN_PREC[parentOp]
    const needParen =
      myPrec < pPrec || (myPrec === pPrec && isRight && (parentOp === '-' || parentOp === '/'))
    if (needParen) text = `(${text})`
  }
  return text
}

function flatten(node: Node, op: BinOp): Node[] {
  if (node.kind === 'bin' && node.op === op) {
    return [...flatten(node.left, op), ...flatten(node.right, op)]
  }
  return [node]
}

/** 规范化：加法和乘法按交换律排序，用来识别"只是换了顺序"的同一个解法 */
function canonKey(node: Node): string {
  if (node.kind === 'num') return `#${node.value}`
  if (node.op === '+' || node.op === '*') {
    const parts = flatten(node, node.op).map(canonKey).sort()
    return `${node.op}[${parts.join('|')}]`
  }
  return `${node.op}(${canonKey(node.left)},${canonKey(node.right)})`
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items.slice()]
  const result: T[][] = []
  for (let i = 0; i < items.length; i += 1) {
    const rest = items.slice(0, i).concat(items.slice(i + 1))
    for (const p of permutations(rest)) {
      result.push([items[i], ...p])
    }
  }
  return result
}

/** 5 种括号结构（对应原程序的 structures） */
function buildTrees(a: number, b: number, c: number, d: number, o1: BinOp, o2: BinOp, o3: BinOp): Node[] {
  const na: Node = { kind: 'num', value: a }
  const nb: Node = { kind: 'num', value: b }
  const nc: Node = { kind: 'num', value: c }
  const nd: Node = { kind: 'num', value: d }
  const bin = (op: BinOp, left: Node, right: Node): Node => ({ kind: 'bin', op, left, right })

  return [
    // (a o1 b) o2 (c o3 d)
    bin(o2, bin(o1, na, nb), bin(o3, nc, nd)),
    // ((a o1 b) o2 c) o3 d
    bin(o3, bin(o2, bin(o1, na, nb), nc), nd),
    // (a o1 (b o2 c)) o3 d
    bin(o3, bin(o1, na, bin(o2, nb, nc)), nd),
    // a o1 ((b o2 c) o3 d)
    bin(o1, na, bin(o3, bin(o2, nb, nc), nd)),
    // a o1 (b o2 (c o3 d))
    bin(o1, na, bin(o2, nb, bin(o3, nc, nd))),
  ]
}

const TARGET = 24

const cache = new Map<string, string[]>()

function cacheKey(numbers: number[]): string {
  return [...numbers].sort((x, y) => x - y).join(',')
}

function computeSolutions(numbers: number[]): string[] {
  const key = cacheKey(numbers)
  const cached = cache.get(key)
  if (cached) return cached

  const perms = permutations(numbers)
  const found = new Map<string, string>()

  for (const [a, b, c, d] of perms) {
    for (const o1 of OPS) {
      for (const o2 of OPS) {
        for (const o3 of OPS) {
          for (const tree of buildTrees(a, b, c, d, o1, o2, o3)) {
            const v = evalNode(tree)
            if (!v || v.d === 0) continue
            if (v.n !== TARGET * v.d) continue
            const ck = canonKey(tree)
            if (!found.has(ck)) found.set(ck, renderNode(tree))
          }
        }
      }
    }
  }

  const list = [...found.values()].sort((x, y) => {
    const w = (s: string) => (s.includes('×') ? 0 : 1) * 100 + s.length
    return w(x) - w(y)
  })
  cache.set(key, list)
  return list
}

/** 全部去重后的解法 */
export function find24Solutions(numbers: number[]): string[] {
  if (numbers.length !== 4) return []
  return computeSolutions(numbers)
}

/** 这组数字有没有解 */
export function has24Solution(numbers: number[]): boolean {
  if (numbers.length !== 4) return false
  return computeSolutions(numbers).length > 0
}

/** 判断一组数字是否"能用且只用一次"地凑出 24（用于出题筛选题面） */
export function isPlayable(numbers: number[]): boolean {
  return has24Solution(numbers)
}

/** 随机抽取 4 个 1-10 的数，保证有解 */
export function pickSolvableNumbers(): number[] {
  let guard = 0
  while (guard < 300) {
    const nums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10) + 1)
    if (has24Solution(nums)) return nums
    guard += 1
  }
  return [4, 5, 6, 7]
}

/* ------------------------------------------------------------------ */
/*                          提示策略（对应教材）                        */
/* ------------------------------------------------------------------ */

export interface StrategyHint {
  /** 教材里的三种优先组合 */
  strategy: '3×8' | '4×6' | '2×12' | 'pair' | 'none'
  title: string
  detail: string
}

function pairValues(a: number, b: number): Array<{ v: Rational; expr: string }> {
  const out: Array<{ v: Rational; expr: string }> = [
    { v: rat(a + b), expr: `${a} + ${b}` },
    { v: rat(a * b), expr: `${a} × ${b}` },
    { v: rat(a - b), expr: `${a} − ${b}` },
    { v: rat(b - a), expr: `${b} − ${a}` },
  ]
  if (b !== 0) out.push({ v: rat(a / b), expr: `${a} ÷ ${b}` })
  if (a !== 0) out.push({ v: rat(b / a), expr: `${b} ÷ ${a}` })
  return out
}

const COMBO_LABEL: Array<{ pair: [number, number]; strategy: StrategyHint['strategy'] }> = [
  { pair: [3, 8], strategy: '3×8' },
  { pair: [4, 6], strategy: '4×6' },
  { pair: [2, 12], strategy: '2×12' },
]

/**
 * 生成分级提示：优先按教材"3×8、4×6、2×12"策略给方向，找不到再退到一般性提示。
 */
export function buildHint(numbers: number[]): StrategyHint {
  const idxSplits: Array<[[number, number], [number, number]]> = [
    [
      [0, 1],
      [2, 3],
    ],
    [
      [0, 2],
      [1, 3],
    ],
    [
      [0, 3],
      [1, 2],
    ],
  ]

  let fallback: StrategyHint | null = null

  for (const [p1, p2] of idxSplits) {
    const left = pairValues(numbers[p1[0]], numbers[p1[1]])
    const right = pairValues(numbers[p2[0]], numbers[p2[1]])
    for (const x of left) {
      for (const y of right) {
        if (!isValidRat(x.v) || !isValidRat(y.v)) continue

        const trials: Array<{ hit: boolean; word: string }> = [
          { hit: eqInt(mulRat(x.v, y.v), TARGET), word: '乘' },
          { hit: eqInt(addRat(x.v, y.v), TARGET), word: '加' },
        ]

        for (const t of trials) {
          if (!t.hit) continue
          const v1 = toNumber(x.v)
          const v2 = toNumber(y.v)
          let strategy: StrategyHint['strategy'] = 'pair'
          for (const item of COMBO_LABEL) {
            if (
              (v1 === item.pair[0] && v2 === item.pair[1]) ||
              (v1 === item.pair[1] && v2 === item.pair[0])
            ) {
              strategy = item.strategy
            }
          }
          const hint: StrategyHint =
            strategy === 'pair'
              ? {
                  strategy,
                  title: `拆成两组，最后一步用${t.word}法`,
                  detail: `先算出「${x.expr} = ${v1}」，再算出「${y.expr} = ${v2}」，最后把这两个结果${t.word}起来就是 24。`,
                }
              : {
                  strategy,
                  title: `优先凑出 ${strategy.replace('×', ' 和 ')}`,
                  detail: `先用「${x.expr} = ${v1}」，再用「${y.expr} = ${v2}」，最后 ${v1} × ${v2} = 24。`,
                }
          if (strategy !== 'pair') return hint
          if (!fallback) fallback = hint
        }
      }
    }
  }

  if (fallback) return fallback

  if (!has24Solution(numbers)) {
    return {
      strategy: 'none',
      title: '这组数字算不出 24',
      detail: '别浪费时间啦，点「换一组数字」重新抽四个数试试。',
    }
  }

  return {
    strategy: 'pair',
    title: '先想乘法，再想加减',
    detail:
      '24 是 30 以内公因数最多的数。先想办法凑出 3 和 8、4 和 6，或者 2 和 12，再做最后一步乘法。',
  }
}
