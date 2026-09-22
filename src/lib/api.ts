/**
 * 与后端通信。
 *
 * 机房可能中途断网，所以上报一律走"先入队、再发送"：
 * 发失败就留在 localStorage 的 outbox 里，等网络恢复或 15 秒后自动补传。
 * 学生因此可以全程离线把游戏和考核做完，联网后再补数据。
 */
const API_BASE = '/api'
const OUTBOX_KEY = 'algo-outbox'
const RETRY_INTERVAL = 15000

export interface ApiResult<T> {
  ok: boolean
  error?: string
  data?: T
}

interface OutboxItem {
  id: string
  path: string
  body: unknown
  at: number
}

function readOutbox(): OutboxItem[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch (err) {
    console.error('离线队列读取失败，已清空', err)
    return []
  }
}

function writeOutbox(list: OutboxItem[]): void {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(list.slice(-400)))
  } catch (err) {
    console.error('离线队列写入失败', err)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T> | null> {
  try {
    const res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
    const json = (await res.json()) as ApiResult<T> & { data?: T }
    return json
  } catch (err) {
    console.error('请求后端失败：' + path, err)
    return null
  }
}

/**
 * 需要送达后端的写操作：先入队（保证不丢），再立刻尝试发送。
 * 成功就从队列里删掉并返回结果；失败则留在队列里等下次补传。
 */
async function postReliable<T>(path: string, body: unknown): Promise<ApiResult<T> | null> {
  const item: OutboxItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    path,
    body,
    at: Date.now(),
  }
  writeOutbox([...readOutbox(), item])
  const r = await request<T>(path, { method: 'POST', body: JSON.stringify(body) })
  if (r) {
    writeOutbox(readOutbox().filter((x) => x.id !== item.id))
    return r
  }
  return null
}

export async function flushOutbox(): Promise<void> {
  const list = readOutbox()
  if (list.length === 0) return
  const rest: OutboxItem[] = []
  let stop = false
  for (const item of list) {
    // 一旦某条发不出去（多半是断网），后面的先留着，避免无谓的重试
    if (stop) {
      rest.push(item)
      continue
    }
    const r = await request(item.path, { method: 'POST', body: JSON.stringify(item.body) })
    if (!r) {
      rest.push(item)
      stop = true
    }
  }
  writeOutbox(rest)
}

let retryTimer: number | null = null

export function startOutboxRetry(): void {
  if (typeof window === 'undefined' || retryTimer !== null) return
  retryTimer = window.setInterval(() => void flushOutbox(), RETRY_INTERVAL)
  window.addEventListener('online', () => void flushOutbox())
}

/* ------------------------------------------------------------------ */
/*                              业务接口                               */
/* ------------------------------------------------------------------ */

export interface ServerStudent {
  classId: string
  name: string
  enteredAt?: number
  levels?: Record<string, { score: number; stars: number; usedMs: number; finishedAt: number }>
  badges?: string[]
  quiz?: { score: number; correct: number; total: number; durationMs: number; submittedAt: number } | null
}

export function reportLogin(
  classId: string,
  name: string,
): Promise<ApiResult<{ student: ServerStudent }> | null> {
  return postReliable<{ student: ServerStudent }>('/login', { classId, name })
}

export function reportProgress(classId: string, name: string, levels: unknown, badges: string[]): void {
  // 进度上报频率高，失败就留在队列里，不阻塞界面
  void postReliable('/progress', { classId, name, levels, badges })
}

export function submitQuiz(
  classId: string,
  name: string,
  answers: Record<string, number>,
  durationMs: number,
): Promise<ApiResult<{ result: unknown }> | null> {
  return postReliable<{ result: unknown }>('/quiz', { classId, name, answers, durationMs })
}

export function teacherLogin(password: string): Promise<ApiResult<{ token: string }> | null> {
  return request<{ token: string }>('/teacher/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export function fetchDashboard(classId: string, token: string): Promise<ApiResult<DashboardData> | null> {
  return request<DashboardData>(`/dashboard?classId=${encodeURIComponent(classId)}&token=${encodeURIComponent(token)}`)
}

export interface DashboardSummary {
  label: string
  expectedTotal: number
  joined: number
  finished: number
  quizzed: number
  avgScore: number
  maxScore: number
  minScore: number
  avgDurationMs: number
  avgGameScore: number
  onlineCount: number
}

export interface DashboardStudent {
  classId: string
  name: string
  key: string
  enteredAt: number | null
  lastSeenAt: number | null
  levels: Record<string, { score: number; stars: number; usedMs: number; finishedAt: number }>
  doneLevels: string[]
  doneCount: number
  totalScore: number
  badges: string[]
  quiz: { score: number; correct: number; total: number; durationMs: number; submittedAt: number } | null
  finished: boolean
  online: boolean
}

export interface DashboardLevel {
  key: string
  done: number
  total: number
  rate: number
  avgScore: number
}

export interface DashboardQuestion {
  index: number
  id: string
  tag: string
  tagLabel: string
  stem: string
  answered: number
  right: number
  correctRate: number
}

export interface DashboardData {
  classId: string
  label: string
  updatedAt: number
  summary: DashboardSummary
  students: DashboardStudent[]
  levels: DashboardLevel[]
  questions: DashboardQuestion[]
  perClass?: Array<{ classId: string; label: string; summary: DashboardSummary }>
}

/** 订阅实时更新。断线时返回的 close 仍可用，调用方可退化为轮询。 */
export function openStream(token: string, onEvent: (payload: unknown) => void): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return () => {}
  const es = new EventSource(`${API_BASE}/stream?token=${encodeURIComponent(token)}`)
  es.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data))
    } catch {
      onEvent(null)
    }
  }
  es.onerror = () => {
    // EventSource 自带重连；这里只记一笔日志，交给浏览器处理
    console.debug('实时连接中断，浏览器会自动重连')
  }
  return () => es.close()
}
