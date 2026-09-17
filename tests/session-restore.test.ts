import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { httpMock, mountApplication } from './harness'

describe('session restore on page refresh', () => {
  it('displays loading state and holds back business page until account is restored', async () => {
    sessionStorage.setItem('accessToken', 'token-1')

    let resolveInfo: ((value: [number, object]) => void) | undefined
    httpMock.onGet('/sys_user/login/get_info').reply(
      () =>
        new Promise((resolve) => {
          resolveInfo = resolve
        }),
    )

    const { wrapper, router } = mountApplication('/workbench')
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Loading state is shown while get_info is pending
    expect(wrapper.get('[role="status"]').text()).toContain('正在确认管理端账号…')
    expect(wrapper.text()).not.toContain('工作台已就绪')

    // Resolve get_info
    resolveInfo?.([
      200,
      {
        code: 200000,
        msg: '操作成功',
        data: {
          nickName: '小 orbit',
          userId: 1,
          phoneNumber: '13800138000',
          identity: 'admin',
          status: 'enable',
        },
      },
    ])
    await router.isReady()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/workbench')
    expect(wrapper.text()).toContain('小 orbit')
    expect(wrapper.text()).toContain('工作台已就绪')
  })

  it('retains token and offers retry when recovery encounters server error', async () => {
    sessionStorage.setItem('accessToken', 'token-1')

    let attempts = 0
    httpMock.onGet('/sys_user/login/get_info').reply(() => {
      attempts += 1
      if (attempts === 1) {
        return [503, { code: 500000, msg: '服务暂不可用', data: null }]
      }
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: {
            nickName: '恢复管理员',
            userId: 2,
            phoneNumber: '13900139000',
            identity: 'admin',
            status: 'enable',
          },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/workbench')
    await router.isReady()
    await flushPromises()

    // 1. Redirected to login with redirect query
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/workbench')

    // 2. Token is retained, NOT cleared
    expect(sessionStorage.getItem('accessToken')).toBe('token-1')

    // 3. Retry and return-to-login options are displayed
    expect(wrapper.text()).toContain('重试确认账号')
    expect(wrapper.text()).toContain('返回登录')
    expect(wrapper.text()).toContain('暂时无法确认当前管理端账号，请重试或返回登录')

    // 4. Clicking retry successfully recovers and enters workbench
    await wrapper.get('button.login-submit').trigger('click')
    await flushPromises()

    expect(attempts).toBe(2)
    expect(router.currentRoute.value.path).toBe('/workbench')
    expect(wrapper.text()).toContain('恢复管理员')
  })

  it('allows returning to clean login form when recovery encounters server error', async () => {
    sessionStorage.setItem('accessToken', 'token-1')

    httpMock.onGet('/sys_user/login/get_info').reply(500, {
      code: 500000,
      msg: '服务器异常',
      data: null,
    })

    const { wrapper, router } = mountApplication('/workbench')
    await router.isReady()
    await flushPromises()

    expect(sessionStorage.getItem('accessToken')).toBe('token-1')
    expect(wrapper.text()).toContain('重试确认账号')

    // Clicking return to login clears the token and resets to login form
    await wrapper.get('button.return-login').trigger('click')
    await flushPromises()

    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(wrapper.text()).not.toContain('重试确认账号')
    expect(wrapper.text()).toContain('登录')
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('clears token and displays login form when session is truly expired (401)', async () => {
    sessionStorage.setItem('accessToken', 'token-1')

    httpMock.onGet('/sys_user/login/get_info').reply(401, {
      code: 401000,
      msg: 'token is invalid',
      data: null,
    })

    const { wrapper, router } = mountApplication('/workbench')
    await router.isReady()
    await flushPromises()

    // 1. Redirected to login with redirect query
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/workbench')

    // 2. Token in sessionStorage is cleared
    expect(sessionStorage.getItem('accessToken')).toBeNull()

    // 3. Retry buttons are NOT displayed
    expect(wrapper.text()).not.toContain('重试确认账号')

    // 4. Standard login form is displayed
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)

    // 5. Expiry error feedback is displayed
    expect(wrapper.text()).toContain('登录状态已失效，请重新输入')
  })

  it('retains token and provides retry on network failure', async () => {
    sessionStorage.setItem('accessToken', 'token-1')

    httpMock.onGet('/sys_user/login/get_info').networkError()

    const { wrapper, router } = mountApplication('/workbench')
    await router.isReady()
    await flushPromises()

    expect(sessionStorage.getItem('accessToken')).toBe('token-1')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(wrapper.text()).toContain('重试确认账号')
    expect(wrapper.text()).toContain('网络暂时不可用，请稍后重试')
  })
})
