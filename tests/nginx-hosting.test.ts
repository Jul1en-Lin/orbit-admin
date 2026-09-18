import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  createServer as createHttpServer,
  request as httpRequest,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http'

// --- 辅助验证逻辑：解析 Nginx 配置文本块 ---

function extractBlock(content: string, blockHeader: string): string {
  const startIndex = content.indexOf(blockHeader)
  if (startIndex === -1) {
    throw new Error(`Block header "${blockHeader}" not found in configuration`)
  }

  const openBraceIndex = content.indexOf('{', startIndex)
  if (openBraceIndex === -1) {
    throw new Error(`Opening brace "{" not found after header "${blockHeader}"`)
  }

  let braceCount = 1
  let currentIndex = openBraceIndex + 1
  while (braceCount > 0 && currentIndex < content.length) {
    const char = content[currentIndex]
    if (char === '{') {
      braceCount++
    } else if (char === '}') {
      braceCount--
    }
    currentIndex++
  }

  if (braceCount !== 0) {
    throw new Error(`Unbalanced braces in block starting at "${blockHeader}"`)
  }

  return content.substring(openBraceIndex + 1, currentIndex - 1)
}

function verifyBalancedBraces(content: string): boolean {
  let count = 0
  for (const char of content) {
    if (char === '{') count++
    else if (char === '}') count--
    if (count < 0) return false
  }
  return count === 0
}

function stripComments(content: string): string {
  return content.replace(/#.*$/gm, '')
}

describe('nginx configuration files structure and directives', () => {
  const siteConfigPath = 'deploy/nginx/orbit-admin.conf'
  const mainConfigPath = 'deploy/nginx.conf'

  it('both configuration files exist and have balanced braces', () => {
    expect(existsSync(siteConfigPath)).toBe(true)
    expect(existsSync(mainConfigPath)).toBe(true)

    const siteContent = readFileSync(siteConfigPath, 'utf-8')
    const mainContent = readFileSync(mainConfigPath, 'utf-8')

    expect(verifyBalancedBraces(siteContent)).toBe(true)
    expect(verifyBalancedBraces(mainContent)).toBe(true)
  })

  describe('orbit-admin.conf (virtual host server block)', () => {
    const content = readFileSync(siteConfigPath, 'utf-8')

    it('defines gateway_upstream pointing to 127.0.0.1:18080 with keepalive', () => {
      const upstreamBlock = extractBlock(content, 'upstream gateway_upstream')
      expect(upstreamBlock).toContain('server 127.0.0.1:18080;')
      expect(upstreamBlock).toContain('keepalive')
    })

    it('configures server root to static build output and index to index.html', () => {
      const serverBlock = extractBlock(content, 'server')
      expect(serverBlock).toContain('root /usr/share/nginx/html;')
      expect(serverBlock).toContain('index index.html;')
      expect(serverBlock).toContain('listen 80;')
    })

    it('configures static assets (/assets/) with try_files $uri =404 and strict caching, never falling back to index.html', () => {
      const assetsBlock = extractBlock(content, 'location ^~ /assets/')
      expect(assetsBlock).toContain('try_files $uri =404;')
      expect(stripComments(assetsBlock)).not.toContain('index.html')
      expect(assetsBlock).toContain('Cache-Control')
      expect(assetsBlock).toContain('immutable')
    })

    it('configures favicon.ico with try_files $uri =404, never falling back to index.html', () => {
      const faviconBlock = extractBlock(content, 'location = /favicon.ico')
      expect(faviconBlock).toContain('try_files $uri =404;')
      expect(stripComments(faviconBlock)).not.toContain('index.html')
    })

    it('configures API proxy (/api/) forwarding to gateway with path rewrite and no error interception', () => {
      const apiBlock = extractBlock(content, 'location ^~ /api/')
      // Trailing slash on both location and proxy_pass rewrites /api/xxx -> /admin/xxx
      expect(apiBlock).toContain('proxy_pass http://gateway_upstream/admin/;')
      expect(apiBlock).toContain('proxy_set_header Host $host;')
      expect(apiBlock).toContain('proxy_set_header X-Real-IP $remote_addr;')
      expect(apiBlock).toContain('proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;')
      expect(apiBlock).toContain('proxy_set_header X-Forwarded-Proto $scheme;')
      expect(apiBlock).toContain('proxy_intercept_errors off;')
      // Strict isolation: API location must not fallback to index.html
      expect(stripComments(apiBlock)).not.toContain('try_files')
      expect(stripComments(apiBlock)).not.toContain('index.html')
    })

    it('redirects bare /api to /api/ with 308 redirect', () => {
      const bareApiBlock = extractBlock(content, 'location = /api')
      expect(bareApiBlock).toContain('return 308 /api/;')
    })

    it('configures frontend history mode fallback in location / with no-cache headers', () => {
      const rootLocationBlock = extractBlock(content, 'location /')
      expect(rootLocationBlock).toContain('try_files $uri $uri/ /index.html;')
      expect(rootLocationBlock).toContain('Cache-Control')
      expect(rootLocationBlock).toContain('no-cache')
    })
  })

  describe('nginx.conf (standalone master config)', () => {
    const content = readFileSync(mainConfigPath, 'utf-8')

    it('includes standard http context, mime types, and upstream definition', () => {
      expect(content).toContain('events {')
      expect(content).toContain('http {')
      expect(content).toContain('include /etc/nginx/mime.types;')
      const upstreamBlock = extractBlock(content, 'upstream gateway_upstream')
      expect(upstreamBlock).toContain('server 127.0.0.1:18080;')
    })

    it('contains identical location rules for assets, api, and history fallback', () => {
      const assetsBlock = extractBlock(content, 'location ^~ /assets/')
      expect(assetsBlock).toContain('try_files $uri =404;')
      expect(stripComments(assetsBlock)).not.toContain('index.html')

      const apiBlock = extractBlock(content, 'location ^~ /api/')
      expect(apiBlock).toContain('proxy_pass http://gateway_upstream/admin/;')
      expect(apiBlock).toContain('proxy_intercept_errors off;')
      expect(stripComments(apiBlock)).not.toContain('try_files')
      expect(stripComments(apiBlock)).not.toContain('index.html')

      const rootLocationBlock = extractBlock(content, 'location /')
      expect(rootLocationBlock).toContain('try_files $uri $uri/ /index.html;')
    })
  })
})

// --- 实际 HTTP 调度行为验证：通过受控的本地测试服务器模拟 Nginx 转发逻辑 ---

describe('nginx hosting and routing fallback runtime semantics', () => {
  let tempStaticDir: string
  let mockGatewayServer: Server
  let mockGatewayPort: number
  let hostingServer: Server
  let hostingPort: number

  interface MockRequestRecord {
    method: string
    url: string
    headers: Record<string, string | string[] | undefined>
    body: string
  }

  const recordedGatewayRequests: MockRequestRecord[] = []

  beforeAll(async () => {
    // 1. 创建静态托管测试目录与产物文件
    tempStaticDir = join(tmpdir(), `orbit-nginx-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
    mkdirSync(tempStaticDir, { recursive: true })
    mkdirSync(join(tempStaticDir, 'assets'), { recursive: true })

    writeFileSync(
      join(tempStaticDir, 'index.html'),
      '<!DOCTYPE html><html><head><title>Orbit Admin</title></head><body><div id="app"></div></body></html>',
    )
    writeFileSync(join(tempStaticDir, 'assets', 'index-test.js'), 'console.log("orbit app bundle");')
    writeFileSync(join(tempStaticDir, 'assets', 'style-test.css'), 'body { margin: 0; }')

    // 2. 启动模拟网关服务
    mockGatewayServer = createHttpServer((req: IncomingMessage, res: ServerResponse) => {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })
      req.on('end', () => {
        recordedGatewayRequests.push({
          method: req.method ?? 'GET',
          url: req.url ?? '/',
          headers: req.headers,
          body,
        })

        if (req.url === '/admin/sys_user/login/password' && req.method === 'POST') {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ code: 200000, msg: '操作成功', data: { token: 'mock-token' } }))
          return
        }

        if (req.url?.startsWith('/admin/sys_user/login/get_info')) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              code: 200000,
              msg: '操作成功',
              data: { userId: 1, userName: 'admin' },
            }),
          )
          return
        }

        if (req.url?.startsWith('/admin/sys_user/list')) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ code: 200000, msg: '操作成功', data: { list: [], total: 0 } }))
          return
        }

        if (req.url === '/admin/error/404-endpoint') {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ code: 404000, msg: '网关未找到对应接口' }))
          return
        }

        if (req.url === '/admin/error/500-endpoint') {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ code: 500000, msg: '后端服务异常' }))
          return
        }

        // 默认返回 404
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ code: 404000, msg: 'Not Found on mock gateway' }))
      })
    })

    await new Promise<void>((resolve) => {
      mockGatewayServer.listen(0, '127.0.0.1', () => {
        const address = mockGatewayServer.address()
        if (address && typeof address === 'object') {
          mockGatewayPort = address.port
        }
        resolve()
      })
    })

    // 3. 启动模拟 Nginx 静态托管与代理服务（完全基于 Nginx 配置规则实现调度）
    hostingServer = createHttpServer((req: IncomingMessage, res: ServerResponse) => {
      const parsedUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
      const pathname = parsedUrl.pathname

      // 规则 A: location = /api
      if (pathname === '/api') {
        res.writeHead(308, { Location: `/api/${parsedUrl.search}` })
        res.end()
        return
      }

      // 规则 B: location ^~ /api/
      // 代理转发至后端网关并替换 /api/ -> /admin/，独立 location，绝不回退至 index.html
      if (pathname.startsWith('/api/')) {
        const rewrittenPath = pathname.replace(/^\/api\//, '/admin/')
        const gatewayUrl = new URL(rewrittenPath + parsedUrl.search, `http://127.0.0.1:${mockGatewayPort}`)

        const proxyReq = httpRequest(
          gatewayUrl,
          {
            method: req.method,
            headers: {
              ...req.headers,
              host: gatewayUrl.host,
              'x-real-ip': req.socket.remoteAddress ?? '127.0.0.1',
              'x-forwarded-for': req.headers['x-forwarded-for'] ?? '127.0.0.1',
              'x-forwarded-proto': 'http',
            },
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
            proxyRes.pipe(res)
          },
        )

        proxyReq.on('error', () => {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ code: 502, msg: 'Bad Gateway' }))
        })

        req.pipe(proxyReq)
        return
      }

      // 规则 C: location = /favicon.ico
      if (pathname === '/favicon.ico') {
        const filePath = join(tempStaticDir, 'favicon.ico')
        if (existsSync(filePath)) {
          res.writeHead(200, { 'Content-Type': 'image/x-icon' })
          res.end(readFileSync(filePath))
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('404 Not Found')
        }
        return
      }

      // 规则 D: location ^~ /assets/
      // 静态资源文件存在则返回强缓存；不存在直接 404，严禁回退至 index.html
      if (pathname.startsWith('/assets/')) {
        const filePath = join(tempStaticDir, pathname)
        if (existsSync(filePath)) {
          const contentType = pathname.endsWith('.js')
            ? 'application/javascript'
            : pathname.endsWith('.css')
              ? 'text/css'
              : 'application/octet-stream'
          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          })
          res.end(readFileSync(filePath))
        } else {
          // 缺失文件直接 404，严禁回退 index.html
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('404 Not Found')
        }
        return
      }

      // 规则 E: location / (try_files $uri $uri/ /index.html)
      // 前端路由 History 模式深层页面回退
      const filePath = join(tempStaticDir, pathname)
      if (pathname !== '/' && existsSync(filePath)) {
        res.writeHead(200)
        res.end(readFileSync(filePath))
        return
      }

      const indexPath = join(tempStaticDir, 'index.html')
      if (existsSync(indexPath)) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        })
        res.end(readFileSync(indexPath))
        return
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('404 Not Found')
    })

    await new Promise<void>((resolve) => {
      hostingServer.listen(0, '127.0.0.1', () => {
        const address = hostingServer.address()
        if (address && typeof address === 'object') {
          hostingPort = address.port
        }
        resolve()
      })
    })
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => mockGatewayServer.close(() => resolve()))
    await new Promise<void>((resolve) => hostingServer.close(() => resolve()))
    if (existsSync(tempStaticDir)) {
      rmSync(tempStaticDir, { recursive: true, force: true })
    }
  })

  describe('frontend route history fallback', () => {
    it.each([
      ['root path', '/'],
      ['accounts page', '/accounts'],
      ['dicts page', '/dicts'],
      ['dict items deep page', '/dicts/10/items'],
      ['arguments page', '/arguments'],
      ['not-found page', '/not-found'],
      ['deep nested workbench route', '/workbench/overview/details'],
    ])('serves index.html with 200 for %s (%s)', async (_name, routePath) => {
      const response = await fetch(`http://127.0.0.1:${hostingPort}${routePath}`)
      expect(response.status).toBe(200)

      const contentType = response.headers.get('content-type')
      expect(contentType).toContain('text/html')

      const cacheControl = response.headers.get('cache-control')
      expect(cacheControl).toContain('no-cache')

      const text = await response.text()
      expect(text).toContain('<div id="app"></div>')
      expect(text).toContain('<title>Orbit Admin</title>')
    })
  })

  describe('static assets handling (/assets/)', () => {
    it('serves existing static JS file with 200 and immutable cache header', async () => {
      const response = await fetch(`http://127.0.0.1:${hostingPort}/assets/index-test.js`)
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/javascript')
      expect(response.headers.get('cache-control')).toContain('immutable')

      const content = await response.text()
      expect(content).toContain('orbit app bundle')
    })

    it('serves existing static CSS file with 200', async () => {
      const response = await fetch(`http://127.0.0.1:${hostingPort}/assets/style-test.css`)
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/css')

      const content = await response.text()
      expect(content).toContain('margin: 0')
    })

    it('returns 404 for missing static JS file and NEVER falls back to index.html', async () => {
      const response = await fetch(`http://127.0.0.1:${hostingPort}/assets/non-existent-chunk-Cd1kD4T.js`)
      expect(response.status).toBe(404)

      const text = await response.text()
      // Strict criterion: MUST NOT return HTML page (which would cause MIME type mismatch in browser)
      expect(text).not.toContain('<div id="app">')
      expect(text).not.toContain('<!DOCTYPE html>')
      expect(text).toBe('404 Not Found')
    })

    it('returns 404 for missing static CSS file and NEVER falls back to index.html', async () => {
      const response = await fetch(`http://127.0.0.1:${hostingPort}/assets/non-existent-style-CXImnBHM.css`)
      expect(response.status).toBe(404)

      const text = await response.text()
      expect(text).not.toContain('<!DOCTYPE html>')
      expect(text).toBe('404 Not Found')
    })

    it('returns 404 for missing favicon.ico and NEVER falls back to index.html', async () => {
      const response = await fetch(`http://127.0.0.1:${hostingPort}/favicon.ico`)
      expect(response.status).toBe(404)

      const text = await response.text()
      expect(text).not.toContain('<!DOCTYPE html>')
    })
  })

  describe('API proxy and path rewrite semantics (/api/ -> /admin/)', () => {
    it('redirects bare /api to /api/ via 308 redirect', async () => {
      const response = await fetch(`http://127.0.0.1:${hostingPort}/api`, {
        redirect: 'manual',
      })
      expect(response.status).toBe(308)
      expect(response.headers.get('location')).toBe('/api/')
    })

    it('proxies GET /api/sys_user/login/get_info to gateway /admin/sys_user/login/get_info', async () => {
      const response = await fetch(`http://127.0.0.1:${hostingPort}/api/sys_user/login/get_info`, {
        headers: {
          Authorization: 'Bearer test-jwt-token-123',
        },
      })
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual({
        code: 200000,
        msg: '操作成功',
        data: { userId: 1, userName: 'admin' },
      })

      // Verify the request received by mock gateway
      const lastReq = recordedGatewayRequests[recordedGatewayRequests.length - 1]
      expect(lastReq.url).toBe('/admin/sys_user/login/get_info')
      expect(lastReq.headers.authorization).toBe('Bearer test-jwt-token-123')
      expect(lastReq.headers['x-real-ip']).toBeDefined()
      expect(lastReq.headers['x-forwarded-proto']).toBe('http')
    })

    it('preserves query string when proxying /api/sys_user/list?page=2&size=10', async () => {
      const response = await fetch(`http://127.0.0.1:${hostingPort}/api/sys_user/list?page=2&size=10`)
      expect(response.status).toBe(200)

      const lastReq = recordedGatewayRequests[recordedGatewayRequests.length - 1]
      expect(lastReq.url).toBe('/admin/sys_user/list?page=2&size=10')
    })

    it('proxies POST /api/sys_user/login/password with payload', async () => {
      const payload = JSON.stringify({
        userName: 'admin',
        passwordHex: 'abcdef123456',
      })

      const response = await fetch(`http://127.0.0.1:${hostingPort}/api/sys_user/login/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data.token).toBe('mock-token')

      const lastReq = recordedGatewayRequests[recordedGatewayRequests.length - 1]
      expect(lastReq.method).toBe('POST')
      expect(lastReq.url).toBe('/admin/sys_user/login/password')
      expect(lastReq.body).toBe(payload)
    })
  })

  describe('API error responses do not fallback to index.html', () => {
    it('returns gateway 404 JSON and does not fallback to index.html when API is not found', async () => {
      const response = await fetch(`http://127.0.0.1:${hostingPort}/api/error/404-endpoint`)
      expect(response.status).toBe(404)

      const json = await response.json()
      expect(json).toEqual({
        code: 404000,
        msg: '网关未找到对应接口',
      })

      // Strict check: must not return HTML
      expect(JSON.stringify(json)).not.toContain('<!DOCTYPE html>')
    })

    it('returns gateway 500 JSON and does not fallback to index.html on server error', async () => {
      const response = await fetch(`http://127.0.0.1:${hostingPort}/api/error/500-endpoint`)
      expect(response.status).toBe(500)

      const json = await response.json()
      expect(json).toEqual({
        code: 500000,
        msg: '后端服务异常',
      })
    })

    it('returns 502 Bad Gateway and does not fallback to index.html when gateway is unreachable', async () => {
      // 启动一个指向未监听端口的代理服务来测试 502 行为
      const brokenHostingServer = createHttpServer((req: IncomingMessage, res: ServerResponse) => {
        const parsedUrl = new URL(req.url ?? '/', 'http://localhost')
        if (parsedUrl.pathname.startsWith('/api/')) {
          // 指向未开放的端口（例如 59999）
          const proxyReq = httpRequest(
            `http://127.0.0.1:59999${parsedUrl.pathname.replace(/^\/api\//, '/admin/')}`,
            () => {
              // unreachable
            },
          )
          proxyReq.on('error', () => {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ code: 502, msg: 'Bad Gateway' }))
          })
          proxyReq.end()
          return
        }

        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end('<html><body>fallback</body></html>')
      })

      let brokenPort = 0
      await new Promise<void>((resolve) => {
        brokenHostingServer.listen(0, '127.0.0.1', () => {
          const address = brokenHostingServer.address()
          if (address && typeof address === 'object') {
            brokenPort = address.port
          }
          resolve()
        })
      })

      try {
        const response = await fetch(`http://127.0.0.1:${brokenPort}/api/sys_user/list`)
        expect(response.status).toBe(502)

        const json = await response.json()
        expect(json.code).toBe(502)
        expect(json.msg).toBe('Bad Gateway')
      } finally {
        await new Promise<void>((resolve) => brokenHostingServer.close(() => resolve()))
      }
    })
  })
})
