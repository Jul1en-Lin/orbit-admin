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
        <p class="section-kicker">ADMINISTRATION / 01</p>
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

            <div class="filter-actions">
              <button type="submit" data-test="query-submit" class="btn-query">查询 ↗</button>
              <button type="button" data-test="query-reset" class="btn-reset" @click="handleReset">重置</button>
            </div>
          </form>

          <div class="table-toolbar">
            <button type="button" class="btn-create-account" data-test="btn-create-account" @click="openCreateDialog">
              + 新增账号
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
                  <td colspan="6" class="cell-state is-empty">暂无数据</td>
                </tr>
                <tr v-for="account in accounts" v-else :key="account.userId" data-test="account-row">
                  <td class="cell-id">{{ account.userId }}</td>
                  <td class="cell-phone">{{ account.phoneNumber }}</td>
                  <td class="cell-nickname">{{ account.nickName }}</td>
                  <td class="cell-identity">{{ getIdentityLabel(account.identity) }}</td>
                  <td class="cell-status">
                    <span :class="['status-badge', account.status === 'disable' ? 'is-disabled' : 'is-enabled']">
                      {{ getStatusLabel(account.status) }}
                    </span>
                  </td>
                  <td class="cell-remark">{{ account.remark || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="!loading && !hasError && accounts.length > 0" class="list-summary">
            已显示全部 {{ accounts.length }} 个账号
          </p>
        </section>

        <aside class="accounts-rail" aria-label="当前操作边界">
          <div class="rail-eyebrow">ACCOUNT DIRECTORY</div>
          <h2>让协作各有所属。</h2>
          <p>从这里查看管理端账号，精确定位协作成员。</p>
          <div class="boundary-note">
            <span class="note-label">当前边界</span>
            <p>当前页面支持按 ID、手机号和状态精确查询。</p>
            <p>首版不提供编辑、删除、重置密码或停用入口。</p>
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

.section-kicker {
  color: var(--orbit-orange);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.page-heading h1 {
  margin: 0.7rem 0 1rem;
  color: var(--orbit-ink);
  font-family: var(--orbit-font-serif);
  font-size: clamp(2.5rem, 5vw, 4.6rem);
  font-weight: 400;
  line-height: 1;
}

.intro-copy {
  max-width: 38rem;
  color: var(--orbit-body-muted);
  font-size: 1.1rem;
  line-height: 1.7;
}

.accounts-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 3rem;
  align-items: start;
}

.dict-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  border-left: 3px solid #d9534f;
  background: rgba(217, 83, 79, 0.08);
  border-radius: 2px;
}

.dict-alert-content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.dict-alert-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background: #d9534f;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
}

.dict-alert-message {
  margin: 0;
  color: var(--orbit-ink);
  font-size: 0.85rem;
}

.refresh-notice-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  border-left: 3px solid #d97706;
  background: rgba(217, 119, 6, 0.08);
  border-radius: 2px;
}

.refresh-notice-content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.refresh-notice-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background: #d97706;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.refresh-notice-text {
  margin: 0;
  color: var(--orbit-ink);
  font-size: 0.85rem;
  line-height: 1.5;
}

.btn-notice-dismiss {
  padding: 0.3rem 0.8rem;
  border: 1px solid var(--orbit-line-soft);
  background: var(--orbit-paper);
  color: var(--orbit-ink);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.btn-dict-retry {
  padding: 0.3rem 0.8rem;
  border: 1px solid var(--orbit-line-soft);
  background: var(--orbit-paper);
  color: var(--orbit-ink);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  outline-offset: 2px;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: var(--orbit-orange);
    border-color: var(--orbit-orange);
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
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) auto;
  gap: 1.25rem;
  align-items: end;
  padding: 1.5rem 0;
  border-top: 1px solid var(--orbit-line-soft);
  border-bottom: 1px solid var(--orbit-line-soft);
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.filter-field label {
  color: var(--orbit-body-muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.filter-field input,
.filter-field select {
  height: 2.4rem;
  padding: 0 0.75rem;
  border: 1px solid var(--orbit-line-soft);
  background: var(--orbit-paper);
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.9rem;
  outline-offset: 2px;

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-query {
  height: 2.4rem;
  padding: 0 1.25rem;
  border: 0;
  background: var(--orbit-orange);
  color: var(--orbit-ink);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
  outline-offset: 2px;

  &:hover {
    opacity: 0.9;
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.btn-reset {
  height: 2.4rem;
  padding: 0 1rem;
  border: 1px solid var(--orbit-line-soft);
  background: transparent;
  color: var(--orbit-ink);
  cursor: pointer;
  outline-offset: 2px;

  &:hover {
    background: var(--orbit-paper);
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.btn-retry {
  display: inline-block;
  padding: 0.4rem 1.25rem;
  border: 0;
  background: var(--orbit-orange);
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  outline-offset: 2px;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.9;
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.table-wrap {
  margin-top: 1.5rem;
  overflow-x: auto;
}

.account-table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;

  th {
    padding: 1rem 0.75rem;
    border-bottom: 1px solid var(--orbit-line-soft);
    background: var(--orbit-paper);
    color: var(--orbit-body-muted);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  td {
    padding: 1rem 0.75rem;
    border-bottom: 1px solid var(--orbit-line-soft);
    color: var(--orbit-ink);
    vertical-align: top;
  }

  tbody tr:hover {
    background: rgba(20, 42, 41, 0.04);
  }
}

.cell-id,
.cell-phone {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.cell-nickname,
.cell-identity {
  white-space: nowrap;
}

.status-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 2px;
  font-size: 0.75rem;

  &.is-enabled {
    background: rgba(35, 60, 49, 0.15);
    color: #233c31;
  }

  &.is-disabled {
    background: rgba(48, 59, 53, 0.15);
    color: #606d64;
  }
}

.cell-remark {
  min-width: 14rem;
  line-height: 1.5;
  word-break: break-all;
  white-space: normal;
}

.cell-state {
  padding: 3.5rem 1rem !important;
  text-align: center;
  color: var(--orbit-body-muted);
  background: var(--orbit-paper);
  font-size: 0.9rem;

  &.is-error {
    color: var(--orbit-ink);

    .state-message {
      color: #b33a2b;
    }
  }

  .state-message {
    margin: 0 0 0.75rem;
  }

  &.is-empty {
    color: var(--orbit-body-muted);
  }
}

.list-summary {
  margin-top: 1rem;
  color: var(--orbit-body-muted);
  font-size: 0.8rem;
}

.accounts-rail {
  padding-left: 1.5rem;
  border-left: 1px dashed var(--orbit-line-soft);
}

.rail-eyebrow {
  color: var(--orbit-body-muted);
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
}

.accounts-rail h2 {
  margin: 0.5rem 0 0.5rem;
  color: var(--orbit-ink);
  font-family: var(--orbit-font-serif);
  font-size: 1.5rem;
  font-weight: 400;
}

.accounts-rail p {
  margin: 0 0 1rem;
  color: var(--orbit-body-muted);
  font-size: 0.85rem;
  line-height: 1.6;
}

.boundary-note {
  margin-top: 1.5rem;
  padding: 1.25rem;
  border-left: 3px solid var(--orbit-orange);
  background: var(--orbit-paper);
}

.note-label {
  color: var(--orbit-ink);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.boundary-note p {
  margin: 0.4rem 0 0;
  font-size: 0.8rem;
}

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.btn-create-account {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.4rem;
  padding: 0 1.25rem;
  border: 0;
  background: var(--orbit-orange);
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
  outline-offset: 2px;

  &:hover {
    opacity: 0.9;
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

:deep(.account-create-dialog) {
  background: var(--orbit-paper);
  border: 1px solid var(--orbit-line-soft);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);

  .el-dialog__header {
    padding: 1.5rem 1.5rem 1rem;
    margin-right: 0;
    border-bottom: 1px solid var(--orbit-line-soft);
  }

  .el-dialog__title {
    color: var(--orbit-ink);
    font-family: var(--orbit-font-serif);
    font-size: 1.35rem;
    font-weight: 400;
  }

  .el-dialog__headerbtn .el-dialog__close {
    color: var(--orbit-body-muted);
  }

  .el-dialog__body {
    padding: 1.5rem;
    color: var(--orbit-ink);
  }
}

.create-account-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  color: var(--orbit-body-muted);
  font-size: 0.8rem;
  font-weight: 600;

  &.required::after {
    content: ' *';
    color: var(--orbit-orange);
  }
}

.form-item input,
.form-item select,
.form-item textarea {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--orbit-line-soft);
  background: var(--orbit-paper);
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.9rem;
  outline-offset: 2px;
  border-radius: 0;

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.form-item textarea {
  resize: vertical;
}

.field-error {
  margin-top: 0.15rem;
  color: #d9534f;
  font-size: 0.78rem;
  line-height: 1.3;
}

.form-item.has-error input,
.form-item.has-error select {
  border-color: #d9534f;
}

.create-error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.55rem 0.75rem;
  background: rgba(217, 83, 79, 0.1);
  border-left: 3px solid #d9534f;
  color: #d9534f;
  font-size: 0.85rem;

  &.is-uncertain {
    background: rgba(217, 119, 6, 0.1);
    border-left: 3px solid #d97706;
    color: #92400e;

    .create-error-icon {
      background: #d97706;
      color: #fff;
    }
  }
}

.create-error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: #d9534f;
  color: var(--orbit-paper);
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-cancel-create {
  height: 2.4rem;
  padding: 0 1.25rem;
  border: 1px solid var(--orbit-line-soft);
  background: transparent;
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-submit-create {
  height: 2.4rem;
  padding: 0 1.5rem;
  border: 0;
  background: var(--orbit-orange);
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
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
    padding-left: 0;
    border-left: 0;
    border-top: 1px dashed var(--orbit-line-soft);
    padding-top: 1.5rem;
  }
}
</style>
