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
    remark: '系统日常维护工作，负责全局参数与系统稳定性保障',
  },
  {
    userId: 1002,
    nickName: '陈以宁',
    phoneNumber: '13800001002',
    identity: 'platform_admin',
    status: 'enable',
    remark: '字典与参数维护',
  },
  {
    userId: 1003,
    nickName: '周青',
    phoneNumber: '13800001003',
    identity: 'platform_admin',
    status: 'disable',
    remark: '历史测试账号，已停用保留备查',
  },
]

describe('management account list and query (account-list-query)', () => {
  it('loads management account list on default business page without pagination or modification entries', async () => {
    sessionStorage.setItem('accessToken', 'token-1')
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { nickName: '林舟', userId: 1001, phoneNumber: '13800001001', identity: 'super_admin', status: 'enable' },
    })

    httpMock.onPost('/sys_user/list').reply((config) => {
      const body = config.data ? JSON.parse(config.data) : {}
      expect(body).toEqual({})
      return [200, { code: 200000, msg: '操作成功', data: mockAccounts }]
    })

    const { wrapper, router } = mountApplication('/accounts')
    await router.isReady()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/accounts')

    // Topbar navigation item for 管理端账号 is active; 参数 remains disabled, 字典 is enabled
    const activeNav = wrapper.find('.primary-nav .nav-item.is-active')
    expect(activeNav.text()).toBe('管理端账号')
    const disabledNavs = wrapper.findAll('.primary-nav .nav-item.is-disabled')
    expect(disabledNavs.map((n) => n.text())).toEqual(['参数'])

    // Displays page heading
    expect(wrapper.text()).toContain('管理端账号')
    expect(wrapper.text()).toContain('查看账号信息，维护系统的协作入口。')

    // Table rows display all fields
    expect(wrapper.text()).toContain('1001')
    expect(wrapper.text()).toContain('13800001001')
    expect(wrapper.text()).toContain('林舟')
    expect(wrapper.text()).toContain('super_admin')
    expect(wrapper.text()).toContain('enable')
    expect(wrapper.text()).toContain('系统日常维护工作，负责全局参数与系统稳定性保障')

    expect(wrapper.text()).toContain('1002')
    expect(wrapper.text()).toContain('13800001002')
    expect(wrapper.text()).toContain('陈以宁')

    expect(wrapper.text()).toContain('1003')
    expect(wrapper.text()).toContain('13800001003')
    expect(wrapper.text()).toContain('周青')
    expect(wrapper.text()).toContain('disable')

    // Long text in remark is fully readable
    expect(wrapper.text()).toContain('系统日常维护工作，负责全局参数与系统稳定性保障')

    // No pagination controls
    expect(wrapper.find('.el-pagination').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('条/页')

    // No edit, delete, reset password, or disable action buttons in table
    const tableText = wrapper.find('table').text()
    expect(tableText).not.toContain('编辑')
    expect(tableText).not.toContain('删除')
    expect(tableText).not.toContain('重置密码')
    expect(tableText).not.toContain('停用账号')
    expect(wrapper.findAll('table button')).toHaveLength(0)
  })

  it('filters by userId, phoneNumber, and status with exact match only when clicking query or pressing enter', async () => {
    sessionStorage.setItem('accessToken', 'token-1')
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { nickName: '林舟', userId: 1001, phoneNumber: '13800001001', identity: 'super_admin', status: 'enable' },
    })

    httpMock.onGet('/dictionary_data/list').reply((config) => {
      const typeKey = config.params?.typeKey
      if (typeKey === 'common_status') {
        return [
          200,
          {
            code: 200000,
            msg: '操作成功',
            data: {
              totals: 2,
              totalPages: 1,
              list: [
                { id: 1, typeKey: 'common_status', dataKey: 'enable', value: '启用', sort: 1, status: 1 },
                { id: 2, typeKey: 'common_status', dataKey: 'disable', value: '停用', sort: 2, status: 1 },
              ],
            },
          },
        ]
      }
      return [200, { code: 200000, msg: '操作成功', data: { totals: 0, totalPages: 1, list: [] } }]
    })

    let lastListPayload: Record<string, unknown> | null = null
    httpMock.onPost('/sys_user/list').reply((config) => {
      lastListPayload = config.data ? JSON.parse(config.data) : {}
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: [mockAccounts[1]],
        },
      ]
    })

    const { wrapper, router } = mountApplication('/accounts')
    await router.isReady()
    await flushPromises()

    // Initial load sent empty filter
    expect(lastListPayload).toEqual({})
    const initialCallCount = httpMock.history.post.filter((r) => r.url === '/sys_user/list').length
    expect(initialCallCount).toBe(1)

    // Typing in inputs does NOT trigger query immediately
    const idInput = wrapper.find('[data-test="filter-user-id"]')
    const phoneInput = wrapper.find('[data-test="filter-phone"]')
    const statusSelect = wrapper.find('[data-test="filter-status"]')

    expect(idInput.exists()).toBe(true)
    expect(phoneInput.exists()).toBe(true)
    expect(statusSelect.exists()).toBe(true)

    await idInput.setValue('1002')
    await phoneInput.setValue('13800001002')
    await statusSelect.setValue('enable')

    // No new request sent merely by changing values
    const countAfterInput = httpMock.history.post.filter((r) => r.url === '/sys_user/list').length
    expect(countAfterInput).toBe(1)

    // Submit query via query button
    const queryBtn = wrapper.find('[data-test="query-submit"]')
    expect(queryBtn.exists()).toBe(true)
    await queryBtn.trigger('click')
    await flushPromises()

    expect(httpMock.history.post.filter((r) => r.url === '/sys_user/list')).toHaveLength(2)
    expect(lastListPayload).toEqual({
      userId: 1002,
      phoneNumber: '13800001002',
      status: 'enable',
    })

    // Submitting via Enter key inside input triggers query
    await phoneInput.setValue('13800001003')
    await phoneInput.trigger('keydown.enter')
    await flushPromises()

    expect(httpMock.history.post.filter((r) => r.url === '/sys_user/list')).toHaveLength(3)
    expect(lastListPayload).toEqual({
      userId: 1002,
      phoneNumber: '13800001003',
      status: 'enable',
    })
  })

  it('resets filters back to empty and immediately re-queries all accounts', async () => {
    sessionStorage.setItem('accessToken', 'token-1')
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { nickName: '林舟', userId: 1001, phoneNumber: '13800001001', identity: 'super_admin', status: 'enable' },
    })

    httpMock.onGet('/dictionary_data/list').reply((config) => {
      const typeKey = config.params?.typeKey
      if (typeKey === 'common_status') {
        return [
          200,
          {
            code: 200000,
            msg: '操作成功',
            data: {
              totals: 2,
              totalPages: 1,
              list: [
                { id: 1, typeKey: 'common_status', dataKey: 'enable', value: '启用', sort: 1, status: 1 },
                { id: 2, typeKey: 'common_status', dataKey: 'disable', value: '停用', sort: 2, status: 1 },
              ],
            },
          },
        ]
      }
      return [200, { code: 200000, msg: '操作成功', data: { totals: 0, totalPages: 1, list: [] } }]
    })

    let lastListPayload: Record<string, unknown> | null = null
    httpMock.onPost('/sys_user/list').reply((config) => {
      lastListPayload = config.data ? JSON.parse(config.data) : {}
      return [200, { code: 200000, msg: '操作成功', data: mockAccounts }]
    })

    const { wrapper, router } = mountApplication('/accounts')
    await router.isReady()
    await flushPromises()

    const idInput = wrapper.find('[data-test="filter-user-id"]')
    const phoneInput = wrapper.find('[data-test="filter-phone"]')
    const statusSelect = wrapper.find('[data-test="filter-status"]')

    await idInput.setValue('1001')
    await phoneInput.setValue('13800001001')
    await statusSelect.setValue('enable')

    const queryBtn = wrapper.find('[data-test="query-submit"]')
    await queryBtn.trigger('click')
    await flushPromises()

    expect(lastListPayload).toEqual({
      userId: 1001,
      phoneNumber: '13800001001',
      status: 'enable',
    })

    // Reset button clears inputs and triggers query with empty payload
    const resetBtn = wrapper.find('[data-test="query-reset"]')
    expect(resetBtn.exists()).toBe(true)
    await resetBtn.trigger('click')
    await flushPromises()

    expect((idInput.element as HTMLInputElement).value).toBe('')
    expect((phoneInput.element as HTMLInputElement).value).toBe('')
    expect((statusSelect.element as HTMLSelectElement).value).toBe('')
    expect(lastListPayload).toEqual({})
  })

  it('restores default empty query state when re-entering the page without global cache', async () => {
    sessionStorage.setItem('accessToken', 'token-1')
    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { nickName: '林舟', userId: 1001, phoneNumber: '13800001001', identity: 'super_admin', status: 'enable' },
    })

    const payloads: unknown[] = []
    httpMock.onPost('/sys_user/list').reply((config) => {
      const p = config.data ? JSON.parse(config.data) : {}
      payloads.push(p)
      return [200, { code: 200000, msg: '操作成功', data: mockAccounts }]
    })

    const { wrapper, router } = mountApplication('/accounts')
    await router.isReady()
    await flushPromises()

    // Apply a filter
    const phoneInput = wrapper.find('[data-test="filter-phone"]')
    await phoneInput.setValue('13800001002')
    await wrapper.find('[data-test="query-submit"]').trigger('click')
    await flushPromises()

    expect(payloads[payloads.length - 1]).toEqual({ phoneNumber: '13800001002' })

    // Navigate to workbench
    await router.push('/workbench')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/workbench')

    // Navigate back to accounts
    await router.push('/accounts')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/accounts')

    // Inputs should be restored to default empty state, and new request sent with empty payload
    const newPhoneInput = wrapper.find('[data-test="filter-phone"]')
    expect((newPhoneInput.element as HTMLInputElement).value).toBe('')
    expect(payloads[payloads.length - 1]).toEqual({})
  })
})
