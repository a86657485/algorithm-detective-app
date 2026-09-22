/** SSE 连接池：看板页面订阅这里，数据一变就推一次。 */
const clients = new Set()
let debounceTimer = null
let heartbeat = null
let cachedPayload = null

export function addClient(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.write(': connected\n\n')
  clients.add(res)
  if (cachedPayload) res.write(`data: ${cachedPayload}\n\n`)

  const onClose = () => {
    clients.delete(res)
  }
  res.on('close', onClose)
  res.on('error', onClose)
}

export function clientCount() {
  return clients.size
}

/**
 * 广播。做 300ms 防抖：50 个学生同时提交时只推一次，
 * 避免看板被高频刷新卡住。
 */
export function broadcast(event) {
  const payload = JSON.stringify(event)
  cachedPayload = payload
  if (debounceTimer) return
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    send(payload)
  }, 300)
}

function send(payload) {
  for (const res of [...clients]) {
    try {
      res.write(`data: ${payload}\n\n`)
    } catch (err) {
      console.error('[sse] 推送失败，移除该连接', err.message)
      clients.delete(res)
    }
  }
}

export function startHeartbeat() {
  if (heartbeat) return
  heartbeat = setInterval(() => {
    for (const res of [...clients]) {
      try {
        res.write(': ping\n\n')
      } catch {
        clients.delete(res)
      }
    }
  }, 25000)
  heartbeat.unref?.()
}

export function stopHeartbeat() {
  if (heartbeat) clearInterval(heartbeat)
  heartbeat = null
}
