/**
 * 有理数运算模块。
 *
 * 24 点游戏里经常出现 1/3、8/3 这类中间结果，如果用 JavaScript 的浮点数直接算，
 * 会出现 8 / 3 * 3 !== 8 的误差，导致"明明是 24 却判成 24.000000000000004"。
 * 这里用 { 分子, 分母 } 精确表示分数，只在最后比较时判断是否等于 24。
 */
export interface Rational {
  n: number
  d: number
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const t = x % y
    x = y
    y = t
  }
  return x === 0 ? 1 : x
}

/** 构造并约分一个有理数；分母为 0 时返回无效值 */
export function rat(n: number, d = 1): Rational {
  if (d === 0 || !Number.isFinite(n) || !Number.isFinite(d)) {
    return { n: Number.NaN, d: 0 }
  }
  let nn = Math.round(n)
  let dd = Math.round(d)
  if (dd < 0) {
    nn = -nn
    dd = -dd
  }
  const g = gcd(nn, dd)
  return { n: nn / g, d: dd / g }
}

export function isValidRat(r: Rational): boolean {
  return r.d !== 0 && Number.isFinite(r.n) && Number.isFinite(r.d)
}

export const addRat = (a: Rational, b: Rational): Rational => rat(a.n * b.d + b.n * a.d, a.d * b.d)

export const subRat = (a: Rational, b: Rational): Rational => rat(a.n * b.d - b.n * a.d, a.d * b.d)

export const mulRat = (a: Rational, b: Rational): Rational => rat(a.n * b.n, a.d * b.d)

export const divRat = (a: Rational, b: Rational): Rational =>
  b.n === 0 ? { n: Number.NaN, d: 0 } : rat(a.n * b.d, a.d * b.n)

export const negRat = (a: Rational): Rational => rat(-a.n, a.d)

export const isZeroRat = (r: Rational): boolean => isValidRat(r) && r.n === 0

export function eqRat(a: Rational, b: Rational): boolean {
  return isValidRat(a) && isValidRat(b) && a.n * b.d === b.n * a.d
}

export function eqInt(r: Rational, target: number): boolean {
  return isValidRat(r) && r.n === target * r.d
}

export function toNumber(r: Rational): number {
  return r.d === 0 ? Number.NaN : r.n / r.d
}

/** 人类可读写法：整数直接显示，分数写成 8/3 */
export function ratToString(r: Rational): string {
  if (!isValidRat(r)) return '无法计算'
  if (r.d === 1) return String(r.n)
  return `${r.n}/${r.d}`
}
