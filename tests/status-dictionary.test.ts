import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { httpMock, mountApplication } from './harness'
import { fetchAllDictData, fetchDictDataPage } from '../src/api/dict'

const mockAccounts = [
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
  {
    userId: 1003,
    nickName: '周青',
    phoneNumber: '13800001003',
    identity: 'platform_admin',
    status: 'disable',
    remark: '历史测试账号',
  },
]

describe('status and identity dictionaries (status-dictionary)', () => {
  describe('API client: fetchDictDataPage and fetchAllDictData', () => {
    it('fetches a single page of dictionary data with correct parameters', async () => {
      httpMock.onGet('/dictionary_data/list').reply((config) => {
        expect(config.params).toEqual({
          typeKey: 'admin',
          pageNo: 1,
          pageSize: 10,
        })
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
      })

      const page = await fetchDictDataPage({ typeKey: 'admin' })
      expect(page.totals).toBe(1)
      expect(page.totalPages).toBe(1)
      expect(page.list).toHaveLength(1)
      expect(page.list[0].dataKey).toBe('super_admin')
    })

    it('fetches all pages sequentially until pageNo >= totalPages', async () => {
      const pageRequests: number[] = []

      httpMock.onGet('/dictionary_data/list').reply((config) => {
        const pageNo = config.params?.pageNo as number
        pageRequests.push(pageNo)

        if (pageNo === 1) {
          return [
            200,
            {
              code: 200000,
              msg: '操作成功',
              data: {
                totals: 3,
                totalPages: 2,
                list: [
                  { id: 1, typeKey: 'admin', dataKey: 'super_admin', value: '超级管理员', sort: 1, status: 1 },
                  { id: 2, typeKey: 'admin', dataKey: 'platform_admin', value: '平台管理员', sort: 2, status: 1 },
                ],
              },
            },
          ]
        }

        return [
          200,
          {
            code: 200000,
            msg: '操作成功',
            data: {
              totals: 3,
              totalPages: 2,
              list: [{ id: 3, typeKey: 'admin', dataKey: 'auditor', value: '审计员', sort: 3, status: 1 }],
            },
          },
        ]
      })

      const allItems = await fetchAllDictData('admin', 2)
      expect(pageRequests).toEqual([1, 2])
      expect(allItems).toHaveLength(3)
      expect(allItems.map((i) => i.dataKey)).toEqual(['super_admin', 'platform_admin', 'auditor'])
    })

    it('stops iteration if totalPages is 0 or list is empty', async () => {
      httpMock.onGet('/dictionary_data/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: {
          totals: 0,
          totalPages: 0,
          list: [],
        },
      })

      const items = await fetchAllDictData('admin')
      expect(items).toEqual([])
      expect(httpMock.history.get.filter((r) => r.url === '/dictionary_data/list')).toHaveLength(1)
    })
  })

  describe('multi-page dictionary fetching and display mapping', () => {
    it('fetches all pages for admin and common_status, maps labels in table rows and populates filter dropdown', async () => {
      sessionStorage.setItem('accessToken', 'token-1')
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

      const adminPageRequested: number[] = []
      const statusPageRequested: number[] = []

      httpMock.onGet('/dictionary_data/list').reply((config) => {
        const typeKey = config.params?.typeKey
        const pageNo = config.params?.pageNo as number

        if (typeKey === 'admin') {
          adminPageRequested.push(pageNo)
          if (pageNo === 1) {
            return [
              200,
              {
                code: 200000,
                msg: '操作成功',
                data: {
                  totals: 3,
                  totalPages: 2,
                  list: [
                    { id: 1, typeKey: 'admin', dataKey: 'super_admin', value: '超级管理员', sort: 1, status: 1 },
                    { id: 2, typeKey: 'admin', dataKey: 'platform_admin', value: '平台管理员', sort: 2, status: 1 },
                  ],
                },
              },
            ]
          }
          return [
            200,
            {
              code: 200000,
              msg: '操作成功',
              data: {
                totals: 3,
                totalPages: 2,
                list: [{ id: 3, typeKey: 'admin', dataKey: 'auditor', value: '审计员', sort: 3, status: 1 }],
              },
            },
          ]
        }

        if (typeKey === 'common_status') {
          statusPageRequested.push(pageNo)
          if (pageNo === 1) {
            return [
              200,
              {
                code: 200000,
                msg: '操作成功',
                data: {
                  totals: 2,
                  totalPages: 2,
                  list: [{ id: 10, typeKey: 'common_status', dataKey: 'enable', value: '启用', sort: 1, status: 1 }],
                },
              },
            ]
          }
          return [
            200,
            {
              code: 200000,
              msg: '操作成功',
              data: {
                totals: 2,
                totalPages: 2,
                list: [{ id: 11, typeKey: 'common_status', dataKey: 'disable', value: '停用', sort: 2, status: 1 }],
              },
            },
          ]
        }

        return [200, { code: 200000, msg: '操作成功', data: { totals: 0, totalPages: 1, list: [] } }]
      })

      const accountsWithAuditor = [
        ...mockAccounts,
        {
          userId: 1004,
          nickName: '徐闻',
          phoneNumber: '13800001004',
          identity: 'auditor',
          status: 'enable',
          remark: '内部审计',
        },
      ]

      httpMock.onPost('/sys_user/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: accountsWithAuditor,
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      // Multi-page fetching completed for both typeKeys
      expect(adminPageRequested).toEqual([1, 2])
      expect(statusPageRequested).toEqual([1, 2])

      // Dynamic filter dropdown populated from common_status without hardcoding
      const statusSelect = wrapper.find('[data-test="filter-status"]')
      const options = statusSelect.findAll('option')
      expect(options).toHaveLength(3)
      expect(options[0].text()).toBe('全部状态')
      expect(options[0].attributes('value')).toBe('')
      expect(options[1].text()).toBe('启用')
      expect(options[1].attributes('value')).toBe('enable')
      expect(options[2].text()).toBe('停用')
      expect(options[2].attributes('value')).toBe('disable')

      // Table rows correctly map identity and status from dictionaries across pages
      const rows = wrapper.findAll('[data-test="account-row"]')
      expect(rows).toHaveLength(4)

      // Row 1: super_admin -> 超级管理员, enable -> 启用
      expect(rows[0].find('.cell-identity').text()).toBe('超级管理员')
      expect(rows[0].find('.cell-status').text()).toBe('启用')

      // Row 2: platform_admin -> 平台管理员, enable -> 启用
      expect(rows[1].find('.cell-identity').text()).toBe('平台管理员')
      expect(rows[1].find('.cell-status').text()).toBe('启用')

      // Row 3: platform_admin -> 平台管理员, disable -> 停用
      expect(rows[2].find('.cell-identity').text()).toBe('平台管理员')
      expect(rows[2].find('.cell-status').text()).toBe('停用')

      // Row 4 (from page 2 of admin dict): auditor -> 审计员, enable -> 启用
      expect(rows[3].find('.cell-identity').text()).toBe('审计员')
      expect(rows[3].find('.cell-status').text()).toBe('启用')

      // Verify selecting dynamically populated option filters accurately
      let filteredPayload: Record<string, unknown> | null = null
      httpMock.onPost('/sys_user/list').reply((config) => {
        filteredPayload = config.data ? JSON.parse(config.data) : {}
        return [200, { code: 200000, msg: '操作成功', data: [accountsWithAuditor[2]] }]
      })

      await statusSelect.setValue('disable')
      await wrapper.find('[data-test="query-submit"]').trigger('click')
      await flushPromises()

      expect(filteredPayload).toEqual({ status: 'disable' })
    })
  })

  describe('fallback to raw values for unknown codes', () => {
    it('displays original raw code for unknown identity or status without dropping records or substituting defaults', async () => {
      sessionStorage.setItem('accessToken', 'token-1')
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

      // Dictionaries only define platform_admin and enable
      httpMock.onGet('/dictionary_data/list').reply((config) => {
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
                list: [{ id: 2, typeKey: 'admin', dataKey: 'platform_admin', value: '平台管理员', sort: 1, status: 1 }],
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
        return [200, { code: 200000, msg: '操作成功', data: { totals: 0, totalPages: 1, list: [] } }]
      })

      const rawAccounts = [
        {
          userId: 2001,
          nickName: '未知身份人员',
          phoneNumber: '13800002001',
          identity: 'custom_guest_role', // Not in dict -> must show raw code
          status: 'enable', // Known in dict -> maps to 启用
          remark: '外部人员',
        },
        {
          userId: 2002,
          nickName: '未知状态人员',
          phoneNumber: '13800002002',
          identity: 'platform_admin', // Known in dict -> maps to 平台管理员
          status: 'archived_pending', // Not in dict -> must show raw code
          remark: '归档待定',
        },
        {
          userId: 2003,
          nickName: '双未知人员',
          phoneNumber: '13800002003',
          identity: 'legacy_operator', // Not in dict -> must show raw code
          status: 'frozen_99', // Not in dict -> must show raw code
          remark: '历史遗留',
        },
      ]

      httpMock.onPost('/sys_user/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: rawAccounts,
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      // None of the records are dropped!
      const rows = wrapper.findAll('[data-test="account-row"]')
      expect(rows).toHaveLength(3)

      // Row 1: custom_guest_role is rendered raw, status is mapped to 启用
      expect(rows[0].find('.cell-identity').text()).toBe('custom_guest_role')
      expect(rows[0].find('.cell-status').text()).toBe('启用')

      // Row 2: identity is mapped to 平台管理员, status is rendered raw archived_pending
      expect(rows[1].find('.cell-identity').text()).toBe('平台管理员')
      expect(rows[1].find('.cell-status').text()).toBe('archived_pending')

      // Row 3: both rendered raw, not replaced by arbitrary defaults
      expect(rows[2].find('.cell-identity').text()).toBe('legacy_operator')
      expect(rows[2].find('.cell-status').text()).toBe('frozen_99')

      // Ensure no fake defaults are substituted
      const tableText = wrapper.find('.account-table').text()
      expect(tableText).not.toContain('超级管理员')
      expect(tableText).not.toContain('停用')
    })
  })

  describe('dictionary load failure feedback and retry', () => {
    it('shows clear feedback and retry on dictionary failure, retains table records with raw codes, and recovers upon retry', async () => {
      sessionStorage.setItem('accessToken', 'token-1')
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

      // Accounts load successfully
      httpMock.onPost('/sys_user/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: mockAccounts,
      })

      // Dictionaries fail with 500 error initially
      let dictFail = true
      httpMock.onGet('/dictionary_data/list').reply((config) => {
        if (dictFail) {
          return [500, { code: 500000, msg: '字典服务不可用' }]
        }
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
                  { id: 3, typeKey: 'common_status', dataKey: 'enable', value: '启用', sort: 1, status: 1 },
                  { id: 4, typeKey: 'common_status', dataKey: 'disable', value: '停用', sort: 2, status: 1 },
                ],
              },
            },
          ]
        }
        return [200, { code: 200000, msg: '操作成功', data: { totals: 0, totalPages: 1, list: [] } }]
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      // Dictionary failure feedback is visible
      const alert = wrapper.find('[data-test="dict-alert"]')
      expect(alert.exists()).toBe(true)
      expect(alert.text()).toContain('字典')
      expect(alert.text()).toContain('失败')

      const retryBtn = wrapper.find('[data-test="dict-retry"]')
      expect(retryBtn.exists()).toBe(true)
      expect(retryBtn.text()).toContain('重试')

      // Account records are NOT dropped; displayed with original raw codes
      const rows = wrapper.findAll('[data-test="account-row"]')
      expect(rows).toHaveLength(3)
      expect(rows[0].find('.cell-identity').text()).toBe('super_admin')
      expect(rows[0].find('.cell-status').text()).toBe('enable')
      expect(rows[2].find('.cell-identity').text()).toBe('platform_admin')
      expect(rows[2].find('.cell-status').text()).toBe('disable')

      // Status dropdown only has empty "全部状态" (no fabricated options)
      const statusSelect = wrapper.find('[data-test="filter-status"]')
      const optionsBefore = statusSelect.findAll('option')
      expect(optionsBefore).toHaveLength(1)
      expect(optionsBefore[0].text()).toBe('全部状态')

      // Trigger dictionary retry
      dictFail = false
      await retryBtn.trigger('click')
      await flushPromises()

      // Alert banner is now gone
      expect(wrapper.find('[data-test="dict-alert"]').exists()).toBe(false)

      // Dropdown options are now populated dynamically
      const optionsAfter = statusSelect.findAll('option')
      expect(optionsAfter).toHaveLength(3)
      expect(optionsAfter.map((o) => o.text())).toEqual(['全部状态', '启用', '停用'])

      // Table displays mapped human-readable labels
      expect(rows[0].find('.cell-identity').text()).toBe('超级管理员')
      expect(rows[0].find('.cell-status').text()).toBe('启用')
      expect(rows[2].find('.cell-identity').text()).toBe('平台管理员')
      expect(rows[2].find('.cell-status').text()).toBe('停用')
    })

    it('table retry button also retries dictionary loading if dictionary had failed', async () => {
      sessionStorage.setItem('accessToken', 'token-1')
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

      // Both accounts and dictionaries fail initially
      let fail = true
      httpMock.onPost('/sys_user/list').reply(() => {
        if (fail) {
          return [500, { code: 500000, msg: '列表服务不可用' }]
        }
        return [200, { code: 200000, msg: '操作成功', data: mockAccounts }]
      })

      httpMock.onGet('/dictionary_data/list').reply((config) => {
        if (fail) {
          return [500, { code: 500000, msg: '字典服务不可用' }]
        }
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
                  { id: 3, typeKey: 'common_status', dataKey: 'enable', value: '启用', sort: 1, status: 1 },
                  { id: 4, typeKey: 'common_status', dataKey: 'disable', value: '停用', sort: 2, status: 1 },
                ],
              },
            },
          ]
        }
        return [200, { code: 200000, msg: '操作成功', data: { totals: 0, totalPages: 1, list: [] } }]
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      // Table shows error state
      expect(wrapper.find('[data-test="state-error"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="dict-alert"]').exists()).toBe(true)

      // Click table retry
      fail = false
      const tableRetryBtn = wrapper.find('[data-test="state-retry"]')
      await tableRetryBtn.trigger('click')
      await flushPromises()

      // Both table and dictionaries recover
      expect(wrapper.find('[data-test="state-error"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="dict-alert"]').exists()).toBe(false)

      const rows = wrapper.findAll('[data-test="account-row"]')
      expect(rows).toHaveLength(3)
      expect(rows[0].find('.cell-identity').text()).toBe('超级管理员')
      expect(rows[0].find('.cell-status').text()).toBe('启用')
    })
  })

  describe('isolation between account string status and dictionary numeric status', () => {
    it('strictly isolates string account status from dictionary item numeric status', async () => {
      sessionStorage.setItem('accessToken', 'token-1')
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

      // Dictionary data has numeric status field: status: 1 and status: 0
      httpMock.onGet('/dictionary_data/list').reply((config) => {
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
                list: [
                  {
                    id: 1,
                    typeKey: 'admin',
                    dataKey: 'super_admin',
                    value: '超级管理员',
                    sort: 1,
                    status: 1, // numeric status of dict item
                  },
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
                  {
                    id: 10,
                    typeKey: 'common_status',
                    dataKey: 'enable',
                    value: '启用',
                    sort: 1,
                    status: 1, // numeric status
                  },
                  {
                    id: 11,
                    typeKey: 'common_status',
                    dataKey: 'disable',
                    value: '停用',
                    sort: 2,
                    status: 0, // numeric status 0
                  },
                ],
              },
            },
          ]
        }
        return [200, { code: 200000, msg: '操作成功', data: { totals: 0, totalPages: 1, list: [] } }]
      })

      const isolationAccounts = [
        {
          userId: 3001,
          nickName: '用户A',
          phoneNumber: '13800003001',
          identity: 'super_admin',
          status: 'enable', // string code matching dataKey
          remark: '',
        },
        {
          userId: 3002,
          nickName: '用户B',
          phoneNumber: '13800003002',
          identity: 'super_admin',
          status: 'disable', // string code matching dataKey
          remark: '',
        },
        {
          userId: 3003,
          nickName: '用户C',
          phoneNumber: '13800003003',
          identity: 'super_admin',
          status: '1', // string '1' coincidentally equals numeric status: 1 but is NOT dataKey
          remark: '',
        },
        {
          userId: 3004,
          nickName: '用户D',
          phoneNumber: '13800003004',
          identity: 'super_admin',
          status: '0', // string '0' coincidentally equals numeric status: 0 but is NOT dataKey
          remark: '',
        },
      ]

      httpMock.onPost('/sys_user/list').reply(200, {
        code: 200000,
        msg: '操作成功',
        data: isolationAccounts,
      })

      const { wrapper, router } = mountApplication('/accounts')
      await router.isReady()
      await flushPromises()

      const rows = wrapper.findAll('[data-test="account-row"]')
      expect(rows).toHaveLength(4)

      // 1. Account A: matches dataKey 'enable' -> '启用'
      expect(rows[0].find('.cell-status').text()).toBe('启用')
      expect(rows[0].find('.status-badge').classes()).toContain('is-enabled')

      // 2. Account B: matches dataKey 'disable' -> '停用'
      expect(rows[1].find('.cell-status').text()).toBe('停用')
      expect(rows[1].find('.status-badge').classes()).toContain('is-disabled')

      // 3. Account C: string status '1' does NOT match numeric status: 1; remains raw '1'
      expect(rows[2].find('.cell-status').text()).toBe('1')

      // 4. Account D: string status '0' does NOT match numeric status: 0; remains raw '0'
      expect(rows[3].find('.cell-status').text()).toBe('0')

      // 5. Dynamic filter options use dataKey string, not numeric status
      const statusSelect = wrapper.find('[data-test="filter-status"]')
      const optionValues = statusSelect.findAll('option').map((o) => o.attributes('value'))
      expect(optionValues).toEqual(['', 'enable', 'disable'])
      expect(optionValues).not.toContain('1')
      expect(optionValues).not.toContain('0')
    })
  })
})
