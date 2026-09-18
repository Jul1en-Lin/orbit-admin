import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { apiClient } from '../src/api/client'
import { useAuthStore } from '../src/auth/store'
import { httpMock, mountApplication } from './harness'

const initialAccounts = [
  {
    userId: 1001,
    nickName: '林舟',
    phoneNumber: '13800001001',
    identity: 'super_admin',
    status: 'enable',
    remark: '系统日常维护',
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

function mockCommonEndpoints() {
  sessionStorage.setItem('accessToken', 'token-admin-1')
  httpMock.onGet('/sys_user/login/get_info').reply(200, {
    code: 200000,
    msg: '操作成功',
    data: {
      nickName: '林舟',
      userId: 1001,
      phoneNumber: '13800001001',
      identity: 'super_admin',
      status: 'enable',
    },
  })

  httpMock.onGet('/dictionary_data/list').reply((config) => {
    const typeKey = config.params?.typeKey
    if (typeKey === 'admin') {
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: {
            totals: 2,
            totalPages: 1,
            list: [
              { id: 1, typeKey: 'admin', dataKey: 'super_admin', value: '超级管理员', sort: 1, status: 1 },
              { id: 2, typeKey: 'admin', dataKey: 'platform_admin', value: '平台管理员', sort: 2, status: 1 },
            ],
          },
        },
      ]
    }
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
              { id: 10, typeKey: 'common_status', dataKey: 'enable', value: '启用', sort: 1, status: 1 },
              { id: 11, typeKey: 'common_status', dataKey: 'disable', value: '停用', sort: 2, status: 1 },
            ],
          },
        },
      ]
    }
    return [404, { code: 404001, msg: '未找到字典类型', data: null }]
  })

  httpMock.onPost('/sys_user/list').reply(200, {
    code: 200000,
    msg: '操作成功',
    data: [...initialAccounts],
  })
}

describe('dirty form confirmation and auth expiry cleanup (Issue 31)', () => {
  beforeEach(() => {
    mockCommonEndpoints()
  })

  describe('Clean form: closes immediately without prompt', () => {
    it('closes dialog immediately on cancel button without confirmation prompt', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      // Open create dialog
      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-test="create-account-dialog"]').exists()).toBe(true)

      // Click cancel button while form is untouched
      await wrapper.find('[data-test="btn-cancel-create"]').trigger('click')
      await nextTick()

      // Dialog is closed without invoking window.confirm
      expect(wrapper.find('.el-overlay').classes()).toContain('dialog-fade-leave-active')
      expect(confirmSpy).not.toHaveBeenCalled()
    })

    it('closes dialog immediately on modal close "X" without confirmation prompt', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      const closeX = wrapper.find('.el-dialog__headerbtn')
      expect(closeX.exists()).toBe(true)
      await closeX.trigger('click')
      await nextTick()

      expect(wrapper.find('.el-overlay').classes()).toContain('dialog-fade-leave-active')
      expect(confirmSpy).not.toHaveBeenCalled()
    })

    it('closes dialog immediately on Escape key without confirmation prompt', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }))
      await nextTick()

      expect(wrapper.find('.el-overlay').classes()).toContain('dialog-fade-leave-active')
      expect(confirmSpy).not.toHaveBeenCalled()
    })

    it('closes dialog immediately on backdrop overlay click without confirmation prompt', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      const overlayDialog = wrapper.find('.el-overlay-dialog')
      await overlayDialog.trigger('mousedown')
      await overlayDialog.trigger('mouseup')
      await overlayDialog.trigger('click')
      await nextTick()

      expect(wrapper.find('.el-overlay').classes()).toContain('dialog-fade-leave-active')
      expect(confirmSpy).not.toHaveBeenCalled()
    })

    it('allows in-app route navigation without prompt when form is clean', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-test="create-account-dialog"]').exists()).toBe(true)

      // Navigate to workbench
      await router.push('/workbench')
      await flushPromises()

      // Route changed smoothly, no confirm prompt
      expect(router.currentRoute.value.path).toBe('/workbench')
      expect(confirmSpy).not.toHaveBeenCalled()
    })

    it('closes without prompt if user inputs text and then clears it back to empty', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      // Fill then clear
      const phoneInput = wrapper.find('[data-test="create-form-phone"]')
      await phoneInput.setValue('13800001234')
      await phoneInput.setValue('')
      await nextTick()

      // Cancel button
      await wrapper.find('[data-test="btn-cancel-create"]').trigger('click')
      await nextTick()

      expect(wrapper.find('.el-overlay').classes()).toContain('dialog-fade-leave-active')
      expect(confirmSpy).not.toHaveBeenCalled()
    })
  })

  describe('Dirty form: prompts confirmation before discarding', () => {
    it('prompts on cancel button; canceling retains form while confirming closes and clears form', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13911112222')
      await wrapper.find('[data-test="create-form-password"]').setValue('SecretPass1')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('脏表单用户')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')
      await wrapper.find('[data-test="create-form-remark"]').setValue('未保存的修改')

      // Case 1: User cancels the discard prompt
      confirmSpy.mockReturnValueOnce(false)
      await wrapper.find('[data-test="btn-cancel-create"]').trigger('click')
      await nextTick()

      expect(confirmSpy).toHaveBeenCalledWith('表单有未保存的修改，确定放弃吗？')
      // Dialog remains open
      expect(wrapper.find('[data-test="create-account-dialog"]').exists()).toBe(true)
      expect(wrapper.find('.el-overlay').classes()).not.toContain('dialog-fade-leave-active')
      // Values are preserved
      expect((wrapper.find('[data-test="create-form-phone"]').element as HTMLInputElement).value).toBe('13911112222')
      expect((wrapper.find('[data-test="create-form-remark"]').element as HTMLTextAreaElement).value).toBe(
        '未保存的修改',
      )

      // Case 2: User confirms the discard prompt
      confirmSpy.mockReturnValueOnce(true)
      await wrapper.find('[data-test="btn-cancel-create"]').trigger('click')
      await nextTick()

      expect(confirmSpy).toHaveBeenCalledTimes(2)
      expect(wrapper.find('.el-overlay').classes()).toContain('dialog-fade-leave-active')

      // Reopening shows fresh empty form
      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      expect((wrapper.find('[data-test="create-form-phone"]').element as HTMLInputElement).value).toBe('')
      expect((wrapper.find('[data-test="create-form-remark"]').element as HTMLTextAreaElement).value).toBe('')
    })

    it('prompts on modal close "X"; canceling retains form while confirming closes and clears form', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      await wrapper.find('[data-test="create-form-nickname"]').setValue('修改昵称')

      // Cancel discard
      confirmSpy.mockReturnValueOnce(false)
      const closeX = wrapper.find('.el-dialog__headerbtn')
      await closeX.trigger('click')
      await nextTick()

      expect(confirmSpy).toHaveBeenCalledWith('表单有未保存的修改，确定放弃吗？')
      expect(wrapper.find('.el-overlay').classes()).not.toContain('dialog-fade-leave-active')
      expect((wrapper.find('[data-test="create-form-nickname"]').element as HTMLInputElement).value).toBe('修改昵称')

      // Confirm discard
      confirmSpy.mockReturnValueOnce(true)
      await closeX.trigger('click')
      await nextTick()

      expect(wrapper.find('.el-overlay').classes()).toContain('dialog-fade-leave-active')
    })

    it('prompts on Escape key; canceling retains form while confirming closes and clears form', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      await wrapper.find('[data-test="create-form-password"]').setValue('TempPass999')

      // Cancel discard
      confirmSpy.mockReturnValueOnce(false)
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }))
      await nextTick()

      expect(confirmSpy).toHaveBeenCalledWith('表单有未保存的修改，确定放弃吗？')
      expect(wrapper.find('.el-overlay').classes()).not.toContain('dialog-fade-leave-active')
      expect((wrapper.find('[data-test="create-form-password"]').element as HTMLInputElement).value).toBe('TempPass999')

      // Confirm discard
      confirmSpy.mockReturnValueOnce(true)
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }))
      await nextTick()

      expect(wrapper.find('.el-overlay').classes()).toContain('dialog-fade-leave-active')
    })

    it('prompts on backdrop overlay click; canceling retains form while confirming closes and clears form', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      await wrapper.find('[data-test="create-form-status"]').setValue('enable')

      const overlayDialog = wrapper.find('.el-overlay-dialog')

      // Cancel discard
      confirmSpy.mockReturnValueOnce(false)
      await overlayDialog.trigger('mousedown')
      await overlayDialog.trigger('mouseup')
      await overlayDialog.trigger('click')
      await nextTick()

      expect(confirmSpy).toHaveBeenCalledWith('表单有未保存的修改，确定放弃吗？')
      expect(wrapper.find('.el-overlay').classes()).not.toContain('dialog-fade-leave-active')

      // Confirm discard
      confirmSpy.mockReturnValueOnce(true)
      await overlayDialog.trigger('mousedown')
      await overlayDialog.trigger('mouseup')
      await overlayDialog.trigger('click')
      await nextTick()

      expect(wrapper.find('.el-overlay').classes()).toContain('dialog-fade-leave-active')
    })

    it('prompts on in-app route navigation; canceling aborts navigation while confirming navigates and clears form', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      await wrapper.find('[data-test="create-form-phone"]').setValue('13899990000')

      // Case 1: Cancel navigation prompt -> stays on /accounts with form intact
      confirmSpy.mockReturnValueOnce(false)
      await router.push('/workbench').catch(() => {})
      await flushPromises()

      expect(confirmSpy).toHaveBeenCalledWith('表单有未保存的修改，确定放弃吗？')
      expect(router.currentRoute.value.path).toBe('/accounts')
      expect(wrapper.find('[data-test="create-account-dialog"]').exists()).toBe(true)
      expect((wrapper.find('[data-test="create-form-phone"]').element as HTMLInputElement).value).toBe('13899990000')

      // Case 2: Confirm navigation prompt -> navigates to /workbench
      confirmSpy.mockReturnValueOnce(true)
      await router.push('/workbench')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/workbench')

      // Navigate back to /accounts: dialog is closed, form was discarded
      await router.push('/accounts')
      await flushPromises()
      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      expect((wrapper.find('[data-test="create-form-phone"]').element as HTMLInputElement).value).toBe('')
    })

    it('triggers dirty state if ANY individual field is modified', async () => {
      const fields: { selector: string; value: string; fieldName: string }[] = [
        { selector: '[data-test="create-form-identity"]', value: 'super_admin', fieldName: 'identity' },
        { selector: '[data-test="create-form-phone"]', value: '13800001111', fieldName: 'phoneNumber' },
        { selector: '[data-test="create-form-password"]', value: 'Pass1234', fieldName: 'password' },
        { selector: '[data-test="create-form-nickname"]', value: '单字段测试', fieldName: 'nickName' },
        { selector: '[data-test="create-form-status"]', value: 'enable', fieldName: 'status' },
        { selector: '[data-test="create-form-remark"]', value: '备注而已', fieldName: 'remark' },
      ]

      for (const field of fields) {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
        const { wrapper, router } = mountApplication('/accounts')
        await router.isReady()
        await flushPromises()

        await wrapper.find('[data-test="btn-create-account"]').trigger('click')
        await nextTick()

        // Modify only this one field
        await wrapper.find(field.selector).setValue(field.value)
        await nextTick()

        // Cancel button should prompt confirmation
        await wrapper.find('[data-test="btn-cancel-create"]').trigger('click')
        await nextTick()

        expect(confirmSpy).toHaveBeenCalledWith('表单有未保存的修改，确定放弃吗？')
      }
    })
  })

  describe('Auth expiry cleanup & no request replay', () => {
    it('discards uncommitted dirty form on API 401 response and does not replay write requests after re-login', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')

      // Configure add_edit to return 401
      httpMock.onPost('/sys_user/add_edit').reply(401, {
        code: 401000,
        msg: 'token is invalid',
        data: null,
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      // Fill in all required fields
      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13855556666')
      await wrapper.find('[data-test="create-form-password"]').setValue('ValidPassword123')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('失效测试用户')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')
      await wrapper.find('[data-test="create-form-remark"]').setValue('未提交的资料')

      // Submit the form
      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()
      await flushPromises()

      // 1. Exactly 1 POST request sent
      const addEditRequests = httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')
      expect(addEditRequests).toHaveLength(1)

      // 2. Auth expired: redirected to /login without confirmation prompt
      expect(router.currentRoute.value.path).toBe('/login')
      expect(confirmSpy).not.toHaveBeenCalled()
      expect(sessionStorage.getItem('accessToken')).toBeNull()

      // 3. User logs back in
      httpMock.onPost('/sys_user/login/password').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { accessToken: 'token-admin-new', expires: 43200000 },
      })
      httpMock.onGet('/sys_user/login/get_info').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: {
          nickName: '林舟',
          userId: 1001,
          phoneNumber: '13800001001',
          identity: 'super_admin',
          status: 'enable',
        },
      })

      const auth = useAuthStore()
      await auth.signIn('13800001001', 'password123')
      await router.push('/accounts')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/accounts')

      // 4. Critical: NO write request was replayed
      const allAddEditRequests = httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')
      expect(allAddEditRequests).toHaveLength(1) // Still exactly 1 from earlier, no replay!

      // 5. Open dialog again: it is completely clean and empty
      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      const phoneInput = wrapper.find('[data-test="create-form-phone"]').element as HTMLInputElement
      expect(phoneInput.value).toBe('')
      const remarkInput = wrapper.find('[data-test="create-form-remark"]').element as HTMLTextAreaElement
      expect(remarkInput.value).toBe('')
    })

    it('discards uncommitted dirty form immediately when background request returns 401', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      await wrapper.find('[data-test="create-form-phone"]').setValue('13877778888')

      // Simulate 401 on background query
      httpMock.onPost('/sys_user/list').reply(401, {
        code: 401000,
        msg: 'token is invalid',
        data: null,
      })

      // Trigger background list request
      await apiClient.post('/sys_user/list').catch(() => {})
      await flushPromises()

      // Redirected to login, no prompt blocked the user
      expect(router.currentRoute.value.path).toBe('/login')
      expect(confirmSpy).not.toHaveBeenCalled()
    })

    it('discards uncommitted dirty form immediately when auth.signOut() is invoked', async () => {
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      await wrapper.find('[data-test="create-form-nickname"]').setValue('登出测试')

      // Call signOut
      const auth = useAuthStore()
      auth.signOut()
      await nextTick()
      await flushPromises()

      // Dialog is closed
      expect(wrapper.find('.el-overlay').classes()).toContain('dialog-fade-leave-active')
    })
  })

  describe('Storage & beforeunload isolation', () => {
    it('does NOT add browser-level beforeunload listeners when entering dirty data', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      await wrapper.find('[data-test="create-form-phone"]').setValue('13800009999')
      await wrapper.find('[data-test="create-form-password"]').setValue('Pass1234')
      await nextTick()

      // Check all addEventListener calls
      const beforeUnloadCalls = addEventListenerSpy.mock.calls.filter(([type]) => type === 'beforeunload')
      expect(beforeUnloadCalls).toHaveLength(0)
    })

    it('does NOT persist uncommitted form data in localStorage or sessionStorage', async () => {
      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()

      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13888887777')
      await wrapper.find('[data-test="create-form-password"]').setValue('SensitivePass1')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('不落盘昵称')
      await wrapper.find('[data-test="create-form-remark"]').setValue('不落盘备注')
      await nextTick()

      // Verify localStorage is completely empty
      expect(localStorage.length).toBe(0)

      // Verify sessionStorage does NOT contain form data
      const sessionKeys: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key) sessionKeys.push(key)
      }
      expect(sessionKeys).toEqual(['accessToken'])
      expect(sessionStorage.getItem('accessToken')).toBe('token-admin-1')
      expect(sessionStorage.getItem('13888887777')).toBeNull()
      expect(sessionStorage.getItem('createForm')).toBeNull()
      expect(sessionStorage.getItem('SensitivePass1')).toBeNull()
    })
  })
})
