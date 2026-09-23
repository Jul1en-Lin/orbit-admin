import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { apiClient } from '../src/api/client'
import { httpMock } from './harness'

describe('vite proxy configuration', () => {
  it('uses VITE_GATEWAY_TARGET with fallback to http://127.0.0.1:18080', async () => {
    // The vite config destructures VITE_GATEWAY_TARGET with a default:
    //   const { VITE_GATEWAY_TARGET = 'http://127.0.0.1:18080' } = loadEnv(...)
    // We verify the config file contains this exact pattern.
    const { readFileSync } = await import('node:fs')
    const viteConfig = readFileSync('vite.config.ts', 'utf-8')

    expect(viteConfig).toContain("VITE_GATEWAY_TARGET = 'http://127.0.0.1:18080'")
    expect(viteConfig).toContain('loadEnv(mode,')
    expect(viteConfig).toContain('target: VITE_GATEWAY_TARGET')
    expect(viteConfig).toContain('changeOrigin: true')
    expect(viteConfig).toContain('port: 18000')
  })

  it('rewrites /api/* to /admin/* in the proxy configuration', async () => {
    const { readFileSync } = await import('node:fs')
    const viteConfig = readFileSync('vite.config.ts', 'utf-8')

    // Verify the rewrite rule is present
    expect(viteConfig).toContain("rewrite: (path) => path.replace(/^\\/api/, '/admin')")

    // Verify path semantics by evaluating the same rewrite function
    const rewrite = (path: string) => path.replace(/^\/api/, '/admin')
    expect(rewrite('/api/sys_user/list')).toBe('/admin/sys_user/list')
    expect(rewrite('/api/login')).toBe('/admin/login')
    expect(rewrite('/api/sys_user/login/password')).toBe('/admin/sys_user/login/password')
    expect(rewrite('/api/dictionary_type/list')).toBe('/admin/dictionary_type/list')
    expect(rewrite('/api')).toBe('/admin')
    // Paths not starting with /api are left untouched
    expect(rewrite('/other/path')).toBe('/other/path')
  })
})

describe('API client configuration', () => {
  it('uses same-origin /api as baseURL', () => {
    expect(apiClient.defaults.baseURL).toBe('/api')
  })

  it('attaches Authorization: Bearer <token> when accessToken exists', async () => {
    sessionStorage.setItem('accessToken', 'test-token-abc')
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { userId: 1, userName: 'test' },
    })

    await apiClient.get('/sys_user/login/get_info')
    await flushPromises()

    const request = httpMock.history.get[0]
    expect(request.headers?.Authorization).toBe('Bearer test-token-abc')
  })

  it('does not attach Authorization header when no accessToken', async () => {
    sessionStorage.removeItem('accessToken')
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { userId: 1, userName: 'test' },
    })

    await apiClient.get('/sys_user/login/get_info')
    await flushPromises()

    const request = httpMock.history.get[0]
    expect(request.headers?.Authorization).toBeUndefined()
  })
})

describe('build-time configuration (no runtime config loader)', () => {
  it('main.ts does not fetch runtime configuration', async () => {
    const { readFileSync } = await import('node:fs')
    const mainTs = readFileSync('src/main.ts', 'utf-8')

    // No dynamic config loading at runtime
    expect(mainTs).not.toContain('config.json')
    expect(mainTs).not.toContain('/api/config')
    expect(mainTs).not.toContain('fetch(')
    expect(mainTs).not.toContain('axios.get')
  })

  it('client.ts does not fetch runtime configuration', async () => {
    const { readFileSync } = await import('node:fs')
    const clientTs = readFileSync('src/api/client.ts', 'utf-8')

    // No dynamic config loading at runtime
    expect(clientTs).not.toContain('config.json')
    expect(clientTs).not.toContain('/api/config')
    // baseURL is a static string, not dynamically loaded
    expect(clientTs).toContain("baseURL: '/api'")
  })

  it('.env.example documents VITE_GATEWAY_TARGET', async () => {
    const { readFileSync } = await import('node:fs')
    const envExample = readFileSync('.env.example', 'utf-8')

    expect(envExample).toContain('VITE_GATEWAY_TARGET')
    expect(envExample).toContain('http://127.0.0.1:18080')
  })
})
