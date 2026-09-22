/**
 * localStorage 安全封装。
 *
 * 存档一旦损坏（手改、旧版本、浏览器配额），最坏的结果就是整页白屏。
 * 所以所有读写都在这里收敛，出错时静默降级为"内存模式"，让游戏还能继续玩。
 */
export const STORAGE_KEY = 'algo-detective-app'
export const STATE_VERSION = 1

let memoryFallback: string | null = null

function resolveStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    const probe = '__algo_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch (err) {
    console.error('浏览器不允许使用本地存储，本次进度不会保存', err)
    return null
  }
}

export function loadRaw(): Record<string, unknown> | null {
  const store = resolveStorage()
  const text = store ? store.getItem(STORAGE_KEY) : memoryFallback
  if (!text) return null
  try {
    const parsed = JSON.parse(text) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as Record<string, unknown>
  } catch (err) {
    console.error('存档解析失败，已重置为初始状态', err)
    clearRaw()
    return null
  }
}

export function saveRaw(value: unknown): void {
  let text = ''
  try {
    text = JSON.stringify(value)
  } catch (err) {
    console.error('进度序列化失败，本次不保存', err)
    return
  }
  const store = resolveStorage()
  if (!store) {
    memoryFallback = text
    return
  }
  try {
    store.setItem(STORAGE_KEY, text)
  } catch (err) {
    console.error('进度写入失败，可能空间已满', err)
    memoryFallback = text
  }
}

export function clearRaw(): void {
  memoryFallback = null
  const store = resolveStorage()
  if (!store) return
  try {
    store.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('清空存档失败', err)
  }
}
