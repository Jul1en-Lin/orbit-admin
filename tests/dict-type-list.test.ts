import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { httpMock, mountApplication } from './harness'
import type { DictTypeVO } from '../src/api/dict'

const mockDictTypes: DictTypeVO[] = [
  {
    id: 1,
    typeKey: 'admin',
    value: '管理端身份',
    status: 1,
    remark: '系统日常维护工作，负责全局参数与系统稳定性保障的管理员身份类型',
  },
  {
    id: 2,
    typeKey: 'common_status',
    value: '通用状态',
    status: 1,
    remark: '全局通用的启用/停用状态定义',
  },
  {
    id: 3,
    typeKey: 'legacy_biz',
    value: '历史业务枚举',
    status: 0,
    remark: '已废弃的历史业务类型，仅供归档备查',
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

describe('dictionary type list and query (dict-type-list)', () => {
  it('enables "字典" topbar navigation and navigates to /dictionaries', async () => {
    setupAuth()

    httpMock.onGet('/dictionary_type/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 3, totalPages: 1, list: mockDictTypes },
    })

    const { wrapper, router } = mountApplication('/accounts')
    await router.isReady()
    await flushPromises()

    // Primary nav has enabled "字典" router-link, and "参数" remains disabled
    const dictNav = wrapper.find('.primary-nav a[href="/dictionaries"]')
    expect(dictNav.exists()).toBe(true)
    expect(dictNav.text()).toBe('字典')
    expect(dictNav.classes()).not.toContain('is-disabled')
    expect(dictNav.attributes('aria-disabled')).toBeUndefined()

    const disabledNavs = wrapper.findAll('.primary-nav .nav-item.is-disabled')
    expect(disabledNavs.map((n) => n.text())).toEqual(['参数'])

    // Navigate to /dictionaries
    await dictNav.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/dictionaries')
    expect(wrapper.find('.primary-nav a[href="/dictionaries"]').classes()).toContain('is-active')

    // Renders page heading and rail notes
    expect(wrapper.find('#dict-types-title').text()).toBe('字典类型')
    expect(wrapper.text()).toContain('查看字典类型，按编码与名称定位业务枚举的分类根基。')
    expect(wrapper.find('.dict-types-rail').text()).toContain('当前边界')
  })

  it('calls GET /dictionary_type/list with pageNo=1, pageSize=10 and displays table data', async () => {
    setupAuth()

    let requestedParams: Record<string, unknown> | null = null
    httpMock.onGet('/dictionary_type/list').reply((config) => {
      requestedParams = config.params
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals: 3, totalPages: 1, list: mockDictTypes },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    // Verify initial query params: pageNo=1, pageSize=10, no typeKey, no value
    expect(requestedParams).toEqual({
      pageNo: 1,
      pageSize: 10,
    })

    // Verify table structure
    const table = wrapper.find('[data-test="dict-type-table"]')
    expect(table.exists()).toBe(true)

    // Table header columns
    const headers = wrapper.findAll('th').map((h) => h.text())
    expect(headers).toEqual(['编码', '名称', '状态', '备注', '操作'])

    // Table rows
    const rows = wrapper.findAll('[data-test="dict-type-row"]')
    expect(rows).toHaveLength(3)

    // Row 1: admin
    expect(rows[0].find('.cell-key').text()).toBe('admin')
    expect(rows[0].find('.cell-name').text()).toBe('管理端身份')
    expect(rows[0].find('.cell-status').text()).toBe('启用')
    expect(rows[0].find('.status-badge').classes()).toContain('is-enabled')
    expect(rows[0].find('.cell-remark').text()).toBe('系统日常维护工作，负责全局参数与系统稳定性保障的管理员身份类型')
    expect(rows[0].find('.cell-actions').text()).toContain('维护字典项')

    // Row 2: common_status
    expect(rows[1].find('.cell-key').text()).toBe('common_status')
    expect(rows[1].find('.cell-name').text()).toBe('通用状态')
    expect(rows[1].find('.cell-status').text()).toBe('启用')
    expect(rows[1].find('.status-badge').classes()).toContain('is-enabled')

    // Row 3: legacy_biz (disabled status = 0)
    expect(rows[2].find('.cell-key').text()).toBe('legacy_biz')
    expect(rows[2].find('.cell-name').text()).toBe('历史业务枚举')
    expect(rows[2].find('.cell-status').text()).toBe('停用')
    expect(rows[2].find('.status-badge').classes()).toContain('is-disabled')

    // List summary
    expect(wrapper.text()).toContain('已显示本页 3 个字典类型')
  })

  it('filters by typeKey (exact) and value (prefix) only on submit or Enter, resets, and restores on page re-entry', async () => {
    setupAuth()

    const receivedParamsList: Record<string, unknown>[] = []
    httpMock.onGet('/dictionary_type/list').reply((config) => {
      receivedParamsList.push(config.params)
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals: 1, totalPages: 1, list: [mockDictTypes[0]] },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    expect(receivedParamsList).toHaveLength(1)
    expect(receivedParamsList[0]).toEqual({ pageNo: 1, pageSize: 10 })

    const typeKeyInput = wrapper.find('[data-test="filter-type-key"]')
    const valueInput = wrapper.find('[data-test="filter-value"]')
    const submitBtn = wrapper.find('[data-test="query-submit"]')
    const resetBtn = wrapper.find('[data-test="query-reset"]')

    expect(typeKeyInput.exists()).toBe(true)
    expect(valueInput.exists()).toBe(true)
    expect(submitBtn.exists()).toBe(true)
    expect(resetBtn.exists()).toBe(true)

    // 1. Modifying input values does NOT trigger query immediately
    await typeKeyInput.setValue('admin')
    await valueInput.setValue('管理')
    expect(receivedParamsList).toHaveLength(1)

    // 2. Clicking submit triggers query with parameters
    await submitBtn.trigger('click')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(2)
    expect(receivedParamsList[1]).toEqual({
      pageNo: 1,
      pageSize: 10,
      typeKey: 'admin',
      value: '管理',
    })

    // 3. Pressing Enter inside input triggers query
    await valueInput.setValue('管理端')
    await valueInput.trigger('keydown.enter')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(3)
    expect(receivedParamsList[2]).toEqual({
      pageNo: 1,
      pageSize: 10,
      typeKey: 'admin',
      value: '管理端',
    })

    // 4. Reset clears inputs and re-queries with default empty params
    await resetBtn.trigger('click')
    await flushPromises()

    expect((typeKeyInput.element as HTMLInputElement).value).toBe('')
    expect((valueInput.element as HTMLInputElement).value).toBe('')
    expect(receivedParamsList).toHaveLength(4)
    expect(receivedParamsList[3]).toEqual({ pageNo: 1, pageSize: 10 })

    // 5. Apply filter and re-enter page
    await typeKeyInput.setValue('admin')
    await submitBtn.trigger('click')
    await flushPromises()
    expect(receivedParamsList[4]).toEqual({ pageNo: 1, pageSize: 10, typeKey: 'admin' })

    // Navigate to /workbench
    await router.push('/workbench')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/workbench')

    // Navigate back to /dictionaries
    await router.push('/dictionaries')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/dictionaries')

    // Inputs should be restored to initial empty state, and query sent with default params
    const newTypeKeyInput = wrapper.find('[data-test="filter-type-key"]')
    const newValueInput = wrapper.find('[data-test="filter-value"]')
    expect((newTypeKeyInput.element as HTMLInputElement).value).toBe('')
    expect((newValueInput.element as HTMLInputElement).value).toBe('')
    expect(receivedParamsList[receivedParamsList.length - 1]).toEqual({ pageNo: 1, pageSize: 10 })
  })

  it('handles loading, empty (暂无数据), error and retry states', async () => {
    setupAuth()

    let resolvePromise: ((val: [number, unknown]) => void) | undefined
    httpMock.onGet('/dictionary_type/list').reply(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve
        }),
    )

    const { wrapper, router } = mountApplication('/dictionaries')
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
    expect(wrapper.findAll('[data-test="dict-type-row"]')).toHaveLength(0)

    // 3. Query error state
    httpMock.onGet('/dictionary_type/list').reply(500, {
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
    httpMock.onGet('/dictionary_type/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 1, totalPages: 1, list: [mockDictTypes[0]] },
    })

    await retryBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="state-error"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-test="dict-type-row"]')).toHaveLength(1)
    expect(wrapper.find('.cell-key').text()).toBe('admin')
  })

  it('rejects stale responses when queries complete out of order (race condition handling)', async () => {
    setupAuth()

    let callCount = 0
    let resolveQuery1: ((val: [number, unknown]) => void) | undefined
    let resolveQuery2: ((val: [number, unknown]) => void) | undefined

    httpMock.onGet('/dictionary_type/list').reply(() => {
      callCount++
      if (callCount === 1) {
        // initial mount query
        return [
          200,
          {
            code: 200000,
            msg: '操作成功',
            data: { totals: 3, totalPages: 1, list: mockDictTypes },
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

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    expect(wrapper.findAll('[data-test="dict-type-row"]')).toHaveLength(3)

    const typeKeyInput = wrapper.find('[data-test="filter-type-key"]')
    const submitBtn = wrapper.find('[data-test="query-submit"]')

    // Trigger Query 1 (callCount = 2)
    await typeKeyInput.setValue('admin')
    await submitBtn.trigger('click')

    // Trigger Query 2 (callCount = 3)
    await typeKeyInput.setValue('common_status')
    await submitBtn.trigger('click')

    expect(callCount).toBe(3)

    // Query 2 finishes first with common_status
    resolveQuery2?.([
      200,
      {
        code: 200000,
        msg: '操作成功',
        data: { totals: 1, totalPages: 1, list: [mockDictTypes[1]] },
      },
    ])
    await flushPromises()

    // Table displays Query 2 result ('common_status')
    expect(wrapper.findAll('[data-test="dict-type-row"]')).toHaveLength(1)
    expect(wrapper.find('.cell-key').text()).toBe('common_status')

    // Query 1 finishes later with admin
    resolveQuery1?.([
      200,
      {
        code: 200000,
        msg: '操作成功',
        data: { totals: 1, totalPages: 1, list: [mockDictTypes[0]] },
      },
    ])
    await flushPromises()

    // Stale response from Query 1 MUST be discarded; Query 2 result remains
    expect(wrapper.findAll('[data-test="dict-type-row"]')).toHaveLength(1)
    expect(wrapper.find('.cell-key').text()).toBe('common_status')
  })
})
