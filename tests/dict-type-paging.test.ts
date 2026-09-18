import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { httpMock, mountApplication } from './harness'
import type { DictTypeVO } from '../src/api/dict'

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

function createMockDictTypes(count: number, startId = 1): DictTypeVO[] {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    typeKey: `type_${startId + i}`,
    value: `字典类型${startId + i}`,
    status: 1,
    remark: `备注说明 ${startId + i}`,
  }))
}

describe('dictionary type pagination interaction (dict-type-paging)', () => {
  it('a) defaults to pageNo=1, pageSize=10 and displays totals and totalPages', async () => {
    setupAuth()

    let requestedParams: Record<string, unknown> | null = null
    httpMock.onGet('/dictionary_type/list').reply((config) => {
      requestedParams = config.params
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals: 25, totalPages: 3, list: createMockDictTypes(10) },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    // Default request params must be pageNo: 1, pageSize: 10
    expect(requestedParams).toEqual({
      pageNo: 1,
      pageSize: 10,
    })

    // Pagination wrapper and elements exist
    const paginationWrap = wrapper.find('[data-test="pagination-wrap"]')
    expect(paginationWrap.exists()).toBe(true)

    // Displays totals and totalPages
    const totalsEl = wrapper.find('[data-test="page-totals"]')
    expect(totalsEl.exists()).toBe(true)
    expect(totalsEl.text()).toContain('25')
    expect(totalsEl.text()).toContain('3')

    // Displays current page
    const currentEl = wrapper.find('[data-test="page-current"]')
    expect(currentEl.exists()).toBe(true)
    expect(currentEl.text()).toContain('1')

    // Page size select defaults to 10
    const sizeSelect = wrapper.find<HTMLSelectElement>('[data-test="page-size-select"]')
    expect(sizeSelect.exists()).toBe(true)
    expect(sizeSelect.element.value).toBe('10')

    // Options: 10, 20, 50
    const options = sizeSelect.findAll('option').map((opt) => opt.element.value)
    expect(options).toEqual(['10', '20', '50'])

    // Previous button disabled on page 1, next button enabled
    const prevBtn = wrapper.find('[data-test="page-prev"]')
    const nextBtn = wrapper.find('[data-test="page-next"]')
    expect(prevBtn.attributes('disabled')).toBeDefined()
    expect(nextBtn.attributes('disabled')).toBeUndefined()
  })

  it('b) switching page size (10 -> 20 -> 50) resets pageNo to 1 and requests new pageSize', async () => {
    setupAuth()

    const receivedParamsList: Record<string, unknown>[] = []
    httpMock.onGet('/dictionary_type/list').reply((config) => {
      receivedParamsList.push(config.params)
      const pageSize = (config.params?.pageSize as number) || 10
      const totals = 60
      const totalPages = Math.ceil(totals / pageSize)
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals, totalPages, list: createMockDictTypes(Math.min(pageSize, 10)) },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    expect(receivedParamsList).toHaveLength(1)
    expect(receivedParamsList[0]).toEqual({ pageNo: 1, pageSize: 10 })

    // Navigate to page 2 first
    const nextBtn = wrapper.find('[data-test="page-next"]')
    await nextBtn.trigger('click')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(2)
    expect(receivedParamsList[1]).toEqual({ pageNo: 2, pageSize: 10 })
    expect(wrapper.find('[data-test="page-current"]').text()).toContain('2')

    // Change pageSize to 20: resets pageNo to 1
    const sizeSelect = wrapper.find('[data-test="page-size-select"]')
    await sizeSelect.setValue('20')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(3)
    expect(receivedParamsList[2]).toEqual({ pageNo: 1, pageSize: 20 })
    expect(wrapper.find('[data-test="page-current"]').text()).toContain('1')

    // Navigate to page 2 with pageSize 20
    await nextBtn.trigger('click')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(4)
    expect(receivedParamsList[3]).toEqual({ pageNo: 2, pageSize: 20 })
    expect(wrapper.find('[data-test="page-current"]').text()).toContain('2')

    // Change pageSize to 50: resets pageNo to 1
    await sizeSelect.setValue('50')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(5)
    expect(receivedParamsList[4]).toEqual({ pageNo: 1, pageSize: 50 })
    expect(wrapper.find('[data-test="page-current"]').text()).toContain('1')
  })

  it('c) next/prev page navigation triggers request with updated pageNo and respects boundary disable states', async () => {
    setupAuth()

    const receivedParamsList: Record<string, unknown>[] = []
    httpMock.onGet('/dictionary_type/list').reply((config) => {
      receivedParamsList.push(config.params)
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals: 25, totalPages: 3, list: createMockDictTypes(10) },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    const prevBtn = wrapper.find('[data-test="page-prev"]')
    const nextBtn = wrapper.find('[data-test="page-next"]')
    const currentEl = wrapper.find('[data-test="page-current"]')

    // Page 1 boundary: prev disabled, next enabled
    expect(currentEl.text()).toContain('1')
    expect(prevBtn.attributes('disabled')).toBeDefined()
    expect(nextBtn.attributes('disabled')).toBeUndefined()

    // Clicking disabled prev does not trigger request
    await prevBtn.trigger('click')
    await flushPromises()
    expect(receivedParamsList).toHaveLength(1)

    // Navigate to page 2
    await nextBtn.trigger('click')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(2)
    expect(receivedParamsList[1]).toEqual({ pageNo: 2, pageSize: 10 })
    expect(currentEl.text()).toContain('2')
    expect(prevBtn.attributes('disabled')).toBeUndefined()
    expect(nextBtn.attributes('disabled')).toBeUndefined()

    // Navigate to page 3 (last page)
    await nextBtn.trigger('click')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(3)
    expect(receivedParamsList[2]).toEqual({ pageNo: 3, pageSize: 10 })
    expect(currentEl.text()).toContain('3')
    expect(prevBtn.attributes('disabled')).toBeUndefined()
    expect(nextBtn.attributes('disabled')).toBeDefined()

    // Clicking disabled next does not trigger request
    await nextBtn.trigger('click')
    await flushPromises()
    expect(receivedParamsList).toHaveLength(3)

    // Navigate back to page 2
    await prevBtn.trigger('click')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(4)
    expect(receivedParamsList[3]).toEqual({ pageNo: 2, pageSize: 10 })
    expect(currentEl.text()).toContain('2')

    // Navigate back to page 1
    await prevBtn.trigger('click')
    await flushPromises()

    expect(receivedParamsList).toHaveLength(5)
    expect(receivedParamsList[4]).toEqual({ pageNo: 1, pageSize: 10 })
    expect(currentEl.text()).toContain('1')
    expect(prevBtn.attributes('disabled')).toBeDefined()
    expect(nextBtn.attributes('disabled')).toBeUndefined()
  })

  it('c-2) disables both prev and next buttons when totalPages is 0', async () => {
    setupAuth()

    httpMock.onGet('/dictionary_type/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 0, totalPages: 0, list: [] },
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    const prevBtn = wrapper.find('[data-test="page-prev"]')
    const nextBtn = wrapper.find('[data-test="page-next"]')
    expect(prevBtn.attributes('disabled')).toBeDefined()
    expect(nextBtn.attributes('disabled')).toBeDefined()

    const totalsEl = wrapper.find('[data-test="page-totals"]')
    expect(totalsEl.text()).toContain('0')
  })

  it('d) filter submit or reset forces pageNo back to 1', async () => {
    setupAuth()

    const receivedParamsList: Record<string, unknown>[] = []
    httpMock.onGet('/dictionary_type/list').reply((config) => {
      receivedParamsList.push(config.params)
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals: 40, totalPages: 4, list: createMockDictTypes(10) },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    const nextBtn = wrapper.find('[data-test="page-next"]')
    const currentEl = wrapper.find('[data-test="page-current"]')
    const typeKeyInput = wrapper.find('[data-test="filter-type-key"]')
    const valueInput = wrapper.find('[data-test="filter-value"]')
    const submitBtn = wrapper.find('[data-test="query-submit"]')
    const resetBtn = wrapper.find('[data-test="query-reset"]')

    // Move to page 3
    await nextBtn.trigger('click')
    await flushPromises()
    await nextBtn.trigger('click')
    await flushPromises()
    expect(currentEl.text()).toContain('3')

    // 1. Submit filter resets pageNo to 1
    await typeKeyInput.setValue('admin')
    await submitBtn.trigger('click')
    await flushPromises()

    expect(receivedParamsList[receivedParamsList.length - 1]).toEqual({
      pageNo: 1,
      pageSize: 10,
      typeKey: 'admin',
    })
    expect(currentEl.text()).toContain('1')

    // Move to page 2
    await nextBtn.trigger('click')
    await flushPromises()
    expect(currentEl.text()).toContain('2')

    // 2. Pressing enter on filter input resets pageNo to 1
    await valueInput.setValue('管理')
    await valueInput.trigger('keydown.enter')
    await flushPromises()

    expect(receivedParamsList[receivedParamsList.length - 1]).toEqual({
      pageNo: 1,
      pageSize: 10,
      typeKey: 'admin',
      value: '管理',
    })
    expect(currentEl.text()).toContain('1')

    // Move to page 2
    await nextBtn.trigger('click')
    await flushPromises()
    expect(currentEl.text()).toContain('2')

    // 3. Resetting filter resets pageNo to 1 and clears filters
    await resetBtn.trigger('click')
    await flushPromises()

    expect(receivedParamsList[receivedParamsList.length - 1]).toEqual({
      pageNo: 1,
      pageSize: 10,
    })
    expect(currentEl.text()).toContain('1')
    expect((typeKeyInput.element as HTMLInputElement).value).toBe('')
    expect((valueInput.element as HTMLInputElement).value).toBe('')
  })

  it('e) re-entering page resets to initial pageNo=1 and pageSize=10', async () => {
    setupAuth()

    const receivedParamsList: Record<string, unknown>[] = []
    httpMock.onGet('/dictionary_type/list').reply((config) => {
      receivedParamsList.push(config.params)
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: { totals: 80, totalPages: 8, list: createMockDictTypes(10) },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    // Change pageSize to 50
    const sizeSelect = wrapper.find('[data-test="page-size-select"]')
    await sizeSelect.setValue('50')
    await flushPromises()

    // Navigate to page 2
    const nextBtn = wrapper.find('[data-test="page-next"]')
    await nextBtn.trigger('click')
    await flushPromises()

    // Add search filter
    const typeKeyInput = wrapper.find('[data-test="filter-type-key"]')
    await typeKeyInput.setValue('admin')
    const submitBtn = wrapper.find('[data-test="query-submit"]')
    await submitBtn.trigger('click')
    await flushPromises()

    // Verify modified state before leaving
    expect(receivedParamsList[receivedParamsList.length - 1]).toEqual({
      pageNo: 1,
      pageSize: 50,
      typeKey: 'admin',
    })

    // Navigate away to /workbench
    await router.push('/workbench')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/workbench')

    // Navigate back to /dictionaries
    await router.push('/dictionaries')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/dictionaries')

    // Verify fresh state on re-entry: pageNo=1, pageSize=10, no filters
    expect(receivedParamsList[receivedParamsList.length - 1]).toEqual({
      pageNo: 1,
      pageSize: 10,
    })

    const newSizeSelect = wrapper.find<HTMLSelectElement>('[data-test="page-size-select"]')
    expect(newSizeSelect.element.value).toBe('10')

    const newTypeKeyInput = wrapper.find<HTMLInputElement>('[data-test="filter-type-key"]')
    const newValueInput = wrapper.find<HTMLInputElement>('[data-test="filter-value"]')
    expect(newTypeKeyInput.element.value).toBe('')
    expect(newValueInput.element.value).toBe('')

    const currentEl = wrapper.find('[data-test="page-current"]')
    expect(currentEl.text()).toContain('1')
  })
})
