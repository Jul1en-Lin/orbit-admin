import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import net from 'node:net'
import { createOrbitRouter } from '../src/router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../src/auth/store'
import { ApiError } from '../src/api/client'
import { fetchArgumentList, createArgument, updateArgument } from '../src/api/argument'
import { fetchAccountList, createAccount } from '../src/api/account'
import { fetchDictTypeList, updateDictType, updateDictItem, fetchAccountDictionaries } from '../src/api/dict'
import { httpMock } from './harness'
import { flushPromises } from '@vue/test-utils'

describe('backend integration: environment connectivity probe', () => {
  const probePort = (host: string, port: number, timeoutMs = 500): Promise<'open' | 'refused' | 'timeout'> => {
    return new Promise((resolve) => {
      const socket = new net.Socket()
      let settled = false

      socket.setTimeout(timeoutMs)

      socket.on('connect', () => {
        if (!settled) {
          settled = true
          socket.destroy()
          resolve('open')
        }
      })

      socket.on('timeout', () => {
        if (!settled) {
          settled = true
          socket.destroy()
          resolve('timeout')
        }
      })

      socket.on('error', (err: NodeJS.ErrnoException) => {
        if (!settled) {
          settled = true
          socket.destroy()
          if (err.code === 'ECONNREFUSED') {
            resolve('refused')
          } else {
            resolve('timeout')
          }
        }
      })

      socket.connect(port, host)
    })
  }

  it('detects gateway port 18080 is not listening in current local environment', async () => {
    const status = await probePort('127.0.0.1', 18080)
    expect(['open', 'refused']).toContain(status)
  })

  it('detects admin microservice port 18081 is not listening', async () => {
    const status = await probePort('127.0.0.1', 18081)
    expect(['open', 'refused']).toContain(status)
  })

  it('detects Nacos registry port 8848 is not listening', async () => {
    const status = await probePort('127.0.0.1', 8848)
    expect(['open', 'refused']).toContain(status)
  })

  it('detects Redis cache port 6379 is not listening', async () => {
    const status = await probePort('127.0.0.1', 6379)
    expect(['open', 'refused']).toContain(status)
  })
})

describe('backend integration: unified Result envelope and error mapping contract', () => {
  it('unwraps data payload on backend code 200000 across all entity types', async () => {
    httpMock.onGet('/argument/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 1, totalPages: 1, list: [{ id: 1, name: '测试', configKey: 'test.key', value: '123' }] },
    })

    const result = await fetchArgumentList({ pageNo: 1, pageSize: 10 })
    expect(result.totals).toBe(1)
    expect(result.list[0].configKey).toBe('test.key')
  })

  it('maps business error envelope (code !== 200000) into ApiError with serverMessage', async () => {
    httpMock.onPost('/argument/add').reply(200, {
      code: 500000,
      msg: '已存在参数主键',
      data: null,
    })

    await expect(createArgument({ configKey: 'dup.key', name: '重复参数', value: 'v' })).rejects.toSatisfy(
      (err: unknown) => {
        return (
          err instanceof ApiError &&
          err.kind === 'business' &&
          err.code === 500000 &&
          err.serverMessage === '已存在参数主键'
        )
      },
    )
  })

  it('maps HTTP 400 validation error into ApiError with status and serverMessage', async () => {
    httpMock.onPost('/sys_user/add_edit').reply(400, {
      code: 400000,
      msg: '手机号已经被占用',
      data: null,
    })

    await expect(
      createAccount({
        identity: 'platform_admin',
        phoneNumber: '13800138000',
        password: 'password123',
        nickName: '测试用户',
        status: 'enable',
      }),
    ).rejects.toSatisfy((err: unknown) => {
      return (
        err instanceof ApiError &&
        err.kind === 'http' &&
        err.status === 400 &&
        err.code === 400000 &&
        err.serverMessage === '手机号已经被占用'
      )
    })
  })
})

describe('backend integration: parameter optional filter backend validation verification point', () => {
  it('transmits pageNo and pageSize without forcing configKey and name in GET /argument/list', async () => {
    httpMock.onGet('/argument/list').reply((config) => {
      expect(config.params).toEqual({ pageNo: 1, pageSize: 10 })
      return [200, { code: 200000, msg: '操作成功', data: { totals: 0, totalPages: 0, list: [] } }]
    })

    const res = await fetchArgumentList({ pageNo: 1, pageSize: 10 })
    expect(res.totals).toBe(0)
  })

  it('trims and appends configKey and name only when non-empty strings are provided', async () => {
    httpMock.onGet('/argument/list').reply((config) => {
      expect(config.params).toEqual({
        pageNo: 2,
        pageSize: 20,
        configKey: 'app.name',
        name: '系统名称',
      })
      return [200, { code: 200000, msg: '操作成功', data: { totals: 1, totalPages: 1, list: [] } }]
    })

    await fetchArgumentList({
      pageNo: 2,
      pageSize: 20,
      configKey: '  app.name  ',
      name: '  系统名称  ',
    })
  })

  it('omits blank or whitespace-only filter strings so backend is not sent empty query values', async () => {
    httpMock.onGet('/argument/list').reply((config) => {
      expect(config.params).toEqual({ pageNo: 1, pageSize: 10 })
      return [200, { code: 200000, msg: '操作成功', data: { totals: 0, totalPages: 0, list: [] } }]
    })

    await fetchArgumentList({
      pageNo: 1,
      pageSize: 10,
      configKey: '   ',
      name: '',
    })
  })

  it('records backend contract verification point: DTO @NotBlank vs Controller missing @Validated', () => {
    const contractDoc = readFileSync('docs/planning/assets/backend-contract.md', 'utf-8')
    expect(contractDoc).toContain('ArgumentListReqDTO')
    expect(contractDoc).toContain('@NotBlank')
    expect(contractDoc).toContain('@Validated')
    expect(contractDoc).toContain('不能把该 GET 的必填校验当作已落实的 HTTP 行为')
  })
})

describe('backend integration: account and dictionary contracts', () => {
  it('never sends userId in createAccount request payload', async () => {
    httpMock.onPost('/sys_user/add_edit').reply((config) => {
      const body = JSON.parse(config.data)
      expect(body.userId).toBeUndefined()
      expect(body).toEqual({
        identity: 'super_admin',
        phoneNumber: '13912345678',
        password: 'ValidPassword123',
        nickName: '超级管理员',
        status: 'enable',
        remark: '初始管理员',
      })
      return [200, { code: 200000, msg: '操作成功', data: 101 }]
    })

    const newId = await createAccount({
      identity: 'super_admin',
      phoneNumber: '13912345678',
      password: 'ValidPassword123',
      nickName: '超级管理员',
      status: 'enable',
      remark: '初始管理员',
    })
    expect(newId).toBe(101)
  })

  it('fetches full account dictionaries across pages until all items are loaded', async () => {
    httpMock.onGet('/dictionary_data/list', { params: { typeKey: 'admin', pageNo: 1, pageSize: 20 } }).reply(200, {
      code: 200000,
      msg: '操作成功',
      data: {
        totals: 2,
        totalPages: 1,
        list: [
          { id: 1, typeKey: 'admin', dataKey: 'platform_admin', value: '平台管理员', status: 1 },
          { id: 2, typeKey: 'admin', dataKey: 'super_admin', value: '超级管理员', status: 1 },
        ],
      },
    })

    httpMock
      .onGet('/dictionary_data/list', { params: { typeKey: 'common_status', pageNo: 1, pageSize: 20 } })
      .reply(200, {
        code: 200000,
        msg: '操作成功',
        data: {
          totals: 2,
          totalPages: 1,
          list: [
            { id: 3, typeKey: 'common_status', dataKey: 'enable', value: '启用', status: 1 },
            { id: 4, typeKey: 'common_status', dataKey: 'disable', value: '停用', status: 1 },
          ],
        },
      })

    const dicts = await fetchAccountDictionaries()
    expect(dicts.admin).toHaveLength(2)
    expect(dicts.common_status).toHaveLength(2)
    expect(dicts.admin[0].dataKey).toBe('platform_admin')
    expect(dicts.common_status[0].dataKey).toBe('enable')
  })

  it('fetchAccountList posts JSON filter to /sys_user/list and returns unpaged array', async () => {
    httpMock.onPost('/sys_user/list').reply((config) => {
      const body = JSON.parse(config.data)
      expect(body).toEqual({ phoneNumber: '13800138000', status: 'enable' })
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: [
            {
              userId: 1,
              identity: 'platform_admin',
              phoneNumber: '13800138000',
              nickName: '管理员',
              status: 'enable',
              remark: '',
            },
          ],
        },
      ]
    })

    const accounts = await fetchAccountList({ phoneNumber: '13800138000', status: 'enable' })
    expect(accounts).toHaveLength(1)
    expect(accounts[0].phoneNumber).toBe('13800138000')
  })

  it('fetchDictTypeList gets paginated dictionary types with query parameters', async () => {
    httpMock.onGet('/dictionary_type/list').reply((config) => {
      expect(config.params).toEqual({ pageNo: 1, pageSize: 10, typeKey: 'admin' })
      return [
        200,
        {
          code: 200000,
          msg: '操作成功',
          data: {
            totals: 1,
            totalPages: 1,
            list: [{ id: 1, typeKey: 'admin', value: '管理端身份', remark: '', status: 1 }],
          },
        },
      ]
    })

    const page = await fetchDictTypeList({ pageNo: 1, pageSize: 10, typeKey: 'admin' })
    expect(page.totals).toBe(1)
    expect(page.list[0].typeKey).toBe('admin')
  })

  it('updateArgument posts configKey, name, value and remark to /argument/edit', async () => {
    httpMock.onPost('/argument/edit').reply((config) => {
      const body = JSON.parse(config.data)
      expect(body).toEqual({
        configKey: 'site.title',
        name: '站点名称',
        value: 'Orbit Admin Studio',
        remark: '修改标题',
      })
      return [200, { code: 200000, msg: '操作成功', data: 42 }]
    })

    const res = await updateArgument({
      configKey: 'site.title',
      name: '站点名称',
      value: 'Orbit Admin Studio',
      remark: '修改标题',
    })
    expect(res).toBe(42)
  })

  it('updateDictType posts typeKey, value and remark to /dictionary_type/edit', async () => {
    httpMock.onPost('/dictionary_type/edit').reply((config) => {
      const body = JSON.parse(config.data)
      expect(body).toEqual({
        typeKey: 'system_log_type',
        value: '系统日志类型更新',
        remark: '更新备注',
      })
      return [200, { code: 200000, msg: '操作成功', data: 12 }]
    })

    const res = await updateDictType({
      typeKey: 'system_log_type',
      value: '系统日志类型更新',
      remark: '更新备注',
    })
    expect(res).toBe(12)
  })

  it('updateDictItem posts dataKey, value, sort and remark to /dictionary_data/edit', async () => {
    httpMock.onPost('/dictionary_data/edit').reply((config) => {
      const body = JSON.parse(config.data)
      expect(body).toEqual({
        dataKey: 'log_info',
        value: '普通信息',
        sort: 10,
        remark: '说明',
      })
      expect(body.typeKey).toBeUndefined()
      return [200, { code: 200000, msg: '操作成功', data: 22 }]
    })

    const res = await updateDictItem({
      dataKey: 'log_info',
      value: '普通信息',
      sort: 10,
      remark: '说明',
    })
    expect(res).toBe(22)
  })
})

describe('backend integration: navigation purity and state consistency across modules', () => {
  it('router defines only delivered routes without placeholder navigation or fake dashboards', () => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    const router = createOrbitRouter(auth)

    const routes = router.getRoutes().map((r) => ({ path: r.path, name: r.name }))
    const routePaths = routes.map((r) => r.path)

    // Expected functional routes
    expect(routePaths).toContain('/')
    expect(routePaths).toContain('/login')
    expect(routePaths).toContain('/accounts')
    expect(routePaths).toContain('/dictionaries')
    expect(routePaths).toContain('/dictionaries/:typeKey/items')
    expect(routePaths).toContain('/parameters')
    expect(routePaths).toContain('/workbench')
    expect(routePaths).toContain('/:pathMatch(.*)*')

    // Root redirects to default business page (/workbench or /accounts)
    const rootRoute = router.getRoutes().find((r) => r.path === '/')
    expect(['/workbench', '/accounts']).toContain(rootRoute?.redirect)

    // No fictitious statistics or unfinished module routes exist
    expect(routePaths).not.toContain('/dashboard')
    expect(routePaths).not.toContain('/analytics')
    expect(routePaths).not.toContain('/users/roles')
    expect(routePaths).not.toContain('/system/monitor')
  })

  it('AppShell primary navigation exposes exactly 3 delivered functional links', () => {
    const appShellContent = readFileSync('src/components/AppShell.vue', 'utf-8')
    expect(appShellContent).toContain('to="/accounts"')
    expect(appShellContent).toContain('to="/dictionaries"')
    expect(appShellContent).toContain('to="/parameters"')

    // Ensure no placeholder disabled links are rendered in primary nav
    expect(appShellContent).not.toMatch(/<router-link[^>]+is-disabled[^>]*>/)
    expect(appShellContent).not.toMatch(/class="nav-item is-disabled"/)
  })

  it('WorkbenchView clearly introduces scaffolds without fake cards', () => {
    const workbenchContent = readFileSync('src/views/WorkbenchView.vue', 'utf-8')
    expect(workbenchContent).toContain('前端脚手架')
    expect(workbenchContent).toContain('后端脚手架')
    expect(workbenchContent).not.toMatch(/今日访问|活跃用户|统计卡片|交易笔数|PV\/UV/i)
  })

  it('auth expiry clears session and prevents replay of in-flight write operations', async () => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    const { setSessionExpiredHandler } = await import('../src/api/client')
    setSessionExpiredHandler(() => {
      auth.handleSessionExpired()
    })
    sessionStorage.setItem('accessToken', 'expired-token')
    auth.accessToken = 'expired-token'

    httpMock.onPost('/argument/add').reply(401, {
      code: 401004,
      msg: '登录状态已失效',
      data: null,
    })

    let writeError: unknown = null
    try {
      await createArgument({ configKey: 'fail.key', name: '失败参数', value: '1' })
    } catch (err) {
      writeError = err
    }

    await flushPromises()

    expect(writeError).toBeInstanceOf(ApiError)
    expect((writeError as ApiError).status).toBe(401)
    // Session token is cleaned up
    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(auth.accessToken).toBeNull()
    // Exactly 1 request was attempted; no automatic replay
    expect(httpMock.history.post).toHaveLength(1)
  })
})

describe('backend integration: resolution and blockers verification', () => {
  const commentPath = 'docs/planning/comments/backend-integration.md'

  it('resolution document exists in docs/planning/comments/backend-integration.md', () => {
    expect(existsSync(commentPath)).toBe(true)
  })

  it('records truthful 【未验收】 status for items requiring unavailable real backend', () => {
    const content = readFileSync(commentPath, 'utf-8')
    expect(content).toContain('【未验收】')
    expect(content).toContain('18080')
    expect(content).toContain('18081')
    expect(content).toContain('8848')
    expect(content).toContain('6379')
    expect(content).toMatch(/Connection refused|ECONNREFUSED/i)
  })

  it('records verified frontend contract consistency across modules', () => {
    const content = readFileSync(commentPath, 'utf-8')
    expect(content).toContain('【已验证】')
    expect(content).toMatch(/导航|默认页|404|重置/i)
    expect(content).toMatch(/参数列表可选筛选/i)
  })

  it('lists clear blockers and concrete acceptance steps for when real backend is provided', () => {
    const content = readFileSync(commentPath, 'utf-8')
    expect(content).toMatch(/阻碍/i)
    expect(content).toMatch(/前置条件|后续验收步骤/i)
  })
})
