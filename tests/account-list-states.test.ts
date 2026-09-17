import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { httpMock, mountApplication } from './harness'

const mockAccounts = [
  {
    userId: 1001,
    nickName: '林舟',
    phoneNumber: '13800001001',
    identity: 'super_admin',
    status: 'enable',
    remark: '系统日常维护工作',
  },
  {
    userId: 1002,
    nickName: '陈以宁',
    phoneNumber: '13800001002',
    identity: 'platform_admin',
    status: 'enable',
    remark: '字典与参数维护',
  },
]

describe('management account list states and latest response (account-list-states)', () => {
  it('distinguishes loading, empty (暂无数据), and failure with retry on current page', async () => {
    sessionStorage.setItem('accessToken', 'token-1')
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: {
        nickName: '当前管理员',
        userId: 9999,
        phoneNumber: '13800009999',
        identity: 'super_admin',
        status: 'enable',
      },
    })

    // 1. Loading state: delayed promise
    let resolveListPromise: ((value: [number, object]) => void) | undefined
    httpMock.onPost('/sys_user/list').reply(
      () =>
        new Promise((resolve) => {
          resolveListPromise = resolve
        }),
    )

    const { wrapper, router } = mountApplication('/accounts')
    await router.isReady()
    // Wait for get_info to resolve so route guard finishes
    await flushPromises()

    // While list request is pending, loading indicator is visible
    expect(wrapper.find('[data-test="state-loading"]').exists()).toBe(true)
    expect(wrapper.find('.table-wrap').text()).toContain('加载')

    // Resolve with empty list
    resolveListPromise?.([200, { code: 200000, msg: '操作成功', data: [] }])
    await flushPromises()

    // Loading indicator is gone, empty state "暂无数据" is displayed
    expect(wrapper.find('[data-test="state-loading"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="state-empty"]').exists()).toBe(true)
    expect(wrapper.find('.table-wrap').text()).toContain('暂无数据')
    expect(wrapper.findAll('[data-test="account-row"]')).toHaveLength(0)

    // 2. Query failure: remains on page and offers retry
    httpMock.onPost('/sys_user/list').reply(500, {
      code: 500000,
      msg: '服务器内部错误',
    })

    const queryBtn = wrapper.find('[data-test="query-submit"]')
    await queryBtn.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/accounts')
    expect(wrapper.find('[data-test="state-error"]').exists()).toBe(true)
    expect(wrapper.find('.table-wrap').text()).toContain('失败')
    const retryBtn = wrapper.find('[data-test="state-retry"]')
    expect(retryBtn.exists()).toBe(true)
    expect(retryBtn.text()).toContain('重试')

    // 3. Retry recovers and displays accounts
    httpMock.onPost('/sys_user/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: mockAccounts,
    })

    await retryBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="state-error"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-test="account-row"]')).toHaveLength(2)
    expect(wrapper.find('.table-wrap').text()).toContain('林舟')
    expect(wrapper.find('.table-wrap').text()).toContain('陈以宁')
  })

  it('does not display stale results as new results when re-query fails', async () => {
    sessionStorage.setItem('accessToken', 'token-1')
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: {
        nickName: '当前管理员',
        userId: 9999,
        phoneNumber: '13800009999',
        identity: 'super_admin',
        status: 'enable',
      },
    })

    // Initial query succeeds with 2 accounts
    httpMock.onPost('/sys_user/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: mockAccounts,
    })

    const { wrapper, router } = mountApplication('/accounts')
    await router.isReady()
    await flushPromises()

    expect(wrapper.findAll('[data-test="account-row"]')).toHaveLength(2)
    expect(wrapper.find('.table-wrap').text()).toContain('林舟')

    // Subsequent filtered query fails
    httpMock.onPost('/sys_user/list').reply(500, {
      code: 500000,
      msg: '查询失败',
    })

    const phoneInput = wrapper.find('[data-test="filter-phone"]')
    await phoneInput.setValue('13800009999')
    await wrapper.find('[data-test="query-submit"]').trigger('click')
    await flushPromises()

    // Stale accounts MUST NOT be displayed in table
    expect(wrapper.findAll('[data-test="account-row"]')).toHaveLength(0)
    expect(wrapper.find('.table-wrap').text()).not.toContain('林舟')
    expect(wrapper.find('.table-wrap').text()).not.toContain('陈以宁')

    // Error state and retry button are shown
    expect(wrapper.find('[data-test="state-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="state-retry"]').exists()).toBe(true)
  })

  it('accepts only the latest response when consecutive queries return out of order', async () => {
    sessionStorage.setItem('accessToken', 'token-1')
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: {
        nickName: '当前管理员',
        userId: 9999,
        phoneNumber: '13800009999',
        identity: 'super_admin',
        status: 'enable',
      },
    })

    // Initial load returns empty
    httpMock.onPost('/sys_user/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: [],
    })

    const { wrapper, router } = mountApplication('/accounts')
    await router.isReady()
    await flushPromises()

    // Prepare two deferred responses for consecutive queries
    let resolveQuery1: ((value: [number, object]) => void) | undefined
    let resolveQuery2: ((value: [number, object]) => void) | undefined

    let callCount = 0
    httpMock.onPost('/sys_user/list').reply(() => {
      callCount++
      if (callCount === 1) {
        return new Promise((resolve) => {
          resolveQuery1 = resolve
        })
      }
      return new Promise((resolve) => {
        resolveQuery2 = resolve
      })
    })

    const phoneInput = wrapper.find('[data-test="filter-phone"]')
    const queryBtn = wrapper.find('[data-test="query-submit"]')

    // Query 1: phone '13800001001'
    await phoneInput.setValue('13800001001')
    await queryBtn.trigger('click')

    // Query 2: phone '13800001002'
    await phoneInput.setValue('13800001002')
    await queryBtn.trigger('click')

    expect(callCount).toBe(2)

    // Query 2 finishes first with [mockAccounts[1]]
    resolveQuery2?.([
      200,
      {
        code: 200000,
        msg: '操作成功',
        data: [mockAccounts[1]],
      },
    ])
    await flushPromises()

    // Should display Query 2 result ('陈以宁')
    expect(wrapper.findAll('[data-test="account-row"]')).toHaveLength(1)
    expect(wrapper.find('.table-wrap').text()).toContain('陈以宁')
    expect(wrapper.find('.table-wrap').text()).not.toContain('林舟')

    // Query 1 finishes later with [mockAccounts[0]] ('林舟')
    resolveQuery1?.([
      200,
      {
        code: 200000,
        msg: '操作成功',
        data: [mockAccounts[0]],
      },
    ])
    await flushPromises()

    // Query 1 is stale and MUST be discarded! Only Query 2 result should remain!
    expect(wrapper.findAll('[data-test="account-row"]')).toHaveLength(1)
    expect(wrapper.find('.table-wrap').text()).toContain('陈以宁')
    expect(wrapper.find('.table-wrap').text()).not.toContain('林舟')
  })

  it('keeps operational boundaries and accessible controls in place', async () => {
    sessionStorage.setItem('accessToken', 'token-1')
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: {
        nickName: '当前管理员',
        userId: 9999,
        phoneNumber: '13800009999',
        identity: 'super_admin',
        status: 'enable',
      },
    })

    httpMock.onPost('/sys_user/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: mockAccounts,
    })

    const { wrapper, router } = mountApplication('/accounts')
    await router.isReady()
    await flushPromises()

    // Boundary note in rail describes operational limits
    const rail = wrapper.find('.accounts-rail')
    expect(rail.exists()).toBe(true)
    expect(rail.text()).toContain('当前边界')
    expect(rail.text()).toContain('当前页面支持按 ID、手机号和状态精确查询。')
    expect(rail.text()).toContain('首版不提供编辑、删除、重置密码或停用入口。')

    // Table container supports horizontal scroll
    const tableWrap = wrapper.find('.table-wrap')
    expect(tableWrap.exists()).toBe(true)

    // Form inputs and submit/reset buttons are keyboard-focusable
    const idInput = wrapper.find('[data-test="filter-user-id"]')
    const phoneInput = wrapper.find('[data-test="filter-phone"]')
    const statusSelect = wrapper.find('[data-test="filter-status"]')
    const submitBtn = wrapper.find('[data-test="query-submit"]')
    const resetBtn = wrapper.find('[data-test="query-reset"]')

    expect(idInput.element.tagName).toBe('INPUT')
    expect(phoneInput.element.tagName).toBe('INPUT')
    expect(statusSelect.element.tagName).toBe('SELECT')
    expect(submitBtn.element.tagName).toBe('BUTTON')
    expect(resetBtn.element.tagName).toBe('BUTTON')
  })
})
