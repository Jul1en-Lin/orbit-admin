<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppShell from '../components/AppShell.vue'
import { fetchAccountList, type SysUserVO } from '../api/account'
import { fetchAccountDictionaries, type DictDataVO } from '../api/dict'

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

async function loadAccounts(queryPayload?: { userId?: string; phoneNumber?: string; status?: string }) {
  const currentSeq = ++querySeq
  loading.value = true
  hasError.value = false
  errorMessage.value = ''

  try {
    const result = await fetchAccountList(queryPayload)
    if (currentSeq !== querySeq) {
      return
    }
    accounts.value = result
    loading.value = false
  } catch (err: unknown) {
    if (currentSeq !== querySeq) {
      return
    }
    accounts.value = []
    hasError.value = true
    errorMessage.value = err instanceof Error && err.message ? err.message : '加载失败，请重试'
    loading.value = false
  }
}

function handleQuery() {
  lastQueryParams.value = {
    userId: filters.userId,
    phoneNumber: filters.phoneNumber,
    status: filters.status,
  }
  loadAccounts(lastQueryParams.value)
}

function handleReset() {
  filters.userId = ''
  filters.phoneNumber = ''
  filters.status = ''
  lastQueryParams.value = {}
  loadAccounts({})
}

function handleRetry() {
  if (dictError.value) {
    loadDictionaries()
  }
  loadAccounts(lastQueryParams.value)
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
