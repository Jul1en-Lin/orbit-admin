import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { encryptLoginPassword } from '../src/auth/password'
import { httpMock, mountApplication } from './harness'

describe('login password compatibility', () => {
  it('matches the Java AES Hex vector', () => {
    expect(encryptLoginPassword('hello')).toBe('712da0890f36e7c845da44a6fe944543')
  })
})

describe('login and workbench', () => {
  it('keeps protected workbench routes behind login', async () => {
    const { router } = mountApplication('/workbench')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/workbench')
  })

  it('does not submit until both required fields have values', async () => {
    const { wrapper, router } = mountApplication()
    await router.isReady()

    await wrapper.get('button[type="submit"]').trigger('click')

    expect(httpMock.history.post).toHaveLength(0)
  })

  it('shows the loading state until account initialization finishes', async () => {
    httpMock.onPost('/sys_user/login/password').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { accessToken: 'token-1', expires: 43200000 },
    })
    let resolveInfo: ((value: [number, object]) => void) | undefined
    httpMock.onGet('/sys_user/login/get_info').reply(
      () =>
        new Promise((resolve) => {
          resolveInfo = resolve
        }),
    )

    const { wrapper, router } = mountApplication()
    await router.isReady()
    await wrapper.get('input[type="text"]').setValue('13800138000')
    await wrapper.get('input[type="password"]').setValue('secret')
    await wrapper.get('button[type="submit"]').trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.get('button.login-submit').text()).toContain('确认中')
    expect(router.currentRoute.value.path).toBe('/login')

    resolveInfo?.([
      200,
      {
        code: 200000,
        msg: '操作成功',
        data: { nickName: '小 orbit', userId: 1, phoneNumber: '13800138000', identity: 'admin', status: 'enable' },
      },
    ])
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/workbench')
    expect(wrapper.text()).toContain('小 orbit')
  })

  it('allows account initialization to recover without losing the token', async () => {
    sessionStorage.setItem('accessToken', 'token-1')
    let getInfoAttempts = 0
    httpMock.onGet('/sys_user/login/get_info').reply(() => {
      getInfoAttempts += 1
      if (getInfoAttempts === 1) return [503, { code: 500000, msg: '服务暂不可用', data: null }]
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { nickName: '小 orbit', userId: 1, phoneNumber: '13800138000', identity: 'admin', status: 'enable' },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/workbench')
    await router.isReady()
    await flushPromises()

    expect(wrapper.text()).toContain('重试确认账号')
    expect(sessionStorage.getItem('accessToken')).toBe('token-1')
    await wrapper.get('button.login-submit').trigger('click')
    await flushPromises()
    await nextTick()

    expect(getInfoAttempts).toBe(1)
    expect(router.currentRoute.value.path).toBe('/login')
    expect(sessionStorage.getItem('accessToken')).toBe('token-1')
    await wrapper.get('button.login-submit').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/workbench')
    expect(wrapper.text()).toContain('小 orbit')
  })

  it('validates, logs in, loads the account, and enters the workbench', async () => {
    httpMock.onPost('/sys_user/login/password').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({
        phone: '13800138000',
        password: encryptLoginPassword('secret'),
      })
      return [200, { code: 200000, msg: '操作成功', data: { accessToken: 'token-1', expires: 43200000 } }]
    })
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { nickName: '小 orbit', userId: 1, phoneNumber: '13800138000', identity: 'admin', status: 'enable' },
    })

    const { wrapper, router } = mountApplication()
    await router.isReady()

    expect(wrapper.text()).toContain('手机号')
    await wrapper.get('input[type="text"]').setValue('13800138000')
    await wrapper.get('input[type="password"]').setValue('secret')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/workbench')
    expect(wrapper.text()).toContain('小 orbit')
    expect(sessionStorage.getItem('accessToken')).toBe('token-1')
  })

  it('keeps the form and reports one error when login fails', async () => {
    httpMock.onPost('/sys_user/login/password').reply(400, {
      code: 400000,
      msg: '登录失败',
      data: null,
    })

    const { wrapper, router } = mountApplication()
    await router.isReady()
    await wrapper.get('input[type="text"]').setValue('13800138000')
    await wrapper.get('input[type="password"]').setValue('wrong')
    await wrapper.get('button[type="submit"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/login')
    expect((wrapper.get('input[type="text"]').element as HTMLInputElement).value).toBe('13800138000')
    expect((wrapper.get('input[type="password"]').element as HTMLInputElement).value).toBe('wrong')
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(1)
  })

  it('does not send a second request while submitting', async () => {
    let resolveRequest: ((value: unknown) => void) | undefined
    httpMock.onPost('/sys_user/login/password').reply(
      () =>
        new Promise((resolve) => {
          resolveRequest = () => resolve([400, { code: 400000, msg: '登录失败', data: null }])
        }),
    )

    const { wrapper, router } = mountApplication()
    await router.isReady()
    await wrapper.get('input[type="text"]').setValue('13800138000')
    await wrapper.get('input[type="password"]').setValue('wrong')
    await wrapper.get('button[type="submit"]').trigger('click')
    await wrapper.get('button[type="submit"]').trigger('click')
    await nextTick()

    expect(httpMock.history.post).toHaveLength(1)
    expect(wrapper.get('button[type="submit"]').text()).toContain('登录中')
    resolveRequest?.(undefined)
    await flushPromises()
  })

  it('clears the local session on logout', async () => {
    httpMock.onPost('/sys_user/login/password').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { accessToken: 'token-1', expires: 43200000 },
    })
    httpMock.onGet('/sys_user/login/get_info').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer token-1')
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { nickName: '小 orbit', userId: 1, phoneNumber: '13800138000', identity: 'admin', status: 'enable' },
        },
      ]
    })

    const { wrapper, router } = mountApplication()
    await router.isReady()
    await wrapper.get('input[type="text"]').setValue('13800138000')
    await wrapper.get('input[type="password"]').setValue('secret')
    await wrapper.get('button[type="submit"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-test="logout"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/login')
    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(wrapper.text()).toContain('手机号')
  })
})
