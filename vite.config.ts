import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fetchHandUrlBody, HandUrlErrorCode } from './server/handUrlServerShared'

/**
 * 讀取 POST body 為 UTF-8 字串。
 */
function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      chunks.push(c)
    })
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', reject)
  })
}

/**
 * 開發時提供與 `/api/fetch-hand-url` 相同行為（因 `/api` 可能轉到本機其他服務）。
 */
function handUrlFetchDevPlugin() {
  return {
    name: 'gto-fetch-hand-url-dev',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/__gto/fetch-hand-url', (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.method !== 'POST') {
          next()
          return
        }
        void (async () => {
          try {
            const raw = await readRequestBody(req)
            const j = JSON.parse(raw) as { url?: string }
            const url = j.url?.trim()
            if (!url) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: false, error: HandUrlErrorCode.INVALID_URL }))
              return
            }
            const { status, contentType, text } = await fetchHandUrlBody(url)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, status, contentType, text }))
          } catch (e) {
            const code = e instanceof Error ? e.message : 'UNKNOWN'
            if (code === HandUrlErrorCode.HTTPS_ONLY || code === HandUrlErrorCode.INVALID_URL) {
              res.statusCode = 400
            } else if (code === HandUrlErrorCode.PRIVATE_HOST) {
              res.statusCode = 403
            } else if (code === HandUrlErrorCode.FETCH_ABORT) {
              res.statusCode = 504
            } else {
              res.statusCode = 502
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: code === 'UNKNOWN' ? 'FETCH_FAILED' : code }))
          }
        })()
      })
      server.middlewares.use('/__gto/report-bug', (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.method !== 'POST') {
          next()
          return
        }
        void (async () => {
          try {
            const raw = await readRequestBody(req)
            const j = JSON.parse(raw) as { message?: string }
            const message = j.message?.trim() ?? ''
            if (message.length < 8) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: false, error: 'INVALID_MESSAGE' }))
              return
            }
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, id: Date.now() }))
          } catch {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: 'INVALID_JSON' }))
          }
        })()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), handUrlFetchDevPlugin()],
    server: {
      allowedHosts: ['anthropometrically-phosphoric-terisa.ngrok-free.dev'],
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
        '/claude-proxy': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/claude-proxy/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const key = env.ANTHROPIC_API_KEY || ''
              if (key) proxyReq.setHeader('x-api-key', key)
              proxyReq.setHeader('anthropic-version', '2023-06-01')
            })
          },
        },
      },
    },
  }
})
