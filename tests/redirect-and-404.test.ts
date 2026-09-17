import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { httpMock, mountApplication } from './harness'

function stubSuccessfulLogin() {
  httpMock.onPost('/sys_user/login/password').reply(200, {
    code: 200000,
    msg: '操作成功',
    data: { accessToken: 'token-1', expires: 43200000 },
  })
  httpMock.onGet('/sys_user/login/get_info').reply(200, {
    code: 200000,
    msg: '操作成功',
    data: { nickName: '小 orbit', userId: 1, phoneNumber: '13800138000', identity: 'admin', status: 'enable' },
  })
}

async function loginAndNavigate(initialPath: string) {
  stubSuccessfulLogin()
  const { wrapper, router } = mountApplication(initialPath)
  await router.isReady()
  await wrapper.get('input[type="text"]').setValue('13800138000')
  await wrapper.get('input[type="password"]').setValue('secret')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  return { wrapper, router }
}

describe('redirect after login', () => {
  it('redirects to a valid site-internal target after login', async () => {
    const { router } = await loginAndNavigate('/login?redirect=%2Fworkbench')
    expect(router.currentRoute.value.path).toBe('/workbench')
  })

  it('enters the default page when there is no redirect target', async () => {
    const { router } = await loginAndNavigate('/login')
    expect(router.currentRoute.value.path).toBe('/workbench')
  })

  it('rejects a protocol-relative target and enters the default page', async () => {
    const { router } = await loginAndNavigate('/login?redirect=%2F%2Fevil.com')
    expect(router.currentRoute.value.path).toBe('/workbench')
  })

  it('rejects an absolute external URL and enters the default page', async () => {
    const { router } = await loginAndNavigate('/login?redirect=https%3A%2F%2Fevil.com')
    expect(router.currentRoute.value.path).toBe('/workbench')
  })

  it('rejects a backslash bypass and enters the default page', async () => {
    const { router } = await loginAndNavigate('/login?redirect=%2F%5Cevil.com')
    expect(router.currentRoute.value.path).toBe('/workbench')
  })

  it('rejects redirecting back to /login itself', async () => {
    const { router } = await loginAndNavigate('/login?redirect=%2Flogin')
    expect(router.currentRoute.value.path).toBe('/workbench')
  })

  it('does not expose rejected target content in error feedback', async () => {
    const { wrapper } = await loginAndNavigate('/login?redirect=https%3A%2F%2Fevil.com%2Fsecret')
    expect(wrapper.text()).not.toContain('evil.com')
    expect(wrapper.text()).not.toContain('secret')
  })
})

describe('404 not found page', () => {
  it('shows a 404 page for unknown routes', async () => {
    const { wrapper, router } = mountApplication('/nonexistent-page')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('not-found')
    expect(wrapper.text()).toContain('页面不存在')
  })

  it('provides a link back to the default page from 404', async () => {
    const { wrapper, router } = mountApplication('/nonexistent-page')
    await router.isReady()
    await flushPromises()

    expect(wrapper.text()).toContain('返回管理端首页')

    // Clicking the button navigates to workbench (which will redirect to login if unauthenticated)
    await wrapper.get('.not-found-action').trigger('click')
    await flushPromises()

    // Unauthenticated, so redirected to login with redirect=/workbench
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('does not introduce a 403 flow', async () => {
    const { wrapper, router } = mountApplication('/nonexistent-page')
    await router.isReady()

    expect(wrapper.text()).not.toContain('403')
    expect(wrapper.text()).not.toContain('无权限')
    expect(router.currentRoute.value.name).toBe('not-found')
  })
})
