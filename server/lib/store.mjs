/**
 * 极简 JSON 存储。
 *
 * 两个必须保证的点：
 * 1. 210 名学生可能同时提交，绝不能并发写同一个文件 —— 所有写操作进串行队列。
 * 2. 写入必须原子 —— 先写 .tmp 再 rename，避免进程中断留下半个文件。
 * 存档损坏时自动备份并重建，服务不崩。
 */
import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), 'server', 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

let db = { students: {}, meta: { updatedAt: 0 } }
let queue = Promise.resolve()
let pendingWrites = 0

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function emptyDb() {
  return { students: {}, meta: { updatedAt: 0 } }
}

export function loadDb() {
  ensureDir()
  if (!fs.existsSync(DB_FILE)) {
    db = emptyDb()
    return db
  }
  try {
    const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
    if (!raw || typeof raw !== 'object' || typeof raw.students !== 'object' || raw.students === null) {
      throw new Error('结构不正确')
    }
    db = { students: raw.students, meta: raw.meta ?? { updatedAt: 0 } }
  } catch (err) {
    const backup = path.join(DATA_DIR, `db.corrupt.${Date.now()}.json`)
    try {
      fs.renameSync(DB_FILE, backup)
      console.error(`[store] 数据文件损坏，已备份到 ${path.basename(backup)} 并重建`, err.message)
    } catch (e) {
      console.error('[store] 备份损坏文件失败', e.message)
    }
    db = emptyDb()
  }
  return db
}

export function getDb() {
  return db
}

export function getStudent(key) {
  return db.students[key] ?? null
}

export function allStudents() {
  return Object.values(db.students)
}

function flush() {
  pendingWrites += 1
  queue = queue.then(
    () =>
      new Promise((resolve) => {
        try {
          ensureDir()
          const tmp = `${DB_FILE}.tmp`
          fs.writeFileSync(tmp, JSON.stringify(db), 'utf8')
          fs.renameSync(tmp, DB_FILE)
        } catch (err) {
          console.error('[store] 写入失败', err.message)
        }
        pendingWrites -= 1
        resolve()
      }),
  )
  return queue
}

/**
 * 读取-修改-写入一个学生记录。
 * mutator 收到当前记录（可能是 null），返回新的记录。
 */
export function updateStudent(key, mutator) {
  const current = db.students[key] ?? null
  const next = mutator(current)
  if (!next) return current
  db.students[key] = next
  db.meta.updatedAt = Date.now()
  flush()
  return next
}

export function pendingWriteCount() {
  return pendingWrites
}

export function dbFilePath() {
  return DB_FILE
}
