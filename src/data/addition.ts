const POSITION_LABEL = ['个位', '十位', '百位', '千位']

export interface AddColumn {
  /** 从右往左的序号：0 = 个位 */
  index: number
  label: string
  aDigit: number
  bDigit: number
  /** 从右边一位进过来的数（0 或 1） */
  carryIn: number
  /** 本列三个数相加的结果 */
  sum: number
  /** 应该写在横线下面的数字 */
  writeDigit: number
  /** 要进到下一位的数 */
  carryOut: number
}

export interface AdditionProblem {
  id: string
  a: number
  b: number
  sum: number
  columns: AddColumn[]
  /** 这道题有几个数位产生了进位 */
  carryCount: number
  tip: string
}

/**
 * 按教材《两个自然数相加的算法分析》的步骤，把两个数拆成"逐位计算"的过程：
 * 第1步 按个位上下对齐；第2步 从个位开始；第3步 把数位上的两个数字相加
 * （满十就把 1 进到前一位）；第4步 向左移动一位并加上进位数；第5步 得到和。
 */
export function buildColumns(a: number, b: number): AddColumn[] {
  const digitsA = String(a).split('').reverse().map(Number)
  const digitsB = String(b).split('').reverse().map(Number)
  const length = Math.max(digitsA.length, digitsB.length)
  const columns: AddColumn[] = []
  let carry = 0

  for (let i = 0; i < length; i += 1) {
    const aDigit = digitsA[i] ?? 0
    const bDigit = digitsB[i] ?? 0
    const total = aDigit + bDigit + carry
    columns.push({
      index: i,
      label: POSITION_LABEL[i] ?? `第 ${i + 1} 位`,
      aDigit,
      bDigit,
      carryIn: carry,
      sum: total,
      writeDigit: total % 10,
      carryOut: Math.floor(total / 10),
    })
    carry = Math.floor(total / 10)
  }

  if (carry > 0) {
    columns.push({
      index: length,
      label: POSITION_LABEL[length] ?? `第 ${length + 1} 位`,
      aDigit: 0,
      bDigit: 0,
      carryIn: carry,
      sum: carry,
      writeDigit: carry,
      carryOut: 0,
    })
  }

  return columns
}

function makeProblem(id: string, a: number, b: number, tip: string): AdditionProblem {
  const columns = buildColumns(a, b)
  return {
    id,
    a,
    b,
    sum: a + b,
    columns,
    carryCount: columns.filter((c) => c.carryOut > 0).length,
    tip,
  }
}

/** 题目取自教材的"闯关活动"（35、47、136、92、23、86）与例题 */
export const ADDITION_PROBLEMS: AdditionProblem[] = [
  makeProblem('p1', 136, 92, '这是教材上的例题：136 + 92。注意十位上 3 + 9 满十了，要向百位进 1。'),
  makeProblem('p2', 47, 35, '个位上 7 + 5 = 12，满十要进位。进位之后十位可别忘了加上这个 1。'),
  makeProblem('p3', 23, 86, '十位上 2 + 8 正好等于 10，也要向前一位进 1，结果会变成三位数。'),
  makeProblem('p4', 405, 178, '个位 5 + 8 满十进位；十位 0 + 7 还要把进位的 1 加上。'),
]

export interface CarryTrap {
  id: string
  a: number
  b: number
  /** 别人算错的结果 */
  shownSum: string
  rightSum: number
  /** 出错的那一列（0 = 个位） */
  wrongColumnIndex: number
  hint: string
  explain: string
}

/** "漏加进位"是教材点名的常见错误，这里专门做一组排查题 */
export const CARRY_TRAPS: CarryTrap[] = [
  {
    id: 't1',
    a: 47,
    b: 35,
    shownSum: '72',
    rightSum: 82,
    wrongColumnIndex: 1,
    hint: '个位算对了吗？算对之后，别忘了个位进上来的那个 1。',
    explain: '个位 7 + 5 = 12，写下 2 并向十位进 1。十位应该是 4 + 3 + 1 = 8，而不是 7 —— 那个进位的 1 被漏掉了。',
  },
  {
    id: 't2',
    a: 136,
    b: 92,
    shownSum: '218',
    rightSum: 228,
    wrongColumnIndex: 2,
    hint: '从个位、十位一路检查过去，哪一位没有把进位加进去？',
    explain: '十位 3 + 9 = 12，写下 2 并向百位进 1。百位应该是 1 + 0 + 1 = 2，漏掉进位就变成了 1，结果也少了 10。',
  },
  {
    id: 't3',
    a: 68,
    b: 57,
    shownSum: '115',
    rightSum: 125,
    wrongColumnIndex: 1,
    hint: '个位 8 + 7 满十了，这 1 应该加到哪一位上去？',
    explain: '个位 8 + 7 = 15，写下 5 并向十位进 1。十位 6 + 5 + 1 = 12，写 2 进 1，最后结果是 125。',
  },
]

/** 教材"进一步探究"的问题，用于关卡二结尾的思考环节 */
export const REFLECT_QUESTIONS = [
  '如果个位相加不满十，还需要进位吗？',
  '把 136 和 92 交换位置再算一次，结果会变吗？为什么？',
  '减法的计算步骤和加法有什么不一样？',
]
