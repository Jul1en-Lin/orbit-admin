import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
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

describe('account create validation, duplicate prevention and failure feedback (Issue 29)', () => {
  describe('Client-side validation before submission', () => {
    it('displays required field error messages and prevents sending HTTP request when fields are empty', async () => {
      mockCommonEndpoints()

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      // Open create dialog
      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      // Initially no field error messages are visible
      expect(wrapper.find('[data-test="error-create-identity"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="error-create-phone"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="error-create-password"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="error-create-nickname"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="error-create-status"]').exists()).toBe(false)

      // Trigger form submission
      await wrapper.find('[data-test="create-account-form"]').trigger('submit.prevent')
      await nextTick()

      // Field error messages must now be displayed
      const identityErr = wrapper.find('[data-test="error-create-identity"]')
      const phoneErr = wrapper.find('[data-test="error-create-phone"]')
      const passwordErr = wrapper.find('[data-test="error-create-password"]')
      const nicknameErr = wrapper.find('[data-test="error-create-nickname"]')
      const statusErr = wrapper.find('[data-test="error-create-status"]')

      expect(identityErr.exists()).toBe(true)
      expect(identityErr.text()).toContain('请选择身份')

      expect(phoneErr.exists()).toBe(true)
      expect(phoneErr.text()).toContain('请输入手机号')

      expect(passwordErr.exists()).toBe(true)
      expect(passwordErr.text()).toContain('请输入密码')

      expect(nicknameErr.exists()).toBe(true)
      expect(nicknameErr.text()).toContain('请输入昵称')

      expect(statusErr.exists()).toBe(true)
      expect(statusErr.text()).toContain('请选择状态')

      // Absolutely NO HTTP request sent
      expect(httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')).toHaveLength(0)
    })

    it('validates password format (1-20 alphanumeric chars) and blocks submission on invalid characters', async () => {
      mockCommonEndpoints()

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      // Fill in all fields with valid inputs except password containing invalid special chars
      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13800005555')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('测试密码校验')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')
      await wrapper.find('[data-test="create-form-password"]').setValue('Invalid#Password!')

      // Trigger submit
      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()

      // Password error message must be shown
      const pwdError = wrapper.find('[data-test="error-create-password"]')
      expect(pwdError.exists()).toBe(true)
      expect(pwdError.text()).toContain('密码需为1-20位英文字母或数字')

      // No HTTP request sent
      expect(httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')).toHaveLength(0)

      // Try password with spaces
      await wrapper.find('[data-test="create-form-password"]').setValue('pass word')
      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-test="error-create-password"]').text()).toContain('密码需为1-20位英文字母或数字')
      expect(httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')).toHaveLength(0)

      // Enter valid alphanumeric password
      await wrapper.find('[data-test="create-form-password"]').setValue('ValidPass123')
      await nextTick()

      // Error message is cleared
      expect(wrapper.find('[data-test="error-create-password"]').exists()).toBe(false)
    })

    it('rejects whitespace-only phone number and nickname', async () => {
      mockCommonEndpoints()

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('   ')
      await wrapper.find('[data-test="create-form-password"]').setValue('Password123')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('   ')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')

      await wrapper.find('[data-test="create-account-form"]').trigger('submit.prevent')
      await nextTick()

      expect(wrapper.find('[data-test="error-create-phone"]').text()).toContain('请输入手机号')
      expect(wrapper.find('[data-test="error-create-nickname"]').text()).toContain('请输入昵称')
      expect(httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')).toHaveLength(0)
    })

    it('validates fields on blur and clears errors upon input', async () => {
      mockCommonEndpoints()

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      // Phone field blur without content
      const phoneInput = wrapper.find('[data-test="create-form-phone"]')
      await phoneInput.trigger('blur')
      await nextTick()

      expect(wrapper.find('[data-test="error-create-phone"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="error-create-phone"]').text()).toContain('请输入手机号')

      // Type valid phone
      await phoneInput.setValue('13800006666')
      await phoneInput.trigger('input')
      await nextTick()

      expect(wrapper.find('[data-test="error-create-phone"]').exists()).toBe(false)
    })
  })

  describe('Submitting state: duplicate prevention and modal lock', () => {
    it('disables submit button with loading state and prevents duplicate HTTP requests while in flight', async () => {
      mockCommonEndpoints()

      let resolveRequest!: (value: unknown) => void
      const pendingRequest = new Promise((resolve) => {
        resolveRequest = resolve
      })

      httpMock.onPost('/sys_user/add_edit').reply(async () => {
        await pendingRequest
        return [200, { code: 200000, msg: '操作成功', data: 2005 }]
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13800007777')
      await wrapper.find('[data-test="create-form-password"]').setValue('ValidPass888')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('并发测试')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')

      const submitBtn = wrapper.find('[data-test="btn-submit-create"]')
      expect(submitBtn.attributes('disabled')).toBeUndefined()

      // First submit
      await submitBtn.trigger('click')
      await nextTick()

      // Verify in-flight loading state
      expect(submitBtn.text()).toContain('提交中...')
      expect(submitBtn.attributes('disabled')).toBeDefined()

      // Attempt duplicate submits while in flight
      await submitBtn.trigger('click')
      await wrapper.find('[data-test="create-account-form"]').trigger('submit.prevent')
      await nextTick()

      // Check request count so far - MUST be exactly 1
      expect(httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')).toHaveLength(1)

      // Resolve the pending request
      resolveRequest(null)
      await flushPromises()

      // Finished without duplicate calls
      expect(httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')).toHaveLength(1)
    })

    it('prohibits closing dialog via cancel button, before-close or dialog escape/backdrop while in flight', async () => {
      mockCommonEndpoints()

      let resolveRequest!: (value: unknown) => void
      const pendingRequest = new Promise((resolve) => {
        resolveRequest = resolve
      })

      httpMock.onPost('/sys_user/add_edit').reply(async () => {
        await pendingRequest
        return [200, { code: 200000, msg: '操作成功', data: 2006 }]
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13800008888')
      await wrapper.find('[data-test="create-form-password"]').setValue('ValidPass999')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('锁定测试')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')

      const submitBtn = wrapper.find('[data-test="btn-submit-create"]')
      const cancelBtn = wrapper.find('[data-test="btn-cancel-create"]')

      // Submit
      await submitBtn.trigger('click')
      await nextTick()

      // While in-flight:
      // Cancel button must be disabled
      expect(cancelBtn.attributes('disabled')).toBeDefined()

      // Clicking cancel must NOT close dialog
      await cancelBtn.trigger('click')
      await nextTick()
      expect(wrapper.find('[data-test="create-account-dialog"]').exists()).toBe(true)

      // Close 'X' button in header must not be rendered when show-close is disabled
      expect(wrapper.find('.el-dialog__headerbtn').exists()).toBe(false)

      // Form inputs should also be disabled to prevent modifications
      expect(wrapper.find('[data-test="create-form-identity"]').attributes('disabled')).toBeDefined()
      expect(wrapper.find('[data-test="create-form-phone"]').attributes('disabled')).toBeDefined()
      expect(wrapper.find('[data-test="create-form-password"]').attributes('disabled')).toBeDefined()
      expect(wrapper.find('[data-test="create-form-nickname"]').attributes('disabled')).toBeDefined()
      expect(wrapper.find('[data-test="create-form-status"]').attributes('disabled')).toBeDefined()
      expect(wrapper.find('[data-test="create-form-remark"]').attributes('disabled')).toBeDefined()

      // Clicking backdrop/overlay does not trigger leave or close dialog
      const overlay = wrapper.find('.el-overlay')
      await overlay.trigger('click')
      await nextTick()
      expect(wrapper.find('[data-test="create-account-dialog"]').exists()).toBe(true)
      expect(overlay.classes()).not.toContain('dialog-fade-leave-active')

      // Pressing Escape does not close dialog
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }))
      await nextTick()
      expect(wrapper.find('[data-test="create-account-dialog"]').exists()).toBe(true)
      expect(overlay.classes()).not.toContain('dialog-fade-leave-active')

      // Complete request
      resolveRequest(null)
      await flushPromises()

      // Dialog now initiates leave transition on success
      expect(overlay.classes()).toContain('dialog-fade-leave-active')
    })
  })

  describe('Failure feedback: preserves form data and provides single feedback', () => {
    it('preserves all entered form data on API 400 error and displays single error feedback', async () => {
      mockCommonEndpoints()

      httpMock.onPost('/sys_user/add_edit').reply(400, {
        code: 400000,
        msg: '手机号已经被占用',
        data: null,
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      await wrapper.find('[data-test="create-form-identity"]').setValue('super_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13800001001')
      await wrapper.find('[data-test="create-form-password"]').setValue('KeepPassword123')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('保留资料测试')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')
      await wrapper.find('[data-test="create-form-remark"]').setValue('保留的备注')

      // Submit
      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()
      await flushPromises()

      // Dialog MUST remain open
      expect(wrapper.find('[data-test="create-account-dialog"]').exists()).toBe(true)

      // All entered values must be preserved
      const identitySelect = wrapper.find('[data-test="create-form-identity"]').element as HTMLSelectElement
      const phoneInput = wrapper.find('[data-test="create-form-phone"]').element as HTMLInputElement
      const passwordInput = wrapper.find('[data-test="create-form-password"]').element as HTMLInputElement
      const nicknameInput = wrapper.find('[data-test="create-form-nickname"]').element as HTMLInputElement
      const statusSelect = wrapper.find('[data-test="create-form-status"]').element as HTMLSelectElement
      const remarkInput = wrapper.find('[data-test="create-form-remark"]').element as HTMLTextAreaElement

      expect(identitySelect.value).toBe('super_admin')
      expect(phoneInput.value).toBe('13800001001')
      expect(passwordInput.value).toBe('KeepPassword123')
      expect(nicknameInput.value).toBe('保留资料测试')
      expect(statusSelect.value).toBe('enable')
      expect(remarkInput.value).toBe('保留的备注')

      // Single error feedback is displayed
      const errorAlerts = wrapper.findAll('[data-test="create-error-message"]')
      expect(errorAlerts).toHaveLength(1)
      expect(errorAlerts[0].text()).toContain('手机号已经被占用')
    })

    it('allows operator to modify input and successfully retry without losing unchanged fields', async () => {
      mockCommonEndpoints()

      let submitCount = 0
      httpMock.onPost('/sys_user/add_edit').reply((config) => {
        submitCount++
        const body = JSON.parse(config.data as string)
        if (body.phoneNumber === '13800001001') {
          return [400, { code: 400000, msg: '手机号已经被占用', data: null }]
        }
        return [200, { code: 200000, msg: '操作成功', data: 2007 }]
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13800001001')
      await wrapper.find('[data-test="create-form-password"]').setValue('SecurePass1')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('重试成功员')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')
      await wrapper.find('[data-test="create-form-remark"]').setValue('保留不变的备注')

      // Submit once -> fails
      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()
      await flushPromises()

      expect(wrapper.find('[data-test="create-error-message"]').text()).toContain('手机号已经被占用')

      // Operator changes ONLY the phone number
      await wrapper.find('[data-test="create-form-phone"]').setValue('13800009999')

      // Resubmit
      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()
      await flushPromises()

      expect(submitCount).toBe(2)

      // Verified second call had updated phone with original unchanged fields
      const addEditCalls = httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')
      expect(addEditCalls).toHaveLength(2)
      const secondCall = JSON.parse(addEditCalls[1].data as string)
      expect(secondCall).toEqual({
        identity: 'platform_admin',
        phoneNumber: '13800009999',
        password: 'SecurePass1',
        nickName: '重试成功员',
        status: 'enable',
        remark: '保留不变的备注',
      })

      // Dialog is now closed on success (in leave transition)
      const overlay = wrapper.find('.el-overlay')
      expect(overlay.classes()).toContain('dialog-fade-leave-active')
    })

    it('handles 500 server error and network error with preserved inputs and single feedback', async () => {
      mockCommonEndpoints()

      // Test 500 internal server error
      httpMock.onPost('/sys_user/add_edit').reply(500, {
        code: 500000,
        msg: '数据库异常',
        data: null,
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13800003333')
      await wrapper.find('[data-test="create-form-password"]').setValue('Pass500Test')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('服务器错误测试')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')

      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()
      await flushPromises()

      // Dialog stays open, fields preserved
      expect(wrapper.find('[data-test="create-account-dialog"]').exists()).toBe(true)
      const phoneElem = wrapper.find('[data-test="create-form-phone"]').element as HTMLInputElement
      expect(phoneElem.value).toBe('13800003333')

      // Single alert displayed
      expect(wrapper.findAll('[data-test="create-error-message"]')).toHaveLength(1)
      expect(wrapper.find('[data-test="create-error-message"]').text()).toContain('数据库异常')

      // Now test network error
      httpMock.onPost('/sys_user/add_edit').networkError()

      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()
      await flushPromises()

      // Dialog still open, still only 1 alert banner
      expect(wrapper.find('[data-test="create-account-dialog"]').exists()).toBe(true)
      expect(wrapper.findAll('[data-test="create-error-message"]')).toHaveLength(1)
      expect(wrapper.find('[data-test="create-error-message"]').text()).toContain('网络请求失败')
      expect(phoneElem.value).toBe('13800003333')
    })
  })
})
