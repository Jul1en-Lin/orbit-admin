<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElDialog } from 'element-plus'
import AppShell from '../components/AppShell.vue'
import { createDictType, fetchDictTypeList, updateDictType, type DictTypeVO } from '../api/dict'
import { ApiError } from '../api/client'
import { useAuthStore } from '../auth/store'

const auth = useAuthStore()

const dictTypes = ref<DictTypeVO[]>([])
const loading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const totals = ref(0)
const totalPages = ref(0)
const pageNo = ref(1)
const pageSize = ref(10)
let querySeq = 0

const filters = reactive({
  typeKey: '',
  value: '',
})

const lastQueryParams = ref<{ typeKey?: string; value?: string }>({})

// Add / Edit modal state
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const dialogSubmitting = ref(false)
const dialogErrorMessage = ref('')

type FormFieldName = 'typeKey' | 'value'

const form = reactive({
  typeKey: '',
  value: '',
  remark: '',
})

const fieldErrors = reactive<Record<FormFieldName, string>>({
  typeKey: '',
  value: '',
})

const fieldTouched = reactive<Record<FormFieldName, boolean>>({
  typeKey: false,
  value: false,
})

function validateTypeKey(): string {
  if (!form.typeKey.trim()) {
    return '请输入字典类型编码'
  }
  return ''
}

function validateValue(): string {
  if (!form.value.trim()) {
    return '请输入字典类型名称'
  }
  return ''
}

function validateSingleField(field: FormFieldName): string {
  let error = ''
  if (field === 'typeKey') {
    error = validateTypeKey()
  } else if (field === 'value') {
    error = validateValue()
  }
  fieldErrors[field] = error
  return error
}

function handleFieldBlur(field: FormFieldName) {
  fieldTouched[field] = true
  validateSingleField(field)
}

function handleFieldInput(field: FormFieldName) {
  if (fieldTouched[field]) {
    validateSingleField(field)
  }
}

function validateAllFields(): boolean {
  fieldTouched.typeKey = true
  fieldTouched.value = true

  const keyErr = validateTypeKey()
  const valErr = validateValue()

  fieldErrors.typeKey = keyErr
  fieldErrors.value = valErr

  return !keyErr && !valErr
}

function clearFieldErrors() {
  fieldErrors.typeKey = ''
  fieldErrors.value = ''
  fieldTouched.typeKey = false
  fieldTouched.value = false
}

function resetForm() {
  form.typeKey = ''
  form.value = ''
  form.remark = ''
  dialogErrorMessage.value = ''
  clearFieldErrors()
}

function openAddDialog() {
  dialogMode.value = 'add'
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(item: DictTypeVO) {
  dialogMode.value = 'edit'
  resetForm()
  form.typeKey = item.typeKey
  form.value = item.value
  form.remark = item.remark ?? ''
  dialogVisible.value = true
}

function closeDialog() {
  if (dialogSubmitting.value) {
    return
  }
  dialogVisible.value = false
  resetForm()
}

function handleDialogBeforeClose(done: () => void) {
  if (dialogSubmitting.value) {
    return
  }
  resetForm()
  done()
}

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

async function handleSubmit() {
  if (dialogSubmitting.value) {
    return
  }

  const isValid = validateAllFields()
  if (!isValid) {
    return
  }

  dialogSubmitting.value = true
  dialogErrorMessage.value = ''

  try {
    const payload = {
      typeKey: form.typeKey.trim(),
      value: form.value.trim(),
      remark: form.remark.trim() ? form.remark.trim() : undefined,
    }

    if (dialogMode.value === 'add') {
      await createDictType(payload)
    } else {
      await updateDictType(payload)
    }
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      dialogVisible.value = false
      resetForm()
      return
    }
    if (isUncertainWriteError(err)) {
      dialogErrorMessage.value = '提交结果未确认，请先查询核实'
    } else if (err instanceof ApiError) {
      if (err.kind === 'network') {
        dialogErrorMessage.value = '网络请求失败，请稍后重试'
      } else if (err.serverMessage) {
        dialogErrorMessage.value = err.serverMessage
      } else if (err.status === 400) {
        dialogErrorMessage.value = '提交参数有误，请检查后重试'
      } else {
        dialogErrorMessage.value =
          err.message || (dialogMode.value === 'add' ? '新增字典类型失败，请重试' : '保存字典类型失败，请重试')
      }
    } else if (err instanceof Error && err.message) {
      dialogErrorMessage.value = err.message
    } else {
      dialogErrorMessage.value = dialogMode.value === 'add' ? '新增字典类型失败，请重试' : '保存字典类型失败，请重试'
    }
    return
  } finally {
    dialogSubmitting.value = false
  }

  const mode = dialogMode.value
  dialogVisible.value = false
  resetForm()

  if (mode === 'add') {
    pageNo.value = 1
    await loadDictTypes(lastQueryParams.value, 1, pageSize.value)
  } else {
    await loadDictTypes(lastQueryParams.value, pageNo.value, pageSize.value)
  }
}

watch(
  () => [auth.accessToken, auth.sessionExpired, auth.isAuthenticated],
  () => {
    if (!auth.isAuthenticated || auth.sessionExpired) {
      dialogVisible.value = false
      resetForm()
    }
  },
)

function getStatusLabel(status: number): string {
  return status === 1 ? '启用' : '停用'
}

async function loadDictTypes(
  queryPayload?: { typeKey?: string; value?: string },
  targetPageNo: number = pageNo.value,
  targetPageSize: number = pageSize.value,
): Promise<boolean> {
  const currentSeq = ++querySeq
  loading.value = true
  hasError.value = false
  errorMessage.value = ''

  try {
    const result = await fetchDictTypeList({
      pageNo: targetPageNo,
      pageSize: targetPageSize,
      typeKey: queryPayload?.typeKey,
      value: queryPayload?.value,
    })
    if (currentSeq !== querySeq) {
      return false
    }
    dictTypes.value = result?.list ?? []
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
    dictTypes.value = []
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
    typeKey: filters.typeKey,
    value: filters.value,
  }
  loadDictTypes(lastQueryParams.value, 1, pageSize.value)
}

function handleReset() {
  filters.typeKey = ''
  filters.value = ''
  lastQueryParams.value = {}
  pageNo.value = 1
  loadDictTypes({}, 1, pageSize.value)
}

function handlePageSizeChange(newSize?: number) {
  if (typeof newSize === 'number' && !Number.isNaN(newSize) && newSize > 0) {
    pageSize.value = newSize
  }
  pageNo.value = 1
  loadDictTypes(lastQueryParams.value, 1, pageSize.value)
}

function handlePageChange(newPageNo: number) {
  if (newPageNo < 1 || (totalPages.value > 0 && newPageNo > totalPages.value)) {
    return
  }
  pageNo.value = newPageNo
  loadDictTypes(lastQueryParams.value, newPageNo, pageSize.value)
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
  await loadDictTypes(lastQueryParams.value, pageNo.value, pageSize.value)
}

onMounted(() => {
  filters.typeKey = ''
  filters.value = ''
  lastQueryParams.value = {}
  pageNo.value = 1
  pageSize.value = 10
  loadDictTypes({}, 1, 10)
})

defineExpose({
  pageNo,
  pageSize,
  totals,
  totalPages,
  dialogVisible,
  dialogMode,
  dialogSubmitting,
  dialogErrorMessage,
  form,
  openAddDialog,
  openEditDialog,
  closeDialog,
  handleSubmit,
  loadDictTypes,
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

          <div class="table-toolbar">
            <button type="button" class="btn-add-dict-type" data-test="btn-add-dict-type" @click="openAddDialog">
              + 新增字典类型
            </button>
          </div>

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
                    <button
                      type="button"
                      class="btn-edit-dict-type"
                      data-test="btn-edit-dict-type"
                      @click="openEditDialog(item)"
                    >
                      编辑
                    </button>
                    <router-link
                      :to="`/dictionaries/${item.typeKey}/items`"
                      class="link-dict-items"
                      data-test="link-dict-items"
                    >
                      维护字典项
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="!loading && !hasError && dictTypes.length > 0" class="list-summary">
            已显示本页 {{ dictTypes.length }} 个字典类型
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

      <el-dialog
        v-if="dialogVisible"
        v-model="dialogVisible"
        width="520px"
        class="dict-type-dialog"
        destroy-on-close
        :close-on-click-modal="!dialogSubmitting"
        :close-on-press-escape="!dialogSubmitting"
        :show-close="!dialogSubmitting"
        :before-close="handleDialogBeforeClose"
      >
        <template #header>
          <span class="el-dialog__title" data-test="dict-type-dialog-title">
            {{ dialogMode === 'add' ? '新增字典类型' : '编辑字典类型' }}
          </span>
        </template>

        <div data-test="dict-type-dialog">
          <form class="dict-type-form" data-test="dict-type-form" @submit.prevent="handleSubmit">
            <div class="form-item" :class="{ 'has-error': fieldErrors.typeKey }">
              <label for="form-type-key" class="form-label required">字典类型编码</label>
              <input
                id="form-type-key"
                v-model="form.typeKey"
                data-test="form-type-key"
                type="text"
                placeholder="请输入字典类型编码"
                :disabled="dialogSubmitting || dialogMode === 'edit'"
                :readonly="dialogMode === 'edit'"
                @blur="handleFieldBlur('typeKey')"
                @input="handleFieldInput('typeKey')"
              />
              <span v-if="fieldErrors.typeKey" class="field-error" data-test="error-type-key" role="alert">
                {{ fieldErrors.typeKey }}
              </span>
            </div>

            <div class="form-item" :class="{ 'has-error': fieldErrors.value }">
              <label for="form-value" class="form-label required">字典类型名称</label>
              <input
                id="form-value"
                v-model="form.value"
                data-test="form-value"
                type="text"
                placeholder="请输入字典类型名称"
                :disabled="dialogSubmitting"
                @blur="handleFieldBlur('value')"
                @input="handleFieldInput('value')"
              />
              <span v-if="fieldErrors.value" class="field-error" data-test="error-value" role="alert">
                {{ fieldErrors.value }}
              </span>
            </div>

            <div class="form-item">
              <label for="form-remark" class="form-label">备注</label>
              <textarea
                id="form-remark"
                v-model="form.remark"
                data-test="form-remark"
                rows="3"
                placeholder="可选备注信息"
                :disabled="dialogSubmitting"
              />
            </div>

            <div
              v-if="dialogErrorMessage"
              class="dict-type-error-message"
              data-test="dict-type-error-message"
              role="alert"
            >
              <span class="dialog-error-icon" aria-hidden="true">!</span>
              <span class="dialog-error-text">{{ dialogErrorMessage }}</span>
            </div>

            <div class="dialog-actions">
              <button
                type="button"
                class="btn-cancel"
                data-test="btn-cancel-dict-type"
                :disabled="dialogSubmitting"
                @click="closeDialog"
              >
                取消
              </button>
              <button type="submit" class="btn-submit" data-test="btn-submit-dict-type" :disabled="dialogSubmitting">
                {{ dialogSubmitting ? '提交中...' : dialogMode === 'add' ? '确认新增' : '确认保存' }}
              </button>
            </div>
          </form>
        </div>
      </el-dialog>
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

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.25rem;
}

.btn-add-dict-type {
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

.btn-edit-dict-type {
  display: inline-block;
  margin-right: 0.75rem;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--orbit-line-soft);
  background: transparent;
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--orbit-paper);
    border-color: var(--orbit-orange);
    color: var(--orbit-orange);
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.link-dict-items {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--orbit-line-soft);
  background: transparent;
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--orbit-paper);
    border-color: var(--orbit-orange);
    color: var(--orbit-orange);
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

:deep(.dict-type-dialog) {
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

.dict-type-form {
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

  &:disabled,
  &[readonly] {
    opacity: 0.6;
    cursor: not-allowed;
    background: rgba(0, 0, 0, 0.03);
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

.form-item.has-error input {
  border-color: #d9534f;
}

.dict-type-error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.55rem 0.75rem;
  background: rgba(217, 83, 79, 0.1);
  border-left: 3px solid #d9534f;
  color: #d9534f;
  font-size: 0.85rem;
}

.dialog-error-icon {
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

.btn-cancel {
  height: 2.4rem;
  padding: 0 1.25rem;
  border: 1px solid var(--orbit-line-soft);
  background: transparent;
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.04);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-submit {
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
