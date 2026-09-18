<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import AppShell from '../components/AppShell.vue'
import { fetchArgumentList, type ArgumentVO } from '../api/argument'
import { ApiError } from '../api/client'

const arguments_ = ref<ArgumentVO[]>([])
const loading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const totals = ref(0)
const totalPages = ref(0)
const pageNo = ref(1)
const pageSize = ref(10)
let querySeq = 0

const filters = reactive({
  configKey: '',
  name: '',
})

const lastQueryParams = ref<{ configKey?: string; name?: string }>({})

async function loadArguments(
  queryPayload?: { configKey?: string; name?: string },
  targetPageNo: number = pageNo.value,
  targetPageSize: number = pageSize.value,
): Promise<boolean> {
  const currentSeq = ++querySeq
  loading.value = true
  hasError.value = false
  errorMessage.value = ''

  try {
    const result = await fetchArgumentList({
      pageNo: targetPageNo,
      pageSize: targetPageSize,
      configKey: queryPayload?.configKey,
      name: queryPayload?.name,
    })
    if (currentSeq !== querySeq) {
      return false
    }
    arguments_.value = result?.list ?? []
    totals.value = result?.totals ?? 0
    totalPages.value = result?.totalPages ?? 0
    pageNo.value = targetPageNo
    pageSize.value = targetPageSize
    loading.value = false
    return true
  } catch (err: unknown) {
    if (currentSeq !== querySeq) {
      return false
    }
    arguments_.value = []
    totals.value = 0
    totalPages.value = 0
    hasError.value = true
    if (err instanceof ApiError && err.serverMessage) {
      errorMessage.value = err.serverMessage
    } else if (err instanceof Error && err.message) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = '加载失败，请重试'
    }
    loading.value = false
    return false
  }
}

function handleQuery() {
  pageNo.value = 1
  lastQueryParams.value = {
    configKey: filters.configKey,
    name: filters.name,
  }
  loadArguments(lastQueryParams.value, 1, pageSize.value)
}

function handleReset() {
  filters.configKey = ''
  filters.name = ''
  lastQueryParams.value = {}
  pageNo.value = 1
  loadArguments({}, 1, pageSize.value)
}

function handlePageSizeChange(newSize?: number) {
  if (typeof newSize === 'number' && !Number.isNaN(newSize) && newSize > 0) {
    pageSize.value = newSize
  }
  pageNo.value = 1
  loadArguments(lastQueryParams.value, 1, pageSize.value)
}

function handlePageChange(newPageNo: number) {
  if (newPageNo < 1 || (totalPages.value > 0 && newPageNo > totalPages.value)) {
    return
  }
  pageNo.value = newPageNo
  loadArguments(lastQueryParams.value, newPageNo, pageSize.value)
}

function handlePrevPage() {
  if (pageNo.value <= 1) {
    return
  }
  handlePageChange(pageNo.value - 1)
}

function handleNextPage() {
  if (pageNo.value >= totalPages.value || totalPages.value === 0) {
    return
  }
  handlePageChange(pageNo.value + 1)
}

async function handleRetry() {
  await loadArguments(lastQueryParams.value, pageNo.value, pageSize.value)
}

onMounted(() => {
  filters.configKey = ''
  filters.name = ''
  lastQueryParams.value = {}
  pageNo.value = 1
  pageSize.value = 10
  loadArguments({}, 1, 10)
})

defineExpose({
  pageNo,
  pageSize,
  totals,
  totalPages,
  loadArguments,
  handleQuery,
  handleReset,
  handlePageSizeChange,
  handlePageChange,
  handlePrevPage,
  handleNextPage,
})
</script>

<template>
  <AppShell>
    <div class="arguments-page">
      <header class="page-heading">
        <p class="section-kicker">CONFIGURATION / 03</p>
        <h1 id="arguments-title">参数</h1>
        <p class="intro-copy">查看系统配置参数，按编码与名称定位目标参数。</p>
      </header>

      <div class="arguments-split">
        <section class="arguments-main" aria-labelledby="arguments-title">
          <form class="filters-form" @submit.prevent="handleQuery">
            <div class="filter-field">
              <label for="filter-config-key">参数键名</label>
              <input
                id="filter-config-key"
                v-model="filters.configKey"
                data-test="filter-config-key"
                type="text"
                placeholder="精确匹配"
                @keydown.enter.prevent="handleQuery"
              />
            </div>

            <div class="filter-field">
              <label for="filter-name">参数名称</label>
              <input
                id="filter-name"
                v-model="filters.name"
                data-test="filter-name"
                type="text"
                placeholder="包含匹配"
                @keydown.enter.prevent="handleQuery"
              />
            </div>

            <div class="filter-actions">
              <button type="submit" data-test="query-submit" class="btn-query">查询 ↗</button>
              <button type="button" data-test="query-reset" class="btn-reset" @click="handleReset">重置</button>
            </div>
          </form>

          <div class="table-wrap">
            <table class="argument-table" data-test="argument-table">
              <thead>
                <tr>
                  <th scope="col">参数键名</th>
                  <th scope="col">参数名称</th>
                  <th scope="col">参数键值</th>
                  <th scope="col">备注</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading" data-test="state-loading" class="state-row">
                  <td colspan="5" class="cell-state is-loading">
                    <span class="state-spinner" aria-hidden="true" />
                    <span class="state-message">正在加载数据...</span>
                  </td>
                </tr>
                <tr v-else-if="hasError" data-test="state-error" class="state-row is-error">
                  <td colspan="5" class="cell-state is-error">
                    <p class="state-message">{{ errorMessage || '数据加载失败，请重试' }}</p>
                    <button type="button" data-test="state-retry" class="btn-retry" @click="handleRetry">重试</button>
                  </td>
                </tr>
                <tr v-else-if="arguments_.length === 0" data-test="state-empty" class="state-row is-empty">
                  <td colspan="5" class="cell-state is-empty">暂无数据</td>
                </tr>
                <tr v-for="item in arguments_" v-else :key="item.id" data-test="argument-row">
                  <td class="cell-config-key">{{ item.configKey }}</td>
                  <td class="cell-name">{{ item.name }}</td>
                  <td class="cell-value">{{ item.value }}</td>
                  <td class="cell-remark">{{ item.remark || '—' }}</td>
                  <td class="cell-actions">
                    <span class="action-placeholder">新增与编辑参数由后续票交付</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="!loading && !hasError && arguments_.length > 0" class="list-summary">
            已显示本页 {{ arguments_.length }} 个参数
          </p>

          <div data-test="pagination-wrap" class="pagination-wrap">
            <div class="pagination-info">
              <span data-test="page-totals" class="page-totals">共 {{ totals }} 条，共 {{ totalPages }} 页</span>
              <span data-test="page-current" class="page-current">第 {{ pageNo }} / {{ totalPages || 1 }} 页</span>
            </div>

            <div class="pagination-controls">
              <label for="page-size-select" class="sr-only">每页条数</label>
              <select
                id="page-size-select"
                v-model.number="pageSize"
                data-test="page-size-select"
                class="page-size-select"
                aria-label="每页显示条数"
                @change="handlePageSizeChange(pageSize)"
              >
                <option :value="10">10 条/页</option>
                <option :value="20">20 条/页</option>
                <option :value="50">50 条/页</option>
              </select>

              <button
                type="button"
                data-test="page-prev"
                class="btn-page"
                :disabled="pageNo <= 1"
                aria-label="上一页"
                @click="handlePrevPage"
              >
                上一页
              </button>

              <button
                type="button"
                data-test="page-next"
                class="btn-page"
                :disabled="pageNo >= totalPages || totalPages === 0"
                aria-label="下一页"
                @click="handleNextPage"
              >
                下一页
              </button>
            </div>
          </div>
        </section>

        <aside class="arguments-rail" aria-label="当前操作边界">
          <div class="rail-eyebrow">CONFIGURATION DIRECTORY</div>
          <h2>让配置参数井然有序。</h2>
          <p>从这里查看系统定义的配置参数，按编码精确定位或按名称模糊搜索。</p>
          <div class="boundary-note">
            <span class="note-label">当前边界</span>
            <p>当前页面支持按参数键名（精确）与参数名称（包含）筛选查询。</p>
            <p>首版支持参数列表与查询；新增与编辑参数由后续票交付，本版不提供删除。</p>
          </div>
        </aside>
      </div>
    </div>
  </AppShell>
</template>

<style lang="scss" scoped>
.arguments-page {
  padding: 2.5rem 3rem 4rem;
}

.page-heading {
  margin-bottom: 2rem;
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

.arguments-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 3rem;
  align-items: start;
}

.filters-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) auto;
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

.filter-field input {
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

.argument-table {
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

.cell-config-key {
  font-family: ui-monospace, monospace;
  font-size: 0.84rem;
  white-space: nowrap;
}

.cell-name {
  white-space: nowrap;
}

.cell-value {
  min-width: 10rem;
  line-height: 1.5;
  word-break: break-all;
  white-space: normal;
}

.cell-remark {
  min-width: 14rem;
  line-height: 1.5;
  word-break: break-all;
  white-space: normal;
}

.cell-actions {
  white-space: nowrap;
}

.action-placeholder {
  color: var(--orbit-body-muted);
  font-size: 0.82rem;
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

.state-spinner {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  margin-bottom: 0.5rem;
  border: 2px solid var(--orbit-line-soft);
  border-top-color: var(--orbit-orange);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.list-summary {
  margin-top: 1rem;
  color: var(--orbit-body-muted);
  font-size: 0.8rem;
}

.pagination-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--orbit-line-soft, rgba(21, 59, 54, 0.15));
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  color: var(--orbit-body-muted);
  font-size: 0.85rem;
}

.page-totals,
.page-current {
  white-space: nowrap;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-size-select {
  height: 2.2rem;
  padding: 0 0.6rem;
  border: 1px solid var(--orbit-line-soft, rgba(21, 59, 54, 0.2));
  background: var(--orbit-paper);
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  outline-offset: 2px;

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.btn-page {
  height: 2.2rem;
  padding: 0 1rem;
  border: 1px solid var(--orbit-line-soft, rgba(21, 59, 54, 0.2));
  background: transparent;
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  outline-offset: 2px;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--orbit-paper);
    border-color: var(--orbit-ink);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    border-color: var(--orbit-line-soft, rgba(21, 59, 54, 0.15));
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.arguments-rail {
  padding-left: 1.5rem;
  border-left: 1px dashed var(--orbit-line-soft);
}

.rail-eyebrow {
  color: var(--orbit-body-muted);
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
}

.arguments-rail h2 {
  margin: 0.5rem 0 0.5rem;
  color: var(--orbit-ink);
  font-family: var(--orbit-font-serif);
  font-size: 1.5rem;
  font-weight: 400;
}

.arguments-rail p {
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

@media (max-width: 960px) {
  .arguments-page {
    padding: 1.5rem;
  }

  .arguments-split {
    grid-template-columns: 1fr;
  }

  .arguments-rail {
    padding-left: 0;
    border-left: 0;
    border-top: 1px dashed var(--orbit-line-soft);
    padding-top: 2rem;
  }
}
</style>
