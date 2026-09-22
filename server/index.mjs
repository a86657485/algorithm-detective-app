/**
 * 算法小侦探事务所 · 后端服务
 *
 * 零外部依赖（只用 Node 内置模块），所以机房没外网、npm install 装不动的时候也能跑。
 * 同一个进程既提供 /api 接口，也托管打包好的前端页面，一条命令启动。
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { handleApi } from './routes/api.mjs'
import { loadDb, dbFilePath } from './lib/store.mjs'
import { startHeartbeat } from './lib/sse.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DIST = path.join(ROOT, 'dist')

const PORT = Number(process.env.PORT) || 3001
const HOST = process.env.HOST || '0.0.0.0'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

function serveStatic(req, res, pathname) {
  if (!fs.existsSync(DIST)) {
    res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(
      '<h1>还没有构建前端</h1><p>请先运行 <code>npm run build</code>，再重启本服务。</p>',
    )
    return
  }

  const safe = path.normalize(decodeURIComponent(pathname)).replace(/^([.][.][/\\])+/, '')
  let filePath = path.join(DIST, safe)
  if (!filePath.startsWith(DIST)) filePath = path.join(DIST, 'index.html')
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // 单页应用：找不到的路径一律回退到 index.html
    const fallback = path.join(DIST, 'index.html')
    if (!fs.existsSync(fallback)) {
      res.writeHead(404)
      res.end('Not Found')
      return
    }
    filePath = fallback
  }

  const ext = path.extname(filePath).toLowerCase()
  const headers = { 'Content-Type': MIME[ext] ?? 'application/octet-stream' }
  headers['Cache-Control'] = ext === '.html' ? 'no-cache' : 'public, max-age=604800'
  res.writeHead(200, headers)
  fs.createReadStream(filePath).pipe(res)
}

function lanAddresses() {
  const out = []
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address)
    }
  }
  return out
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

  // 局域网内学生机访问，放开跨域，方便老师用其他端口调试前端
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  try {
    if (url.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ ok: true, uptime: Math.round(process.uptime()), db: dbFilePath() }))
      return
    }
    const handled = await handleApi(req, res, url)
    if (handled) return
    if (url.pathname.startsWith('/api/')) return
    serveStatic(req, res, url.pathname)
  } catch (err) {
    console.error('[server] 请求处理失败', url.pathname, err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ ok: false, error: err.message }))
    } else {
      res.end()
    }
  }
})

loadDb()
startHeartbeat()

server.listen(PORT, HOST, () => {
  const addrs = lanAddresses()
  const line = '='.repeat(66)
  // 控制台刻意只用 ASCII：机房 cmd 默认代码页是 936，直接输出中文会变成乱码。
  // 中文说明见 README.md 与「启动服务.bat」。
  console.log('')
  console.log(line)
  console.log('  Algorithm Detective - server started / fu wu yi qi dong')
  console.log(line)
  console.log(`  Teacher machine : http://localhost:${PORT}/`)
  for (const ip of addrs) {
    console.log(`  Student devices : http://${ip}:${PORT}/`)
  }
  console.log(`  Dashboard       : http://localhost:${PORT}/#/dashboard`)
  console.log(`  Data file       : ${dbFilePath()}`)
  console.log(
    `  Teacher password: ${
      process.env.TEACHER_PASSWORD ? '(set via env TEACHER_PASSWORD)' : 'teacher'
    }`,
  )
  console.log(line)
  console.log('  Keep this window open while students are using the app.')
  console.log('')
})

function shutdown() {
  console.log('\nShutting down server ...')
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 2000)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
