/**
 * 看板聚合。
 * 按班级汇总：人数、登录/通关/考核人数、平均分、逐关完成率、逐题正确率。
 * 结果按 meta.updatedAt 缓存，避免每次轮询（或 SSE 一推）就全量重算。
 */
import { CLASS_IDS, ROSTER, CLASS_LABELS, classSize, TOTAL_STUDENTS } from '../../shared/roster.mjs'
import { QUIZ_QUESTIONS, QUIZ_TAGS } from '../../shared/quiz-data.mjs'
import { allStudents, getDb } from './store.mjs'

const LEVEL_KEYS = ['intro', 'kitchen', 'addition', 'rectangle', 'twentyFour', 'report']

let cache = { at: -1, data: null }

function emptyStudent(classId, name) {
  return {
    classId,
    name,
    key: `${classId}::${name}`,
    enteredAt: null,
    lastSeenAt: null,
    levels: {},
    totalScore: 0,
    badges: [],
    quiz: null,
    online: false,
  }
}

function normalize(raw) {
  const levels = raw.levels && typeof raw.levels === 'object' ? raw.levels : {}
  const done = LEVEL_KEYS.filter((k) => levels[k] && levels[k].finishedAt)
  const score = LEVEL_KEYS.reduce((s, k) => s + (levels[k]?.score ?? 0), 0)
  return {
    classId: raw.classId,
    name: raw.name,
    key: raw.key,
    enteredAt: raw.enteredAt ?? null,
    lastSeenAt: raw.lastSeenAt ?? null,
    levels,
    doneLevels: done,
    doneCount: done.length,
    totalScore: score,
    badges: Array.isArray(raw.badges) ? raw.badges : [],
    quiz: raw.quiz ?? null,
    finished: done.length >= 5,
  }
}

function buildClass(classId, records) {
  const names = ROSTER[classId] ?? []
  const byName = new Map(records.map((r) => [r.name, r]))
  const students = names.map((n) => {
    const rec = byName.get(n)
    return rec ? { ...rec, expected: true } : { ...emptyStudent(classId, n), expected: true }
  })

  const joined = students.filter((s) => s.enteredAt)
  const finished = students.filter((s) => s.finished)
  const quizzed = students.filter((s) => s.quiz && s.quiz.submittedAt)
  const scores = quizzed.map((s) => s.quiz.score)

  return { classId, label: CLASS_LABELS[classId], students, joined, finished, quizzed, scores }
}

function summarize(groups, expectedTotal, expectedLabel) {
  const students = groups.flatMap((g) => g.students)
  const joined = students.filter((s) => s.enteredAt)
  const finished = students.filter((s) => s.finished)
  const quizzed = students.filter((s) => s.quiz && s.quiz.submittedAt)
  const scores = quizzed.map((s) => s.quiz.score)
  const durations = quizzed.map((s) => s.quiz.durationMs).filter((d) => Number.isFinite(d) && d > 0)

  return {
    label: expectedLabel,
    expectedTotal,
    joined: joined.length,
    finished: finished.length,
    quizzed: quizzed.length,
    avgScore: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
    maxScore: scores.length ? Math.max(...scores) : 0,
    minScore: scores.length ? Math.min(...scores) : 0,
    avgDurationMs: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0,
    avgGameScore: joined.length
      ? Math.round((joined.reduce((a, b) => a + b.totalScore, 0) / joined.length) * 10) / 10
      : 0,
    onlineCount: students.filter((s) => s.online).length,
  }
}

function levelStats(students) {
  return LEVEL_KEYS.map((key) => {
    const done = students.filter((s) => s.levels[key] && s.levels[key].finishedAt)
    const scores = done.map((s) => s.levels[key].score ?? 0)
    return {
      key,
      done: done.length,
      total: students.length,
      rate: students.length ? Math.round((done.length / students.length) * 100) : 0,
      avgScore: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
    }
  })
}

function questionStats(students) {
  const quizzed = students.filter((s) => s.quiz && Array.isArray(s.quiz.detail))
  return QUIZ_QUESTIONS.map((q, idx) => {
    let right = 0
    let answered = 0
    for (const s of quizzed) {
      const item = s.quiz.detail.find((d) => d.id === q.id)
      if (!item) continue
      answered += 1
      if (item.ok) right += 1
    }
    return {
      index: idx + 1,
      id: q.id,
      tag: q.tag,
      tagLabel: QUIZ_TAGS[q.tag] ?? q.tag,
      stem: q.stem,
      answered,
      right,
      correctRate: answered ? Math.round((right / answered) * 100) : 0,
    }
  })
}

function tickOnline(students) {
  const now = Date.now()
  return students.map((s) => ({
    ...s,
    online: Boolean(s.lastSeenAt && now - s.lastSeenAt < 90000),
  }))
}

export function computeDashboard(classId) {
  const db = getDb()
  const at = db.meta.updatedAt
  if (cache.at === at && cache.data) {
    return classId && classId !== 'all' ? cache.data.byClass[classId] ?? cache.data.byClass.all : cache.data.byClass.all
  }

  const records = allStudents().map(normalize)
  const groups = CLASS_IDS.map((id) => buildClass(id, records.filter((r) => r.classId === id)))

  const byClass = {}
  for (const g of groups) {
    const students = tickOnline(g.students).sort((a, b) => {
      if (a.enteredAt === b.enteredAt) return a.name.localeCompare(b.name, 'zh')
      if (!a.enteredAt) return 1
      if (!b.enteredAt) return -1
      return a.enteredAt - b.enteredAt
    })
    byClass[g.classId] = {
      classId: g.classId,
      label: g.label,
      updatedAt: at,
      summary: summarize([g], classSize(g.classId), g.label),
      students,
      levels: levelStats(g.students),
      questions: questionStats(g.students),
    }
  }

  const allStudentsFlat = tickOnline(groups.flatMap((g) => g.students))
  byClass.all = {
    classId: 'all',
    label: '四个班合计',
    updatedAt: at,
    summary: summarize(groups, TOTAL_STUDENTS, '四个班合计'),
    students: allStudentsFlat.sort((a, b) => {
      if (a.classId !== b.classId) return a.classId.localeCompare(b.classId)
      if (!a.enteredAt) return 1
      if (!b.enteredAt) return -1
      return a.enteredAt - b.enteredAt
    }),
    levels: levelStats(groups.flatMap((g) => g.students)),
    questions: questionStats(groups.flatMap((g) => g.students)),
    perClass: groups.map((g) => ({
      classId: g.classId,
      label: g.label,
      summary: summarize([g], classSize(g.classId), g.label),
    })),
  }

  cache = { at, data: { byClass } }
  return classId && classId !== 'all' ? byClass[classId] ?? byClass.all : byClass.all
}

export { LEVEL_KEYS }
