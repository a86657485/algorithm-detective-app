import crypto from 'node:crypto'
import { CLASS_IDS, CLASS_LABELS, ROSTER, TOTAL_STUDENTS, isValidStudent, studentKey } from '../../shared/roster.mjs'
import { publicQuestions, gradeQuiz, QUIZ_TOTAL } from '../../shared/quiz-data.mjs'
import { updateStudent, getStudent } from '../lib/store.mjs'
import { computeDashboard } from '../lib/aggregate.mjs'
import { addClient, broadcast, clientCount } from '../lib/sse.mjs'

const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'teacher'
const sessions = new Map() // token -> 过期时间
const SESSION_TTL = 12 * 60 * 60 * 1000

function newToken() {
  const token = crypto.randomBytes(16).toString('hex')
  sessions.set(token, Date.now() + SESSION_TTL)
  return token
}

function checkToken(token) {
  const exp = sessions.get(token)
  if (!exp) return false
  if (exp < Date.now()) {
    sessions.delete(token)
    return false
  }
  return true
}

function json(res, status, body) {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(text),
  })
  res.end(text)
}

export function readBody(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        reject(new Error('请求体过大'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('请求体不是合法 JSON'))
      }
    })
    req.on('error', reject)
  })
}

const notFound = (res) => json(res, 404, { ok: false, error: '接口不存在' })

/** 返回 true 表示已处理该请求 */
export async function handleApi(req, res, url) {
  const { pathname } = url

  /* ---------- 名单 ---------- */
  if (pathname === '/api/roster' && req.method === 'GET') {
    json(res, 200, {
      ok: true,
      data: { classIds: CLASS_IDS, labels: CLASS_LABELS, roster: ROSTER, total: TOTAL_STUDENTS },
    })
    return true
  }

  /* ---------- 学生登录 ---------- */
  if (pathname === '/api/login' && req.method === 'POST') {
    const body = await readBody(req)
    const classId = String(body.classId ?? '')
    const name = String(body.name ?? '').trim()
    if (!isValidStudent(classId, name)) {
      json(res, 200, { ok: false, error: '名单里没有找到这位同学，请检查班级和姓名' })
      return true
    }
    const now = Date.now()
    const rec = updateStudent(studentKey(classId, name), (cur) => ({
      classId,
      name,
      key: studentKey(classId, name),
      enteredAt: cur?.enteredAt ?? now,
      lastSeenAt: now,
      levels: cur?.levels ?? {},
      badges: cur?.badges ?? [],
      quiz: cur?.quiz ?? null,
    }))
    broadcast({ type: 'update', classId, key: rec.key })
    json(res, 200, {
      ok: true,
      data: { student: { classId, name, enteredAt: rec.enteredAt, levels: rec.levels, badges: rec.badges, quiz: rec.quiz } },
    })
    return true
  }

  /* ---------- 心跳 / 进度上报 ---------- */
  if (pathname === '/api/progress' && req.method === 'POST') {
    const body = await readBody(req)
    const classId = String(body.classId ?? '')
    const name = String(body.name ?? '').trim()
    if (!isValidStudent(classId, name)) {
      json(res, 200, { ok: false, error: '学生信息无效' })
      return true
    }
    const now = Date.now()
    const levels = body.levels && typeof body.levels === 'object' ? body.levels : {}
    updateStudent(studentKey(classId, name), (cur) => ({
      classId,
      name,
      key: studentKey(classId, name),
      enteredAt: cur?.enteredAt ?? now,
      lastSeenAt: now,
      levels,
      badges: Array.isArray(body.badges) ? body.badges : (cur?.badges ?? []),
      quiz: cur?.quiz ?? null,
    }))
    broadcast({ type: 'progress', classId })
    json(res, 200, { ok: true })
    return true
  }

  /* ---------- 取题 ---------- */
  if (pathname === '/api/quiz' && req.method === 'GET') {
    json(res, 200, { ok: true, data: { total: QUIZ_TOTAL, questions: publicQuestions() } })
    return true
  }

  /* ---------- 提交答卷（服务端判分） ---------- */
  if (pathname === '/api/quiz' && req.method === 'POST') {
    const body = await readBody(req)
    const classId = String(body.classId ?? '')
    const name = String(body.name ?? '').trim()
    if (!isValidStudent(classId, name)) {
      json(res, 200, { ok: false, error: '学生信息无效' })
      return true
    }
    const answers = body.answers && typeof body.answers === 'object' ? body.answers : {}
    const result = gradeQuiz(answers)
    const now = Date.now()
    const durationMs = Math.min(3 * 60 * 60 * 1000, Math.max(0, Number(body.durationMs) || 0))
    const quiz = { ...result, answers, durationMs, submittedAt: now }
    updateStudent(studentKey(classId, name), (cur) => ({
      classId,
      name,
      key: studentKey(classId, name),
      enteredAt: cur?.enteredAt ?? now,
      lastSeenAt: now,
      levels: cur?.levels ?? {},
      badges: cur?.badges ?? [],
      quiz,
    }))
    broadcast({ type: 'quiz', classId, key: studentKey(classId, name) })
    json(res, 200, { ok: true, data: { result: quiz } })
    return true
  }

  /* ---------- 教师口令 ---------- */
  if (pathname === '/api/teacher/login' && req.method === 'POST') {
    const body = await readBody(req)
    if (String(body.password ?? '') !== TEACHER_PASSWORD) {
      json(res, 200, { ok: false, error: '口令不正确' })
      return true
    }
    json(res, 200, { ok: true, data: { token: newToken() } })
    return true
  }

  /* ---------- 看板数据 ---------- */
  if (pathname === '/api/dashboard' && req.method === 'GET') {
    const token = url.searchParams.get('token') ?? ''
    if (!checkToken(token)) {
      json(res, 401, { ok: false, error: '登录已过期，请重新输入口令' })
      return true
    }
    const classId = url.searchParams.get('classId') ?? 'all'
    json(res, 200, { ok: true, data: computeDashboard(classId), streamClients: clientCount() })
    return true
  }

  /* ---------- 实时推送 ---------- */
  if (pathname === '/api/stream' && req.method === 'GET') {
    const token = url.searchParams.get('token') ?? ''
    if (!checkToken(token)) {
      json(res, 401, { ok: false, error: '登录已过期' })
      return true
    }
    addClient(res)
    return true
  }

  /* ---------- 学生自查（可选） ---------- */
  if (pathname === '/api/me' && req.method === 'GET') {
    const classId = url.searchParams.get('classId') ?? ''
    const name = url.searchParams.get('name') ?? ''
    if (!isValidStudent(classId, name)) {
      json(res, 200, { ok: false, error: '学生信息无效' })
      return true
    }
    json(res, 200, { ok: true, data: { student: getStudent(studentKey(classId, name)) } })
    return true
  }

  if (pathname.startsWith('/api/')) {
    notFound(res)
    return true
  }
  return false
}
