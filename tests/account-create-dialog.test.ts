import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createAccount } from '../src/api/account'
import { encryptLoginPassword } from '../src/auth/password'
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

describe('account creation dialog and success path (Issue 28)', () => {
  describe('API client: createAccount', () => {
    it('calls POST /sys_user/add_edit without userId and returns created ID', async () => {
      httpMock.onPost('/sys_user/add_edit').reply((config) => {
        const body = JSON.parse(config.data as string)
        expect(body).toEqual({
          identity: 'platform_admin',
          phoneNumber: '13900008888',
          password: 'PlainPassword123',
          nickName: '新管理员',
          status: 'enable',
          remark: '常规运维',
        })
        expect('userId' in body).toBe(false)
        return [200, { code: 200000, msg: '操作成功', data: 2001 }]
      })

      const id = await createAccount({
        identity: 'platform_admin',
        phoneNumber: '13900008888',
        password: 'PlainPassword123',
        nickName: '新管理员',
        status: 'enable',
        remark: '常规运维',
      })

      expect(id).toBe(2001)
      expect(httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')).toHaveLength(1)
    })

    it('defensively strips userId even if passed in input object', async () => {
      httpMock.onPost('/sys_user/add_edit').reply((config) => {
        const body = JSON.parse(config.data as string)
        expect('userId' in body).toBe(false)
        return [200, { code: 200000, msg: '操作成功', data: 2002 }]
      })

      const payloadWithUserId = {
        userId: 9999,
        identity: 'super_admin',
        phoneNumber: '13900009999',
        password: 'Password999',
        nickName: '特权用户',
        status: 'enable',
      } as unknown as Parameters<typeof createAccount>[0]

      const id = await createAccount(payloadWithUserId)
      expect(id).toBe(2002)
    })

    it('omits remark if not provided or empty', async () => {
      httpMock.onPost('/sys_user/add_edit').reply((config) => {
        const body = JSON.parse(config.data as string)
        expect('remark' in body).toBe(false)
        return [200, { code: 200000, msg: '操作成功', data: 2003 }]
      })

      await createAccount({
        identity: 'platform_admin',
        phoneNumber: '13900007777',
        password: 'PassWord1',
        nickName: '无备注用户',
        status: 'enable',
        remark: '   ',
      })
    })
  })

  describe('UI dialog behavior and field initial states', () => {
    it('opens dialog from list, renders all form fields, and identity & status are not defaulted', async () => {
      mockCommonEndpoints()

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      const createBtn = wrapper.find('[data-test="btn-create-account"]')
      expect(createBtn.exists()).toBe(true)
      expect(createBtn.text()).toContain('新增账号')

      await createBtn.trigger('click')
      await nextTick()
      await flushPromises()

      const dialog = wrapper.find('[data-test="create-account-dialog"]')
      expect(dialog.exists()).toBe(true)

      // Check fields existence
      const identitySelect = wrapper.find('[data-test="create-form-identity"]')
      const phoneInput = wrapper.find('[data-test="create-form-phone"]')
      const passwordInput = wrapper.find('[data-test="create-form-password"]')
      const nicknameInput = wrapper.find('[data-test="create-form-nickname"]')
      const statusSelect = wrapper.find('[data-test="create-form-status"]')
      const remarkInput = wrapper.find('[data-test="create-form-remark"]')
      const submitBtn = wrapper.find('[data-test="btn-submit-create"]')

      expect(identitySelect.exists()).toBe(true)
      expect(phoneInput.exists()).toBe(true)
      expect(passwordInput.exists()).toBe(true)
      expect(nicknameInput.exists()).toBe(true)
      expect(statusSelect.exists()).toBe(true)
      expect(remarkInput.exists()).toBe(true)
      expect(submitBtn.exists()).toBe(true)

      // Check that identity and status are NOT defaulted (must require active selection)
      expect((identitySelect.element as HTMLSelectElement).value).toBe('')
      expect((statusSelect.element as HTMLSelectElement).value).toBe('')

      // Options inside selects should match dictionaries
      const identityOptions = identitySelect.findAll('option')
      expect(identityOptions[0].text()).toContain('请选择身份')
      expect(identityOptions.map((o) => o.attributes('value'))).toEqual(['', 'super_admin', 'platform_admin'])

      const statusOptions = statusSelect.findAll('option')
      expect(statusOptions[0].text()).toContain('请选择状态')
      expect(statusOptions.map((o) => o.attributes('value'))).toEqual(['', 'enable', 'disable'])

      // Password field attributes
      expect(passwordInput.attributes('type')).toBe('password')
      expect(passwordInput.attributes('maxlength')).toBe('20')

      // Initially submit is disabled because fields are not filled
      expect(submitBtn.attributes('disabled')).toBeDefined()
    })
  })

  describe('Successful account creation and list refresh', () => {
    it('submits valid data without userId, closes dialog, and refreshes the table with new account', async () => {
      mockCommonEndpoints()

      const updatedAccounts = [
        ...initialAccounts,
        {
          userId: 1003,
          nickName: '赵明',
          phoneNumber: '13811112222',
          identity: 'platform_admin',
          status: 'enable',
          remark: '新入职运维',
        },
      ]

      httpMock.onPost('/sys_user/add_edit').reply((config) => {
        const payload = JSON.parse(config.data as string)
        expect(payload).toEqual({
          identity: 'platform_admin',
          phoneNumber: '13811112222',
          password: 'Password2026',
          nickName: '赵明',
          status: 'enable',
          remark: '新入职运维',
        })
        expect('userId' in payload).toBe(false)
        return [200, { code: 200000, msg: '操作成功', data: 1003 }]
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      expect(wrapper.findAll('[data-test="account-row"]')).toHaveLength(2)

      // Open dialog
      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      // Fill in all required fields actively
      await wrapper.find('[data-test="create-form-identity"]').setValue('platform_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13811112222')
      await wrapper.find('[data-test="create-form-password"]').setValue('Password2026')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('赵明')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')
      await wrapper.find('[data-test="create-form-remark"]').setValue('新入职运维')

      // Update list mock to return new user on subsequent calls
      httpMock.onPost('/sys_user/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: updatedAccounts,
      })

      const submitBtn = wrapper.find('[data-test="btn-submit-create"]')
      expect(submitBtn.attributes('disabled')).toBeUndefined()

      await submitBtn.trigger('click')
      await nextTick()
      await flushPromises()

      // Verify POST /sys_user/add_edit was called
      const addEditRequests = httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')
      expect(addEditRequests).toHaveLength(1)
      const body = JSON.parse(addEditRequests[0].data as string)
      expect(body.identity).toBe('platform_admin')
      expect(body.phoneNumber).toBe('13811112222')
      expect(body.password).toBe('Password2026')
      expect(body.nickName).toBe('赵明')
      expect(body.status).toBe('enable')
      expect('userId' in body).toBe(false)

      // Table should be refreshed with 3 accounts
      const rows = wrapper.findAll('[data-test="account-row"]')
      expect(rows).toHaveLength(3)
      expect(wrapper.text()).toContain('赵明')
      expect(wrapper.text()).toContain('13811112222')
    })
  })

  describe('Password handling (no AES encryption, 1-20 alphanumeric characters)', () => {
    it('sends raw plain text password and does not apply login AES hex encryption', async () => {
      mockCommonEndpoints()

      const rawPassword = 'AlphaNumPassword99'
      const aesEncrypted = encryptLoginPassword(rawPassword)

      httpMock.onPost('/sys_user/add_edit').reply((config) => {
        const payload = JSON.parse(config.data as string)
        // Must be exact plain text
        expect(payload.password).toBe(rawPassword)
        // Must NOT match login AES encrypted hash
        expect(payload.password).not.toBe(aesEncrypted)
        return [200, { code: 200000, msg: '操作成功', data: 1005 }]
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      await wrapper.find('[data-test="create-form-identity"]').setValue('super_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13899990000')
      await wrapper.find('[data-test="create-form-password"]').setValue(rawPassword)
      await wrapper.find('[data-test="create-form-nickname"]').setValue('测试密码')
      await wrapper.find('[data-test="create-form-status"]').setValue('enable')

      await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
      await nextTick()
      await flushPromises()

      const addEditRequests = httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')
      expect(addEditRequests).toHaveLength(1)
      const payload = JSON.parse(addEditRequests[0].data as string)
      expect(payload.password).toBe('AlphaNumPassword99')
    })

    it('accepts boundary alphanumeric passwords (1 char and 20 chars)', async () => {
      mockCommonEndpoints()

      const passwords = ['A', 'A1b2C3d4E5f6G7h8I9j0']

      for (let i = 0; i < passwords.length; i++) {
        const pwd = passwords[i]
        httpMock.onPost('/sys_user/add_edit').reply((config) => {
          const payload = JSON.parse(config.data as string)
          expect(payload.password).toBe(pwd)
          return [200, { code: 200000, msg: '操作成功', data: 1006 + i }]
        })

        const { wrapper, router } = mountApplication('/accounts')
        await router.isReady()
        await flushPromises()

        await wrapper.find('[data-test="btn-create-account"]').trigger('click')
        await nextTick()
        await flushPromises()

        await wrapper.find('[data-test="create-form-identity"]').setValue('super_admin')
        await wrapper.find('[data-test="create-form-phone"]').setValue(`1380000990${i}`)
        await wrapper.find('[data-test="create-form-password"]').setValue(pwd)
        await wrapper.find('[data-test="create-form-nickname"]').setValue(`密码测试${i}`)
        await wrapper.find('[data-test="create-form-status"]').setValue('enable')

        await wrapper.find('[data-test="btn-submit-create"]').trigger('click')
        await nextTick()
        await flushPromises()
      }
    })
  })

  describe('Dictionary options failure prevents submission and allows retry', () => {
    it('shows alert, disables dropdowns & submit button, and recovers upon retry', async () => {
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

      httpMock.onPost('/sys_user/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: [...initialAccounts],
      })

      // Dictionary fails initially
      let dictSuccess = false
      httpMock.onGet('/dictionary_data/list').reply((config) => {
        if (!dictSuccess) {
          return [500, { code: 500000, msg: '字典服务故障', data: null }]
        }

        const typeKey = config.params?.typeKey
        if (typeKey === 'admin') {
          return [
            200,
            {
              code: 200000,
              msg: '操作成功',
              data: {
                totals: 1,
                totalPages: 1,
                list: [{ id: 1, typeKey: 'admin', dataKey: 'super_admin', value: '超级管理员', sort: 1, status: 1 }],
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
                totals: 1,
                totalPages: 1,
                list: [{ id: 10, typeKey: 'common_status', dataKey: 'enable', value: '启用', sort: 1, status: 1 }],
              },
            },
          ]
        }
        return [404, { code: 404001, msg: '未找到', data: null }]
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      // Open create dialog
      await wrapper.find('[data-test="btn-create-account"]').trigger('click')
      await nextTick()
      await flushPromises()

      // Alert should be visible inside dialog
      const dialogAlert = wrapper.find('[data-test="dialog-dict-alert"]')
      expect(dialogAlert.exists()).toBe(true)

      const identitySelect = wrapper.find('[data-test="create-form-identity"]')
      const statusSelect = wrapper.find('[data-test="create-form-status"]')
      const submitBtn = wrapper.find('[data-test="btn-submit-create"]')

      // Selects and submit must be disabled
      expect(identitySelect.attributes('disabled')).toBeDefined()
      expect(statusSelect.attributes('disabled')).toBeDefined()
      expect(submitBtn.attributes('disabled')).toBeDefined()

      // Attempting to submit form should be rejected without HTTP call
      await wrapper.find('[data-test="create-account-form"]').trigger('submit.prevent')
      expect(httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')).toHaveLength(0)

      // Now recover dictionary service
      dictSuccess = true

      // Click retry button in dialog
      const retryBtn = wrapper.find('[data-test="dialog-dict-retry"]')
      expect(retryBtn.exists()).toBe(true)
      await retryBtn.trigger('click')
      await flushPromises()

      // Alert should be gone
      expect(wrapper.find('[data-test="dialog-dict-alert"]').exists()).toBe(false)

      // Selects should now be enabled and contain options
      expect(identitySelect.attributes('disabled')).toBeUndefined()
      expect(statusSelect.attributes('disabled')).toBeUndefined()

      const idOptions = identitySelect.findAll('option')
      expect(idOptions).toHaveLength(2) // placeholder + super_admin

      // Now fill and submit successfully
      await identitySelect.setValue('super_admin')
      await wrapper.find('[data-test="create-form-phone"]').setValue('13800003333')
      await wrapper.find('[data-test="create-form-password"]').setValue('Pwd12345')
      await wrapper.find('[data-test="create-form-nickname"]').setValue('重试成功用户')
      await statusSelect.setValue('enable')

      httpMock.onPost('/sys_user/add_edit').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: 1007,
      })

      await submitBtn.trigger('click')
      await nextTick()
      await flushPromises()

      expect(httpMock.history.post.filter((r) => r.url === '/sys_user/add_edit')).toHaveLength(1)
    })
  })
})
