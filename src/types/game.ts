/** 算法基本流程的三个环节：输入 / 处理 / 输出 */
export type Stage = 'input' | 'process' | 'output'

export type LevelId =
  | 'intro'
  | 'kitchen'
  | 'addition'
  | 'rectangle'
  | 'twentyFour'
  | 'quiz'
  | 'report'

export type BadgeId =
  | 'rookie'
  | 'kitchen-master'
  | 'carry-hunter'
  | 'measure-expert'
  | 'twentyfour-king'
  | 'perfect-detective'

/** 一条"算法流程"记录，对应任务单中的一行 */
export interface AlgorithmRecord {
  id: string
  levelId: LevelId
  levelTitle: string
  input: string
  process: string
  output: string
  /** 该条记录属于哪个活动（任务单按活动归类） */
  group: string
  createdAt: number
}

export interface BadgeMeta {
  id: BadgeId
  name: string
  emoji: string
  desc: string
}

export interface LevelMeta {
  id: LevelId
  /** 关卡序号，0 为序章 */
  index: number
  title: string
  subtitle: string
  emoji: string
  /** 本关对应的教材学习目标 */
  goal: string
  /** 本关知识要点（底栏常驻提示） */
  point: string
  estMinutes: number
  /** 主题色语义 */
  accent: Stage | 'neutral'
  /** 进入本关前必须完成的前置关卡 */
  requires: LevelId[]
}

export interface LevelProgress {
  score: number
  stars: number
  usedMs: number
  finishedAt: number | null
}

/** 结业考核成绩快照 */
export interface QuizSnapshot {
  score: number
  correct: number
  total: number
  durationMs: number
  submittedAt: number
  /** 每题作答情况，用于出具错题解析 */
  detail: Array<{ id: string; picked: number; correct: number; ok: boolean }>
}

export interface GameState {
  version: number
  /** 学生所在班级，例如 '501'；为空表示还没登录 */
  classId: string
  playerName: string
  currentLevel: LevelId
  unlockedLevels: LevelId[]
  progress: Partial<Record<LevelId, LevelProgress>>
  records: AlgorithmRecord[]
  badges: BadgeId[]
  startedAt: number | null
  finishedAt: number | null
  soundOn: boolean
  quizResult: QuizSnapshot | null
}

export interface StageTheme {
  key: Stage
  label: string
  hint: string
  emoji: string
  /** Tailwind 语义类名（保证三区配色在全应用一致） */
  ring: string
  bg: string
  bgSoft: string
  text: string
  border: string
  chip: string
}
