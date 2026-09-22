import { twMerge } from 'tailwind-merge'

/** 合并 Tailwind 类名，后面的类名会覆盖前面冲突的类名 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(' '))
}
