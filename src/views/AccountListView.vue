<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElDialog } from 'element-plus'
import AppShell from '../components/AppShell.vue'
import { createAccount, fetchAccountList, type SysUserVO } from '../api/account'
import { fetchAccountDictionaries, type DictDataVO } from '../api/dict'
import { ApiError } from '../api/client'
import { useAuthStore } from '../auth/store'

const auth = useAuthStore()

const accounts = ref<SysUserVO[]>([])
const loading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
let querySeq = 0

// Dictionary state
const identityDict = ref<DictDataVO[]>([])
const statusDict = ref<DictDataVO[]>([])
const dictLoading = ref(false)
const dictError = ref(false)
const dictErrorMessage = ref('')

const filters = reactive({
  userId: '',
  phoneNumber: '',
  status: '',
})

const lastQueryParams = ref<{ userId?: string; phoneNumber?: string; status?: string }>({})

// Identity options for create dialog derived dynamically from admin dictionary
const identityOptions = computed(() => {
  const seen = new Set<string>()
  const options: { dataKey: string; value: string }[] = []
  for (const item of identityDict.value) {
    if (!seen.has(item.dataKey)) {
      seen.add(item.dataKey)
      options.push({ dataKey: item.dataKey, value: item.value })
    }
  }
  return options
})

// Status options for filter select derived dynamically from common_status dictionary
const statusOptions = computed(() => {
  const seen = new Set<string>()
  const options: { dataKey: string; value: string }[] = []
  for (const item of statusDict.value) {
    if (!seen.has(item.dataKey)) {
      seen.add(item.dataKey)
      options.push({ dataKey: item.dataKey, value: item.value })
    }
  }
  return options
})

// Mappings for table display (dataKey -> value)
const identityDictMap = computed(() => {
  const map = new Map<string, string>()
  for (const item of identityDict.value) {
    map.set(item.dataKey, item.value)
  }
  return map
})

const statusDictMap = computed(() => {
  const map = new Map<string, string>()
  for (const item of statusDict.value) {
    map.set(item.dataKey, item.value)
  }
  return map
})

function getIdentityLabel(identity: string): string {
  if (!identity) return ''
  return identityDictMap.value.get(identity) ?? identity
}

function getStatusLabel(status: string): string {
  if (!status) return ''
  return statusDictMap.value.get(status) ?? status
}

async function loadDictionaries(): Promise<void> {
  dictLoading.value = true
  dictError.value = false
  dictErrorMessage.value = ''

  try {
    const { admin, common_status } = await fetchAccountDictionaries()
    identityDict.value = admin
    statusDict.value = common_status
    dictLoading.value = false
  } catch (err: unknown) {
    dictError.value = true
    dictErrorMessage.value = err instanceof Error && err.message ? err.message : '字典数据加载失败，当前显示原始编码。'
    dictLoading.value = false
  }
}

async function loadAccounts(queryPayload?: {
  userId?: string
  phoneNumber?: string
  status?: string
}): Promise<boolean> {
  const currentSeq = ++querySeq
  loading.value = true
  hasError.value = false
  errorMessage.value = ''

  try {
    const result = await fetchAccountList(queryPayload)
    if (currentSeq !== querySeq) {
      return false
    }
    accounts.value = result
    loading.value = false
    return true
  } catch (err: unknown) {
    if (currentSeq !== querySeq) {
      return false
    }
    accounts.value = []
    hasError.value = true
    errorMessage.value = err instanceof Error && err.message ? err.message : '加载失败，请重试'
    loading.value = false
    return false
  }
}

function handleQuery() {
  refreshFailureNotice.value = ''
  lastQueryParams.value = {
    userId: filters.userId,
    phoneNumber: filters.phoneNumber,
    status: filters.status,
  }
  loadAccounts(lastQueryParams.value)
}

function handleReset() {
  refreshFailureNotice.value = ''
  filters.userId = ''
  filters.phoneNumber = ''
  filters.status = ''
  lastQueryParams.value = {}
  loadAccounts({})
}

async function handleRetry() {
  if (dictError.value) {
    loadDictionaries()
  }
  const ok = await loadAccounts(lastQueryParams.value)
  if (ok) {
    refreshFailureNotice.value = ''
  }
}

// Create account dialog state
const createDialogVisible = ref(false)
const createSubmitting = ref(false)
const createErrorMessage = ref('')
const isCreateUncertain = ref(false)
const refreshFailureNotice = ref('')

const PASSWORD_REGEX = /^[a-zA-Z0-9]+$/

type FormFieldName = 'identity' | 'phoneNumber' | 'password' | 'nickName' | 'status'

const createForm = reactive({
  identity: '',
  phoneNumber: '',
  password: '',
  nickName: '',
  status: '',
  remark: '',
})

const createFieldErrors = reactive<Record<FormFieldName, string>>({
  identity: '',
  phoneNumber: '',
  password: '',
  nickName: '',
  status: '',
})

const createFieldTouched = reactive<Record<FormFieldName, boolean>>({
  identity: false,
  phoneNumber: false,
  password: false,
  nickName: false,
  status: false,
})

function validateIdentity(): string {
  if (!createForm.identity) {
    return '请选择身份'
  }
  return ''
}

function validatePhoneNumber(): string {
  if (!createForm.phoneNumber.trim()) {
    return '请输入手机号'
  }
  return ''
}

function validatePassword(): string {
  if (!createForm.password) {
    return '请输入密码'
  }
  if (!PASSWORD_REGEX.test(createForm.password) || createForm.password.length > 20) {
    return '密码需为1-20位英文字母或数字'
  }
  return ''
}

function validateNickName(): string {
  if (!createForm.nickName.trim()) {
    return '请输入昵称'
  }
  return ''
}

function validateStatus(): string {
  if (!createForm.status) {
    return '请选择状态'
  }
  return ''
}

function validateSingleField(field: FormFieldName): string {
  let error = ''
  switch (field) {
    case 'identity':
      error = validateIdentity()
      break
    case 'phoneNumber':
      error = validatePhoneNumber()
      break
    case 'password':
      error = validatePassword()
      break
    case 'nickName':
      error = validateNickName()
      break
    case 'status':
      error = validateStatus()
      break
  }
  createFieldErrors[field] = error
  return error
}

function handleFieldBlur(field: FormFieldName) {
  createFieldTouched[field] = true
  validateSingleField(field)
}

function handleFieldInput(field: FormFieldName) {
  if (createFieldTouched[field]) {
    validateSingleField(field)
  }
}

function handleFieldChange(field: FormFieldName) {
  createFieldTouched[field] = true
  validateSingleField(field)
}

function validateAllCreateFields(): boolean {
  createFieldTouched.identity = true
  createFieldTouched.phoneNumber = true
  createFieldTouched.password = true
  createFieldTouched.nickName = true
  createFieldTouched.status = true

  const idErr = validateIdentity()
  const phoneErr = validatePhoneNumber()
  const pwdErr = validatePassword()
  const nickErr = validateNickName()
  const statusErr = validateStatus()

  createFieldErrors.identity = idErr
  createFieldErrors.phoneNumber = phoneErr
  createFieldErrors.password = pwdErr
  createFieldErrors.nickName = nickErr
  createFieldErrors.status = statusErr

  return !idErr && !phoneErr && !pwdErr && !nickErr && !statusErr
}

function resetCreateForm() {
  createForm.identity = ''
  createForm.phoneNumber = ''
  createForm.password = ''
  createForm.nickName = ''
  createForm.status = ''
  createForm.remark = ''
  createErrorMessage.value = ''
  isCreateUncertain.value = false
  createFieldErrors.identity = ''
  createFieldErrors.phoneNumber = ''
  createFieldErrors.password = ''
  createFieldErrors.nickName = ''
  createFieldErrors.status = ''
  createFieldTouched.identity = false
  createFieldTouched.phoneNumber = false
  createFieldTouched.password = false
  createFieldTouched.nickName = false
  createFieldTouched.status = false
}

function openCreateDialog() {
  refreshFailureNotice.value = ''
  resetCreateForm()
  createDialogVisible.value = true
}

function closeCreateDialog() {
  if (createSubmitting.value) {
    return
  }
  if (!confirmDiscardChanges()) {
    return
  }
  createDialogVisible.value = false
  resetCreateForm()
}

function handleDialogBeforeClose(done: () => void) {
  if (createSubmitting.value) {
    return
  }
  if (!confirmDiscardChanges()) {
    return
  }
  resetCreateForm()
  done()
}

const CONFIRM_DISCARD_MESSAGE = '表单有未保存的修改，确定放弃吗？'

const isCreateFormDirty = computed(() => {
  return (
    createForm.identity !== '' ||
    createForm.phoneNumber !== '' ||
    createForm.password !== '' ||
    createForm.nickName !== '' ||
    createForm.status !== '' ||
    createForm.remark !== ''
  )
})

function confirmDiscardChanges(): boolean {
  if (!isCreateFormDirty.value) {
    return true
  }
  // eslint-disable-next-line no-undef
  return window.confirm(CONFIRM_DISCARD_MESSAGE)
}

onBeforeRouteLeave(() => {
  if (!auth.isAuthenticated || auth.sessionExpired) {
    createDialogVisible.value = false
    resetCreateForm()
    return true
  }

  if (createDialogVisible.value && isCreateFormDirty.value) {
    const ok = confirmDiscardChanges()
    if (!ok) {
      return false
    }
    createDialogVisible.value = false
    resetCreateForm()
    return true
  }

  if (createDialogVisible.value) {
    createDialogVisible.value = false
    resetCreateForm()
  }

  return true
})

watch(
  () => [auth.accessToken, auth.sessionExpired, auth.isAuthenticated],
  () => {
    if (!auth.isAuthenticated || auth.sessionExpired) {
      createDialogVisible.value = false
      resetCreateForm()
    }
  },
)

const isCreateFormFilled = computed(() => {
  return (
    createForm.identity !== '' &&
    createForm.phoneNumber.trim() !== '' &&
    createForm.password !== '' &&
    createForm.nickName.trim() !== '' &&
    createForm.status !== ''
  )
})

const isCreateFormValid = computed(() => isCreateFormFilled.value)

function isUncertainWriteError(err: unknown): boolean {
  if (err instanceof ApiError) {
    if (err.kind === 'timeout' || err.isTimeout) {
      return true
    }
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || err.code === 'ERR_CANCELED') {
      return true
    }
    if (typeof err.message === 'string' && /timeout|超时|abort|canceled/i.test(err.message)) {
      return true
    }
  }
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>
    if (record.kind === 'timeout' || record.isTimeout === true) {
      return true
    }
    if (
      record.code === 'ECONNABORTED' ||
      record.code === 'ETIMEDOUT' ||
      record.code === 'ERR_CANCELED' ||
      record.code === 'ECONNRESET'
    ) {
      return true
    }
    if (typeof record.message === 'string' && /timeout|超时|abort|canceled|econnreset/i.test(record.message)) {
      return true
    }
  }
  return false
}

async function handleCreateSubmit() {
  if (dictError.value || dictLoading.value) {
    return
  }

  if (createSubmitting.value) {
    return
  }

  const isValid = validateAllCreateFields()
  if (!isValid) {
    return
  }

  createSubmitting.value = true
  createErrorMessage.value = ''
  isCreateUncertain.value = false
  refreshFailureNotice.value = ''

  try {
    await createAccount({
      identity: createForm.identity,
      phoneNumber: createForm.phoneNumber.trim(),
      password: createForm.password,
      nickName: createForm.nickName.trim(),
      status: createForm.status,
      remark: createForm.remark.trim() ? createForm.remark.trim() : undefined,
    })
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      createDialogVisible.value = false
      resetCreateForm()
      return
    }
    if (isUncertainWriteError(err)) {
      isCreateUncertain.value = true
      createErrorMessage.value = '提交结果未确认，请先查询核实'
    } else if (err instanceof ApiError) {
      if (err.kind === 'network') {
        createErrorMessage.value = '网络请求失败，请稍后重试'
      } else if (err.serverMessage) {
        createErrorMessage.value = err.serverMessage
      } else if (err.status === 400) {
        createErrorMessage.value = '提交参数有误，请检查后重试'
      } else {
        createErrorMessage.value = err.message || '创建账号失败，请重试'
      }
    } else if (err instanceof Error && err.message) {
      createErrorMessage.value = err.message
    } else {
      createErrorMessage.value = '创建账号失败，请重试'
    }
    return
  } finally {
    createSubmitting.value = false
  }

  createDialogVisible.value = false
  resetCreateForm()

  let refreshOk: boolean
  try {
    refreshOk = await loadAccounts(lastQueryParams.value)
  } catch (refreshErr: unknown) {
    refreshOk = false
    hasError.value = true
    errorMessage.value = refreshErr instanceof Error && refreshErr.message ? refreshErr.message : '加载失败，请重试'
  }

  if (!refreshOk || hasError.value) {
    refreshFailureNotice.value = '账号创建成功，但列表刷新失败。请通过下方表格重试刷新查看最新数据，无需重复提交保存。'
  }
}

onMounted(() => {
  lastQueryParams.value = {}
  loadDictionaries()
  loadAccounts({})
})
</script>

<template>
  <AppShell>
    <div class="accounts-page">
      <header class="page-heading">
        <div class="heading-kicker-wrap">
          <span class="kicker-dot" />
          <p class="section-kicker">ADMINISTRATION / 01</p>
        </div>
        <h1 id="accounts-title">管理端账号</h1>
        <p class="intro-copy">查看账号信息，维护系统的协作入口。</p>
      </header>

      <div class="accounts-split">
        <section class="accounts-main" aria-labelledby="accounts-title">
          <div v-if="dictError" class="dict-alert" data-test="dict-alert" role="alert">
            <div class="dict-alert-content">
              <span class="dict-alert-icon" aria-hidden="true">!</span>
              <p class="dict-alert-message">{{ dictErrorMessage || '字典数据加载失败，当前显示原始编码。' }}</p>
            </div>
            <button
              type="button"
              class="btn-dict-retry"
              data-test="dict-retry"
              :disabled="dictLoading"
              @click="loadDictionaries"
            >
              {{ dictLoading ? '重试中...' : '重试字典' }}
            </button>
          </div>

          <div v-if="refreshFailureNotice" class="refresh-notice-alert" data-test="create-refresh-warning" role="alert">
            <div class="refresh-notice-content">
              <span class="refresh-notice-icon" aria-hidden="true">!</span>
              <p class="refresh-notice-text" data-test="refresh-failure-notice">
                {{ refreshFailureNotice }}
              </p>
            </div>
            <button
              type="button"
              class="btn-notice-dismiss"
              data-test="btn-dismiss-refresh-notice"
              @click="refreshFailureNotice = ''"
            >
              知道了
            </button>
          </div>

          <div class="table-card">
            <form class="filters-form" @submit.prevent="handleQuery">
              <div class="filter-field">
                <label for="filter-user-id">账号 ID</label>
                <input
                  id="filter-user-id"
                  v-model="filters.userId"
                  data-test="filter-user-id"
                  type="text"
                  placeholder="精确匹配"
                  @keydown.enter.prevent="handleQuery"
                />
              </div>

              <div class="filter-field">
                <label for="filter-phone">手机号</label>
                <input
                  id="filter-phone"
                  v-model="filters.phoneNumber"
                  data-test="filter-phone"
                  type="text"
                  placeholder="输入完整手机号"
                  @keydown.enter.prevent="handleQuery"
                />
              </div>

              <div class="filter-field">
                <label for="filter-status">状态</label>
                <div class="select-wrap">
                  <select id="filter-status" v-model="filters.status" data-test="filter-status">
                    <option value="">全部状态</option>
                    <option
                      v-for="item in statusOptions"
                      :key="item.dataKey"
                      :value="item.dataKey"
                      :data-test="`status-option-${item.dataKey}`"
                    >
                      {{ item.value }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="filter-actions">
                <button type="submit" data-test="query-submit" class="btn-query">
                  <span>查询</span>
                  <span class="btn-arrow">↗</span>
                </button>
                <button type="button" data-test="query-reset" class="btn-reset" @click="handleReset">重置</button>
              </div>
            </form>

            <div class="table-toolbar">
              <div class="toolbar-meta">
                <span class="meta-dot" />
                <span class="meta-text">账号名录列表</span>
              </div>
              <button type="button" class="btn-create-account" data-test="btn-create-account" @click="openCreateDialog">
                <svg class="btn-add-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                  <path d="M8 3.5v9M3.5 8h9" stroke-width="2" stroke-linecap="round" />
                </svg>
                <span>新增账号</span>
              </button>
            </div>

            <div class="table-wrap">
              <table class="account-table" data-test="account-table">
                <thead>
                  <tr>
                    <th scope="col">账号 ID</th>
                    <th scope="col">手机号</th>
                    <th scope="col">昵称</th>
                    <th scope="col">身份</th>
                    <th scope="col">状态</th>
                    <th scope="col">备注</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading" data-test="state-loading" class="state-row">
                    <td colspan="6" class="cell-state is-loading">
                      <span class="state-spinner" aria-hidden="true" />
                      <span class="state-message">正在加载数据...</span>
                    </td>
                  </tr>
                  <tr v-else-if="hasError" data-test="state-error" class="state-row is-error">
                    <td colspan="6" class="cell-state is-error">
                      <p class="state-message">{{ errorMessage || '数据加载失败，请重试' }}</p>
                      <button type="button" data-test="state-retry" class="btn-retry" @click="handleRetry">重试</button>
                    </td>
                  </tr>
                  <tr v-else-if="accounts.length === 0" data-test="state-empty" class="state-row is-empty">
                    <td colspan="6" class="cell-state is-empty">
                      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="9" stroke-width="1.5" stroke-dasharray="3 3" />
                        <path
                          d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                      </svg>
                      <span>暂无数据</span>
                    </td>
                  </tr>
                  <tr v-for="account in accounts" v-else :key="account.userId" data-test="account-row">
                    <td class="cell-id">
                      <span class="id-tag">#{{ account.userId }}</span>
                    </td>
                    <td class="cell-phone">{{ account.phoneNumber }}</td>
                    <td class="cell-nickname">
                      <div class="user-inline">
                        <span class="user-avatar-mini">{{ (account.nickName || 'U')[0] }}</span>
                        <span>{{ account.nickName }}</span>
                      </div>
                    </td>
                    <td class="cell-identity">
                      <span class="identity-badge">{{ getIdentityLabel(account.identity) }}</span>
                    </td>
                    <td class="cell-status">
                      <span :class="['status-badge', account.status === 'disable' ? 'is-disabled' : 'is-enabled']">
                        <span class="badge-point" />
                        <span>{{ getStatusLabel(account.status) }}</span>
                      </span>
                    </td>
                    <td class="cell-remark">{{ account.remark || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="!loading && !hasError && accounts.length > 0" class="list-summary-bar">
              <p class="list-summary">已显示全部 {{ accounts.length }} 个账号</p>
            </div>
          </div>
        </section>

        <aside class="accounts-rail" aria-label="当前操作边界">
          <div class="rail-card">
            <div class="rail-eyebrow">ACCOUNT DIRECTORY</div>
            <h2>让协作各有所属。</h2>
            <p>从这里查看管理端账号，精确定位协作成员。</p>

            <div class="boundary-note">
              <div class="boundary-header">
                <svg class="boundary-icon" viewBox="0 0 16 16" fill="currentColor">
                  <path
                    d="M8 1a3.5 3.5 0 00-3.5 3.5V6H3a1 1 0 00-1 1v7a1 1 0 001 1h10a1 1 0 001-1V7a1 1 0 00-1-1h-1.5V4.5A3.5 3.5 0 008 1zm2 5H6V4.5a2 2 0 114 0V6z"
                  />
                </svg>
                <span class="note-label">当前边界</span>
              </div>
              <p>当前页面支持按 ID、手机号和状态精确查询。</p>
              <p>首版不提供编辑、删除、重置密码或停用入口。</p>
            </div>
          </div>
        </aside>
      </div>

      <el-dialog
        v-model="createDialogVisible"
        title="新增管理端账号"
        width="520px"
        class="account-create-dialog"
        destroy-on-close
        :close-on-click-modal="!createSubmitting"
        :close-on-press-escape="!createSubmitting"
        :show-close="!createSubmitting"
        :before-close="handleDialogBeforeClose"
      >
        <div data-test="create-account-dialog">
          <div v-if="dictError" class="dict-alert dialog-dict-alert" data-test="dialog-dict-alert" role="alert">
            <div class="dict-alert-content">
              <span class="dict-alert-icon" aria-hidden="true">!</span>
              <p class="dict-alert-message">{{ dictErrorMessage || '字典选项加载失败，无法选择身份与状态。' }}</p>
            </div>
            <button
              type="button"
              class="btn-dict-retry"
              data-test="dialog-dict-retry"
              :disabled="dictLoading"
              @click="loadDictionaries"
            >
              {{ dictLoading ? '重试中...' : '重试加载选项' }}
            </button>
          </div>

          <form class="create-account-form" data-test="create-account-form" @submit.prevent="handleCreateSubmit">
            <div class="form-item" :class="{ 'has-error': createFieldErrors.identity }">
              <label for="create-identity" class="form-label required">身份</label>
              <select
                id="create-identity"
                v-model="createForm.identity"
                data-test="create-form-identity"
                :disabled="dictError || dictLoading || createSubmitting"
                @blur="handleFieldBlur('identity')"
                @change="handleFieldChange('identity')"
              >
                <option value="">请选择身份</option>
                <option
                  v-for="item in identityOptions"
                  :key="item.dataKey"
                  :value="item.dataKey"
                  :data-test="`create-identity-option-${item.dataKey}`"
                >
                  {{ item.value }}
                </option>
              </select>
              <span
                v-if="createFieldErrors.identity"
                class="field-error"
                data-test="error-create-identity"
                role="alert"
              >
                {{ createFieldErrors.identity }}
              </span>
            </div>

            <div class="form-item" :class="{ 'has-error': createFieldErrors.phoneNumber }">
              <label for="create-phone" class="form-label required">手机号</label>
              <input
                id="create-phone"
                v-model="createForm.phoneNumber"
                data-test="create-form-phone"
                type="text"
                placeholder="请输入手机号"
                :disabled="createSubmitting"
                @blur="handleFieldBlur('phoneNumber')"
                @input="handleFieldInput('phoneNumber')"
              />
              <span
                v-if="createFieldErrors.phoneNumber"
                class="field-error"
                data-test="error-create-phone"
                role="alert"
              >
                {{ createFieldErrors.phoneNumber }}
              </span>
            </div>

            <div class="form-item" :class="{ 'has-error': createFieldErrors.password }">
              <label for="create-password" class="form-label required">密码</label>
              <input
                id="create-password"
                v-model="createForm.password"
                data-test="create-form-password"
                type="password"
                maxlength="20"
                placeholder="1-20位英文字母或数字"
                autocomplete="new-password"
                :disabled="createSubmitting"
                @blur="handleFieldBlur('password')"
                @input="handleFieldInput('password')"
              />
              <span
                v-if="createFieldErrors.password"
                class="field-error"
                data-test="error-create-password"
                role="alert"
              >
                {{ createFieldErrors.password }}
              </span>
            </div>

            <div class="form-item" :class="{ 'has-error': createFieldErrors.nickName }">
              <label for="create-nickname" class="form-label required">昵称</label>
              <input
                id="create-nickname"
                v-model="createForm.nickName"
                data-test="create-form-nickname"
                type="text"
                placeholder="请输入昵称"
                :disabled="createSubmitting"
                @blur="handleFieldBlur('nickName')"
                @input="handleFieldInput('nickName')"
              />
              <span
                v-if="createFieldErrors.nickName"
                class="field-error"
                data-test="error-create-nickname"
                role="alert"
              >
                {{ createFieldErrors.nickName }}
              </span>
            </div>

            <div class="form-item" :class="{ 'has-error': createFieldErrors.status }">
              <label for="create-status" class="form-label required">状态</label>
              <select
                id="create-status"
                v-model="createForm.status"
                data-test="create-form-status"
                :disabled="dictError || dictLoading || createSubmitting"
                @blur="handleFieldBlur('status')"
                @change="handleFieldChange('status')"
              >
                <option value="">请选择状态</option>
                <option
                  v-for="item in statusOptions"
                  :key="item.dataKey"
                  :value="item.dataKey"
                  :data-test="`create-status-option-${item.dataKey}`"
                >
                  {{ item.value }}
                </option>
              </select>
              <span v-if="createFieldErrors.status" class="field-error" data-test="error-create-status" role="alert">
                {{ createFieldErrors.status }}
              </span>
            </div>

            <div class="form-item">
              <label for="create-remark" class="form-label">备注</label>
              <textarea
                id="create-remark"
                v-model="createForm.remark"
                data-test="create-form-remark"
                rows="3"
                placeholder="可选备注信息"
                :disabled="createSubmitting"
              />
            </div>

            <div
              v-if="createErrorMessage"
              class="create-error-message"
              data-test="create-error-message"
              :class="{ 'is-uncertain': isCreateUncertain }"
              role="alert"
            >
              <span class="create-error-icon" aria-hidden="true">!</span>
              <span class="create-error-text" :data-test="isCreateUncertain ? 'create-uncertain-warning' : undefined">{{
                createErrorMessage
              }}</span>
            </div>

            <div class="dialog-actions">
              <button
                type="button"
                class="btn-cancel-create"
                data-test="btn-cancel-create"
                :disabled="createSubmitting"
                @click="closeCreateDialog"
              >
                取消
              </button>
              <button
                type="submit"
                class="btn-submit-create"
                data-test="btn-submit-create"
                :disabled="dictError || dictLoading || createSubmitting || !isCreateFormValid"
              >
                {{ createSubmitting ? '提交中...' : '确认新增' }}
              </button>
            </div>
          </form>
        </div>
      </el-dialog>
    </div>
  </AppShell>
</template>

<style lang="scss" scoped>
.accounts-page {
  display: flex;
  flex-direction: column;
  gap: var(--orbit-space-xl);
}

.page-heading {
  padding-bottom: var(--orbit-space-md);
  border-bottom: var(--orbit-content-border);
}

.heading-kicker-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.kicker-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--orbit-orange);
}

.section-kicker {
  color: var(--orbit-orange);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  margin: 0;
}

.page-heading h1 {
  margin: 0.5rem 0 0.75rem;
  color: var(--orbit-ink);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  font-size: clamp(2rem, 3.5vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.intro-copy {
  max-width: 38rem;
  margin: 0;
  color: var(--orbit-body-muted);
  font-size: 0.98rem;
  line-height: 1.65;
}

.accounts-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 2.25rem;
  align-items: start;
}

.table-card {
  background: var(--orbit-paper);
  border: 1px solid var(--orbit-line-soft);
  border-radius: 16px;
  box-shadow: 0 4px 20px -2px rgba(21, 59, 54, 0.05);
  overflow: hidden;
}

.dict-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 0.85rem 1.25rem;
  border-left: 4px solid #ef4444;
  background: rgba(239, 68, 68, 0.08);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.06);
}

.dict-alert-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dict-alert-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.dict-alert-message {
  margin: 0;
  color: #991b1b;
  font-size: 0.88rem;
  font-weight: 500;
}

.refresh-notice-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 0.85rem 1.25rem;
  border-left: 4px solid #f59e0b;
  background: rgba(245, 158, 11, 0.08);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.06);
}

.refresh-notice-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.refresh-notice-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 50%;
  background: #f59e0b;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.refresh-notice-text {
  margin: 0;
  color: #92400e;
  font-size: 0.88rem;
  line-height: 1.5;
  font-weight: 500;
}

.btn-notice-dismiss {
  padding: 0.35rem 0.85rem;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 6px;
  background: #ffffff;
  color: #92400e;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: #fffbeb;
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.btn-dict-retry {
  padding: 0.35rem 0.85rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  background: #ffffff;
  color: #991b1b;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: #fef2f2;
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.filters-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) auto;
  gap: 1.25rem;
  align-items: end;
  padding: 1.5rem 1.75rem;
  background: rgba(21, 59, 54, 0.02);
  border-bottom: 1px solid var(--orbit-line-soft);
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  label {
    color: var(--orbit-body-muted);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  input,
  select {
    height: 2.5rem;
    padding: 0 0.85rem;
    border: 1px solid var(--orbit-line-soft);
    border-radius: 8px;
    background: var(--orbit-paper);
    color: var(--orbit-ink);
    font-family: inherit;
    font-size: 0.9rem;
    transition: all 0.18s ease;

    &:hover {
      border-color: rgba(21, 59, 54, 0.3);
    }

    &:focus {
      border-color: var(--orbit-orange);
      box-shadow: 0 0 0 3px rgba(232, 117, 59, 0.15);
      outline: none;
    }
  }
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-query {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  height: 2.5rem;
  padding: 0 1.25rem;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--orbit-orange) 0%, #ff8a4c 100%);
  color: #0b2925;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(232, 117, 59, 0.3);
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    box-shadow: 0 4px 12px rgba(232, 117, 59, 0.45);
    transform: translateY(-1px);
    color: #0b2925;
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.btn-arrow {
  font-size: 1rem;
}

.btn-reset {
  height: 2.5rem;
  padding: 0 1rem;
  border: 1px solid var(--orbit-line-soft);
  border-radius: 8px;
  background: var(--orbit-paper);
  color: var(--orbit-ink);
  font-weight: 500;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(21, 59, 54, 0.04);
    border-color: rgba(21, 59, 54, 0.3);
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.75rem 0.5rem;
}

.toolbar-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.meta-text {
  color: var(--orbit-body-muted);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.btn-create-account {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  height: 2.35rem;
  padding: 0 1.15rem;
  border: 0;
  border-radius: 8px;
  background: var(--orbit-orange);
  color: #0b2925;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(232, 117, 59, 0.3);
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: var(--orbit-orange-hover);
    box-shadow: 0 4px 14px rgba(232, 117, 59, 0.45);
    transform: translateY(-1px);
    color: #0b2925;
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.btn-add-icon {
  width: 0.95rem;
  height: 0.95rem;
}

.table-wrap {
  overflow-x: auto;
  padding: 0.75rem 1.75rem 1.25rem;
}

.account-table {
  width: 100%;
  min-width: 640px;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  font-size: 0.88rem;

  th {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid var(--orbit-line-soft);
    background: rgba(21, 59, 54, 0.03);
    color: var(--orbit-body-muted);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    white-space: nowrap;

    &:first-child {
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
    }

    &:last-child {
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
    }
  }

  td {
    padding: 1.05rem 1rem;
    border-bottom: 1px solid rgba(21, 59, 54, 0.08);
    color: var(--orbit-ink);
    vertical-align: middle;
    transition: background 0.15s ease;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  tbody tr:hover td {
    background: rgba(21, 59, 54, 0.03);
  }
}

.cell-id,
.cell-phone {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.id-tag {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: rgba(21, 59, 54, 0.06);
  color: var(--orbit-ink);
  font-family: ui-monospace, monospace;
  font-size: 0.82rem;
  font-weight: 600;
}

.user-inline {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.user-avatar-mini {
  display: grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 50%;
  background: rgba(232, 117, 59, 0.15);
  color: var(--orbit-orange);
  font-size: 0.75rem;
  font-weight: 700;
}

.cell-nickname,
.cell-identity {
  white-space: nowrap;
}

.identity-badge {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  color: #4f46e5;
  font-size: 0.78rem;
  font-weight: 600;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;

  &.is-enabled {
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.25);
    color: #065f46;

    .badge-point {
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }
  }

  &.is-disabled {
    background: rgba(100, 116, 139, 0.12);
    border: 1px solid rgba(100, 116, 139, 0.25);
    color: #475569;

    .badge-point {
      background: #94a3b8;
    }
  }
}

.badge-point {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.cell-remark {
  min-width: 14rem;
  line-height: 1.5;
  word-break: break-all;
  white-space: normal;
  color: var(--orbit-body-muted);
}

.cell-state {
  padding: 4rem 1rem !important;
  text-align: center;
  color: var(--orbit-body-muted);
  font-size: 0.92rem;

  &.is-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &.is-error {
    color: var(--orbit-ink);

    .state-message {
      color: #dc2626;
      font-weight: 500;
    }
  }

  .state-message {
    margin: 0.5rem 0 0.85rem;
  }

  &.is-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: var(--orbit-body-muted);
  }
}

.empty-icon {
  width: 2.5rem;
  height: 2.5rem;
  stroke: var(--orbit-muted);
}

.state-spinner {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 2.5px solid rgba(21, 59, 54, 0.15);
  border-top-color: var(--orbit-orange);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-retry {
  display: inline-block;
  padding: 0.45rem 1.35rem;
  border: 0;
  border-radius: 8px;
  background: var(--orbit-orange);
  color: #0b2925;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(232, 117, 59, 0.3);
  transition: all 0.15s ease;

  &:hover {
    background: var(--orbit-orange-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.list-summary-bar {
  padding: 0.75rem 1.75rem 1.25rem;
  border-top: 1px solid var(--orbit-line-soft);
}

.list-summary {
  margin: 0;
  color: var(--orbit-body-muted);
  font-size: 0.82rem;
}

.accounts-rail {
  position: sticky;
  top: 5.5rem;
}

.rail-card {
  padding: 1.75rem;
  background: var(--orbit-paper);
  border: 1px solid var(--orbit-line-soft);
  border-radius: 16px;
  box-shadow: 0 4px 16px -2px rgba(21, 59, 54, 0.04);
}

.rail-eyebrow {
  color: var(--orbit-orange);
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.rail-card h2 {
  margin: 0.6rem 0 0.5rem;
  color: var(--orbit-ink);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.rail-card p {
  margin: 0 0 1rem;
  color: var(--orbit-body-muted);
  font-size: 0.85rem;
  line-height: 1.6;
}

.boundary-note {
  margin-top: 1.25rem;
  padding: 1.25rem;
  border-left: 3px solid var(--orbit-orange);
  border-radius: 0 8px 8px 0;
  background: rgba(21, 59, 54, 0.03);

  p {
    margin: 0.4rem 0 0;
    font-size: 0.82rem;
    line-height: 1.55;
  }
}

.boundary-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.25rem;
}

.boundary-icon {
  width: 0.85rem;
  height: 0.85rem;
  color: var(--orbit-orange);
}

.note-label {
  color: var(--orbit-ink);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

:deep(.account-create-dialog) {
  background: var(--orbit-paper);
  border: 1px solid var(--orbit-line-soft);
  border-radius: 16px;
  box-shadow: 0 24px 48px -12px rgba(11, 41, 37, 0.25);
  overflow: hidden;

  .el-dialog__header {
    padding: 1.5rem 1.75rem 1.25rem;
    margin-right: 0;
    border-bottom: 1px solid var(--orbit-line-soft);
  }

  .el-dialog__title {
    color: var(--orbit-ink);
    font-family: var(--orbit-font-serif);
    font-size: 1.25rem;
    font-weight: 700;
  }

  .el-dialog__headerbtn .el-dialog__close {
    color: var(--orbit-body-muted);
    font-size: 1.1rem;
    transition: transform 0.2s ease;

    &:hover {
      transform: rotate(90deg);
      color: var(--orbit-ink);
    }
  }

  .el-dialog__body {
    padding: 1.75rem;
    color: var(--orbit-ink);
  }
}

.create-account-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  color: var(--orbit-body-muted);
  font-size: 0.82rem;
  font-weight: 600;

  &.required::after {
    content: ' *';
    color: var(--orbit-orange);
  }
}

.form-item input,
.form-item select,
.form-item textarea {
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--orbit-line-soft);
  border-radius: 8px;
  background: var(--orbit-paper);
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.18s ease;

  &:focus {
    border-color: var(--orbit-orange);
    box-shadow: 0 0 0 3px rgba(232, 117, 59, 0.15);
    outline: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: rgba(21, 59, 54, 0.03);
  }
}

.form-item textarea {
  resize: vertical;
}

.field-error {
  margin-top: 0.2rem;
  color: #dc2626;
  font-size: 0.78rem;
  line-height: 1.3;
  font-weight: 500;
}

.form-item.has-error input,
.form-item.has-error select {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.02);

  &:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
  }
}

.create-error-message {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.08);
  border-left: 3px solid #ef4444;
  color: #991b1b;
  font-size: 0.85rem;
  font-weight: 500;

  &.is-uncertain {
    background: rgba(245, 158, 11, 0.08);
    border-left: 3px solid #f59e0b;
    color: #92400e;

    .create-error-icon {
      background: #f59e0b;
      color: #fff;
    }
  }
}

.create-error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 50%;
  background: #ef4444;
  color: var(--orbit-paper);
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.btn-cancel-create {
  height: 2.5rem;
  padding: 0 1.25rem;
  border: 1px solid var(--orbit-line-soft);
  border-radius: 8px;
  background: transparent;
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(21, 59, 54, 0.04);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-submit-create {
  height: 2.5rem;
  padding: 0 1.5rem;
  border: 0;
  border-radius: 8px;
  background: var(--orbit-orange);
  color: #0b2925;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(232, 117, 59, 0.3);
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover:not(:disabled) {
    background: var(--orbit-orange-hover);
    box-shadow: 0 4px 12px rgba(232, 117, 59, 0.45);
    transform: translateY(-1px);
    color: #0b2925;
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.dialog-dict-alert {
  margin-bottom: 1.25rem;
}

@media (max-width: 900px) {
  .accounts-split {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .accounts-rail {
    position: static;
  }
}
</style>
