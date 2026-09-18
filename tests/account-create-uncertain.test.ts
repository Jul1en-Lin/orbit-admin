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

describe('uncertain write results and refresh failure handling (Issue 30)', () => {
  describe('Uncertain write results (timeout / network abort)', () => {
    it('handles request timeout: preserves form inputs, unlocks submission, displays prompt, and does not auto-retry', async () => {
      mockCommonEndpoints()

      // Configure add_edit to timeout
      httpMock.onPost('/sys_user/add_edit').timeout()

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      // Open create dialog
      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      // Fill in all required form fields and remark
      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13811112222')
      await wrapper.find('[data-test="create-form-password"]').setValue('SafePassword123')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('超时测试员')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')
      await wrapper.find('[data-test="create-form-remark"]').setValue('需要核实的账号')

      // Submit the form
      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()
      await flushPromises()

      // 1. Exactly one POST request sent, NO automatic retry
      const addEditRequests = httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')
      expect(addEditRequests).toHaveLength(1)

      // 2. Dialog remains open
      expect(wrapper.find('[data-test="create-account-dialog"]').exists()).toBe(true)

      // 3. Submission lock is released
      const submitBtn = wrapper.find('[data-test="btn-submit-create"]')
      const cancelBtn = wrapper.find('[data-test="btn-cancel-create"]')
      expect(submitBtn.text()).toContain('确认新增')
      expect(submitBtn.attributes('disabled')).toBeUndefined()
      expect(cancelBtn.attributes('disabled')).toBeUndefined()

      // Form inputs re-enabled
      const identitySelect = wrapper.find('[data-test="create-form-identity"]').element as HTMLSelectElement
      const phoneInput = wrapper.find('[data-test="create-form-phone"]').element as HTMLInputElement
      const passwordInput = wrapper.find('[data-test="create-form-password"]').element as HTMLInputElement
      const nicknameInput = wrapper.find('[data-test="create-form-nickname"]').element as HTMLInputElement
      const statusSelect = wrapper.find('[data-test="create-form-status"]').element as HTMLSelectElement
      const remarkTextarea = wrapper.find('[data-test="create-form-remark"]').element as HTMLTextAreaElement

      expect(identitySelect.disabled).toBe(false)
      expect(phoneInput.disabled).toBe(false)
      expect(passwordInput.disabled).toBe(false)
      expect(nicknameInput.disabled).toBe(false)
      expect(statusSelect.disabled).toBe(false)
      expect(remarkTextarea.disabled).toBe(false)

      // 4. Form values remain intact
      expect(identitySelect.value).toBe('platform_admin')
      expect(phoneInput.value).toBe('13811112222')
      expect(passwordInput.value).toBe('SafePassword123')
      expect(nicknameInput.value).toBe('超时测试员')
      expect(statusSelect.value).toBe('enable')
      expect(remarkTextarea.value).toBe('需要核实的账号')

      // 5. Prompt displayed with exact text: 「提交结果未确认，请先查询核实」
      const errorMsg = wrapper.find('[data-test="create-error-message"]')
      const uncertainWarning = wrapper.find('[data-test="create-uncertain-warning"]')
      expect(errorMsg.exists()).toBe(true)
      expect(uncertainWarning.exists()).toBe(true)
      expect(errorMsg.text()).toContain('提交结果未确认，请先查询核实')
      expect(uncertainWarning.text()).toContain('提交结果未确认，请先查询核实')

      // Does not claim absolute idempotence
      expect(errorMsg.text()).not.toContain('已自动去重')
      expect(errorMsg.text()).not.toContain('保证不重复')
    })

    it('handles request abort/disconnect: preserves form inputs, unlocks submission, and warns operator', async () => {
      mockCommonEndpoints()

      httpMock.onPost('/sys_user/add_edit').abortRequest()

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      await wrapper.find('[data-test="create-form-identity"]').setValue('super_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13822223333')
      await wrapper.find('[data-test="create-form-password"]').setValue('AbortPass456')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('断开连接测试员')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')
      await wrapper.find('[data-test="create-form-remark"]').setValue('网络中断待核实')

      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()
      await flushPromises()

      // Exactly 1 POST request sent
      expect(httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')).toHaveLength(1)

      // Dialog stays open, values intact
      expect(wrapper.find('[data-test="create-account-dialog"]').exists()).toBe(true)
      const phoneInput = wrapper.find('[data-test="create-form-phone"]').element as HTMLInputElement
      expect(phoneInput.value).toBe('13822223333')

      // Form unlocked
      const submitBtn = wrapper.find('[data-test="btn-submit-create"]')
      expect(submitBtn.attributes('disabled')).toBeUndefined()

      // Shows uncertain warning
      expect(wrapper.find('[data-test="create-error-message"]').text()).toContain('提交结果未确认，请先查询核实')
    })

    it('allows operator to close dialog after uncertain prompt, query manually, and reopen fresh form', async () => {
      mockCommonEndpoints()

      httpMock.onPost('/sys_user/add_edit').timeout()

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13833334444')
      await wrapper.find('[data-test="create-form-password"]').setValue('PwdCheck789')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('核实流程测试')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')

      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()
      await flushPromises()

      expect(wrapper.find('[data-test="create-error-message"]').text()).toContain('提交结果未确认，请先查询核实')

      // Operator clicks cancel to close dialog and verify via query
      await wrapper.find('[data-test="btn-cancel-create"]').trigger('click')
      await nextTick()

      // Query phone number
      await wrapper.find('[data-test="filter-phone"]').setValue('13833334444')
      await wrapper.find('[data-test="query-submit"]').trigger('click')
      await flushPromises()

      // Reopen create dialog: old inputs and warning should be cleared
      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      const phoneField = wrapper.find('[data-test="create-form-phone"]').element as HTMLInputElement
      expect(phoneField.value).toBe('')
      expect(wrapper.find('[data-test="create-error-message"]').exists()).toBe(false)
    })
  })

  describe('Success write but list refresh failure', () => {
    it('closes create dialog, clears create form, explains both outcomes separately, and does not induce saving again', async () => {
      mockCommonEndpoints()

      // add_edit succeeds
      httpMock.onPost('/sys_user/add_edit').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: 2099,
      })

      // The subsequent list fetch fails
      httpMock.onPost('/sys_user/list').reply(500, {
        code: 500000,
        msg: '数据服务暂时不可用',
        data: null,
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      // Open create dialog
      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      // Fill in valid form
      await wrapper.find('[data-test="create-form-identity"]').setValue('super_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13899998888')
      await wrapper.find('[data-test="create-form-password"]').setValue('Password2099')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('刷新失败测试员')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')
      await wrapper.find('[data-test="create-form-remark"]').setValue('写入成功但刷新失败')

      // Submit
      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()
      await flushPromises()

      // 1. Exactly one POST /sys_user/add_edit request sent
      expect(httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')).toHaveLength(1)

      // 2. Dialog is closed (in leave transition or hidden)
      const overlay = wrapper.find('.el-overlay')
      expect(overlay.classes()).toContain('dialog-fade-leave-active')

      // 3. Notice banner is displayed on the page
      const warningBanner = wrapper.find('[data-test="create-refresh-warning"]')
      const refreshNotice = wrapper.find('[data-test="refresh-failure-notice"]')
      expect(warningBanner.exists()).toBe(true)
      expect(refreshNotice.exists()).toBe(true)

      // Explains BOTH outcomes separately:
      // (a) creation succeeded
      expect(refreshNotice.text()).toContain('账号创建成功')
      // (b) list refresh failed
      expect(refreshNotice.text()).toContain('列表刷新失败')
      // (c) does not induce saving again
      expect(refreshNotice.text()).toContain('无需重复提交')

      // 4. Table displays its error state and retry button
      const stateError = wrapper.find('[data-test="state-error"]')
      const tableRetry = wrapper.find('[data-test="state-retry"]')
      expect(stateError.exists()).toBe(true)
      expect(tableRetry.exists()).toBe(true)

      // 5. If user reopens dialog, the form is cleared, not dirty
      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      const phoneInput = wrapper.find('[data-test="create-form-phone"]').element as HTMLInputElement
      const pwdInput = wrapper.find('[data-test="create-form-password"]').element as HTMLInputElement
      expect(phoneInput.value).toBe('')
      expect(pwdInput.value).toBe('')

      // Close dialog again
      await wrapper.find('[data-test="btn-cancel-create"]').trigger('click')
      await nextTick()

      // Verified no second create request was induced or sent
      expect(httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')).toHaveLength(1)
    })

    it('recovers from list refresh failure when operator clicks table retry', async () => {
      mockCommonEndpoints()

      // add_edit succeeds
      httpMock.onPost('/sys_user/add_edit').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: 2100,
      })

      // First list refresh after create fails
      let listSuccess = false
      httpMock.onPost('/sys_user/list').reply(() => {
        if (!listSuccess) {
          return [500, { code: 500000, msg: '服务网络超时', data: null }]
        }
        return [
          200,
          {
            code: 200000,
            msg: '操作成功',
            data: [
              ...initialAccounts,
              {
                userId: 2100,
                nickName: '恢复重试员',
                phoneNumber: '13877776666',
                identity: 'platform_admin',
                status: 'enable',
                remark: '重试刷新成功',
              },
            ],
          },
        ]
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13877776666')
      await wrapper.find('[data-test="create-form-password"]').setValue('RecoverPass123')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('恢复重试员')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')
      await wrapper.find('[data-test="create-form-remark"]').setValue('重试刷新成功')

      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()
      await flushPromises()

      // Banner and error state visible
      expect(wrapper.find('[data-test="create-refresh-warning"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="state-error"]').exists()).toBe(true)

      // Service recovers, operator clicks table retry
      listSuccess = true
      await wrapper.find('[data-test="state-retry"]').trigger('click')
      await flushPromises()

      // Notice banner dismissed upon successful list refresh
      expect(wrapper.find('[data-test="create-refresh-warning"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="state-error"]').exists()).toBe(false)

      // Table displays the accounts including the newly created one
      const rows = wrapper.findAll('[data-test="account-row"]')
      expect(rows).toHaveLength(3)
      expect(wrapper.text()).toContain('恢复重试员')
      expect(wrapper.text()).toContain('13877776666')

      // Still exactly 1 add_edit POST in total
      expect(httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')).toHaveLength(1)
    })

    it('allows operator to manually dismiss the refresh failure notice banner', async () => {
      mockCommonEndpoints()

      httpMock.onPost('/sys_user/add_edit').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: 2101,
      })
      httpMock.onPost('/sys_user/list').reply(500, {
        code: 500000,
        msg: '网络波动',
        data: null,
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13855554444')
      await wrapper.find('[data-test="create-form-password"]').setValue('DismissTest123')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('手动关闭通知测试')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')

      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()
      await flushPromises()

      const warningBanner = wrapper.find('[data-test="create-refresh-warning"]')
      expect(warningBanner.exists()).toBe(true)

      // Click dismiss button
      await wrapper.find('[data-test="btn-dismiss-refresh-notice"]').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-test="create-refresh-warning"]').exists()).toBe(false)
    })
  })
})
