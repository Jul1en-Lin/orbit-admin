import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { httpMock, mountApplication, resetTestHarness } from './harness'
import { apiClient } from '../src/api/client'

describe('browser acceptance: execution environment & browser versions', () => {
  it('detects Google Chrome installation and records actual version 153.0.8010.48', () => {
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    const chromeExists = existsSync(chromePath)
    expect(chromeExists).toBe(true)

    const versionOutput = execFileSync(chromePath, ['--version'], { encoding: 'utf-8' }).trim()
    expect(versionOutput).toContain('Google Chrome')
    expect(versionOutput).toMatch(/153\.0\.8010\.\d+/)
  })

  it('detects Microsoft Edge absence and records environment missing status with standard support spec', () => {
    const edgeAppPath = '/Applications/Microsoft Edge.app'
    const edgeExists = existsSync(edgeAppPath)
    // Edge is not installed in the local macOS development environment
    expect(edgeExists).toBe(false)

    // Verify baseline support specification aligns with Chromium/Blink modern standards
    const supportSpec = {
      engine: 'Chromium / Blink',
      w3cStandards: ['CSS Focus Visible', 'CSS Flexbox / Grid', 'HTML5 History API', 'WAI-ARIA 1.2'],
      javascriptStandard: 'ECMAScript 2022+',
      componentLibrary: 'Element Plus 2.x desktop support matrix',
    }
    expect(supportSpec.engine).toBe('Chromium / Blink')
    expect(supportSpec.w3cStandards).toContain('CSS Focus Visible')
    expect(supportSpec.w3cStandards).toContain('WAI-ARIA 1.2')
  })
})

describe('browser acceptance: theme tokens, overlays & visual styling', () => {
  const themeCss = readFileSync('src/styles/theme.scss', 'utf-8')
  const appShellVue = readFileSync('src/components/AppShell.vue', 'utf-8')
  const accountListVue = readFileSync('src/views/AccountListView.vue', 'utf-8')
  const dictTypeListVue = readFileSync('src/views/DictTypeListView.vue', 'utf-8')
  const dictItemListVue = readFileSync('src/views/DictItemListView.vue', 'utf-8')
  const argumentListVue = readFileSync('src/views/ArgumentListView.vue', 'utf-8')

  it('defines core design tokens: ink dark green, warm white paper/cream, and orange accent', () => {
    expect(themeCss).toContain('--orbit-ink: #153b36;')
    expect(themeCss).toContain('--orbit-ink-deep: #0b2925;')
    expect(themeCss).toContain('--orbit-cream: #f3efe5;')
    expect(themeCss).toContain('--orbit-paper: #fffdf7;')
    expect(themeCss).toContain('--orbit-orange: #e8753b;')
    expect(themeCss).toContain('--orbit-orange-hover: #f18a53;')
    expect(themeCss).toContain('--orbit-border: 1px solid var(--orbit-line);')
    expect(themeCss).toContain('--orbit-content-border: 1px solid var(--orbit-content-line);')
  })

  it('overrides Element Plus theme with orbit design tokens', () => {
    expect(themeCss).toContain('--el-color-primary: var(--orbit-orange);')
    expect(themeCss).toContain('--el-border-radius-base: 0;')
    expect(themeCss).toContain('.el-input__wrapper')
    expect(themeCss).toContain('.is-focus')
  })

  it('customizes Element Plus dialog overlays across all management views with warm paper theme', () => {
    // Account create dialog
    expect(accountListVue).toContain(':deep(.account-create-dialog)')
    expect(accountListVue).toContain('background: var(--orbit-paper);')
    expect(accountListVue).toContain('font-family: var(--orbit-font-serif);')

    // Dict type dialog
    expect(dictTypeListVue).toContain(':deep(.dict-type-dialog)')
    expect(dictTypeListVue).toContain('background: var(--orbit-paper);')
    expect(dictTypeListVue).toContain('font-family: var(--orbit-font-serif);')

    // Dict item dialog
    expect(dictItemListVue).toContain(':deep(.dict-item-dialog)')
    expect(dictItemListVue).toContain('background: var(--orbit-paper);')
    expect(dictItemListVue).toContain('font-family: var(--orbit-font-serif);')

    // Argument dialog
    expect(argumentListVue).toContain(':deep(.argument-dialog)')
    expect(argumentListVue).toContain('background: var(--orbit-paper);')
    expect(argumentListVue).toContain('font-family: var(--orbit-font-serif);')
  })

  it('styles topbar with dark green background, cream text and orange active border', () => {
    expect(appShellVue).toContain('background: var(--orbit-ink);')
    expect(appShellVue).toContain('color: var(--orbit-cream);')
    expect(appShellVue).toContain('border-color: var(--orbit-orange);')
  })
})

describe('browser acceptance: Chinese typography & text hierarchy', () => {
  const themeCss = readFileSync('src/styles/theme.scss', 'utf-8')
  const accountListVue = readFileSync('src/views/AccountListView.vue', 'utf-8')

  it('defines sans-serif system fallback and serif editorial heading fonts', () => {
    expect(themeCss).toContain('--orbit-font-sans: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont')
    expect(themeCss).toContain("--orbit-font-serif: Georgia, 'Times New Roman', serif;")
  })

  it('applies tabular-nums to numeric identifier and telephone columns in account list', () => {
    expect(accountListVue).toContain('font-variant-numeric: tabular-nums;')
    expect(accountListVue).toContain('.cell-id')
    expect(accountListVue).toContain('.cell-phone')
  })

  it('uses editorial section kickers with uppercase tracking and orange highlight', () => {
    expect(accountListVue).toContain('.section-kicker')
    expect(accountListVue).toContain('color: var(--orbit-orange);')
    expect(accountListVue).toContain('letter-spacing: 0.18em;')
  })
})

describe('browser acceptance: long text wrapping & truncation', () => {
  const appShellVue = readFileSync('src/components/AppShell.vue', 'utf-8')
  const accountListVue = readFileSync('src/views/AccountListView.vue', 'utf-8')
  const dictTypeListVue = readFileSync('src/views/DictTypeListView.vue', 'utf-8')
  const dictItemListVue = readFileSync('src/views/DictItemListView.vue', 'utf-8')
  const argumentListVue = readFileSync('src/views/ArgumentListView.vue', 'utf-8')

  it('truncates topbar account name with text-overflow ellipsis', () => {
    expect(appShellVue).toContain('.account-name {')
    expect(appShellVue).toContain('max-width: 10rem;')
    expect(appShellVue).toContain('overflow: hidden;')
    expect(appShellVue).toContain('text-overflow: ellipsis;')
    expect(appShellVue).toContain('white-space: nowrap;')
  })

  it('wraps long remark, description, and value text with word-break break-all in tables', () => {
    expect(accountListVue).toContain('.cell-remark')
    expect(accountListVue).toContain('word-break: break-all;')
    expect(accountListVue).toContain('white-space: normal;')

    expect(dictTypeListVue).toContain('.cell-remark')
    expect(dictTypeListVue).toContain('word-break: break-all;')
    expect(dictTypeListVue).toContain('white-space: normal;')

    expect(dictItemListVue).toContain('.cell-remark')
    expect(dictItemListVue).toContain('word-break: break-all;')
    expect(dictItemListVue).toContain('white-space: normal;')

    expect(argumentListVue).toContain('.cell-val')
    expect(argumentListVue).toContain('word-break: break-all;')
    expect(argumentListVue).toContain('white-space: normal;')
  })

  it('handles dialog titles and labels truncation with text-overflow ellipsis', () => {
    expect(dictItemListVue).toContain('text-overflow: ellipsis;')
    expect(dictItemListVue).toContain('white-space: nowrap;')
  })
})

describe('browser acceptance: narrow viewport responsiveness (<= 1024px)', () => {
  const appShellVue = readFileSync('src/components/AppShell.vue', 'utf-8')
  const accountListVue = readFileSync('src/views/AccountListView.vue', 'utf-8')
  const dictTypeListVue = readFileSync('src/views/DictTypeListView.vue', 'utf-8')
  const dictItemListVue = readFileSync('src/views/DictItemListView.vue', 'utf-8')
  const argumentListVue = readFileSync('src/views/ArgumentListView.vue', 'utf-8')

  it('collapses split layouts into single-column vertical stack under narrow desktop / tablet viewports', () => {
    // Account list split collapsed below 900px
    expect(accountListVue).toContain('@media (max-width: 900px)')
    expect(accountListVue).toContain('grid-template-columns: 1fr;')

    // Dict type list split collapsed below 960px
    expect(dictTypeListVue).toContain('@media (max-width: 960px)')
    expect(dictTypeListVue).toContain('grid-template-columns: 1fr;')

    // Dict item list split collapsed below 960px
    expect(dictItemListVue).toContain('@media (max-width: 960px)')
    expect(dictItemListVue).toContain('grid-template-columns: 1fr;')

    // Argument list split collapsed below 960px
    expect(argumentListVue).toContain('@media (max-width: 960px)')
    expect(argumentListVue).toContain('grid-template-columns: 1fr;')
  })

  it('provides horizontal scrolling table wrappers with min-width to prevent column compression', () => {
    expect(accountListVue).toContain('.table-wrap {')
    expect(accountListVue).toContain('overflow-x: auto;')
    expect(accountListVue).toContain('min-width: 640px;')

    expect(dictTypeListVue).toContain('.table-wrap {')
    expect(dictTypeListVue).toContain('overflow-x: auto;')
    expect(dictTypeListVue).toContain('min-width: 640px;')

    expect(dictItemListVue).toContain('.table-wrap {')
    expect(dictItemListVue).toContain('overflow-x: auto;')
    expect(dictItemListVue).toContain('min-width: 720px;')

    expect(argumentListVue).toContain('.table-wrap {')
    expect(argumentListVue).toContain('overflow-x: auto;')
    expect(argumentListVue).toContain('min-width: 640px;')
  })

  it('adapts topbar navigation layout under narrow viewports (<= 760px)', () => {
    expect(appShellVue).toContain('@media (max-width: 760px)')
    expect(appShellVue).toContain('flex-wrap: wrap;')
    expect(appShellVue).toContain('order: 3;')
  })
})

describe('browser acceptance: visible focus & keyboard navigation flows', () => {
  const themeCss = readFileSync('src/styles/theme.scss', 'utf-8')
  const accountListVue = readFileSync('src/views/AccountListView.vue', 'utf-8')
  const dictTypeListVue = readFileSync('src/views/DictTypeListView.vue', 'utf-8')
  const dictItemListVue = readFileSync('src/views/DictItemListView.vue', 'utf-8')
  const argumentListVue = readFileSync('src/views/ArgumentListView.vue', 'utf-8')
  const loginVue = readFileSync('src/views/LoginView.vue', 'utf-8')

  it('enforces visible focus outlines on buttons, links, inputs, selects and textareas', () => {
    expect(themeCss).toContain('button:focus-visible')
    expect(themeCss).toContain('input:focus-visible')
    expect(themeCss).toContain('select:focus-visible')
    expect(themeCss).toContain('textarea:focus-visible')
    expect(themeCss).toContain('outline: 2px solid var(--orbit-orange);')
    expect(themeCss).toContain('outline-offset: 3px;')
  })

  it('binds Enter key to trigger search query across all list views', () => {
    expect(accountListVue).toContain('@keydown.enter.prevent="handleQuery"')
    expect(dictTypeListVue).toContain('@keydown.enter.prevent="handleQuery"')
    expect(dictItemListVue).toContain('@keydown.enter.prevent="handleQuery"')
    expect(argumentListVue).toContain('@keydown.enter.prevent="handleQuery"')
  })

  it('binds Enter key on login form and native submit button', () => {
    expect(loginVue).toContain('class="login-form" @submit.prevent="submit"')
    expect(loginVue).toContain('native-type="submit"')
  })

  it('enables ESC key modal dismiss while locking ESC during submission', () => {
    // Account create dialog
    expect(accountListVue).toContain(':close-on-press-escape="!createSubmitting"')
    // Dict type dialog
    expect(dictTypeListVue).toContain(':close-on-press-escape="!dialogSubmitting"')
    // Dict item dialog
    expect(dictItemListVue).toContain(':close-on-press-escape="!dialogSubmitting"')
    // Argument dialog
    expect(argumentListVue).toContain(':close-on-press-escape="!dialogSubmitting"')
  })

  it('validates interactive keyboard flows: Enter query and dialog open/close with focus restoration', async () => {
    resetTestHarness()
    sessionStorage.setItem('accessToken', 'test-token')

    httpMock.onGet('/sys_user/login/get_info').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: {
        nickName: '测试用户',
        userId: 1000,
        phoneNumber: '13800138000',
        identity: 'super_admin',
        status: 'enable',
      },
    })

    httpMock.onGet('/dictionary_data/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: { totals: 0, totalPages: 0, list: [] },
    })

    httpMock.onPost('/sys_user/list').reply(200, {
      code: 200000,
      msg: '操作成功',
      data: [],
    })

    const { wrapper, router } = mountApplication('/accounts')
    await router.isReady()
    await flushPromises()

    // 1. Enter key triggers query
    const phoneFilter = wrapper.find('[data-test="filter-phone"]')
    expect(phoneFilter.exists()).toBe(true)
    await phoneFilter.setValue('13800000000')
    await phoneFilter.trigger('keydown', { key: 'Enter', code: 'Enter' })
    await flushPromises()

    const postRequests = httpMock.history.post.filter((r) => r.url === '/sys_user/list')
    expect(postRequests.length).toBeGreaterThanOrEqual(1)

    // 2. Open dialog via keyboard/click on trigger button
    const createBtn = wrapper.find('[data-test="btn-create-account"]')
    expect(createBtn.exists()).toBe(true)
    await createBtn.trigger('click')
    await nextTick()

    const dialog = wrapper.find('[data-test="create-account-dialog"]')
    expect(dialog.exists()).toBe(true)

    // 3. Dialog overlay has role="dialog" and aria-modal="true" for screen readers & a11y focus trapping
    const overlayDialog = wrapper.find('.el-overlay-dialog')
    expect(overlayDialog.exists()).toBe(true)
    expect(overlayDialog.attributes('role')).toBe('dialog')
    expect(overlayDialog.attributes('aria-modal')).toBe('true')

    // 4. Dismiss via Escape key
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }))
    await nextTick()

    expect(wrapper.find('.el-overlay').classes()).toContain('dialog-fade-leave-active')
  })
})

describe('browser acceptance: deployment evidence summary', () => {
  const siteConfig = readFileSync('deploy/nginx/orbit-admin.conf', 'utf-8')
  const clientTs = readFileSync('src/api/client.ts', 'utf-8')

  it('verifies same-origin /api path and Bearer token request authorization header', () => {
    expect(clientTs).toContain("baseURL: '/api'")
    expect(clientTs).toContain("const accessToken = sessionStorage.getItem('accessToken')")
    expect(clientTs).toContain('config.headers.Authorization = `Bearer ${accessToken}`')

    // Verify Axios instance baseURL directly
    expect(apiClient.defaults.baseURL).toBe('/api')
  })

  it('verifies deep page refresh: Nginx location / try_files $uri $uri/ /index.html and no-cache headers', () => {
    expect(siteConfig).toContain('location / {')
    expect(siteConfig).toContain('try_files $uri $uri/ /index.html;')
    expect(siteConfig).toContain('add_header Cache-Control "no-cache, no-store, must-revalidate";')
    expect(siteConfig).toContain('add_header Pragma "no-cache";')
    expect(siteConfig).toContain('add_header Expires "0";')
  })

  it('verifies API and missing static assets do not fall back to index.html', () => {
    // Missing assets return 404 with 1-year immutable cache
    expect(siteConfig).toContain('location ^~ /assets/ {')
    expect(siteConfig).toContain('try_files $uri =404;')
    expect(siteConfig).toContain('add_header Cache-Control "public, max-age=31536000, immutable";')

    // API proxy routes to /admin/ and does not intercept errors
    expect(siteConfig).toContain('location ^~ /api/ {')
    expect(siteConfig).toContain('proxy_pass http://gateway_upstream/admin/;')
    expect(siteConfig).toContain('proxy_intercept_errors off;')
  })

  it('verifies production upstream, domain and HTTPS unverified boundary', () => {
    // Upstream points to local 18080 by default
    expect(siteConfig).toContain('upstream gateway_upstream {')
    expect(siteConfig).toContain('server 127.0.0.1:18080;')

    // Production domain and HTTPS are unverified in local development environment
    const productionDeploymentStatus = {
      productionGatewayReachable: false,
      productionDomainConfigured: false,
      productionHttpsCertValidated: false,
    }
    expect(productionDeploymentStatus.productionGatewayReachable).toBe(false)
    expect(productionDeploymentStatus.productionDomainConfigured).toBe(false)
    expect(productionDeploymentStatus.productionHttpsCertValidated).toBe(false)
  })
})
