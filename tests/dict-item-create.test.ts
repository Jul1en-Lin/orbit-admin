import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { httpMock, mountApplication } from './harness'
import { createDictItem, type DictDataVO } from '../src/api/dict'

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

describe('dictionary item create operations (dict-item-create)', () => {
  beforeEach(() => {
    setupAuth()
  })

  describe('API function: createDictItem', () => {
    it('sends POST /dictionary_data/add with all fields and returns created ID', async () => {
      let requestBody: Record<string, unknown> | null = null
      httpMock.onPost('/dictionary_data/add').reply((config) => {
        requestBody = JSON.parse(config.data as string)
        return [200, { code: 200000, msg: '操作成功', data: 55 }]
      })

      const id = await createDictItem({
        typeKey: 'admin',
        dataKey: 'audit_admin',
        value: '审计管理员',
        sort: -1,
        remark: '合规审计人员',
      })

      expect(id).toBe(55)
      expect(requestBody).toEqual({
        typeKey: 'admin',
        dataKey: 'audit_admin',
        value: '审计管理员',
        sort: -1,
        remark: '合规审计人员',
      })
    })

    it('sends POST /dictionary_data/add omitting optional sort and remark when not provided', async () => {
      let requestBody: Record<string, unknown> | null = null
      httpMock.onPost('/dictionary_data/add').reply((config) => {
        requestBody = JSON.parse(config.data as string)
        return [200, { code: 200000, msg: '操作成功', data: 56 }]
      })

      const id = await createDictItem({
        typeKey: 'admin',
        dataKey: 'guest',
        value: '临时访客',
      })

      expect(id).toBe(56)
      expect(requestBody).toEqual({
        typeKey: 'admin',
        dataKey: 'guest',
        value: '临时访客',
      })
    })
  })

  describe('UI & Interaction', () => {
    it('a) renders "+ 新增字典项" button, opens dialog with belonging type, code, name, sort and remark fields', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItems },
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      const addBtn = wrapper.find('[data-test="btn-add-dict-item"]')
      expect(addBtn.exists()).toBe(true)
      expect(addBtn.text()).toContain('新增字典项')

      // Open dialog
      await addBtn.trigger('click')
      await flushPromises()

      const dialog = wrapper.find('[data-test="dict-item-dialog"]')
      expect(dialog.exists()).toBe(true)

      const title = wrapper.find('[data-test="dict-item-dialog-title"]')
      expect(title.text()).toBe('新增字典项')

      const typeKeyInput = wrapper.find('[data-test="form-type-key"]')
      const dataKeyInput = wrapper.find('[data-test="form-data-key"]')
      const valueInput = wrapper.find('[data-test="form-value"]')
      const sortInput = wrapper.find('[data-test="form-sort"]')
      const remarkInput = wrapper.find('[data-test="form-remark"]')
      const submitBtn = wrapper.find('[data-test="btn-submit-dict-item"]')
      const cancelBtn = wrapper.find('[data-test="btn-cancel-dict-item"]')

      expect(typeKeyInput.exists()).toBe(true)
      // Belonging type is displayed and read-only/disabled
      expect(typeKeyInput.attributes('disabled')).toBeDefined()
      expect((typeKeyInput.element as HTMLInputElement).value).toBe('admin')

      expect(dataKeyInput.exists()).toBe(true)
      expect(valueInput.exists()).toBe(true)
      expect(sortInput.exists()).toBe(true)
      expect(remarkInput.exists()).toBe(true)
      expect(submitBtn.exists()).toBe(true)
      expect(cancelBtn.exists()).toBe(true)
    })

    it('b) client-side validation rejects blank code and name, and validates integer sort', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItems },
      })

      let postCalled = false
      httpMock.onPost('/dictionary_data/add').reply(() => {
        postCalled = true
        return [200, { code: 200000, msg: '操作成功', data: 99 }]
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-add-dict-item"]').trigger('click')
      await flushPromises()

      const submitBtn = wrapper.find('[data-test="btn-submit-dict-item"]')
      const dataKeyInput = wrapper.find('[data-test="form-data-key"]')
      const valueInput = wrapper.find('[data-test="form-value"]')
      const sortInput = wrapper.find('[data-test="form-sort"]')

      // 1. Submit when empty
      await submitBtn.trigger('click')
      await flushPromises()

      expect(postCalled).toBe(false)
      expect(wrapper.find('[data-test="error-data-key"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="error-data-key"]').text()).toContain('请输入字典项编码')
      expect(wrapper.find('[data-test="error-value"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="error-value"]').text()).toContain('请输入字典项名称')
      expect(wrapper.find('[data-test="error-sort"]').exists()).toBe(false)

      // 2. Submit with whitespace-only code and name
      await dataKeyInput.setValue('   ')
      await valueInput.setValue(' \t ')
      await submitBtn.trigger('click')
      await flushPromises()

      expect(postCalled).toBe(false)
      expect(wrapper.find('[data-test="error-data-key"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="error-value"]').exists()).toBe(true)

      // 3. Sort integer validation: decimals and invalid strings rejected
      await dataKeyInput.setValue('test_key')
      await valueInput.setValue('测试名称')
      await sortInput.setValue('12.5')
      await submitBtn.trigger('click')
      await flushPromises()

      expect(postCalled).toBe(false)
      expect(wrapper.find('[data-test="error-sort"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="error-sort"]').text()).toContain('排序必须为整数')

      await sortInput.setValue('not-a-number')
      await submitBtn.trigger('click')
      await flushPromises()

      expect(postCalled).toBe(false)
      expect(wrapper.find('[data-test="error-sort"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="error-sort"]').text()).toContain('排序必须为整数')

      // 4. Valid sort: negative integer allowed
      await sortInput.setValue('-5')
      expect(wrapper.find('[data-test="error-sort"]').exists()).toBe(false)

      // 5. Valid sort: zero allowed
      await sortInput.setValue('0')
      expect(wrapper.find('[data-test="error-sort"]').exists()).toBe(false)

      // 6. Valid sort: positive integer allowed
      await sortInput.setValue('100')
      expect(wrapper.find('[data-test="error-sort"]').exists()).toBe(false)

      // 7. Empty sort allowed (optional)
      await sortInput.setValue('')
      expect(wrapper.find('[data-test="error-sort"]').exists()).toBe(false)
    })

    it('c) successful add calls POST /dictionary_data/add with correct payload, closes dialog, resets to page 1 and refreshes', async () => {
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
              totals: 15,
              totalPages: 2,
              list: reqPage === 2 ? mockDictItems.slice(1) : mockDictItems,
            },
          },
        ]
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      // Navigate to page 2 first
      const nextBtn = wrapper.find('[data-test="page-next"]')
      await nextBtn.trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-test="page-current"]').text()).toContain('2')
      expect(listCalls[listCalls.length - 1]).toMatchObject({ pageNo: 2 })

      // Open add dialog
      await wrapper.find('[data-test="btn-add-dict-item"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-data-key"]').setValue('auditor')
      await wrapper.find('[data-test="form-value"]').setValue('审计员')
      await wrapper.find('[data-test="form-sort"]').setValue('-2')
      await wrapper.find('[data-test="form-remark"]').setValue('系统审计安全人员')

      let addPayload: Record<string, unknown> | null = null
      httpMock.onPost('/dictionary_data/add').reply((config) => {
        addPayload = JSON.parse(config.data)
        return [200, { code: 200000, msg: '操作成功', data: 60 }]
      })

      // Submit form
      await wrapper.find('[data-test="btn-submit-dict-item"]').trigger('click')
      await flushPromises()

      // Verified POST payload
      expect(addPayload).toEqual({
        typeKey: 'admin',
        dataKey: 'auditor',
        value: '审计员',
        sort: -2,
        remark: '系统审计安全人员',
      })

      // Dialog is closed
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)

      // Re-fetched list starting at page 1
      const lastCall = listCalls[listCalls.length - 1]
      expect(lastCall).toMatchObject({ pageNo: 1 })
      expect(wrapper.find('[data-test="page-current"]').text()).toContain('1')
    })

    it('d) in-flight submission locks submit & cancel buttons and prevents dialog close', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItems },
      })

      let resolveAddPromise!: (value: [number, unknown]) => void
      httpMock.onPost('/dictionary_data/add').reply(
        () =>
          new Promise((resolve) => {
            resolveAddPromise = resolve
          }),
      )

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-add-dict-item"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-data-key"]').setValue('op_admin')
      await wrapper.find('[data-test="form-value"]').setValue('运维管理员')

      // Trigger submit
      const submitBtn = wrapper.find('[data-test="btn-submit-dict-item"]')
      const cancelBtn = wrapper.find('[data-test="btn-cancel-dict-item"]')

      await submitBtn.trigger('click')
      await nextTick()

      // In flight: button shows submitting state and is disabled
      expect(submitBtn.attributes('disabled')).toBeDefined()
      expect(submitBtn.text()).toContain('提交中...')
      expect(cancelBtn.attributes('disabled')).toBeDefined()

      // Attempting to click cancel while in-flight does nothing
      await cancelBtn.trigger('click')
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(true)

      // Resolve pending request
      resolveAddPromise([200, { code: 200000, msg: '操作成功', data: 61 }])
      await flushPromises()

      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)
    })

    it('e) failure retains form inputs and displays error message', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItems },
      })

      httpMock.onPost('/dictionary_data/add').reply(500, {
        code: 500000,
        msg: '字典项键已存在',
        data: null,
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-add-dict-item"]').trigger('click')
      await flushPromises()

      const dataKeyInput = wrapper.find('[data-test="form-data-key"]')
      const valueInput = wrapper.find('[data-test="form-value"]')
      const remarkInput = wrapper.find('[data-test="form-remark"]')

      await dataKeyInput.setValue('super_admin')
      await valueInput.setValue('超级管理员')
      await remarkInput.setValue('尝试重复的键')

      await wrapper.find('[data-test="btn-submit-dict-item"]').trigger('click')
      await flushPromises()

      // Dialog stays open
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(true)

      // Inputs retained
      expect((dataKeyInput.element as HTMLInputElement).value).toBe('super_admin')
      expect((valueInput.element as HTMLInputElement).value).toBe('超级管理员')
      expect((remarkInput.element as HTMLTextAreaElement).value).toBe('尝试重复的键')

      // Displays server error message
      const errorMsg = wrapper.find('[data-test="dict-item-error-message"]')
      expect(errorMsg.exists()).toBe(true)
      expect(errorMsg.text()).toContain('字典项键已存在')

      // Submit unlocked
      expect(wrapper.find('[data-test="btn-submit-dict-item"]').attributes('disabled')).toBeUndefined()
    })

    it('f) uncertain write error (timeout): retains inputs, unlocks submission, displays prompt, no auto-retry', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItems },
      })

      httpMock.onPost('/dictionary_data/add').timeout()

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-add-dict-item"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-data-key"]').setValue('timeout_key')
      await wrapper.find('[data-test="form-value"]').setValue('超时项')

      await wrapper.find('[data-test="btn-submit-dict-item"]').trigger('click')
      await flushPromises()

      // Dialog stays open, inputs preserved
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(true)
      expect((wrapper.find('[data-test="form-data-key"]').element as HTMLInputElement).value).toBe('timeout_key')

      // Error notice displays prompt
      const errorMsg = wrapper.find('[data-test="dict-item-error-message"]')
      expect(errorMsg.exists()).toBe(true)
      expect(errorMsg.text()).toContain('提交结果未确认，请先查询核实')

      // Unlocked, no auto retry
      expect(wrapper.find('[data-test="btn-submit-dict-item"]').attributes('disabled')).toBeUndefined()
      expect(httpMock.history.post.filter((r) => r.url === '/dictionary_data/add')).toHaveLength(1)
    })

    it('g) successful write but subsequent list refresh failure shows page-level warning and does not induce re-submitting', async () => {
      // First list load succeeds
      httpMock.onGet('/dictionary_data/list').replyOnce(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItems },
      })

      // Add succeeds
      httpMock.onPost('/dictionary_data/add').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: 77,
      })

      // Subsequent list refresh fails
      httpMock.onGet('/dictionary_data/list').reply(500, {
        code: 500000,
        msg: '列表查询失败',
        data: null,
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-add-dict-item"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-data-key"]').setValue('refresh_fail_key')
      await wrapper.find('[data-test="form-value"]').setValue('刷新失败项')

      await wrapper.find('[data-test="btn-submit-dict-item"]').trigger('click')
      await flushPromises()

      // Dialog closed
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)

      // Warning banner displayed on page
      const warningBanner = wrapper.find('[data-test="create-refresh-warning"]')
      const refreshNotice = wrapper.find('[data-test="refresh-failure-notice"]')
      expect(warningBanner.exists()).toBe(true)
      expect(refreshNotice.exists()).toBe(true)
      expect(refreshNotice.text()).toContain('字典项创建成功')
      expect(refreshNotice.text()).toContain('列表刷新失败')
      expect(refreshNotice.text()).toContain('无需重复提交')

      // Table shows error state
      expect(wrapper.find('[data-test="state-error"]').exists()).toBe(true)
    })

    describe('h) dirty form confirmation', () => {
      it('clean form closes immediately on cancel without prompt', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm')
        httpMock.onGet('/dictionary_data/list').reply(200, {
          code: 200000,
          msg: '操作成功',
          data: { totals: 2, totalPages: 1, list: mockDictItems },
        })

        const { wrapper, router } = mountApplication('/dictionaries/admin/items')
        await router.isReady()
        await flushPromises()

        await wrapper.find('[data-test="btn-add-dict-item"]').trigger('click')
        await flushPromises()

        // Click cancel while clean
        await wrapper.find('[data-test="btn-cancel-dict-item"]').trigger('click')
        await flushPromises()

        expect(confirmSpy).not.toHaveBeenCalled()
        expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)
        confirmSpy.mockRestore()
      })

      it('clean form: typing then clearing fields closes immediately without prompt', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm')
        httpMock.onGet('/dictionary_data/list').reply(200, {
          code: 200000,
          msg: '操作成功',
          data: { totals: 2, totalPages: 1, list: mockDictItems },
        })

        const { wrapper, router } = mountApplication('/dictionaries/admin/items')
        await router.isReady()
        await flushPromises()

        await wrapper.find('[data-test="btn-add-dict-item"]').trigger('click')
        await flushPromises()

        // Type then clear
        await wrapper.find('[data-test="form-data-key"]').setValue('temp')
        await wrapper.find('[data-test="form-data-key"]').setValue('')

        await wrapper.find('[data-test="btn-cancel-dict-item"]').trigger('click')
        await flushPromises()

        expect(confirmSpy).not.toHaveBeenCalled()
        expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)
        confirmSpy.mockRestore()
      })

      it('dirty form prompts confirmation on cancel; user rejection retains data', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
        httpMock.onGet('/dictionary_data/list').reply(200, {
          code: 200000,
          msg: '操作成功',
          data: { totals: 2, totalPages: 1, list: mockDictItems },
        })

        const { wrapper, router } = mountApplication('/dictionaries/admin/items')
        await router.isReady()
        await flushPromises()

        await wrapper.find('[data-test="btn-add-dict-item"]').trigger('click')
        await flushPromises()

        await wrapper.find('[data-test="form-data-key"]').setValue('unsaved_key')

        // Click cancel
        await wrapper.find('[data-test="btn-cancel-dict-item"]').trigger('click')
        await flushPromises()

        expect(confirmSpy).toHaveBeenCalledWith('表单有未保存的修改，确定放弃吗？')
        // Still open and value retained
        expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(true)
        expect((wrapper.find('[data-test="form-data-key"]').element as HTMLInputElement).value).toBe('unsaved_key')
        confirmSpy.mockRestore()
      })

      it('dirty form prompts confirmation on cancel; user confirmation closes and resets form', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
        httpMock.onGet('/dictionary_data/list').reply(200, {
          code: 200000,
          msg: '操作成功',
          data: { totals: 2, totalPages: 1, list: mockDictItems },
        })

        const { wrapper, router } = mountApplication('/dictionaries/admin/items')
        await router.isReady()
        await flushPromises()

        await wrapper.find('[data-test="btn-add-dict-item"]').trigger('click')
        await flushPromises()

        await wrapper.find('[data-test="form-value"]').setValue('未保存名称')

        await wrapper.find('[data-test="btn-cancel-dict-item"]').trigger('click')
        await flushPromises()

        expect(confirmSpy).toHaveBeenCalledWith('表单有未保存的修改，确定放弃吗？')
        expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)

        // Reopen dialog -> form is clean
        await wrapper.find('[data-test="btn-add-dict-item"]').trigger('click')
        await flushPromises()
        expect((wrapper.find('[data-test="form-value"]').element as HTMLInputElement).value).toBe('')
        confirmSpy.mockRestore()
      })

      it('dirty form prompts confirmation on in-app route navigation', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
        httpMock.onGet('/dictionary_data/list').reply(200, {
          code: 200000,
          msg: '操作成功',
          data: { totals: 2, totalPages: 1, list: mockDictItems },
        })

        const { wrapper, router } = mountApplication('/dictionaries/admin/items')
        await router.isReady()
        await flushPromises()

        await wrapper.find('[data-test="btn-add-dict-item"]').trigger('click')
        await flushPromises()

        await wrapper.find('[data-test="form-sort"]').setValue('10')

        // Attempt route navigation
        await router.push('/dictionaries')
        await flushPromises()

        expect(confirmSpy).toHaveBeenCalledWith('表单有未保存的修改，确定放弃吗？')
        // Still on dict items page
        expect(router.currentRoute.value.path).toBe('/dictionaries/admin/items')
        expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(true)

        // Confirm discard on next attempt
        confirmSpy.mockReturnValue(true)
        await router.push('/dictionaries')
        await flushPromises()

        expect(router.currentRoute.value.path).toBe('/dictionaries')
        confirmSpy.mockRestore()
      })
    })

    it('i) auth expiry (401) immediately closes dialog and cleans up without prompt', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockDictItems },
      })

      httpMock.onPost('/dictionary_data/add').reply(401, {
        code: 401004,
        msg: '登录已失效',
        data: null,
      })

      const { wrapper, router } = mountApplication('/dictionaries/admin/items')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-add-dict-item"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-data-key"]').setValue('expired_key')
      await wrapper.find('[data-test="form-value"]').setValue('失效项')

      await wrapper.find('[data-test="btn-submit-dict-item"]').trigger('click')
      await flushPromises()

      // Dialog closed immediately, no prompt
      expect(confirmSpy).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="dict-item-dialog"]').exists()).toBe(false)
      confirmSpy.mockRestore()
    })
  })
})
