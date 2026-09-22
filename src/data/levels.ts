import type { BadgeMeta, LevelId, LevelMeta, Stage, StageTheme } from '../types/game'

/**
 * 三区语义：输入=草绿 / 处理=天蓝 / 输出=橙黄。
 * 这三套配色会出现在每一关的区域卡片、编号徽标、反馈提示和任务单表头里，
 * 让学生反复看到"三色 = 输入处理输出"。
 */
export const STAGE_THEMES: Record<Stage, StageTheme> = {
  input: {
    key: 'input',
    label: '输入',
    hint: '做这件事之前，要准备的东西',
    emoji: '📥',
    ring: 'ring-zin',
    bg: 'bg-zin',
    bgSoft: 'bg-zin-pale',
    text: 'text-zin-dark',
    border: 'border-zin',
    chip: 'bg-zin-light text-zin-dark',
  },
  process: {
    key: 'process',
    label: '处理',
    hint: '按照步骤、一步一步地做',
    emoji: '⚙️',
    ring: 'ring-zproc',
    bg: 'bg-zproc',
    bgSoft: 'bg-zproc-pale',
    text: 'text-zproc-dark',
    border: 'border-zproc',
    chip: 'bg-zproc-light text-zproc-dark',
  },
  output: {
    key: 'output',
    label: '输出',
    hint: '做完之后得到的结果',
    emoji: '📤',
    ring: 'ring-zout',
    bg: 'bg-zout',
    bgSoft: 'bg-zout-pale',
    text: 'text-zout-dark',
    border: 'border-zout',
    chip: 'bg-zout-light text-zout-dark',
  },
}

export const LEVELS: LevelMeta[] = [
  {
    id: 'intro',
    index: 0,
    title: '序章 · 侦探入职',
    subtitle: '什么叫算法？',
    emoji: '🔍',
    goal: '通过生活中的情境和案例，进一步认识算法的含义。',
    point: '做事的一连串步骤，就是"算法"。',
    estMinutes: 3,
    accent: 'neutral',
    requires: [],
  },
  {
    id: 'kitchen',
    index: 1,
    title: '第一关 · 厨房现场',
    subtitle: '西红柿炒鸡蛋里的三个箱子',
    emoji: '🍳',
    goal: '知道算法的基本流程：输入 → 处理 → 输出。',
    point: '原材料是输入，炒菜步骤是处理，那盘菜是输出。',
    estMinutes: 4,
    accent: 'process',
    requires: ['intro'],
  },
  {
    id: 'addition',
    index: 2,
    title: '第二关 · 数字迷宫',
    subtitle: '竖式加法里的秘密步骤',
    emoji: '🧮',
    goal: '能够用自然语言描述做事的步骤，培养按步骤解决问题的能力。',
    point: '个位相加满十，要向前一位进 1；下一位计算时必须加上它。',
    estMinutes: 5,
    accent: 'process',
    requires: ['kitchen'],
  },
  {
    id: 'rectangle',
    index: 3,
    title: '第三关 · 密室测量',
    subtitle: '长方形面积计算器',
    emoji: '📐',
    goal: '在公式计算中体会"输入—处理—输出"的完整流程。',
    point: '同一个算法，换一组输入就有不同的输出。',
    estMinutes: 4,
    accent: 'output',
    requires: ['addition'],
  },
  {
    id: 'twentyFour',
    index: 4,
    title: '第四关 · 24点终局',
    subtitle: '用四个数凑出一个 24',
    emoji: '🃏',
    goal: '写出计算步骤，体会其中存在的算法，并记录算法流程表。',
    point: '24 是 30 以内公因数最多的数，优先凑 3×8、4×6、2×12。',
    estMinutes: 8,
    accent: 'output',
    requires: ['rectangle'],
  },
  {
    id: 'quiz',
    index: 5,
    title: '结业考核 · 20 题闯关',
    subtitle: '检验这一课学得怎么样',
    emoji: '📝',
    goal: '综合运用本课所学，独立完成 20 道选择题。',
    point: '把"输入—处理—输出"用起来，才能说明真的学会了。',
    estMinutes: 8,
    accent: 'neutral',
    requires: ['twentyFour'],
  },
  {
    id: 'report',
    index: 6,
    title: '结业 · 颁发侦探证',
    subtitle: '长按结论：算法就在身边',
    emoji: '🏅',
    goal: '回顾本课学习目标，整理属于自己的算法流程表。',
    point: '算法是一种数字化的思维方式，在解决问题时都能派上用场。',
    estMinutes: 2,
    accent: 'neutral',
    requires: ['twentyFour'],
  },
]

export const LEVEL_ORDER: LevelId[] = [
  'intro',
  'kitchen',
  'addition',
  'rectangle',
  'twentyFour',
  'quiz',
  'report',
]

export function getLevel(id: LevelId): LevelMeta {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0]
}

export function nextLevelId(id: LevelId): LevelId | null {
  const i = LEVEL_ORDER.indexOf(id)
  if (i < 0 || i >= LEVEL_ORDER.length - 1) return null
  return LEVEL_ORDER[i + 1]
}

export const BADGES: BadgeMeta[] = [
  { id: 'rookie', name: '实习侦探', emoji: '🕵️', desc: '完成入职培训，领取侦探手册。' },
  { id: 'kitchen-master', name: '厨房勘察员', emoji: '🍅', desc: '分清做菜中的输入、处理和输出。' },
  { id: 'carry-hunter', name: '进位猎手', emoji: '➕', desc: '完整走完竖式加法的每一步，并揪出漏加进位的错误。' },
  { id: 'measure-expert', name: '测量专家', emoji: '📐', desc: '用面积公式完成任务，还能反推出边长。' },
  { id: 'twentyfour-king', name: '24点高手', emoji: '👑', desc: '在 24 点挑战中完成三局以上并写出算式。' },
  { id: 'perfect-detective', name: '首席算法侦探', emoji: '🎖️', desc: '五关全部通关，集齐所有线索。' },
]

export function getBadge(id: string): BadgeMeta | undefined {
  return BADGES.find((b) => b.id === id)
}
