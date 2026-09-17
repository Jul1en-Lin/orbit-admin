import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { apiClient } from '../src/api/client'
import { useAuthStore } from '../src/auth/store'
import { httpMock, mountApplication } from './harness'

describe('expiry handling and old session isolation', () => {
  it('handles multiple concurrent 401 responses by clearing session, notifying once, and redirecting once', async () => {
    sessionStorage.setItem('accessToken', 'token-1')

    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: {
        nickName: '小 orbit',
        userId: 1,
        phoneNumber: '13800138000',
        identity: 'admin',
        status: 'enable',
      },
    })

    const { wrapper, router } = mountApplication('/workbench')
    await router.isReady()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/workbench')
    expect(wrapper.text()).toContain('工作台已就绪')

    // Simulate two concurrent requests that both return 401
    httpMock.onGet('/sys_user/login/get_info').reply(401, {
      code: 401000,
      msg: 'token is invalid',
      data: null,
    })
    httpMock.onPost('/sys_user/list').reply(401, {
      code: 401000,
      msg: 'token is invalid',
      data: null,
    })

    const p1 = apiClient.get('/sys_user/login/get_info')
    const p2 = apiClient.post('/sys_user/list')

    await Promise.allSettled([p1, p2])
    await flushPromises()

    // 1. Session is cleared
    expect(sessionStorage.getItem('accessToken')).toBeNull()

    // 2. Redirected to login with redirect query
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/workbench')

    // 3. User is notified exactly once
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(1)
    expect(wrapper.get('[role="alert"]').text()).toContain('登录状态已失效，请重新输入')
  })

  it('does not restore old session when delayed response arrives after logout', async () => {
    sessionStorage.setItem('accessToken', 'token-old')

    let resolveInfo: ((value: [number, object]) => void) | undefined
    httpMock.onGet('/sys_user/login/get_info').reply(
      () =>
        new Promise((resolve) => {
          resolveInfo = resolve
        }),
    )

    // Mount workbench which triggers session restore
    const { wrapper, router } = mountApplication('/workbench')
    await new Promise((resolve) => setTimeout(resolve, 0))

    // While restore is in flight, user returns to login / signs out
    const auth = useAuthStore()
    auth.signOut()
    await router.push('/login')
    await flushPromises()

    // Delayed response from old session finally arrives with 200
    resolveInfo?.([
      200,
      {
        code: 200000,
        msg: '操作成功',
        data: {
          nickName: '老账号',
          userId: 99,
          phoneNumber: '13800138999',
          identity: 'admin',
          status: 'enable',
        },
      },
    ])
    await flushPromises()

    // Must NOT restore old session
    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(router.currentRoute.value.path).toBe('/login')
    expect(wrapper.text()).not.toContain('老账号')
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('does not clear or overwrite new session when old session request completes with 401 or 200', async () => {
    // 1. User 1 logs in with token-1
    httpMock.onPost('/sys_user/login/password').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { accessToken: 'token-1', expires: 43200000 },
    })
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: {
        nickName: '账号一',
        userId: 1,
        phoneNumber: '13800138001',
        identity: 'admin',
        status: 'enable',
      },
    })

    const { wrapper, router } = mountApplication()
    await router.isReady()
    await wrapper.get('input[type="text"]').setValue('13800138001')
    await wrapper.get('input[type="password"]').setValue('secret1')
    await wrapper.get('button[type="submit"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/workbench')
    expect(wrapper.text()).toContain('账号一')
    expect(sessionStorage.getItem('accessToken')).toBe('token-1')

    // 2. Dispatch a background request during Session 1 that will be delayed
    let resolveOld401: ((value: [number, object]) => void) | undefined
    httpMock.onGet('/sys_user/old_pending').reply(
      () =>
        new Promise((resolve) => {
          resolveOld401 = resolve
        }),
    )
    const oldRequest401 = apiClient.get('/sys_user/old_pending')

    // 3. User 1 logs out
    await wrapper.get('[data-test="logout"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/login')
    expect(sessionStorage.getItem('accessToken')).toBeNull()

    // 4. User 2 logs in with token-2
    httpMock.onPost('/sys_user/login/password').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { accessToken: 'token-2', expires: 43200000 },
    })
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: {
        nickName: '账号二',
        userId: 2,
        phoneNumber: '13800138002',
        identity: 'admin',
        status: 'enable',
      },
    })

    await wrapper.get('input[type="text"]').setValue('13800138002')
    await wrapper.get('input[type="password"]').setValue('secret2')
    await wrapper.get('button[type="submit"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/workbench')
    expect(wrapper.text()).toContain('账号二')
    expect(sessionStorage.getItem('accessToken')).toBe('token-2')

    // 5. Old request from Session 1 returns 401
    resolveOld401?.([401, { code: 401000, msg: 'token expired', data: null }])
    await expect(oldRequest401).rejects.toThrow()
    await flushPromises()

    // Session 2 must NOT be cleared or redirected to login!
    expect(sessionStorage.getItem('accessToken')).toBe('token-2')
    expect(router.currentRoute.value.path).toBe('/workbench')
    expect(wrapper.text()).toContain('账号二')
  })

  it('does not overwrite new session state when old session request succeeds late', async () => {
    // 1. Session 1 in-flight get_info
    sessionStorage.setItem('accessToken', 'token-1')
    let resolveOldInfo: ((value: [number, object]) => void) | undefined
    httpMock.onGet('/sys_user/login/get_info').reply(
      () =>
        new Promise((resolve) => {
          resolveOldInfo = resolve
        }),
    )

    const { wrapper, router } = mountApplication('/workbench')
    await new Promise((resolve) => setTimeout(resolve, 0))

    // 2. User logs out before get_info resolves
    const auth = useAuthStore()
    auth.signOut()
    await router.push('/login')
    await flushPromises()

    // 3. User 2 logs in with token-2
    httpMock.onPost('/sys_user/login/password').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { accessToken: 'token-2', expires: 43200000 },
    })
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: {
        nickName: '新账号',
        userId: 2,
        phoneNumber: '13800138002',
        identity: 'admin',
        status: 'enable',
      },
    })

    await wrapper.get('input[type="text"]').setValue('13800138002')
    await wrapper.get('input[type="password"]').setValue('secret2')
    await wrapper.get('button[type="submit"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/workbench')
    expect(wrapper.text()).toContain('新账号')

    // 4. Delayed get_info from Session 1 resolves
    resolveOldInfo?.([
      200,
      {
        code: 200000,
        msg: '操作成功',
        data: {
          nickName: '旧账号',
          userId: 1,
          phoneNumber: '13800138001',
          identity: 'admin',
          status: 'enable',
        },
      },
    ])
    await flushPromises()

    // Current user in workbench must STILL be '新账号', not overwritten by '旧账号'
    expect(wrapper.text()).toContain('新账号')
    expect(wrapper.text()).not.toContain('旧账号')
    expect(sessionStorage.getItem('accessToken')).toBe('token-2')
  })

  it('keeps login endpoint 401 errors on login form without triggering session expiration', async () => {
    httpMock.onPost('/sys_user/login/password').reply(401, {
      code: 401000,
      msg: '密码错误',
      data: null,
    })

    const { wrapper, router } = mountApplication('/login')
    await router.isReady()

    await wrapper.get('input[type="text"]').setValue('13800138000')
    await wrapper.get('input[type="password"]').setValue('wrong-password')
    await wrapper.get('button[type="submit"]').trigger('click')
    await flushPromises()

    // 1. Stays on login form
    expect(router.currentRoute.value.path).toBe('/login')

    // 2. Retains phone and password input
    expect((wrapper.get('input[type="text"]').element as HTMLInputElement).value).toBe('13800138000')
    expect((wrapper.get('input[type="password"]').element as HTMLInputElement).value).toBe('wrong-password')

    // 3. Reports credential error once, NOT "登录状态已失效"
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(1)
    expect(wrapper.get('[role="alert"]').text()).toBe('手机号或密码错误，请检查后重试')
    expect(wrapper.text()).not.toContain('登录状态已失效')

    // 4. Token remains null
    expect(sessionStorage.getItem('accessToken')).toBeNull()
  })

  it('classifies other request failures by HTTP status and business code', async () => {
    // 1. Business error (HTTP 200 with non-200000 code)
    httpMock.onGet('/test/business-fail').reply(200, {
      code: 400001,
      msg: '业务参数错误',
      data: null,
    })
    await expect(apiClient.get('/test/business-fail')).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'business',
      code: 400001,
    })

    // 2. HTTP status error (e.g. 500)
    httpMock.onGet('/test/server-fail').reply(500, {
      code: 500000,
      msg: '系统内部错误',
      data: null,
    })
    await expect(apiClient.get('/test/server-fail')).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'http',
      status: 500,
      code: 500000,
    })

    // 3. Network error
    httpMock.onGet('/test/network-fail').networkError()
    await expect(apiClient.get('/test/network-fail')).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'network',
    })
  })
})
