import type { Stage } from '../types/game'

export interface KitchenCard {
  id: string
  label: string
  emoji: string
  /** 正确的归属区域 */
  zone: Stage
  /** 投对之后给出的解释，帮助学生把"分类"和"概念"对应起来 */
  why: string
  /** 投错时给的针对性提示 */
  wrongTip: string
}

/**
 * 素材来自教材"做西红柿炒鸡蛋"：
 * 准备原材料 = 输入，遵循菜谱炒菜 = 处理，做出的菜 = 输出。
 */
export const KITCHEN_CARDS: KitchenCard[] = [
  {
    id: 'egg',
    label: '鸡蛋',
    emoji: '🥚',
    zone: 'input',
    why: '鸡蛋是做这道菜的原材料，动手之前先准备好，属于输入。',
    wrongTip: '鸡蛋是"要做菜先准备"的东西，再想想它属于哪一步？',
  },
  {
    id: 'tomato',
    label: '西红柿',
    emoji: '🍅',
    zone: 'input',
    why: '西红柿同样是原材料，还没有被加工过，属于输入。',
    wrongTip: '西红柿这时候还是一整个，没被切也没被炒，属于哪一步？',
  },
  {
    id: 'oil',
    label: '食用油',
    emoji: '🧴',
    zone: 'input',
    why: '炒菜要用到的油，也是提前准备好的原材料，属于输入。',
    wrongTip: '油是准备阶段就摆在灶台边的材料哦。',
  },
  {
    id: 'seasoning',
    label: '调味料',
    emoji: '🍶',
    zone: 'input',
    why: '油、盐、糖等调味料都要先备齐，属于输入。',
    wrongTip: '"备齐调味料"是准备；"往锅里加调味料"才是动作，注意区分。',
  },
  {
    id: 'cut-tomato',
    label: '切西红柿',
    emoji: '🔪',
    zone: 'process',
    why: '"切"是一个动作，是处理过程中的一步。',
    wrongTip: '它是个动作，不是材料哦——做菜时你正在对它做什么？',
  },
  {
    id: 'stir-egg',
    label: '搅拌鸡蛋',
    emoji: '🥣',
    zone: 'process',
    why: '把蛋液搅匀是炒菜过程中的一步操作，属于处理。',
    wrongTip: '同学们正在动手操作它，这发生在哪一个阶段？',
  },
  {
    id: 'pour-pot',
    label: '倒入锅里',
    emoji: '🍳',
    zone: 'process',
    why: '"倒入锅里"是执行菜谱中的一步，属于处理。',
    wrongTip: '倒进锅里是在"按菜谱做事"，属于中间那一步。',
  },
  {
    id: 'stir-fry',
    label: '翻炒',
    emoji: '♨️',
    zone: 'process',
    why: '翻炒是核心的烹饪动作，属于处理。',
    wrongTip: '翻炒是过程中不停重复的动作，它已经产出结果了吗？',
  },
  {
    id: 'add-seasoning',
    label: '加入调味料',
    emoji: '➕',
    zone: 'process',
    why: '往锅里加调味料是一个动作，属于处理。',
    wrongTip: '注意"加入"两个字——这是动作，不是材料本身。',
  },
  {
    id: 'dish',
    label: '一盘西红柿炒鸡蛋',
    emoji: '🍲',
    zone: 'output',
    why: '所有步骤做完以后端出来的那盘菜，就是输出。',
    wrongTip: '它是做完之后才出现的结果，应该放到最后那一步。',
  },
]

/** 打乱顺序的炒菜步骤，学生需要拖成正确顺序 */
export const KITCHEN_STEPS: Array<{ id: string; emoji: string; text: string }> = [
  { id: 's1', emoji: '🥚', text: '把鸡蛋打进碗里，搅拌成蛋液' },
  { id: 's2', emoji: '🍅', text: '西红柿洗净，切成小块' },
  { id: 's3', emoji: '🧴', text: '锅里倒油，把油烧热' },
  { id: 's4', emoji: '🍳', text: '倒入蛋液，炒成蛋块后先盛出来' },
  { id: 's5', emoji: '♨️', text: '下西红柿翻炒出汁，加入调味料' },
  { id: 's6', emoji: '🍽️', text: '把蛋块倒回锅里翻匀，装盘出锅' },
]

export const KITCHEN_STEP_ORDER: string[] = ['s1', 's2', 's3', 's4', 's5', 's6']

/** 顺序打乱的初始展示顺序（固定，保证每次课堂演示一致） */
export const KITCHEN_STEPS_SCRAMBLED: string[] = ['s4', 's1', 's5', 's2', 's6', 's3']
