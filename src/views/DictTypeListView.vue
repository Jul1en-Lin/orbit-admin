<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import AppShell from '../components/AppShell.vue'
import { fetchDictTypeList, type DictTypeVO } from '../api/dict'
import { ApiError } from '../api/client'

const dictTypes = ref<DictTypeVO[]>([])
const loading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const totals = ref(0)
let querySeq = 0

const filters = reactive({
  typeKey: '',
  value: '',
})

const lastQueryParams = ref<{ typeKey?: string; value?: string }>({})

function getStatusLabel(status: number): string {
  return status === 1 ? '启用' : '停用'
}

async function loadDictTypes(queryPayload?: { typeKey?: string; value?: string }): Promise<boolean> {
  const currentSeq = ++querySeq
  loading.value = true
  hasError.value = false
  errorMessage.value = ''

  try {
    const result = await fetchDictTypeList({
      pageNo: 1,
      pageSize: 10,
      typeKey: queryPayload?.typeKey,
      value: queryPayload?.value,
    })
    if (currentSeq !== querySeq) {
      return false
    }
    dictTypes.value = result?.list ?? []
    totals.value = result?.totals ?? 0
    loading.value = false
    return true
  } catch (err: unknown) {
    if (currentSeq !== querySeq) {
      return false
    }
    dictTypes.value = []
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
  lastQueryParams.value = {
    typeKey: filters.typeKey,
    value: filters.value,
  }
  loadDictTypes(lastQueryParams.value)
}

function handleReset() {
  filters.typeKey = ''
  filters.value = ''
  lastQueryParams.value = {}
  loadDictTypes({})
}

async function handleRetry() {
  await loadDictTypes(lastQueryParams.value)
}

onMounted(() => {
  filters.typeKey = ''
  filters.value = ''
  lastQueryParams.value = {}
  loadDictTypes({})
})
</script>

<template>
  <AppShell>
    <div class="dict-types-page">
      <header class="page-heading">
        <p class="section-kicker">DICTIONARY / 01</p>
        <h1 id="dict-types-title">字典类型</h1>
        <p class="intro-copy">查看字典类型，按编码与名称定位业务枚举的分类根基。</p>
      </header>

      <div class="dict-types-split">
        <section class="dict-types-main" aria-labelledby="dict-types-title">
          <form class="filters-form" @submit.prevent="handleQuery">
            <div class="filter-field">
              <label for="filter-type-key">字典类型编码</label>
              <input
                id="filter-type-key"
                v-model="filters.typeKey"
                data-test="filter-type-key"
                type="text"
                placeholder="精确匹配"
                @keydown.enter.prevent="handleQuery"
              />
            </div>

            <div class="filter-field">
              <label for="filter-value">字典类型名称</label>
              <input
                id="filter-value"
                v-model="filters.value"
                data-test="filter-value"
                type="text"
                placeholder="前缀匹配"
                @keydown.enter.prevent="handleQuery"
              />
            </div>

            <div class="filter-actions">
              <button type="submit" data-test="query-submit" class="btn-query">查询 ↗</button>
              <button type="button" data-test="query-reset" class="btn-reset" @click="handleReset">重置</button>
            </div>
          </form>

          <div class="table-wrap">
            <table class="dict-table" data-test="dict-type-table">
              <thead>
                <tr>
                  <th scope="col">编码</th>
                  <th scope="col">名称</th>
                  <th scope="col">状态</th>
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
                <tr v-else-if="dictTypes.length === 0" data-test="state-empty" class="state-row is-empty">
                  <td colspan="5" class="cell-state is-empty">暂无数据</td>
                </tr>
                <tr v-for="item in dictTypes" v-else :key="item.id" data-test="dict-type-row">
                  <td class="cell-key">{{ item.typeKey }}</td>
                  <td class="cell-name">{{ item.value }}</td>
                  <td class="cell-status">
                    <span :class="['status-badge', item.status === 1 ? 'is-enabled' : 'is-disabled']">
                      {{ getStatusLabel(item.status) }}
                    </span>
                  </td>
                  <td class="cell-remark">{{ item.remark || '—' }}</td>
                  <td class="cell-actions">
                    <span class="action-placeholder" data-test="action-placeholder">维护字典项</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="!loading && !hasError && dictTypes.length > 0" class="list-summary">
            已显示本页 {{ dictTypes.length }} 个字典类型
          </p>
        </section>

        <aside class="dict-types-rail" aria-label="当前操作边界">
          <div class="rail-eyebrow">DICTIONARY DIRECTORY</div>
          <h2>让枚举井然有序。</h2>
          <p>从这里查看系统定义的字典类型，统一维护各业务域的数据字典。</p>
          <div class="boundary-note">
            <span class="note-label">当前边界</span>
            <p>当前页面支持按类型编码（精确）与类型名称（前缀）筛选查询。</p>
            <p>首版支持类型列表与查询；字典项维护、新增与编辑由后续版本交付，本版不提供删除或状态写入。</p>
          </div>
        </aside>
      </div>
    </div>
  </AppShell>
</template>

<style lang="scss" scoped>
.dict-types-page {
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

.dict-types-split {
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

.dict-table {
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

.cell-key {
  font-family: ui-monospace, monospace;
  font-size: 0.84rem;
  white-space: nowrap;
}

.cell-name {
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

.dict-types-rail {
  padding-left: 1.5rem;
  border-left: 1px dashed var(--orbit-line-soft);
}

.rail-eyebrow {
  color: var(--orbit-body-muted);
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
}

.dict-types-rail h2 {
  margin: 0.5rem 0 0.5rem;
  color: var(--orbit-ink);
  font-family: var(--orbit-font-serif);
  font-size: 1.5rem;
  font-weight: 400;
}

.dict-types-rail p {
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
  .dict-types-page {
    padding: 1.5rem;
  }

  .dict-types-split {
    grid-template-columns: 1fr;
  }

  .dict-types-rail {
    padding-left: 0;
    border-left: 0;
    border-top: 1px dashed var(--orbit-line-soft);
    padding-top: 2rem;
  }
}
</style>
