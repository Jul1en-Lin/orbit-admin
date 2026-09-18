import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'

describe('deployment notes and instructions (docs/deployment.md)', () => {
  const docPath = 'docs/deployment.md'

  it('docs/deployment.md exists', () => {
    expect(existsSync(docPath)).toBe(true)
  })

  it('documents dependency installation and dev startup commands', () => {
    const content = readFileSync(docPath, 'utf-8')
    expect(content).toContain('corepack pnpm install --frozen-lockfile')
    expect(content).toContain('corepack pnpm dev')
    expect(content).toContain('24.15.0')
    expect(content).toContain('12.4.2')
  })

  it('documents gateway target environment variable and proxy rewrite', () => {
    const content = readFileSync(docPath, 'utf-8')
    expect(content).toContain('VITE_GATEWAY_TARGET')
    expect(content).toContain('.env.example')
    expect(content).toContain('.env.local')
    expect(content).toContain('/api')
    expect(content).toContain('/admin')
    expect(content).toContain('127.0.0.1:18080')
  })

  it('documents unified local quality check gate (corepack pnpm run check)', () => {
    const content = readFileSync(docPath, 'utf-8')
    expect(content).toContain('corepack pnpm run check')
    expect(content).toContain('format:check')
    expect(content).toContain('lint')
    expect(content).toContain('typecheck')
    expect(content).toContain('test')
    expect(content).toContain('build')
  })

  it('documents template replication and independent development without private CLI or auto-update binding', () => {
    const content = readFileSync(docPath, 'utf-8')
    expect(content).toMatch(/纯静态/i)
    expect(content).toMatch(/无私有\s*CLI/i)
    expect(content).toMatch(/无模板自动升级/i)
  })

  it('documents Nginx hosting, history fallback, assets 404 isolation, and api proxy', () => {
    const content = readFileSync(docPath, 'utf-8')
    expect(content).toContain('deploy/nginx/orbit-admin.conf')
    expect(content).toContain('deploy/nginx.conf')
    expect(content).toContain('try_files $uri $uri/ /index.html')
    expect(content).toContain('try_files $uri =404')
    expect(content).toContain('proxy_pass http://gateway_upstream/admin/')
    expect(content).toContain('proxy_intercept_errors off')
  })

  it('defines credential boundary: browser visible info and server secret prohibition', () => {
    const content = readFileSync(docPath, 'utf-8')
    expect(content).toMatch(/公开/i)
    expect(content).toMatch(/严禁.*提交.*服务端秘密/i)
  })

  it('distinguishes verified automated checks from unverified real gateway and online deployment blockers', () => {
    const content = readFileSync(docPath, 'utf-8')
    expect(content).toContain('已验证')
    expect(content).toContain('未验收')
    expect(content).toMatch(/18080.*未.*监听/i)
    expect(content).toMatch(/真实.*联调.*未验收/i)
    expect(content).toMatch(/未获授权不更改共享基础设施/i)
  })
})

describe('README.md deployment pointers and boundary documentation', () => {
  const readmePath = 'README.md'

  it('README.md references docs/deployment.md', () => {
    const content = readFileSync(readmePath, 'utf-8')
    expect(content).toContain('docs/deployment.md')
  })

  it('README.md includes quick start, check, template replication, and Nginx deployment overview', () => {
    const content = readFileSync(readmePath, 'utf-8')
    expect(content).toContain('corepack pnpm install --frozen-lockfile')
    expect(content).toContain('corepack pnpm dev')
    expect(content).toContain('corepack pnpm run check')
    expect(content).toContain('corepack pnpm build')
    expect(content).toContain('deploy/nginx/orbit-admin.conf')
    expect(content).toContain('deploy/nginx.conf')
  })

  it('README.md defines credentials security boundary and verification status', () => {
    const content = readFileSync(readmePath, 'utf-8')
    expect(content).toMatch(/公开/i)
    expect(content).toMatch(/严禁.*服务端/i)
    expect(content).toMatch(/未验收/i)
  })
})

describe('environment variables security verification', () => {
  it('.env.example contains only non-secret gateway URL', () => {
    const content = readFileSync('.env.example', 'utf-8')
    expect(content).toContain('VITE_GATEWAY_TARGET=http://127.0.0.1:18080')
    expect(content).not.toMatch(/secret|key|password|token/i)
  })
})
