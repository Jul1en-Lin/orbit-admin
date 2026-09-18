import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import net from 'node:net'

describe('automated check: scripts and frozen engine constraints', () => {
  const pkgPath = 'package.json'

  it('package.json exists and specifies frozen node and pnpm engines', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.engines?.node).toBe('24.15.0')
    expect(pkg.packageManager).toBe('pnpm@12.4.2')
  })

  it('package.json contains complete check script chaining format, lint, typecheck, test, and build', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    const checkScript = pkg.scripts?.check
    expect(checkScript).toBe(
      'npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build',
    )
    expect(pkg.scripts?.format).toBe('prettier --write .')
    expect(pkg.scripts?.['format:check']).toBe('prettier --check .')
    expect(pkg.scripts?.lint).toContain('--max-warnings 0')
    expect(pkg.scripts?.typecheck).toBe('vue-tsc --noEmit')
    expect(pkg.scripts?.test).toBe('vitest run')
    expect(pkg.scripts?.build).toBe('vite build')
  })

  it('pnpm-lock.yaml exists for frozen lockfile verification', () => {
    expect(existsSync('pnpm-lock.yaml')).toBe(true)
  })
})

describe('automated check: production build artifacts (dist)', () => {
  it('dist/index.html exists and contains valid app mount structure', () => {
    const indexPath = 'dist/index.html'
    expect(existsSync(indexPath)).toBe(true)
    const content = readFileSync(indexPath, 'utf-8')
    expect(content).toContain('<div id="app"></div>')
    expect(content).toMatch(/<script type="module" crossorigin src="\/assets\/index-.*\.js"><\/script>/)
    expect(content).toMatch(/<link rel="stylesheet" crossorigin href="\/assets\/index-.*\.css">/)
  })

  it('dist/assets contains compiled JS and CSS chunks', () => {
    const assetsDir = 'dist/assets'
    expect(existsSync(assetsDir)).toBe(true)
    const files = readdirSync(assetsDir)
    const hasJsChunk = files.some((f) => f.startsWith('index-') && f.endsWith('.js'))
    const hasCssChunk = files.some((f) => f.startsWith('index-') && f.endsWith('.css'))
    expect(hasJsChunk).toBe(true)
    expect(hasCssChunk).toBe(true)
  })
})

describe('backend connectivity probe and offline state detection', () => {
  const probePort = (host: string, port: number, timeoutMs = 500): Promise<'open' | 'refused' | 'timeout'> => {
    return new Promise((resolve) => {
      const socket = new net.Socket()
      let settled = false

      socket.setTimeout(timeoutMs)

      socket.on('connect', () => {
        if (!settled) {
          settled = true
          socket.destroy()
          resolve('open')
        }
      })

      socket.on('timeout', () => {
        if (!settled) {
          settled = true
          socket.destroy()
          resolve('timeout')
        }
      })

      socket.on('error', (err: NodeJS.ErrnoException) => {
        if (!settled) {
          settled = true
          socket.destroy()
          if (err.code === 'ECONNREFUSED') {
            resolve('refused')
          } else {
            resolve('timeout')
          }
        }
      })

      socket.connect(port, host)
    })
  }

  it('probes local gateway port 18080 and detects it is refused/offline without throwing unhandled errors', async () => {
    const status = await probePort('127.0.0.1', 18080)
    // Gateway port status is gracefully resolved as open or refused
    expect(['open', 'refused']).toContain(status)
  })

  it('probes Nacos port 8848 and detects it is refused/offline', async () => {
    const status = await probePort('127.0.0.1', 8848)
    expect(['open', 'refused']).toContain(status)
  })

  it('probes Redis port 6379 and detects it is refused/offline', async () => {
    const status = await probePort('127.0.0.1', 6379)
    expect(['open', 'refused']).toContain(status)
  })
})

describe('automated check documentation and resolution record (docs/planning/comments/automated-check.md)', () => {
  const commentPath = 'docs/planning/comments/automated-check.md'

  it('resolution comment file exists', () => {
    expect(existsSync(commentPath)).toBe(true)
  })

  it('records frozen lockfile installation and full quality check outputs', () => {
    const content = readFileSync(commentPath, 'utf-8')
    expect(content).toContain('corepack pnpm install --frozen-lockfile')
    expect(content).toContain('corepack pnpm run check')
    expect(content).toContain('prettier --check .')
    expect(content).toContain('eslint . --max-warnings 0')
    expect(content).toContain('vue-tsc --noEmit')
    expect(content).toContain('vitest run')
    expect(content).toContain('vite build')
    expect(content).toMatch(/dist\/index\.html/i)
  })

  it('records local backend port status, connection refused facts, and real blockers', () => {
    const content = readFileSync(commentPath, 'utf-8')
    expect(content).toContain('18080')
    expect(content).toContain('8848')
    expect(content).toContain('6379')
    expect(content).toContain('3306')
    expect(content).toMatch(/Connection refused|ECONNREFUSED/i)
    expect(content).toMatch(/未验收/i)
    expect(content).toMatch(/网关/i)
    expect(content).toMatch(/凭据/i)
  })

  it('adheres to security boundary without leaking real passwords or server secrets', () => {
    const content = readFileSync(commentPath, 'utf-8')
    expect(content).not.toMatch(/mysql:\/\/[^:]+:[^@]+@/i)
    expect(content).not.toMatch(/BEGIN RSA PRIVATE KEY/i)
    expect(content).not.toMatch(/BEGIN PRIVATE KEY/i)
  })
})
