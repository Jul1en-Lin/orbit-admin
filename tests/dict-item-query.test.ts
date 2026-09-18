import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { httpMock, mountApplication } from './harness'
import type { DictDataVO, DictTypeVO } from '../src/api/dict'

const mockDictTypes: DictTypeVO[] = [
  {
    id: 1,
    typeKey: 'admin',
    value: '管理端身份',
    status: 1,
    remark: '管理员身份类型',
  },
  {
    id: 2,
    typeKey: 'common_status',
    value: '通用状态',
    status: 1,
    remark: '启用/停用状态',
  },
]

const mockDictItems: DictDataVO[] = [
  {
    id: 101,
    typeKey: 'admin',
    dataKey: 'platform_admin',
    value: '平台管理员',
    sort: 1,
    status: 1,
    remark: '平台管理员角色',
  },
  {
    id: 102,
    typeKey: 'admin',
    dataKey: 'super_admin',
    value: '超级管理员',
    sort: 2,
    status: 1,
    remark: null,
  },
  {
    id: 103,
    typeKey: 'admin',
    dataKey: 'disabled_admin',
    value: '已停用管理员',
    sort: 3,
    status: 0,
    remark: '已废弃',
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

function createMockDictItems(count: number, startId = 1): DictDataVO[] {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    typeKey: 'admin',
    dataKey: `item_${startId + i}`,
    value: `字典项${startId + i}`,
    sort: startId + i,
    status: 1,
    remark: `备注 ${startId + i}`,
  }))
}

describe('dictionary item query and round-trip navigation (dict-item-query)', () => {
  it('a) navigates from DictTypeListView row action "维护字典项" to /dictionaries/:typeKey/items', async () => {
    setupAuth()

    httpMock.onGet('/dictionary_type/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 2, totalPages: 1, list: mockDictTypes },
    })

    httpMock.onGet('/dictionary_data/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 3, totalPages: 1, list: mockDictItems },
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    // Find "维护字典项" links in the table
    const itemLinks = wrapper.findAll('[data-test="link-dict-items"]')
    expect(itemLinks).toHaveLength(2)

    // First row link should go to /dictionaries/admin/items
    const firstLink = itemLinks[0]
    expect(firstLink.text()).toBe('维护字典项')
    expect(firstLink.attributes('href')).toBe('/dictionaries/admin/items')

    // Click the link to navigate
    await firstLink.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/dictionaries/admin/items')

    // The dict items page renders
    expect(wrapper.find('#dict-items-title').text()).toBe('字典项')
    expect(wrapper.find('[data-test="parent-type-key"]').text()).toBe('admin')
  })

  it('b) DictItemListView renders parent typeKey, loads items with fixed typeKey, pageNo=1, pageSize=10', async () => {
    setupAuth()

    let requestedParams: Record<string, unknown> | null = null
    httpMock.onGet('/dictionary_data/list').reply((config) => {
      requestedParams = config.params
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals: 3, totalPages: 1, list: mockDictItems },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/dictionaries/admin/items')
    await router.isReady()
    await flushPromises()

    // Verify parent typeKey is displayed
    expect(wrapper.find('[data-test="parent-type-key"]').text()).toBe('admin')
    expect(wrapper.text()).toContain('DICTIONARY / admin')

    // Verify initial request params
    expect(requestedParams).toEqual({
      typeKey: 'admin',
      pageNo: 1,
      pageSize: 10,
    })

    // Verify table structure and columns
    const table = wrapper.find('[data-test="dict-item-table"]')
    expect(table.exists()).toBe(true)

    const headers = table.findAll('th').map((h) => h.text())
    expect(headers).toEqual(['字典项编码', '名称', '排序', '状态', '备注', '操作'])

    // Verify rows
    const rows = wrapper.findAll('[data-test="dict-item-row"]')
    expect(rows).toHaveLength(3)

    // Row 1
    expect(rows[0].find('.cell-data-key').text()).toBe('platform_admin')
    expect(rows[0].find('.cell-value').text()).toBe('平台管理员')
    expect(rows[0].find('.cell-sort').text()).toBe('1')
    expect(rows[0].find('.cell-status').text()).toBe('启用')
    expect(rows[0].find('.status-badge').classes()).toContain('is-enabled')
    expect(rows[0].find('.cell-remark').text()).toBe('平台管理员角色')
    expect(rows[0].find('.cell-actions').text()).toContain('新增与编辑字典项由后续票交付')

    // Row 2
    expect(rows[1].find('.cell-data-key').text()).toBe('super_admin')
    expect(rows[1].find('.cell-value').text()).toBe('超级管理员')
    expect(rows[1].find('.cell-sort').text()).toBe('2')
    expect(rows[1].find('.cell-remark').text()).toBe('—')

    // Row 3 (disabled)
    expect(rows[2].find('.cell-data-key').text()).toBe('disabled_admin')
    expect(rows[2].find('.cell-status').text()).toBe('停用')
    expect(rows[2].find('.status-badge').classes()).toContain('is-disabled')

    // Summary text
    expect(wrapper.text()).toContain('已显示本页 3 个字典项')
  })

  it('c) prefix search by value with Enter/Submit button, Reset restores full list', async () => {
    setupAuth()

    const receivedParamsList: Record<string, unknown>[] = []
    httpMock.onGet('/dictionary_data/list').reply((config) => {
      receivedParamsList.push(config.params)
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals: 3, totalPages: 1, list: mockDictItems },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/dictionaries/admin/items')
    await router.isReady()
    await flushPromises()

    // Initial load with typeKey only
    expect(receivedParamsList).toHaveLength(1)
    expect(receivedParamsList[0]).toEqual({ typeKey: 'admin', pageNo: 1, pageSize: 10 })

    const valueInput = wrapper.find('[data-test="filter-value"]')
    const submitBtn = wrapper.find('[data-test="query-submit"]')
    const resetBtn = wrapper.find('[data-test="query-reset"]')

    expect(valueInput.exists()).toBe(true)
    expect(submitBtn.exists()).toBe(true)
    expect(resetBtn.exists()).toBe(true)

    // 1. Modifying input does NOT trigger query immediately
    await valueInput.setValue('平台')
    expect(receivedParamsList).toHaveLength(1)

    // 2. Clicking submit triggers query with value filter
    await submitBtn.trigger('click')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(2)
    expect(receivedParamsList[1]).toEqual({
      typeKey: 'admin',
      pageNo: 1,
      pageSize: 10,
      value: '平台',
    })

    // 3. Pressing Enter on input triggers query
    await valueInput.setValue('超级')
    await valueInput.trigger('keydown.enter')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(3)
    expect(receivedParamsList[2]).toEqual({
      typeKey: 'admin',
      pageNo: 1,
      pageSize: 10,
      value: '超级',
    })

    // 4. Reset clears input and re-queries with only typeKey
    await resetBtn.trigger('click')
    await flushPromises()

    expect((valueInput.element as HTMLInputElement).value).toBe('')
    expect(receivedParamsList).toHaveLength(4)
    expect(receivedParamsList[3]).toEqual({
      typeKey: 'admin',
      pageNo: 1,
      pageSize: 10,
    })
  })

  it('d) paging interaction: pageSize change resets to page 1, next/prev navigate', async () => {
    setupAuth()

    const receivedParamsList: Record<string, unknown>[] = []
    httpMock.onGet('/dictionary_data/list').reply((config) => {
      receivedParamsList.push(config.params)
      const pageSize = (config.params?.pageSize as number) || 10
      const totals = 25
      const totalPages = Math.ceil(totals / pageSize)
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals, totalPages, list: createMockDictItems(Math.min(pageSize, 10)) },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/dictionaries/admin/items')
    await router.isReady()
    await flushPromises()

    expect(receivedParamsList).toHaveLength(1)
    expect(receivedParamsList[0]).toEqual({ typeKey: 'admin', pageNo: 1, pageSize: 10 })

    const nextBtn = wrapper.find('[data-test="page-next"]')
    const prevBtn = wrapper.find('[data-test="page-prev"]')
    const sizeSelect = wrapper.find('[data-test="page-size-select"]')

    // Navigate to page 2
    await nextBtn.trigger('click')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(2)
    expect(receivedParamsList[1]).toEqual({ typeKey: 'admin', pageNo: 2, pageSize: 10 })
    expect(wrapper.find('[data-test="page-current"]').text()).toContain('2')

    // Change pageSize to 20: resets to page 1
    await sizeSelect.setValue('20')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(3)
    expect(receivedParamsList[2]).toEqual({ typeKey: 'admin', pageNo: 1, pageSize: 20 })
    expect(wrapper.find('[data-test="page-current"]').text()).toContain('1')

    // Navigate to page 2 with pageSize 20, then back
    await nextBtn.trigger('click')
    await flushPromises()
    expect(receivedParamsList[3]).toEqual({ typeKey: 'admin', pageNo: 2, pageSize: 20 })

    await prevBtn.trigger('click')
    await flushPromises()
    expect(receivedParamsList[4]).toEqual({ typeKey: 'admin', pageNo: 1, pageSize: 20 })
    expect(wrapper.find('[data-test="page-current"]').text()).toContain('1')

    // Prev disabled on page 1
    expect(prevBtn.attributes('disabled')).toBeDefined()
  })

  it('e) loading, empty, error & retry states, and stale response rejection', async () => {
    setupAuth()

    let resolvePromise: ((val: [number, unknown]) => void) | undefined
    httpMock.onGet('/dictionary_data/list').reply(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve
        }),
    )

    const { wrapper, router } = mountApplication('/dictionaries/admin/items')
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

    // 3. Error state
    httpMock.onGet('/dictionary_data/list').reply(500, {
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
    httpMock.onGet('/dictionary_data/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 3, totalPages: 1, list: mockDictItems },
    })

    await retryBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="state-error"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-test="dict-item-row"]')).toHaveLength(3)

    // 5. Stale response rejection (race condition)
    let callCount = 0
    let resolveQuery1: ((val: [number, unknown]) => void) | undefined
    let resolveQuery2: ((val: [number, unknown]) => void) | undefined

    httpMock.onGet('/dictionary_data/list').reply(() => {
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

    const valueInput = wrapper.find('[data-test="filter-value"]')

    // Trigger Query 1 (slow)
    await valueInput.setValue('平台')
    await submitBtn.trigger('click')

    // Trigger Query 2 (fast)
    await valueInput.setValue('超级')
    await submitBtn.trigger('click')

    expect(callCount).toBe(2)

    // Query 2 arrives first
    resolveQuery2?.([
      200,
      {
        code: 200000,
        msg: '操作成功',
        data: { totals: 1, totalPages: 1, list: [mockDictItems[1]] },
      },
    ])
    await flushPromises()

    expect(wrapper.findAll('[data-test="dict-item-row"]')).toHaveLength(1)
    expect(wrapper.find('.cell-data-key').text()).toBe('super_admin')

    // Query 1 arrives late — must be discarded
    resolveQuery1?.([
      200,
      {
        code: 200000,
        msg: '操作成功',
        data: { totals: 1, totalPages: 1, list: [mockDictItems[0]] },
      },
    ])
    await flushPromises()

    expect(wrapper.findAll('[data-test="dict-item-row"]')).toHaveLength(1)
    expect(wrapper.find('.cell-data-key').text()).toBe('super_admin')
  })

  it('f) back button navigates to /dictionaries and restores default filter and page 1', async () => {
    setupAuth()

    const dictTypeParamsList: Record<string, unknown>[] = []
    httpMock.onGet('/dictionary_type/list').reply((config) => {
      dictTypeParamsList.push(config.params)
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals: 2, totalPages: 1, list: mockDictTypes },
        },
      ]
    })

    httpMock.onGet('/dictionary_data/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 3, totalPages: 1, list: mockDictItems },
    })

    // Start at dict items page
    const { wrapper, router } = mountApplication('/dictionaries/admin/items')
    await router.isReady()
    await flushPromises()

    // Verify we're on dict items page
    expect(router.currentRoute.value.path).toBe('/dictionaries/admin/items')
    expect(wrapper.find('[data-test="parent-type-key"]').text()).toBe('admin')

    // Click back button
    const backBtn = wrapper.find('[data-test="btn-back-to-types"]')
    expect(backBtn.exists()).toBe(true)
    expect(backBtn.text()).toBe('← 返回字典类型')

    await backBtn.trigger('click')
    await flushPromises()

    // Now on /dictionaries
    expect(router.currentRoute.value.path).toBe('/dictionaries')

    // The dict types page loads with default params: pageNo=1, pageSize=10, no filters
    expect(dictTypeParamsList.length).toBeGreaterThanOrEqual(1)
    expect(dictTypeParamsList[dictTypeParamsList.length - 1]).toEqual({
      pageNo: 1,
      pageSize: 10,
    })

    // Filter inputs are empty
    const typeKeyInput = wrapper.find('[data-test="filter-type-key"]')
    const valueInput = wrapper.find('[data-test="filter-value"]')
    expect((typeKeyInput.element as HTMLInputElement).value).toBe('')
    expect((valueInput.element as HTMLInputElement).value).toBe('')

    // Page current shows page 1
    expect(wrapper.find('[data-test="page-current"]').text()).toContain('1')
  })
})
