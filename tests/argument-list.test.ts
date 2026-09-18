import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { httpMock, mountApplication } from './harness'
import type { ArgumentVO } from '../src/api/argument'

const mockArguments: ArgumentVO[] = [
  {
    id: 1,
    configKey: 'sys.login.captcha',
    name: '登录验证码开关',
    value: 'false',
    remark: '控制登录页面是否显示验证码',
  },
  {
    id: 2,
    configKey: 'sys.upload.maxSize',
    name: '上传文件大小限制',
    value: '10485760',
    remark: '单位为字节，默认10MB',
  },
  {
    id: 3,
    configKey: 'sys.account.initPassword',
    name: '新用户初始密码',
    value: 'abc123',
    remark: null,
  },
]

function setupAuth() {
  sessionStorage.setItem('accessToken', 'token-test')
  httpMock.onGet('/sys_user/login/get_info').reply(200, {
    code: 200000,
    msg: '操作成功',
    data: {
      nickName: '系统管理员',
      userId: 1001,
      phoneNumber: '13800001001',
      identity: 'super_admin',
      status: 'enable',
    },
  })
}

describe('argument list and query (argument-list)', () => {
  it('a) enables "参数" topbar navigation and navigates to /parameters', async () => {
    setupAuth()

    httpMock.onGet('/argument/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 3, totalPages: 1, list: mockArguments },
    })

    const { wrapper, router } = mountApplication('/accounts')
    await router.isReady()
    await flushPromises()

    // "参数" is now an enabled router-link, not a disabled span
    const paramNav = wrapper.find('.primary-nav a[href="/parameters"]')
    expect(paramNav.exists()).toBe(true)
    expect(paramNav.text()).toBe('参数')
    expect(paramNav.classes()).not.toContain('is-disabled')
    expect(paramNav.attributes('aria-disabled')).toBeUndefined()

    // No disabled nav items remain
    const disabledNavs = wrapper.findAll('.primary-nav .nav-item.is-disabled')
    expect(disabledNavs).toHaveLength(0)

    // Navigate to /parameters
    // Need to mock the argument list endpoint for the navigation target
    httpMock.onPost('/sys_user/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: [],
    })

    await paramNav.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/parameters')
    expect(wrapper.find('.primary-nav a[href="/parameters"]').classes()).toContain('is-active')

    // Renders page heading and rail notes
    expect(wrapper.find('#arguments-title').text()).toBe('参数')
    expect(wrapper.text()).toContain('查看系统配置参数，按编码与名称定位目标参数。')
    expect(wrapper.find('.arguments-rail').text()).toContain('当前边界')
  })

  it('b) calls GET /argument/list with pageNo=1, pageSize=10 and displays table data', async () => {
    setupAuth()

    let requestedParams: Record<string, unknown> | null = null
    httpMock.onGet('/argument/list').reply((config) => {
      requestedParams = config.params
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals: 3, totalPages: 1, list: mockArguments },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/parameters')
    await router.isReady()
    await flushPromises()

    // Verify initial query params: pageNo=1, pageSize=10, no filters
    expect(requestedParams).toEqual({
      pageNo: 1,
      pageSize: 10,
    })

    // Verify table structure
    const table = wrapper.find('[data-test="argument-table"]')
    expect(table.exists()).toBe(true)

    // Table header columns
    const headers = wrapper.findAll('th').map((h) => h.text())
    expect(headers).toEqual(['参数键名', '参数名称', '参数键值', '备注', '操作'])

    // Table rows
    const rows = wrapper.findAll('[data-test="argument-row"]')
    expect(rows).toHaveLength(3)

    // Row 1
    expect(rows[0].find('.cell-config-key').text()).toBe('sys.login.captcha')
    expect(rows[0].find('.cell-name').text()).toBe('登录验证码开关')
    expect(rows[0].find('.cell-value').text()).toBe('false')
    expect(rows[0].find('.cell-remark').text()).toBe('控制登录页面是否显示验证码')
    expect(rows[0].find('.action-placeholder').text()).toBe('新增与编辑参数由后续票交付')

    // Row 2
    expect(rows[1].find('.cell-config-key').text()).toBe('sys.upload.maxSize')
    expect(rows[1].find('.cell-name').text()).toBe('上传文件大小限制')
    expect(rows[1].find('.cell-value').text()).toBe('10485760')
    expect(rows[1].find('.cell-remark').text()).toBe('单位为字节，默认10MB')

    // Row 3: remark is null, should show —
    expect(rows[2].find('.cell-config-key').text()).toBe('sys.account.initPassword')
    expect(rows[2].find('.cell-name').text()).toBe('新用户初始密码')
    expect(rows[2].find('.cell-value').text()).toBe('abc123')
    expect(rows[2].find('.cell-remark').text()).toBe('—')

    // List summary
    expect(wrapper.text()).toContain('已显示本页 3 个参数')
  })

  it('c) filters by configKey (exact) and name (contains), enter key submit, reset', async () => {
    setupAuth()

    const receivedParamsList: Record<string, unknown>[] = []
    httpMock.onGet('/argument/list').reply((config) => {
      receivedParamsList.push(config.params)
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals: 1, totalPages: 1, list: [mockArguments[0]] },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/parameters')
    await router.isReady()
    await flushPromises()

    expect(receivedParamsList).toHaveLength(1)
    expect(receivedParamsList[0]).toEqual({ pageNo: 1, pageSize: 10 })

    const configKeyInput = wrapper.find('[data-test="filter-config-key"]')
    const nameInput = wrapper.find('[data-test="filter-name"]')
    const submitBtn = wrapper.find('[data-test="query-submit"]')
    const resetBtn = wrapper.find('[data-test="query-reset"]')

    expect(configKeyInput.exists()).toBe(true)
    expect(nameInput.exists()).toBe(true)
    expect(submitBtn.exists()).toBe(true)
    expect(resetBtn.exists()).toBe(true)

    // 1. Modifying input values does NOT trigger query immediately
    await configKeyInput.setValue('sys.login.captcha')
    await nameInput.setValue('验证码')
    expect(receivedParamsList).toHaveLength(1)

    // 2. Clicking submit triggers query with parameters
    await submitBtn.trigger('click')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(2)
    expect(receivedParamsList[1]).toEqual({
      pageNo: 1,
      pageSize: 10,
      configKey: 'sys.login.captcha',
      name: '验证码',
    })

    // 3. Pressing Enter inside name input triggers query
    await nameInput.setValue('登录')
    await nameInput.trigger('keydown.enter')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(3)
    expect(receivedParamsList[2]).toEqual({
      pageNo: 1,
      pageSize: 10,
      configKey: 'sys.login.captcha',
      name: '登录',
    })

    // 4. Reset clears inputs and re-queries with default empty params
    await resetBtn.trigger('click')
    await flushPromises()

    expect((configKeyInput.element as HTMLInputElement).value).toBe('')
    expect((nameInput.element as HTMLInputElement).value).toBe('')
    expect(receivedParamsList).toHaveLength(4)
    expect(receivedParamsList[3]).toEqual({ pageNo: 1, pageSize: 10 })
  })

  it('d) paging interaction (pageSize change, next/prev)', async () => {
    setupAuth()

    const receivedParamsList: Record<string, unknown>[] = []
    httpMock.onGet('/argument/list').reply((config) => {
      receivedParamsList.push(config.params)
      const pageSize = (config.params?.pageSize as number) || 10
      const totals = 25
      const totalPages = Math.ceil(totals / pageSize)
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals, totalPages, list: mockArguments.slice(0, Math.min(pageSize, 3)) },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/parameters')
    await router.isReady()
    await flushPromises()

    expect(receivedParamsList).toHaveLength(1)
    expect(receivedParamsList[0]).toEqual({ pageNo: 1, pageSize: 10 })

    const prevBtn = wrapper.find('[data-test="page-prev"]')
    const nextBtn = wrapper.find('[data-test="page-next"]')
    const sizeSelect = wrapper.find('[data-test="page-size-select"]')

    // Prev disabled on page 1
    expect(prevBtn.attributes('disabled')).toBeDefined()
    expect(nextBtn.attributes('disabled')).toBeUndefined()

    // Navigate to page 2
    await nextBtn.trigger('click')
    await flushPromises()
    expect(receivedParamsList).toHaveLength(2)
    expect(receivedParamsList[1]).toEqual({ pageNo: 2, pageSize: 10 })
    expect(wrapper.find('[data-test="page-current"]').text()).toContain('2')

    // Change pageSize to 20: resets pageNo to 1
    await sizeSelect.setValue('20')
    await flushPromises()
    expect(receivedParamsList).toHaveLength(3)
    expect(receivedParamsList[2]).toEqual({ pageNo: 1, pageSize: 20 })
    expect(wrapper.find('[data-test="page-current"]').text()).toContain('1')

    // Change pageSize to 50: resets pageNo to 1
    await sizeSelect.setValue('50')
    await flushPromises()
    expect(receivedParamsList).toHaveLength(4)
    expect(receivedParamsList[3]).toEqual({ pageNo: 1, pageSize: 50 })
  })

  it('e) loading, empty, error & retry states, and stale response rejection', async () => {
    setupAuth()

    let resolvePromise: ((val: [number, unknown]) => void) | undefined
    httpMock.onGet('/argument/list').reply(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve
        }),
    )

    const { wrapper, router } = mountApplication('/parameters')
    await router.isReady()
    await flushPromises()

    // 1. Loading state
    expect(wrapper.find('[data-test="state-loading"]').exists()).toBe(true)
    expect(wrapper.find('.table-wrap').text()).toContain('正在加载数据...')

    // Resolve with empty list
    resolvePromise?.([
      200,
      {
        code: 200000,
        msg: '操作成功',
        data: { totals: 0, totalPages: 0, list: [] },
      },
    ])
    await flushPromises()

    // 2. Empty state
    expect(wrapper.find('[data-test="state-loading"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="state-empty"]').exists()).toBe(true)
    expect(wrapper.find('.table-wrap').text()).toContain('暂无数据')
    expect(wrapper.findAll('[data-test="argument-row"]')).toHaveLength(0)

    // 3. Error state
    httpMock.onGet('/argument/list').reply(500, {
      code: 500000,
      msg: '服务器繁忙，请稍后重试',
    })

    const submitBtn = wrapper.find('[data-test="query-submit"]')
    await submitBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="state-error"]').exists()).toBe(true)
    expect(wrapper.find('.table-wrap').text()).toContain('服务器繁忙，请稍后重试')
    const retryBtn = wrapper.find('[data-test="state-retry"]')
    expect(retryBtn.exists()).toBe(true)

    // 4. Retry succeeds
    httpMock.onGet('/argument/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 1, totalPages: 1, list: [mockArguments[0]] },
    })

    await retryBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="state-error"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-test="argument-row"]')).toHaveLength(1)
    expect(wrapper.find('.cell-config-key').text()).toBe('sys.login.captcha')
  })

  it('e-2) rejects stale responses when queries complete out of order (race condition)', async () => {
    setupAuth()

    let callCount = 0
    let resolveQuery1: ((val: [number, unknown]) => void) | undefined
    let resolveQuery2: ((val: [number, unknown]) => void) | undefined

    httpMock.onGet('/argument/list').reply(() => {
      callCount++
      if (callCount === 1) {
        // initial mount query
        return [
          200,
          {
            code: 200000,
            msg: '操作成功',
            data: { totals: 3, totalPages: 1, list: mockArguments },
          },
        ]
      }
      if (callCount === 2) {
        // Query 1: slow
        return new Promise((resolve) => {
          resolveQuery1 = resolve
        })
      }
      // Query 2: fast
      return new Promise((resolve) => {
        resolveQuery2 = resolve
      })
    })

    const { wrapper, router } = mountApplication('/parameters')
    await router.isReady()
    await flushPromises()

    expect(wrapper.findAll('[data-test="argument-row"]')).toHaveLength(3)

    const configKeyInput = wrapper.find('[data-test="filter-config-key"]')
    const submitBtn = wrapper.find('[data-test="query-submit"]')

    // Trigger Query 1 (callCount = 2)
    await configKeyInput.setValue('sys.login.captcha')
    await submitBtn.trigger('click')

    // Trigger Query 2 (callCount = 3)
    await configKeyInput.setValue('sys.upload.maxSize')
    await submitBtn.trigger('click')

    expect(callCount).toBe(3)

    // Query 2 finishes first
    resolveQuery2?.([
      200,
      {
        code: 200000,
        msg: '操作成功',
        data: { totals: 1, totalPages: 1, list: [mockArguments[1]] },
      },
    ])
    await flushPromises()

    // Table displays Query 2 result
    expect(wrapper.findAll('[data-test="argument-row"]')).toHaveLength(1)
    expect(wrapper.find('.cell-config-key').text()).toBe('sys.upload.maxSize')

    // Query 1 finishes later
    resolveQuery1?.([
      200,
      {
        code: 200000,
        msg: '操作成功',
        data: { totals: 1, totalPages: 1, list: [mockArguments[0]] },
      },
    ])
    await flushPromises()

    // Stale response from Query 1 MUST be discarded; Query 2 result remains
    expect(wrapper.findAll('[data-test="argument-row"]')).toHaveLength(1)
    expect(wrapper.find('.cell-config-key').text()).toBe('sys.upload.maxSize')
  })

  it('f) table row rendering of configKey, name, value, remark', async () => {
    setupAuth()

    const extendedMockArgs: ArgumentVO[] = [
      ...mockArguments,
      {
        id: 4,
        configKey: 'sys.long.value',
        name: '长文本参数',
        value: '这是一段非常长的参数值，需要确认不会被意外截断，而是可以完整查看。包含各种中文字符与数字1234567890。',
        remark: '这也是一段非常长的备注文本，用来测试备注列的可读性，不应该被意外截断或隐藏，而应该完整展示给用户。',
      },
    ]

    httpMock.onGet('/argument/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 4, totalPages: 1, list: extendedMockArgs },
    })

    const { wrapper, router } = mountApplication('/parameters')
    await router.isReady()
    await flushPromises()

    const rows = wrapper.findAll('[data-test="argument-row"]')
    expect(rows).toHaveLength(4)

    // Row 4: long text is readable (not truncated)
    const longRow = rows[3]
    expect(longRow.find('.cell-config-key').text()).toBe('sys.long.value')
    expect(longRow.find('.cell-name').text()).toBe('长文本参数')
    expect(longRow.find('.cell-value').text()).toContain('这是一段非常长的参数值')
    expect(longRow.find('.cell-value').text()).toContain('1234567890')
    expect(longRow.find('.cell-remark').text()).toContain('这也是一段非常长的备注文本')
    expect(longRow.find('.cell-remark').text()).toContain('完整展示给用户')

    // Operation column shows placeholder
    for (const row of rows) {
      expect(row.find('.action-placeholder').text()).toBe('新增与编辑参数由后续票交付')
    }
  })

  it('g) re-entering page resets state', async () => {
    setupAuth()

    const receivedParamsList: Record<string, unknown>[] = []
    httpMock.onGet('/argument/list').reply((config) => {
      receivedParamsList.push(config.params)
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals: 25, totalPages: 3, list: mockArguments },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/parameters')
    await router.isReady()
    await flushPromises()

    // Change pageSize to 50
    const sizeSelect = wrapper.find('[data-test="page-size-select"]')
    await sizeSelect.setValue('50')
    await flushPromises()

    // Add search filter
    const configKeyInput = wrapper.find('[data-test="filter-config-key"]')
    await configKeyInput.setValue('sys.login.captcha')
    const submitBtn = wrapper.find('[data-test="query-submit"]')
    await submitBtn.trigger('click')
    await flushPromises()

    // Verify modified state before leaving
    expect(receivedParamsList[receivedParamsList.length - 1]).toEqual({
      pageNo: 1,
      pageSize: 50,
      configKey: 'sys.login.captcha',
    })

    // Navigate away to /workbench
    await router.push('/workbench')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/workbench')

    // Navigate back to /parameters
    await router.push('/parameters')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/parameters')

    // Verify fresh state on re-entry: pageNo=1, pageSize=10, no filters
    expect(receivedParamsList[receivedParamsList.length - 1]).toEqual({
      pageNo: 1,
      pageSize: 10,
    })

    const newSizeSelect = wrapper.find<HTMLSelectElement>('[data-test="page-size-select"]')
    expect(newSizeSelect.element.value).toBe('10')

    const newConfigKeyInput = wrapper.find<HTMLInputElement>('[data-test="filter-config-key"]')
    const newNameInput = wrapper.find<HTMLInputElement>('[data-test="filter-name"]')
    expect(newConfigKeyInput.element.value).toBe('')
    expect(newNameInput.element.value).toBe('')

    const currentEl = wrapper.find('[data-test="page-current"]')
    expect(currentEl.text()).toContain('1')
  })
})
