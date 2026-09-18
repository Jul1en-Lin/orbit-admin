import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { httpMock, mountApplication } from './harness'
import { createDictType, updateDictType, type DictTypeVO } from '../src/api/dict'

const mockDictTypesPage1: DictTypeVO[] = [
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
]

const mockDictTypesPage2: DictTypeVO[] = [
  {
    id: 3,
    typeKey: 'notice_channel',
    value: '通知渠道',
    status: 1,
    remark: '系统通知发送渠道定义',
  },
  {
    id: 4,
    typeKey: 'order_source',
    value: '订单来源',
    status: 0,
    remark: '历史订单接入渠道',
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

describe('dictionary type add and edit operations (dict-type-edit)', () => {
  describe('API functions: createDictType and updateDictType', () => {
    it('createDictType sends POST /dictionary_type/add with payload and returns created ID', async () => {
      let requestBody: Record<string, unknown> | null = null
      httpMock.onPost('/dictionary_type/add').reply((config) => {
        requestBody = JSON.parse(config.data as string)
        return [200, { code: 200000, msg: '操作成功', data: 42 }]
      })

      const id = await createDictType({
        typeKey: 'app_channel',
        value: '应用渠道',
        remark: '客户端渠道',
      })

      expect(id).toBe(42)
      expect(requestBody).toEqual({
        typeKey: 'app_channel',
        value: '应用渠道',
        remark: '客户端渠道',
      })
    })

    it('updateDictType sends POST /dictionary_type/edit with payload and returns updated ID', async () => {
      let requestBody: Record<string, unknown> | null = null
      httpMock.onPost('/dictionary_type/edit').reply((config) => {
        requestBody = JSON.parse(config.data as string)
        return [200, { code: 200000, msg: '操作成功', data: 43 }]
      })

      const id = await updateDictType({
        typeKey: 'app_channel',
        value: '应用推广渠道',
      })

      expect(id).toBe(43)
      expect(requestBody).toEqual({
        typeKey: 'app_channel',
        value: '应用推广渠道',
      })
    })
  })

  it('a) opens add modal, displays typeKey, value, remark fields, and client-side validation rejects blank inputs', async () => {
    setupAuth()

    httpMock.onGet('/dictionary_type/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 2, totalPages: 1, list: mockDictTypesPage1 },
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    const addBtn = wrapper.find('[data-test="btn-add-dict-type"]')
    expect(addBtn.exists()).toBe(true)
    expect(addBtn.text()).toContain('新增字典类型')

    // 1. Open add modal
    await addBtn.trigger('click')
    await flushPromises()

    const dialog = wrapper.find('[data-test="dict-type-dialog"]')
    expect(dialog.exists()).toBe(true)

    const title = wrapper.find('[data-test="dict-type-dialog-title"]')
    expect(title.text()).toBe('新增字典类型')

    const typeKeyInput = wrapper.find('[data-test="form-type-key"]')
    const valueInput = wrapper.find('[data-test="form-value"]')
    const remarkInput = wrapper.find('[data-test="form-remark"]')
    const submitBtn = wrapper.find('[data-test="btn-submit-dict-type"]')

    expect(typeKeyInput.exists()).toBe(true)
    expect(valueInput.exists()).toBe(true)
    expect(remarkInput.exists()).toBe(true)
    expect(submitBtn.exists()).toBe(true)

    // In add mode, typeKey is editable (neither disabled nor readonly)
    expect(typeKeyInput.attributes('disabled')).toBeUndefined()
    expect(typeKeyInput.attributes('readonly')).toBeUndefined()

    // No error messages initially
    expect(wrapper.find('[data-test="error-type-key"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="error-value"]').exists()).toBe(false)

    // 2. Submit with empty inputs -> rejected by client-side validation
    let postAddCalled = false
    httpMock.onPost('/dictionary_type/add').reply(() => {
      postAddCalled = true
      return [200, { code: 200000, msg: '操作成功', data: 99 }]
    })

    await submitBtn.trigger('click')
    await flushPromises()

    expect(postAddCalled).toBe(false)
    expect(wrapper.find('[data-test="error-type-key"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="error-type-key"]').text()).toContain('请输入字典类型编码')
    expect(wrapper.find('[data-test="error-value"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="error-value"]').text()).toContain('请输入字典类型名称')

    // 3. Submit with whitespace-only inputs -> still rejected
    await typeKeyInput.setValue('   ')
    await valueInput.setValue(' \t \n ')
    await submitBtn.trigger('click')
    await flushPromises()

    expect(postAddCalled).toBe(false)
    expect(wrapper.find('[data-test="error-type-key"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="error-value"]').exists()).toBe(true)

    // 4. Entering valid text clears validation error
    await typeKeyInput.setValue('goods_type')
    expect(wrapper.find('[data-test="error-type-key"]').exists()).toBe(false)

    await valueInput.setValue('商品类型')
    expect(wrapper.find('[data-test="error-value"]').exists()).toBe(false)
  })

  it('b) successful add calls POST /dictionary_type/add, closes modal, resets to page 1 and re-fetches', async () => {
    setupAuth()

    const listRequests: Record<string, unknown>[] = []
    httpMock.onGet('/dictionary_type/list').reply((config) => {
      listRequests.push(config.params)
      const reqPage = Number(config.params?.pageNo ?? 1)
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: {
            totals: 4,
            totalPages: 2,
            list: reqPage === 2 ? mockDictTypesPage2 : mockDictTypesPage1,
          },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    // Navigate to page 2 first
    const nextBtn = wrapper.find('[data-test="page-next"]')
    await nextBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="page-current"]').text()).toContain('2')
    expect(listRequests[listRequests.length - 1]).toMatchObject({ pageNo: 2 })

    // Open add modal
    await wrapper.find('[data-test="btn-add-dict-type"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-test="form-type-key"]').setValue('order_status')
    await wrapper.find('[data-test="form-value"]').setValue('订单状态')
    await wrapper.find('[data-test="form-remark"]').setValue('电商业务全局订单状态')

    let addPayload: Record<string, unknown> | null = null
    httpMock.onPost('/dictionary_type/add').reply((config) => {
      addPayload = JSON.parse(config.data)
      return [200, { code: 200000, msg: '操作成功', data: 5 }]
    })

    // Submit form
    await wrapper.find('[data-test="btn-submit-dict-type"]').trigger('click')
    await flushPromises()

    // Verified POST payload
    expect(addPayload).toEqual({
      typeKey: 'order_status',
      value: '订单状态',
      remark: '电商业务全局订单状态',
    })

    // Modal is closed
    expect(wrapper.find('[data-test="dict-type-dialog"]').exists()).toBe(false)

    // Re-fetched list starting from page 1
    const lastRequest = listRequests[listRequests.length - 1]
    expect(lastRequest).toMatchObject({ pageNo: 1 })
    expect(wrapper.find('[data-test="page-current"]').text()).toContain('1')
  })

  it('c) opens edit modal: typeKey is read-only and prefilled, value and remark are prefilled, editing value', async () => {
    setupAuth()

    httpMock.onGet('/dictionary_type/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 2, totalPages: 1, list: mockDictTypesPage1 },
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    const rows = wrapper.findAll('[data-test="dict-type-row"]')
    expect(rows).toHaveLength(2)

    // Row 0 is 'admin'
    const editBtn = rows[0].find('[data-test="btn-edit-dict-type"]')
    expect(editBtn.exists()).toBe(true)
    expect(editBtn.text()).toBe('编辑')

    // Open edit dialog
    await editBtn.trigger('click')
    await flushPromises()

    const dialog = wrapper.find('[data-test="dict-type-dialog"]')
    expect(dialog.exists()).toBe(true)

    // Modal title is '编辑字典类型'
    const title = wrapper.find('[data-test="dict-type-dialog-title"]')
    expect(title.text()).toBe('编辑字典类型')

    const typeKeyInput = wrapper.find<HTMLInputElement>('[data-test="form-type-key"]')
    const valueInput = wrapper.find<HTMLInputElement>('[data-test="form-value"]')
    const remarkInput = wrapper.find<HTMLTextAreaElement>('[data-test="form-remark"]')

    // typeKey is prefilled and read-only / disabled
    expect(typeKeyInput.element.value).toBe('admin')
    const isReadOnlyOrDisabled =
      typeKeyInput.attributes('readonly') !== undefined || typeKeyInput.attributes('disabled') !== undefined
    expect(isReadOnlyOrDisabled).toBe(true)

    // value and remark are prefilled and editable
    expect(valueInput.element.value).toBe('管理端身份')
    expect(valueInput.attributes('readonly')).toBeUndefined()
    expect(valueInput.attributes('disabled')).toBeUndefined()

    expect(remarkInput.element.value).toBe('系统日常维护工作，负责全局参数与系统稳定性保障的管理员身份类型')
    expect(remarkInput.attributes('disabled')).toBeUndefined()

    // Editing value
    await valueInput.setValue('系统平台管理身份')
    expect(valueInput.element.value).toBe('系统平台管理身份')

    // Validation rejecting blank value in edit mode
    await valueInput.setValue('   ')
    await wrapper.find('[data-test="btn-submit-dict-type"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="error-value"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="error-value"]').text()).toContain('请输入字典类型名称')
  })

  it('d) successful edit calls POST /dictionary_type/edit, closes modal, stays on current page and re-fetches', async () => {
    setupAuth()

    const listRequests: Record<string, unknown>[] = []
    httpMock.onGet('/dictionary_type/list').reply((config) => {
      listRequests.push(config.params)
      const reqPage = Number(config.params?.pageNo ?? 1)
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: {
            totals: 4,
            totalPages: 2,
            list: reqPage === 2 ? mockDictTypesPage2 : mockDictTypesPage1,
          },
        },
      ]
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    // Navigate to page 2
    await wrapper.find('[data-test="page-next"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="page-current"]').text()).toContain('2')

    // On page 2, edit row 0 ('notice_channel')
    const rows = wrapper.findAll('[data-test="dict-type-row"]')
    expect(rows[0].find('.cell-key').text()).toBe('notice_channel')

    await rows[0].find('[data-test="btn-edit-dict-type"]').trigger('click')
    await flushPromises()

    // Edit value and remark
    await wrapper.find('[data-test="form-value"]').setValue('系统通知渠道')
    await wrapper.find('[data-test="form-remark"]').setValue('系统升级与告警渠道说明')

    let editPayload: Record<string, unknown> | null = null
    httpMock.onPost('/dictionary_type/edit').reply((config) => {
      editPayload = JSON.parse(config.data)
      return [200, { code: 200000, msg: '操作成功', data: 3 }]
    })

    // Submit edit
    await wrapper.find('[data-test="btn-submit-dict-type"]').trigger('click')
    await flushPromises()

    // Verified POST payload to /dictionary_type/edit
    expect(editPayload).toEqual({
      typeKey: 'notice_channel',
      value: '系统通知渠道',
      remark: '系统升级与告警渠道说明',
    })

    // Modal is closed
    expect(wrapper.find('[data-test="dict-type-dialog"]').exists()).toBe(false)

    // List re-fetched keeping current page (page 2)
    const lastRequest = listRequests[listRequests.length - 1]
    expect(lastRequest).toMatchObject({ pageNo: 2 })
    expect(wrapper.find('[data-test="page-current"]').text()).toContain('2')
  })

  it('e) in-flight submission locking, failure retains form data and displays single feedback', async () => {
    setupAuth()

    httpMock.onGet('/dictionary_type/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 2, totalPages: 1, list: mockDictTypesPage1 },
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    await wrapper.find('[data-test="btn-add-dict-type"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-test="form-type-key"]').setValue('duplicate_key')
    await wrapper.find('[data-test="form-value"]').setValue('重复类型')
    await wrapper.find('[data-test="form-remark"]').setValue('测试防重复与错误留存')

    // Setup a deferred mock response
    let resolvePost!: (value: [number, unknown]) => void
    httpMock.onPost('/dictionary_type/add').reply(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve
        }),
    )

    // Trigger submission
    await wrapper.find('[data-test="dict-type-form"]').trigger('submit.prevent')

    // 1. In-flight locking checks
    const submitBtn = wrapper.find('[data-test="btn-submit-dict-type"]')
    const cancelBtn = wrapper.find('[data-test="btn-cancel-dict-type"]')
    const keyInput = wrapper.find('[data-test="form-type-key"]')
    const valInput = wrapper.find('[data-test="form-value"]')
    const remarkInput = wrapper.find('[data-test="form-remark"]')

    expect(submitBtn.attributes('disabled')).toBeDefined()
    expect(submitBtn.text()).toContain('提交中...')
    expect(cancelBtn.attributes('disabled')).toBeDefined()
    expect(keyInput.attributes('disabled')).toBeDefined()
    expect(valInput.attributes('disabled')).toBeDefined()
    expect(remarkInput.attributes('disabled')).toBeDefined()

    // Clicking cancel while in flight should not close dialog
    await cancelBtn.trigger('click')
    expect(wrapper.find('[data-test="dict-type-dialog"]').exists()).toBe(true)

    // 2. Resolve with 500 business error
    resolvePost([
      500,
      {
        code: 500000,
        msg: '字典类型的键或者值已存在',
        data: null,
      },
    ])
    await flushPromises()

    // Dialog remains open
    expect(wrapper.find('[data-test="dict-type-dialog"]').exists()).toBe(true)

    // Form data retained
    expect((wrapper.find<HTMLInputElement>('[data-test="form-type-key"]').element as HTMLInputElement).value).toBe(
      'duplicate_key',
    )
    expect((wrapper.find<HTMLInputElement>('[data-test="form-value"]').element as HTMLInputElement).value).toBe(
      '重复类型',
    )
    expect((wrapper.find<HTMLTextAreaElement>('[data-test="form-remark"]').element as HTMLTextAreaElement).value).toBe(
      '测试防重复与错误留存',
    )

    // Exactly one single error feedback
    const errorAlerts = wrapper.findAll('[data-test="dict-type-error-message"]')
    expect(errorAlerts).toHaveLength(1)
    expect(errorAlerts[0].text()).toContain('字典类型的键或者值已存在')

    // Submit button unlocked
    expect(wrapper.find('[data-test="btn-submit-dict-type"]').attributes('disabled')).toBeUndefined()

    // 3. Re-submit and fail with network error
    httpMock.onPost('/dictionary_type/add').networkError()
    await wrapper.find('[data-test="dict-type-form"]').trigger('submit.prevent')
    await flushPromises()

    // Dialog remains open, data retained
    expect(wrapper.find('[data-test="dict-type-dialog"]').exists()).toBe(true)
    expect((wrapper.find<HTMLInputElement>('[data-test="form-type-key"]').element as HTMLInputElement).value).toBe(
      'duplicate_key',
    )

    // Still exactly one single error alert with updated message
    const updatedAlerts = wrapper.findAll('[data-test="dict-type-error-message"]')
    expect(updatedAlerts).toHaveLength(1)
    expect(updatedAlerts[0].text()).toContain('网络请求失败')
  })

  it('f) ensures no delete or status editing controls are provided in list or modals', async () => {
    setupAuth()

    httpMock.onGet('/dictionary_type/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 2, totalPages: 1, list: mockDictTypesPage1 },
    })

    const { wrapper, router } = mountApplication('/dictionaries')
    await router.isReady()
    await flushPromises()

    // In table: no delete buttons or status edit controls
    expect(wrapper.find('[data-test="btn-delete"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="btn-delete-dict-type"]').exists()).toBe(false)
    expect(wrapper.find('.btn-delete').exists()).toBe(false)
    expect(wrapper.findAll('input[type="checkbox"]').length).toBe(0)
    expect(wrapper.findAll('.cell-actions select').length).toBe(0)

    // Status badges are read-only text spans
    const badges = wrapper.findAll('.status-badge')
    expect(badges).toHaveLength(2)
    for (const badge of badges) {
      expect(badge.element.tagName.toLowerCase()).toBe('span')
    }

    // In Add modal: no delete or status controls
    await wrapper.find('[data-test="btn-add-dict-type"]').trigger('click')
    await flushPromises()

    const addDialog = wrapper.find('[data-test="dict-type-dialog"]')
    expect(addDialog.find('[data-test="btn-delete"]').exists()).toBe(false)
    expect(addDialog.find('[data-test="form-status"]').exists()).toBe(false)
    expect(addDialog.findAll('select').length).toBe(0)
    expect(addDialog.findAll('input[type="checkbox"]').length).toBe(0)

    // Close add modal
    await wrapper.find('[data-test="btn-cancel-dict-type"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="dict-type-dialog"]').exists()).toBe(false)

    // In Edit modal: no delete or status controls
    const rows = wrapper.findAll('[data-test="dict-type-row"]')
    await rows[0].find('[data-test="btn-edit-dict-type"]').trigger('click')
    await flushPromises()

    const editDialog = wrapper.find('[data-test="dict-type-dialog"]')
    expect(editDialog.find('[data-test="btn-delete"]').exists()).toBe(false)
    expect(editDialog.find('[data-test="form-status"]').exists()).toBe(false)
    expect(editDialog.findAll('select').length).toBe(0)
    expect(editDialog.findAll('input[type="checkbox"]').length).toBe(0)
  })
})
