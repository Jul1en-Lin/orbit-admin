import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { httpMock, mountApplication } from './harness'
import { createArgument, updateArgument, type ArgumentVO } from '../src/api/argument'
import { useAuthStore } from '../src/auth/store'

const mockArgumentsPage1: ArgumentVO[] = [
  {
    id: 1,
    configKey: 'sys.login.captcha',
    name: '登录验证码开关',
    value: 'false',
    remark: '控制登录页面是否显示验证码',
  },
  {
    id: 2,
    configKey: 'sys.upload.maxSize',
    name: '上传文件大小限制',
    value: '10485760',
    remark: '单位为字节，默认10MB',
  },
]

const mockArgumentsPage2: ArgumentVO[] = [
  {
    id: 3,
    configKey: 'sys.account.initPassword',
    name: '新用户初始密码',
    value: 'abc123',
    remark: null,
  },
  {
    id: 4,
    configKey: 'sys.custom.template',
    name: '自定义通知模板',
    value: '{\n  "greeting": "Hello",\n  "farewell": "Bye"\n}',
    remark: '多行JSON配置',
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

describe('argument add and edit operations (argument-edit)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('API functions: createArgument and updateArgument', () => {
    it('createArgument sends POST /argument/add with configKey, name, value, remark and returns created ID', async () => {
      let requestBody: Record<string, unknown> | null = null
      httpMock.onPost('/argument/add').reply((config) => {
        requestBody = JSON.parse(config.data as string)
        return [200, { code: 200000, msg: '操作成功', data: 101 }]
      })

      const id = await createArgument({
        configKey: 'sys.site.theme',
        name: '站点主题',
        value: 'dark-orbit',
        remark: '默认深色主题',
      })

      expect(id).toBe(101)
      expect(requestBody).toEqual({
        configKey: 'sys.site.theme',
        name: '站点主题',
        value: 'dark-orbit',
        remark: '默认深色主题',
      })
    })

    it('createArgument preserves multiline formatted text in value as-is', async () => {
      let requestBody: Record<string, unknown> | null = null
      httpMock.onPost('/argument/add').reply((config) => {
        requestBody = JSON.parse(config.data as string)
        return [200, { code: 200000, msg: '操作成功', data: 102 }]
      })

      const multilineValue = '  line 1  \n\tline 2 with tabs\n\n{"key": "value"}\n  '
      const id = await createArgument({
        configKey: 'sys.format.multiline',
        name: '多行格式参数',
        value: multilineValue,
      })

      expect(id).toBe(102)
      expect(requestBody).toEqual({
        configKey: 'sys.format.multiline',
        name: '多行格式参数',
        value: multilineValue,
      })
    })

    it('updateArgument sends POST /argument/edit with configKey, name, value, remark and returns updated ID', async () => {
      let requestBody: Record<string, unknown> | null = null
      httpMock.onPost('/argument/edit').reply((config) => {
        requestBody = JSON.parse(config.data as string)
        return [200, { code: 200000, msg: '操作成功', data: 103 }]
      })

      const id = await updateArgument({
        configKey: 'sys.upload.maxSize',
        name: '文件上传最大限制',
        value: '20971520',
        remark: '调整至20MB',
      })

      expect(id).toBe(103)
      expect(requestBody).toEqual({
        configKey: 'sys.upload.maxSize',
        name: '文件上传最大限制',
        value: '20971520',
        remark: '调整至20MB',
      })
    })
  })

  describe('UI & Interaction', () => {
    it('a) opens add dialog, renders fields with multiline textarea for value, client-side validation rejects blank inputs', async () => {
      setupAuth()

      httpMock.onGet('/argument/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockArgumentsPage1 },
      })

      const { wrapper, router } = mountApplication('/parameters')
      await router.isReady()
      await flushPromises()

      const addBtn = wrapper.find('[data-test="btn-add-argument"]')
      expect(addBtn.exists()).toBe(true)
      expect(addBtn.text()).toContain('新增参数')

      // Open add dialog
      await addBtn.trigger('click')
      await flushPromises()

      const dialog = wrapper.find('[data-test="argument-dialog"]')
      expect(dialog.exists()).toBe(true)

      const title = wrapper.find('[data-test="argument-dialog-title"]')
      expect(title.text()).toBe('新增参数')

      const keyInput = wrapper.find('[data-test="form-config-key"]')
      const nameInput = wrapper.find('[data-test="form-name"]')
      const valueInput = wrapper.find('[data-test="form-value"]')
      const remarkInput = wrapper.find('[data-test="form-remark"]')
      const submitBtn = wrapper.find('[data-test="btn-submit-argument"]')

      expect(keyInput.exists()).toBe(true)
      expect(nameInput.exists()).toBe(true)
      expect(valueInput.exists()).toBe(true)
      // Value input must be a textarea
      expect(valueInput.element.tagName.toLowerCase()).toBe('textarea')
      expect(remarkInput.exists()).toBe(true)
      expect(submitBtn.exists()).toBe(true)

      // In add mode, configKey is editable
      expect(keyInput.attributes('disabled')).toBeUndefined()
      expect(keyInput.attributes('readonly')).toBeUndefined()

      // Submit with empty inputs
      let postAddCalled = false
      httpMock.onPost('/argument/add').reply(() => {
        postAddCalled = true
        return [200, { code: 200000, msg: '操作成功', data: 99 }]
      })

      await submitBtn.trigger('click')
      await flushPromises()

      expect(postAddCalled).toBe(false)
      expect(wrapper.find('[data-test="error-config-key"]').text()).toContain('请输入参数键名')
      expect(wrapper.find('[data-test="error-name"]').text()).toContain('请输入参数名称')
      expect(wrapper.find('[data-test="error-value"]').text()).toContain('请输入参数键值')

      // Whitespace-only inputs are also rejected
      await keyInput.setValue('   ')
      await nameInput.setValue('\t  ')
      await valueInput.setValue('  \n\t  ')
      await submitBtn.trigger('click')
      await flushPromises()

      expect(postAddCalled).toBe(false)
      expect(wrapper.find('[data-test="error-config-key"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="error-name"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="error-value"]').exists()).toBe(true)

      // Entering valid values clears errors
      await keyInput.setValue('sys.notice.enabled')
      expect(wrapper.find('[data-test="error-config-key"]').exists()).toBe(false)

      await nameInput.setValue('通知开关')
      expect(wrapper.find('[data-test="error-name"]').exists()).toBe(false)

      await valueInput.setValue('true')
      expect(wrapper.find('[data-test="error-value"]').exists()).toBe(false)
    })

    it('b) successful add calls POST /argument/add, preserves multiline value as-is, closes dialog, resets to page 1', async () => {
      setupAuth()

      const listRequests: Record<string, unknown>[] = []
      httpMock.onGet('/argument/list').reply((config) => {
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
              list: reqPage === 2 ? mockArgumentsPage2 : mockArgumentsPage1,
            },
          },
        ]
      })

      const { wrapper, router } = mountApplication('/parameters')
      await router.isReady()
      await flushPromises()

      // Navigate to page 2 first
      await wrapper.find('[data-test="page-next"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-test="page-current"]').text()).toContain('2')

      // Open add modal
      await wrapper.find('[data-test="btn-add-argument"]').trigger('click')
      await flushPromises()

      const multilineText = '  leading and trailing spaces  \nsecond line\n{"json": true}'
      await wrapper.find('[data-test="form-config-key"]').setValue('  sys.test.multiline  ')
      await wrapper.find('[data-test="form-name"]').setValue('  测试多行值  ')
      await wrapper.find('[data-test="form-value"]').setValue(multilineText)
      await wrapper.find('[data-test="form-remark"]').setValue('  可选备注说明  ')

      let addPayload: Record<string, unknown> | null = null
      httpMock.onPost('/argument/add').reply((config) => {
        addPayload = JSON.parse(config.data)
        return [200, { code: 200000, msg: '操作成功', data: 5 }]
      })

      // Submit form
      await wrapper.find('[data-test="btn-submit-argument"]').trigger('click')
      await flushPromises()

      // Verified POST payload: configKey & name & remark trimmed, but value preserved AS-IS
      expect(addPayload).toEqual({
        configKey: 'sys.test.multiline',
        name: '测试多行值',
        value: multilineText,
        remark: '可选备注说明',
      })

      // Dialog is closed
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(false)

      // Re-fetched list starting from page 1
      const lastRequest = listRequests[listRequests.length - 1]
      expect(lastRequest).toMatchObject({ pageNo: 1 })
      expect(wrapper.find('[data-test="page-current"]').text()).toContain('1')
    })

    it('c) opens edit modal: configKey is read-only, name, value, remark are prefilled, client validation rejects blank', async () => {
      setupAuth()

      httpMock.onGet('/argument/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockArgumentsPage1 },
      })

      const { wrapper, router } = mountApplication('/parameters')
      await router.isReady()
      await flushPromises()

      const rows = wrapper.findAll('[data-test="argument-row"]')
      expect(rows).toHaveLength(2)

      const editBtn = rows[0].find('[data-test="btn-edit-argument"]')
      expect(editBtn.exists()).toBe(true)
      expect(editBtn.text()).toBe('编辑')

      // Open edit dialog
      await editBtn.trigger('click')
      await flushPromises()

      const dialog = wrapper.find('[data-test="argument-dialog"]')
      expect(dialog.exists()).toBe(true)

      const title = wrapper.find('[data-test="argument-dialog-title"]')
      expect(title.text()).toBe('编辑参数')

      const keyInput = wrapper.find<HTMLInputElement>('[data-test="form-config-key"]')
      const nameInput = wrapper.find<HTMLInputElement>('[data-test="form-name"]')
      const valueInput = wrapper.find<HTMLTextAreaElement>('[data-test="form-value"]')
      const remarkInput = wrapper.find<HTMLTextAreaElement>('[data-test="form-remark"]')

      // configKey is prefilled and read-only / disabled
      expect(keyInput.element.value).toBe('sys.login.captcha')
      const isReadOnlyOrDisabled =
        keyInput.attributes('readonly') !== undefined || keyInput.attributes('disabled') !== undefined
      expect(isReadOnlyOrDisabled).toBe(true)

      // name, value, remark are prefilled
      expect(nameInput.element.value).toBe('登录验证码开关')
      expect(valueInput.element.value).toBe('false')
      expect(remarkInput.element.value).toBe('控制登录页面是否显示验证码')

      // Blank validation in edit mode
      await nameInput.setValue('   ')
      await valueInput.setValue('   ')
      await wrapper.find('[data-test="btn-submit-argument"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-test="error-name"]').text()).toContain('请输入参数名称')
      expect(wrapper.find('[data-test="error-value"]').text()).toContain('请输入参数键值')
    })

    it('d) successful edit calls POST /argument/edit, preserves multiline value as-is, stays on current page and refreshes', async () => {
      setupAuth()

      const listRequests: Record<string, unknown>[] = []
      httpMock.onGet('/argument/list').reply((config) => {
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
              list: reqPage === 2 ? mockArgumentsPage2 : mockArgumentsPage1,
            },
          },
        ]
      })

      const { wrapper, router } = mountApplication('/parameters')
      await router.isReady()
      await flushPromises()

      // Navigate to page 2
      await wrapper.find('[data-test="page-next"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-test="page-current"]').text()).toContain('2')

      // Edit row 1 ('sys.custom.template') on page 2
      const rows = wrapper.findAll('[data-test="argument-row"]')
      expect(rows[1].find('.cell-config-key').text()).toBe('sys.custom.template')

      await rows[1].find('[data-test="btn-edit-argument"]').trigger('click')
      await flushPromises()

      const newTemplate = '{\n  "updated": true,\n  "count": 42\n}'
      await wrapper.find('[data-test="form-name"]').setValue('更新后的自定义通知模板')
      await wrapper.find('[data-test="form-value"]').setValue(newTemplate)
      await wrapper.find('[data-test="form-remark"]').setValue('更新模板内容')

      let editPayload: Record<string, unknown> | null = null
      httpMock.onPost('/argument/edit').reply((config) => {
        editPayload = JSON.parse(config.data)
        return [200, { code: 200000, msg: '操作成功', data: 4 }]
      })

      // Submit edit
      await wrapper.find('[data-test="btn-submit-argument"]').trigger('click')
      await flushPromises()

      expect(editPayload).toEqual({
        configKey: 'sys.custom.template',
        name: '更新后的自定义通知模板',
        value: newTemplate,
        remark: '更新模板内容',
      })

      // Modal is closed
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(false)

      // List re-fetched keeping current page (page 2)
      const lastRequest = listRequests[listRequests.length - 1]
      expect(lastRequest).toMatchObject({ pageNo: 2 })
      expect(wrapper.find('[data-test="page-current"]').text()).toContain('2')
    })

    it('e) in-flight submission locking, failure retains form data and displays single feedback', async () => {
      setupAuth()

      httpMock.onGet('/argument/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockArgumentsPage1 },
      })

      const { wrapper, router } = mountApplication('/parameters')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-add-argument"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-config-key"]').setValue('sys.dup.key')
      await wrapper.find('[data-test="form-name"]').setValue('重复键名参数')
      await wrapper.find('[data-test="form-value"]').setValue('some-value')
      await wrapper.find('[data-test="form-remark"]').setValue('测试防重复提交与错误留存')

      // Setup deferred response
      let resolvePost!: (value: [number, unknown]) => void
      httpMock.onPost('/argument/add').reply(
        () =>
          new Promise((resolve) => {
            resolvePost = resolve
          }),
      )

      // Submit form
      await wrapper.find('[data-test="argument-form"]').trigger('submit.prevent')

      // Locking verification
      const submitBtn = wrapper.find('[data-test="btn-submit-argument"]')
      const cancelBtn = wrapper.find('[data-test="btn-cancel-argument"]')
      const keyInput = wrapper.find('[data-test="form-config-key"]')
      const nameInput = wrapper.find('[data-test="form-name"]')
      const valueInput = wrapper.find('[data-test="form-value"]')
      const remarkInput = wrapper.find('[data-test="form-remark"]')

      expect(submitBtn.attributes('disabled')).toBeDefined()
      expect(submitBtn.text()).toContain('提交中...')
      expect(cancelBtn.attributes('disabled')).toBeDefined()
      expect(keyInput.attributes('disabled')).toBeDefined()
      expect(nameInput.attributes('disabled')).toBeDefined()
      expect(valueInput.attributes('disabled')).toBeDefined()
      expect(remarkInput.attributes('disabled')).toBeDefined()

      // Clicking cancel while in flight does not close dialog
      await cancelBtn.trigger('click')
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(true)

      // Resolve with 500 error: 已存在参数主键
      resolvePost([
        500,
        {
          code: 500000,
          msg: '已存在参数主键',
          data: null,
        },
      ])
      await flushPromises()

      // Dialog remains open
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(true)

      // Form data retained
      expect((wrapper.find<HTMLInputElement>('[data-test="form-config-key"]').element as HTMLInputElement).value).toBe(
        'sys.dup.key',
      )
      expect((wrapper.find<HTMLInputElement>('[data-test="form-name"]').element as HTMLInputElement).value).toBe(
        '重复键名参数',
      )
      expect((wrapper.find<HTMLTextAreaElement>('[data-test="form-value"]').element as HTMLTextAreaElement).value).toBe(
        'some-value',
      )
      expect(
        (wrapper.find<HTMLTextAreaElement>('[data-test="form-remark"]').element as HTMLTextAreaElement).value,
      ).toBe('测试防重复提交与错误留存')

      // Error message shown
      const errorAlerts = wrapper.findAll('[data-test="argument-error-message"]')
      expect(errorAlerts).toHaveLength(1)
      expect(errorAlerts[0].text()).toContain('已存在参数主键')

      // Submit button unlocked
      expect(wrapper.find('[data-test="btn-submit-argument"]').attributes('disabled')).toBeUndefined()

      // Re-submit and fail with network error
      httpMock.onPost('/argument/add').networkError()
      await wrapper.find('[data-test="argument-form"]').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(true)
      const updatedAlerts = wrapper.findAll('[data-test="argument-error-message"]')
      expect(updatedAlerts).toHaveLength(1)
      expect(updatedAlerts[0].text()).toContain('网络请求失败')
    })

    it('f) timeout/uncertain write error keeps form, unlocks button, prompts verification without auto-retry', async () => {
      setupAuth()

      httpMock.onGet('/argument/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockArgumentsPage1 },
      })

      const { wrapper, router } = mountApplication('/parameters')
      await router.isReady()
      await flushPromises()

      // Open edit on row 0
      const rows = wrapper.findAll('[data-test="argument-row"]')
      await rows[0].find('[data-test="btn-edit-argument"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-name"]').setValue('修改名称')
      await wrapper.find('[data-test="form-value"]').setValue('修改值')

      httpMock.onPost('/argument/edit').timeout()

      await wrapper.find('[data-test="argument-form"]').trigger('submit.prevent')
      await flushPromises()

      // Dialog stays open, button unlocked, prompt shown
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="btn-submit-argument"]').attributes('disabled')).toBeUndefined()
      expect(wrapper.find('[data-test="argument-error-message"]').text()).toContain('提交结果未确认，请先查询核实')
      expect((wrapper.find<HTMLInputElement>('[data-test="form-name"]').element as HTMLInputElement).value).toBe(
        '修改名称',
      )
    })

    it('g) successful write but refresh failure displays warning banner without misleading user to re-submit', async () => {
      setupAuth()

      let listCallCount = 0
      httpMock.onGet('/argument/list').reply(() => {
        listCallCount++
        if (listCallCount === 1) {
          return [200, { code: 200000, msg: '操作成功', data: { totals: 2, totalPages: 1, list: mockArgumentsPage1 } }]
        }
        // Second call (refresh) fails
        return [500, { code: 500000, msg: '服务器临时不可用', data: null }]
      })

      const { wrapper, router } = mountApplication('/parameters')
      await router.isReady()
      await flushPromises()

      await wrapper.find('[data-test="btn-add-argument"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-config-key"]').setValue('sys.new.param')
      await wrapper.find('[data-test="form-name"]').setValue('新参数')
      await wrapper.find('[data-test="form-value"]').setValue('新值')

      httpMock.onPost('/argument/add').reply(200, { code: 200000, msg: '操作成功', data: 99 })

      await wrapper.find('[data-test="argument-form"]').trigger('submit.prevent')
      await flushPromises()

      // Dialog is closed
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(false)

      // Warning banner displayed
      const banner = wrapper.find('[data-test="create-refresh-warning"]')
      expect(banner.exists()).toBe(true)
      expect(banner.find('[data-test="refresh-failure-notice"]').text()).toContain(
        '参数创建成功，但列表刷新失败。请通过下方表格重试刷新查看最新数据，无需重复提交保存。',
      )

      // Can dismiss warning banner
      await wrapper.find('[data-test="btn-dismiss-refresh-notice"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-test="create-refresh-warning"]').exists()).toBe(false)
    })

    it('h) dirty form checking: clean form closes immediately, dirty form prompts confirmDiscardChanges', async () => {
      setupAuth()

      httpMock.onGet('/argument/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockArgumentsPage1 },
      })

      const { wrapper, router } = mountApplication('/parameters')
      await router.isReady()
      await flushPromises()

      const confirmSpy = vi.spyOn(window, 'confirm')

      // Case 1: Clean form in Add mode closes immediately
      await wrapper.find('[data-test="btn-add-argument"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(true)

      await wrapper.find('[data-test="btn-cancel-argument"]').trigger('click')
      await flushPromises()
      expect(confirmSpy).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(false)

      // Case 2: Dirty form in Add mode prompts confirm
      await wrapper.find('[data-test="btn-add-argument"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-config-key"]').setValue('sys.partial')
      confirmSpy.mockReturnValueOnce(false)

      await wrapper.find('[data-test="btn-cancel-argument"]').trigger('click')
      await flushPromises()
      expect(confirmSpy).toHaveBeenCalledWith('表单有未保存的修改，确定放弃吗？')
      // Cancelled discard -> stays open
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(true)

      // User confirms discard -> closes
      confirmSpy.mockReturnValueOnce(true)
      await wrapper.find('[data-test="btn-cancel-argument"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(false)

      // Case 3: Edit mode dirty checking
      const rows = wrapper.findAll('[data-test="argument-row"]')
      await rows[0].find('[data-test="btn-edit-argument"]').trigger('click')
      await flushPromises()

      // Unmodified edit form closes without confirm
      confirmSpy.mockClear()
      await wrapper.find('[data-test="btn-cancel-argument"]').trigger('click')
      await flushPromises()
      expect(confirmSpy).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(false)

      // Modified edit form prompts confirm
      await rows[0].find('[data-test="btn-edit-argument"]').trigger('click')
      await flushPromises()
      await wrapper.find('[data-test="form-name"]').setValue('修改了名称')

      confirmSpy.mockReturnValueOnce(true)
      await wrapper.find('[data-test="btn-cancel-argument"]').trigger('click')
      await flushPromises()
      expect(confirmSpy).toHaveBeenCalledWith('表单有未保存的修改，确定放弃吗？')
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(false)
    })

    it('i) 401 session expiry immediately clears and closes dialog without dirty prompt', async () => {
      setupAuth()

      httpMock.onGet('/argument/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockArgumentsPage1 },
      })

      const { wrapper, router } = mountApplication('/parameters')
      await router.isReady()
      await flushPromises()

      const confirmSpy = vi.spyOn(window, 'confirm')

      // 1. Verify auth store session change clears dialog
      await wrapper.find('[data-test="btn-add-argument"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(true)

      const authStore = useAuthStore()
      authStore.handleSessionExpired()
      await flushPromises()

      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(false)
      expect(confirmSpy).not.toHaveBeenCalled()

      // 2. Re-login and verify 401 API response on submit closes dialog without prompt
      setupAuth()
      await router.push('/parameters')
      await flushPromises()

      await wrapper.find('[data-test="btn-add-argument"]').trigger('click')
      await flushPromises()

      await wrapper.find('[data-test="form-config-key"]').setValue('sys.dirty.value')
      await wrapper.find('[data-test="form-name"]').setValue('脏数据')
      await wrapper.find('[data-test="form-value"]').setValue('值')

      httpMock.onPost('/argument/add').reply(401, {
        code: 401004,
        msg: '登录令牌已失效',
        data: null,
      })

      await wrapper.find('[data-test="argument-form"]').trigger('submit.prevent')
      await flushPromises()

      // Dialog closed immediately
      expect(wrapper.find('[data-test="argument-dialog"]').exists()).toBe(false)
      expect(confirmSpy).not.toHaveBeenCalled()
    })

    it('j) ensures no delete button is provided anywhere in list or modals', async () => {
      setupAuth()

      httpMock.onGet('/argument/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: { totals: 2, totalPages: 1, list: mockArgumentsPage1 },
      })

      const { wrapper, router } = mountApplication('/parameters')
      await router.isReady()
      await flushPromises()

      // No delete buttons in table
      expect(wrapper.find('[data-test="btn-delete"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="btn-delete-argument"]').exists()).toBe(false)
      expect(wrapper.find('.btn-delete').exists()).toBe(false)
      expect(wrapper.findAll('input[type="checkbox"]').length).toBe(0)

      // Open add dialog
      await wrapper.find('[data-test="btn-add-argument"]').trigger('click')
      await flushPromises()

      const addDialog = wrapper.find('[data-test="argument-dialog"]')
      expect(addDialog.find('[data-test="btn-delete"]').exists()).toBe(false)
      expect(addDialog.findAll('select').length).toBe(0)

      // Close add dialog
      await wrapper.find('[data-test="btn-cancel-argument"]').trigger('click')
      await flushPromises()

      // Open edit dialog
      const rows = wrapper.findAll('[data-test="argument-row"]')
      await rows[0].find('[data-test="btn-edit-argument"]').trigger('click')
      await flushPromises()

      const editDialog = wrapper.find('[data-test="argument-dialog"]')
      expect(editDialog.find('[data-test="btn-delete"]').exists()).toBe(false)
      expect(editDialog.findAll('select').length).toBe(0)
    })
  })
})
