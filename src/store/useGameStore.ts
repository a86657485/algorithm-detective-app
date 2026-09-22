import { create } from 'zustand'
import type {
  AlgorithmRecord,
  BadgeId,
  GameState,
  LevelId,
  LevelProgress,
  QuizSnapshot,
} from '../types/game'
import { LEVEL_ORDER, nextLevelId } from '../data/levels'
import { clearRaw, loadRaw, saveRaw, STATE_VERSION } from '../lib/storage'
import { setSoundMuted } from '../lib/sound'

const INITIAL: GameState = {
  version: STATE_VERSION,
  classId: '',
  playerName: '',
  currentLevel: 'intro',
  unlockedLevels: ['intro'],
  progress: {},
  records: [],
  badges: [],
  startedAt: null,
  finishedAt: null,
  soundOn: true,
  quizResult: null,
}

const ALL_LEVELS = LEVEL_ORDER

function isLevelId(value: unknown): value is LevelId {
  return typeof value === 'string' && (ALL_LEVELS as string[]).includes(value)
}

function sanitize(raw: Record<string, unknown>): GameState {
  if (raw.version !== STATE_VERSION) {
    clearRaw()
    return { ...INITIAL }
  }
  const unlocked = Array.isArray(raw.unlockedLevels)
    ? (raw.unlockedLevels as unknown[]).filter(isLevelId)
    : []
  const records = Array.isArray(raw.records) ? (raw.records as AlgorithmRecord[]) : []
  const badges = Array.isArray(raw.badges) ? (raw.badges as BadgeId[]) : []

  return {
    version: STATE_VERSION,
    classId: typeof raw.classId === 'string' ? raw.classId : '',
    playerName: typeof raw.playerName === 'string' ? raw.playerName : '',
    currentLevel: isLevelId(raw.currentLevel) ? raw.currentLevel : 'intro',
    unlockedLevels: unlocked.length > 0 ? Array.from(new Set(['intro', ...unlocked])) : ['intro'],
    progress: (raw.progress && typeof raw.progress === 'object' ? raw.progress : {}) as Partial<
      Record<LevelId, LevelProgress>
    >,
    records: records.filter((r) => r && typeof r.input === 'string'),
    badges: Array.from(new Set(badges)),
    startedAt: typeof raw.startedAt === 'number' ? raw.startedAt : null,
    finishedAt: typeof raw.finishedAt === 'number' ? raw.finishedAt : null,
    soundOn: raw.soundOn !== false,
    quizResult: (raw.quizResult && typeof raw.quizResult === 'object'
      ? raw.quizResult
      : null) as QuizSnapshot | null,
  }
}

function hydrate(): GameState {
  const raw = loadRaw()
  if (!raw) return { ...INITIAL }
  return sanitize(raw)
}

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${rand}`
}

export interface RecordInput {
  levelId: LevelId
  levelTitle: string
  group: string
  input: string
  process: string
  output: string
}

interface Actions {
  /** 登录：写入班级与学生姓名（会清空上一位同学的进度） */
  setStudent: (classId: string, name: string) => void
  logout: () => void
  setName: (name: string) => void
  goLevel: (id: LevelId) => void
  unlock: (id: LevelId) => void
  completeLevel: (id: LevelId, progress: Omit<LevelProgress, 'finishedAt'>) => void
  addRecord: (rec: RecordInput) => void
  replaceRecords: (group: string, recs: RecordInput[]) => void
  addBadge: (id: BadgeId) => void
  toggleSound: () => void
  markStarted: () => void
  markFinished: () => void
  setQuizResult: (result: QuizSnapshot | null) => void
  resetAll: () => void
}

export type GameStore = GameState & Actions

export const useGameStore = create<GameStore>()((set, get) => ({
  ...hydrate(),

  // 换人登录时清空上一位同学的进度，避免同名班级混在一起
  setStudent: (classId, name) =>
    set({
      classId,
      playerName: name.trim().slice(0, 12),
      currentLevel: 'kitchen',
      unlockedLevels: ['intro', 'kitchen'],
      progress: {},
      records: [],
      badges: [],
      startedAt: Date.now(),
      finishedAt: null,
      quizResult: null,
    }),

  logout: () =>
    set({
      classId: '',
      playerName: '',
      currentLevel: 'intro',
      unlockedLevels: ['intro'],
      progress: {},
      records: [],
      badges: [],
      startedAt: null,
      finishedAt: null,
      quizResult: null,
    }),

  setQuizResult: (result) => set({ quizResult: result }),

  setName: (name) => set({ playerName: name.trim().slice(0, 12) }),

  goLevel: (id) => set({ currentLevel: id }),

  unlock: (id) =>
    set((s) => (s.unlockedLevels.includes(id) ? s : { unlockedLevels: [...s.unlockedLevels, id] })),

  completeLevel: (id, progress) =>
    set((s) => {
      const prev = s.progress[id]
      const merged: LevelProgress = {
        score: Math.max(prev?.score ?? 0, progress.score),
        stars: Math.max(prev?.stars ?? 0, progress.stars),
        usedMs: prev ? prev.usedMs + progress.usedMs : progress.usedMs,
        finishedAt: Date.now(),
      }
      const nxt = nextLevelId(id)
      const unlockedLevels = nxt && !s.unlockedLevels.includes(nxt)
        ? [...s.unlockedLevels, nxt]
        : s.unlockedLevels
      return {
        progress: { ...s.progress, [id]: merged },
        unlockedLevels,
      }
    }),

  addRecord: (rec) =>
    set((s) => ({
      records: [...s.records, { ...rec, id: makeId('rec'), createdAt: Date.now() }],
    })),

  replaceRecords: (group, recs) =>
    set((s) => ({
      records: [
        ...s.records.filter((r) => r.group !== group),
        ...recs.map((r) => ({ ...r, id: makeId('rec'), createdAt: Date.now() })),
      ],
    })),

  addBadge: (id) =>
    set((s) => (s.badges.includes(id) ? s : { badges: [...s.badges, id] })),

  toggleSound: () => {
    const next = !get().soundOn
    setSoundMuted(!next)
    set({ soundOn: next })
  },

  markStarted: () => {
    if (get().startedAt == null) set({ startedAt: Date.now() })
  },

  markFinished: () => set({ finishedAt: Date.now() }),

  resetAll: () => {
    clearRaw()
    setSoundMuted(false)
    set({ ...INITIAL, badges: [], records: [], progress: {}, unlockedLevels: ['intro'] })
  },
}))

/* ---------------- 自动存档（节流 120ms，避免拖拽时高频写入） ---------------- */
function toPersisted(s: GameStore): GameState {
  return {
    version: STATE_VERSION,
    classId: s.classId,
    playerName: s.playerName,
    currentLevel: s.currentLevel,
    unlockedLevels: s.unlockedLevels,
    progress: s.progress,
    records: s.records,
    badges: s.badges,
    startedAt: s.startedAt,
    finishedAt: s.finishedAt,
    soundOn: s.soundOn,
    quizResult: s.quizResult,
  }
}

let pending: number | null = null

useGameStore.subscribe(() => {
  if (typeof window === 'undefined') return
  if (pending !== null) return
  pending = window.setTimeout(() => {
    pending = null
    saveRaw(toPersisted(useGameStore.getState()))
  }, 120)
})

// 首次进入时把静音状态同步给音效模块
setSoundMuted(!useGameStore.getState().soundOn)

/* ---------------- 常用选择器 ---------------- */
export const selectTotalScore = (s: GameStore): number =>
  ALL_LEVELS.reduce((sum, id) => sum + (s.progress[id]?.score ?? 0), 0)

export const selectFinishedCount = (s: GameStore): number =>
  ALL_LEVELS.filter((id) => s.progress[id]?.finishedAt).length

export function selectRecordsByGroup(group: string): (s: GameStore) => AlgorithmRecord[] {
  return (s) => s.records.filter((r) => r.group === group)
}
