import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { httpMock, mountApplication } from './harness'
import { updateDictItem, type DictDataVO } from '../src/api/dict'

const mockDictItemsPage1: DictDataVO[] = [
  {
    id: 101,
    typeKey: 'admin',
    dataKey: 'platform_admin',
    value: '平台管理员',
    sort: 1,
    status: 1,
    remark: '平台管理员角色，拥有系统运维权限',
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
]

const mockDictItemsPage2: DictDataVO[] = [
  {
    id: 103,
    typeKey: 'admin',
    dataKey: 'sec_admin',
    value: '安全管理员',
    sort: 3,
    status: 1,
    remark: '负责安全合规审计',
  },
  {
    id: 104,
    typeKey: 'admin',
    dataKey: 'guest_admin',
    value: '访客管理员',
    sort: 4,
    status: 0,
    remark: '',
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

describe('dictionary item edit operations (dict-item-edit)', () => {
  beforeEach(() => {
    setupAuth()
  })

  describe('API function: updateDictItem', () => {
    it('sends POST /dictionary_data/edit with dataKey, value, sort, remark and does NOT send typeKey', async () => {
      let requestBody: Record<string, unknown> | null = null
      httpMock.onPost('/dictionary_data/edit').reply((config) => {
        requestBody = JSON.parse(config.data as string)
        return [200, { code: 200000, msg: '操作成功', data: 101 }]
      })

      const id = await updateDictItem({
        dataKey: 'platform_admin',
        value: '平台总管理员',
        sort: 10,
        remark: '更新运维权限说明',
      })

      expect(id).toBe(101)
      expect(requestBody).toEqual({
        dataKey: 'platform_admin',
        value: '平台总管理员',
        sort: 10,
        remark: '更新运维权限说明',
      })
      // Ensure typeKey is not sent in body
      expect(requestBody).not.toHaveProperty('typeKey')
    })

    it('sends POST /dictionary_data/edit omitting optional sort and remark when not provided', async () => {
      let requestBody: Record<string, unknown> | null = null
      httpMock.onPost('/dictionary_data/edit').reply((config) => {
        requestBody = JSON.parse(config.data as string)
        return [200, { code: 200000, msg: '操作成功', data: 102 }]
      })

      const id = await updateDictItem({
        dataKey: 'super_admin',
        value: '超级管理特权者',
      })

      expect(id).toBe(102)
      expect(requestBody).toEqual({
        dataKey: 'super_admin',
        value: '超级管理特权者',
      })
      expect(requestBody).not.toHaveProperty('sort')
      expect(requestBody).not.toHaveProperty('remark')
      expect(requestBody).not.toHaveProperty('typeKey')
    })
  })

  describe('UI & Interaction', () => {
    it('a) renders "编辑" button on each row, opens edit dialog with prefilled values, code and type locked as read-only', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItemsPage1 },
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      const rows = wrapper.findAll('[data-test="dict-item-row"]')
      expect(rows).toHaveLength(2)

      const editBtn = rows[0].find('[data-test="btn-edit-dict-item"]')
      expect(editBtn.exists()).toBe(true)
      expect(editBtn.text()).toContain('编辑')

      // Open edit dialog
      await editBtn.trigger('click')
      await flushPromises()

      const dialog = wrapper.find('[data-test="dict-item-dialog"]')
      expect(dialog.exists()).toBe(true)

      const title = wrapper.find('[data-test="dict-item-dialog-title"]')
      expect(title.text()).toBe('编辑字典项')

      const typeKeyInput = wrapper.find<HTMLInputElement>('[data-test="form-type-key"]')
      const dataKeyInput = wrapper.find<HTMLInputElement>('[data-test="form-data-key"]')
      const valueInput = wrapper.find<HTMLInputElement>('[data-test="form-value"]')
      const sortInput = wrapper.find<HTMLInputElement>('[data-test="form-sort"]')
      const remarkInput = wrapper.find<HTMLTextAreaElement>('[data-test="form-remark"]')
      const submitBtn = wrapper.find('[data-test="btn-submit-dict-item"]')

      // Belonging type is fixed and read-only/disabled
      expect(typeKeyInput.element.value).toBe('admin')
      expect(
        typeKeyInput.attributes('disabled') !== undefined || typeKeyInput.attributes('readonly') !== undefined,
      ).toBe(true)

      // Dict item code is prefilled and read-only/disabled
      expect(dataKeyInput.element.value).toBe('platform_admin')
      expect(
        dataKeyInput.attributes('disabled') !== undefined || dataKeyInput.attributes('readonly') !== undefined,
      ).toBe(true)

      // Name, sort, remark prefilled and editable
      expect(valueInput.element.value).toBe('平台管理员')
      expect(valueInput.attributes('readonly')).toBeUndefined()

      expect(sortInput.element.value).toBe('1')
      expect(sortInput.attributes('readonly')).toBeUndefined()

      expect(remarkInput.element.value).toBe('平台管理员角色，拥有系统运维权限')
      expect(remarkInput.attributes('readonly')).toBeUndefined()

      expect(submitBtn.text()).toBe('确认保存')
    })

    it('b) prevents clearing an existing remark, rejects whitespace bypass, displays "当前接口不支持清空备注"', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItemsPage1 },
      })

      let editCalled = false
      httpMock.onPost('/dictionary_data/edit').reply(() => {
        editCalled = true
        return [200, { code: 200000, msg: '操作成功', data: 101 }]
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      // Row 0 has remark: '平台管理员角色，拥有系统运维权限'
      const rows = wrapper.findAll('[data-test="dict-item-row"]')
      await rows[0].find('[data-test="btn-edit-dict-item"]').trigger('click')
      await flushPromises()

      const remarkInput = wrapper.find<HTMLTextAreaElement>('[data-test="form-remark"]')
      const submitBtn = wrapper.find('[data-test="btn-submit-dict-item"]')

      // 1. Attempt to clear remark to empty string
      await remarkInput.setValue('')
      await submitBtn.trigger('click')
      await flushPromises()

      expect(editCalled).toBe(false)
      const errorRemark = wrapper.find('[data-test="error-remark"]')
      expect(errorRemark.exists()).toBe(true)
      expect(errorRemark.text()).toContain('当前接口不支持清空备注')

      // 2. Attempt to bypass with whitespace only
      await remarkInput.setValue('   \t \n  ')
      await submitBtn.trigger('click')
      await flushPromises()

      expect(editCalled).toBe(false)
      expect(wrapper.find('[data-test="error-remark"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="error-remark"]').text()).toContain('当前接口不支持清空备注')

      // 3. Modifying to valid non-empty text clears the error
      await remarkInput.setValue('修改后的非空管理员备注')
      await flushPromises()

      expect(wrapper.find('[data-test="error-remark"]').exists()).toBe(false)
    })

    it('c) allows submitting empty remark if the item originally had NO remark (null or empty)', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItemsPage1 },
      })

      let editPayload: Record<string, unknown> | null = null
      httpMock.onPost('/dictionary_data/edit').reply((config) => {
        editPayload = JSON.parse(config.data as string)
        return [200, { code: 200000, msg: '操作成功', data: 102 }]
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      // Row 1 is super_admin with remark: null
      const rows = wrapper.findAll('[data-test="dict-item-row"]')
      await rows[1].find('[data-test="btn-edit-dict-item"]').trigger('click')
      await flushPromises()

      const remarkInput = wrapper.find<HTMLTextAreaElement>('[data-test="form-remark"]')
      expect(remarkInput.element.value).toBe('')

      // Submit with empty remark -> should succeed because original had no remark
      await wrapper.find('[data-test="btn-submit-dict-item"]').trigger('click')
      await flushPromises()

      expect(editPayload).toEqual({
        dataKey: 'super_admin',
        value: '超级管理员',
        sort: 2,
      })
      expect(wrapper.find('[data-test="error-remark"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)
    })

    it('d) client-side validation rejects blank name and non-integer sort in edit mode', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItemsPage1 },
      })

      let editCalled = false
      httpMock.onPost('/dictionary_data/edit').reply(() => {
        editCalled = true
        return [200, { code: 200000, msg: '操作成功', data: 101 }]
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      await wrapper.findAll('[data-test="dict-item-row"]')[0].find('[data-test="btn-edit-dict-item"]').trigger('click')
      await flushPromises()

      const valueInput = wrapper.find('[data-test="form-value"]')
      const sortInput = wrapper.find('[data-test="form-sort"]')
      const submitBtn = wrapper.find('[data-test="btn-submit-dict-item"]')

      // 1. Blank name rejected
      await valueInput.setValue('   ')
      await submitBtn.trigger('click')
      await flushPromises()

      expect(editCalled).toBe(false)
      expect(wrapper.find('[data-test="error-value"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="error-value"]').text()).toContain('请输入字典项名称')

      // 2. Restore name, enter invalid sort (decimal)
      await valueInput.setValue('有效名称')
      await sortInput.setValue('3.14')
      await submitBtn.trigger('click')
      await flushPromises()

      expect(editCalled).toBe(false)
      expect(wrapper.find('[data-test="error-sort"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="error-sort"]').text()).toContain('排序必须为整数')

      // 3. Negative integer and zero are valid
      await sortInput.setValue('-10')
      expect(wrapper.find('[data-test="error-sort"]').exists()).toBe(false)

      await sortInput.setValue('0')
      expect(wrapper.find('[data-test="error-sort"]').exists()).toBe(false)
    })

    it('e) successful edit sends POST /dictionary_data/edit, stays on current page (page 2) and refreshes', async () => {
      const listCalls: Record<string, unknown>[] = []
      httpMock.onGet('/dictionary_data/list').reply((config) => {
        listCalls.push(config.params)
        const reqPage = Number(config.params?.pageNo ?? 1)
        return [
          200,
          {
            code: 200000,
            msg: '操作成功',
            data: {
              totals: 4,
              totalPages: 2,
              list: reqPage === 2 ? mockDictItemsPage2 : mockDictItemsPage1,
            },
          },
        ]
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      // Navigate to page 2 first
      await wrapper.find('[data-test="page-next"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-test="page-current"]').text()).toContain('2')

      // Edit sec_admin on page 2
      const rows = wrapper.findAll('[data-test="dict-item-row"]')
      expect(rows[0].find('.cell-data-key').text()).toBe('sec_admin')

      await rows[0].find('[data-test="btn-edit-dict-item"]').trigger('click')
      await flushPromises()

      // Update name, sort, remark
      await wrapper.find('[data-test="form-value"]').setValue('安全审计总控')
      await wrapper.find('[data-test="form-sort"]').setValue('30')
      await wrapper.find('[data-test="form-remark"]').setValue('负责合规与日常安全策略审计')

      let editPayload: Record<string, unknown> | null = null
      httpMock.onPost('/dictionary_data/edit').reply((config) => {
        editPayload = JSON.parse(config.data as string)
        return [200, { code: 200000, msg: '操作成功', data: 103 }]
      })

      await wrapper.find('[data-test="btn-submit-dict-item"]').trigger('click')
      await flushPromises()

      // Verifying edit payload
      expect(editPayload).toEqual({
        dataKey: 'sec_admin',
        value: '安全审计总控',
        sort: 30,
        remark: '负责合规与日常安全策略审计',
      })
      expect(editPayload).not.toHaveProperty('typeKey')

      // Dialog is closed
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)

      // Verified remaining on page 2
      const lastListCall = listCalls[listCalls.length - 1]
      expect(lastListCall).toMatchObject({ pageNo: 2 })
      expect(wrapper.find('[data-test="page-current"]').text()).toContain('2')
    })

    it('f) does not promise clearing sort to null: clearing sort omits sort in edit payload and displays backend returned state upon refresh', async () => {
      // Backend contract: sort is not cleared to null, so re-fetching still returns the original sort (or backend unchanged value)
      let listCallCount = 0
      httpMock.onGet('/dictionary_data/list').reply(() => {
        listCallCount++
        return [
          200,
          {
            code: 200000,
            msg: '操作成功',
            data: {
              totals: 2,
              totalPages: 1,
              // Even if frontend cleared sort input, backend still retains sort: 1
              list: mockDictItemsPage1,
            },
          },
        ]
      })

      let editPayload: Record<string, unknown> | null = null
      httpMock.onPost('/dictionary_data/edit').reply((config) => {
        editPayload = JSON.parse(config.data as string)
        return [200, { code: 200000, msg: '操作成功', data: 101 }]
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      // Open edit for platform_admin (sort: 1)
      await wrapper.findAll('[data-test="dict-item-row"]')[0].find('[data-test="btn-edit-dict-item"]').trigger('click')
      await flushPromises()

      const sortInput = wrapper.find<HTMLInputElement>('[data-test="form-sort"]')
      expect(sortInput.element.value).toBe('1')

      // Clear sort input
      await sortInput.setValue('')
      // Submit edit
      await wrapper.find('[data-test="btn-submit-dict-item"]').trigger('click')
      await flushPromises()

      // Payload omits sort
      expect(editPayload).toBeDefined()
      expect(editPayload).not.toHaveProperty('sort')

      // Dialog is closed
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)

      // The table displays the actual backend state (sort is still 1), not falsely presenting null/empty
      const rows = wrapper.findAll('[data-test="dict-item-row"]')
      expect(rows[0].find('.cell-sort').text()).toBe('1')
      expect(listCallCount).toBe(2)
    })

    it('g) in-flight submission locking, failure retains form data, and single error alert displayed', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItemsPage1 },
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      await wrapper.findAll('[data-test="dict-item-row"]')[0].find('[data-test="btn-edit-dict-item"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-value"]').setValue('新管理员名称')

      // Deferred promise to inspect in-flight locking
      let resolvePost!: (value: [number, unknown]) => void
      httpMock.onPost('/dictionary_data/edit').reply(
        () =>
          new Promise((resolve) => {
            resolvePost = resolve
          }),
      )

      await wrapper.find('[data-test="dict-item-form"]').trigger('submit.prevent')

      // 1. Locking assertions
      const submitBtn = wrapper.find('[data-test="btn-submit-dict-item"]')
      const cancelBtn = wrapper.find('[data-test="btn-cancel-dict-item"]')
      const valInput = wrapper.find('[data-test="form-value"]')

      expect(submitBtn.attributes('disabled')).toBeDefined()
      expect(submitBtn.text()).toContain('提交中...')
      expect(cancelBtn.attributes('disabled')).toBeDefined()
      expect(valInput.attributes('disabled')).toBeDefined()

      // Cancel button cannot close modal in flight
      await cancelBtn.trigger('click')
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(true)

      // 2. Reject with backend 500 error
      resolvePost([
        500,
        {
          code: 500000,
          msg: '字典项值已存在',
          data: null,
        },
      ])
      await flushPromises()

      // Dialog stays open, values retained
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(true)
      expect((wrapper.find<HTMLInputElement>('[data-test="form-value"]').element as HTMLInputElement).value).toBe(
        '新管理员名称',
      )

      // Single error banner
      const errors = wrapper.findAll('[data-test="dict-item-error-message"]')
      expect(errors).toHaveLength(1)
      expect(errors[0].text()).toContain('字典项值已存在')
      expect(wrapper.find('[data-test="btn-submit-dict-item"]').attributes('disabled')).toBeUndefined()

      // 3. Network error handling
      httpMock.onPost('/dictionary_data/edit').networkError()
      await wrapper.find('[data-test="dict-item-form"]').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(true)
      const updatedErrors = wrapper.findAll('[data-test="dict-item-error-message"]')
      expect(updatedErrors).toHaveLength(1)
      expect(updatedErrors[0].text()).toContain('网络请求失败')
    })

    it('h) timeout/uncertain write error keeps form, unlocks button, prompts verification without auto-retry', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItemsPage1 },
      })

      httpMock.onPost('/dictionary_data/edit').timeout()

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      await wrapper.findAll('[data-test="dict-item-row"]')[0].find('[data-test="btn-edit-dict-item"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-value"]').setValue('超时测试名称')
      await wrapper.find('[data-test="btn-submit-dict-item"]').trigger('click')
      await flushPromises()

      // Form remains open and inputs preserved
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(true)
      expect((wrapper.find<HTMLInputElement>('[data-test="form-value"]').element as HTMLInputElement).value).toBe(
        '超时测试名称',
      )

      // Prompt verification note
      const errorEl = wrapper.find('[data-test="dict-item-error-message"]')
      expect(errorEl.exists()).toBe(true)
      expect(errorEl.text()).toContain('提交结果未确认，请先查询核实')

      // Unlocked, not automatically retrying
      expect(wrapper.find('[data-test="btn-submit-dict-item"]').attributes('disabled')).toBeUndefined()
    })

    it('i) successful edit but refresh failure displays warning banner without misleading user to re-submit', async () => {
      let listQueryCount = 0
      httpMock.onGet('/dictionary_data/list').reply(() => {
        listQueryCount++
        if (listQueryCount === 1) {
          return [200, { code: 200000, msg: '操作成功', data: { totals: 2, totalPages: 1, list: mockDictItemsPage1 } }]
        }
        // Second call (refresh after edit) fails
        return [500, { code: 500000, msg: '服务暂时不可用', data: null }]
      })

      httpMock.onPost('/dictionary_data/edit').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: 101,
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      await wrapper.findAll('[data-test="dict-item-row"]')[0].find('[data-test="btn-edit-dict-item"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-value"]').setValue('新管理员')
      await wrapper.find('[data-test="btn-submit-dict-item"]').trigger('click')
      await flushPromises()

      // Dialog closed
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)

      // Warning banner displayed
      const warningBanner = wrapper.find('[data-test="create-refresh-warning"]')
      expect(warningBanner.exists()).toBe(true)
      expect(warningBanner.text()).toContain('无需重复提交保存')
    })

    it('j) dirty form checking: clean form closes immediately, dirty form prompts confirmDiscardChanges', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItemsPage1 },
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      // 1. Clean edit form: open and click cancel without modifications -> closes directly
      const confirmSpy = vi.spyOn(window, 'confirm')

      await wrapper.findAll('[data-test="dict-item-row"]')[0].find('[data-test="btn-edit-dict-item"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(true)

      await wrapper.find('[data-test="btn-cancel-dict-item"]').trigger('click')
      await flushPromises()

      expect(confirmSpy).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)

      // 2. Dirty edit form: modify value -> click cancel -> confirm is triggered
      await wrapper.findAll('[data-test="dict-item-row"]')[0].find('[data-test="btn-edit-dict-item"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-value"]').setValue('修改了的名称')

      // User cancels discard -> dialog stays open
      confirmSpy.mockReturnValueOnce(false)
      await wrapper.find('[data-test="btn-cancel-dict-item"]').trigger('click')
      await flushPromises()

      expect(confirmSpy).toHaveBeenCalledWith('表单有未保存的修改，确定放弃吗？')
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(true)

      // User confirms discard -> dialog closes
      confirmSpy.mockReturnValueOnce(true)
      await wrapper.find('[data-test="btn-cancel-dict-item"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)

      confirmSpy.mockRestore()
    })

    it('k) 401 session expiry immediately clears and closes edit dialog without dirty prompt', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItemsPage1 },
      })

      httpMock.onPost('/dictionary_data/edit').reply(401, {
        code: 401004,
        msg: 'Token 已过期',
        data: null,
      })

      const confirmSpy = vi.spyOn(window, 'confirm')

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      await wrapper.findAll('[data-test="dict-item-row"]')[0].find('[data-test="btn-edit-dict-item"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-value"]').setValue('修改值并触发401')
      await wrapper.find('[data-test="btn-submit-dict-item"]').trigger('click')
      await flushPromises()

      // Dialog closed without confirm prompt
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)
      expect(confirmSpy).not.toHaveBeenCalled()

      confirmSpy.mockRestore()
    })

    it('l) ensures no delete button or status editing controls are provided anywhere', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItemsPage1 },
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      // In table:
      expect(wrapper.find('[data-test="btn-delete"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="btn-delete-dict-item"]').exists()).toBe(false)
      expect(wrapper.find('.btn-delete').exists()).toBe(false)
      expect(wrapper.findAll('input[type="checkbox"]').length).toBe(0)
      expect(wrapper.findAll('.cell-actions select').length).toBe(0)

      // Status is read-only badge
      const badges = wrapper.findAll('.status-badge')
      expect(badges).toHaveLength(2)
      for (const badge of badges) {
        expect(badge.element.tagName.toLowerCase()).toBe('span')
      }

      // In Edit dialog:
      await wrapper.findAll('[data-test="dict-item-row"]')[0].find('[data-test="btn-edit-dict-item"]').trigger('click')
      await flushPromises()

      const editDialog = wrapper.find('[data-test="dict-item-dialog"]')
      expect(editDialog.find('[data-test="btn-delete"]').exists()).toBe(false)
      expect(editDialog.find('[data-test="form-status"]').exists()).toBe(false)
      expect(editDialog.findAll('select').length).toBe(0)
      expect(editDialog.findAll('input[type="checkbox"]').length).toBe(0)
    })
  })
})
