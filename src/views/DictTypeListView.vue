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
        <div class="heading-kicker-wrap">
          <span class="kicker-dot" />
          <p class="section-kicker">DICTIONARY / 01</p>
        </div>
        <h1 id="dict-types-title">字典类型</h1>
        <p class="intro-copy">查看字典类型，按编码与名称定位业务枚举的分类根基。</p>
      </header>

      <div class="dict-types-split">
        <section class="dict-types-main" aria-labelledby="dict-types-title">
          <div class="table-card">
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
                <span class="meta-text">字典分类列表</span>
              </div>
              <button type="button" class="btn-add-dict-type" data-test="btn-add-dict-type" @click="openAddDialog">
                <svg class="btn-add-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                  <path d="M8 3.5v9M3.5 8h9" stroke-width="2" stroke-linecap="round" />
                </svg>
                <span>新增字典类型</span>
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
                    <td colspan="5" class="cell-state is-empty">
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
                  <tr v-for="item in dictTypes" v-else :key="item.id" data-test="dict-type-row">
                    <td class="cell-key">
                      <span class="code-pill">{{ item.typeKey }}</span>
                    </td>
                    <td class="cell-name">{{ item.value }}</td>
                    <td class="cell-status">
                      <span :class="['status-badge', item.status === 1 ? 'is-enabled' : 'is-disabled']">
                        <span class="badge-point" />
                        <span>{{ getStatusLabel(item.status) }}</span>
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

            <div class="table-card-footer">
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
            </div>
          </div>
        </section>

        <aside class="dict-types-rail" aria-label="当前操作边界">
          <div class="rail-card">
            <div class="rail-eyebrow">DICTIONARY DIRECTORY</div>
            <h2>让枚举井然有序。</h2>
            <p>从这里查看系统定义的字典类型，统一维护各业务域的数据字典。</p>
            <div class="boundary-note">
              <div class="boundary-header">
                <svg class="boundary-icon" viewBox="0 0 16 16" fill="currentColor">
                  <path
                    d="M8 1a3.5 3.5 0 00-3.5 3.5V6H3a1 1 0 00-1 1v7a1 1 0 001 1h10a1 1 0 001-1V7a1 1 0 00-1-1h-1.5V4.5A3.5 3.5 0 008 1zm2 5H6V4.5a2 2 0 114 0V6z"
                  />
                </svg>
                <span class="note-label">当前边界</span>
              </div>
              <p>当前页面支持按类型编码（精确）与类型名称（前缀）筛选查询。</p>
              <p>首版支持类型列表与查询；字典项维护、新增与编辑由后续版本交付，本版不提供删除或状态写入。</p>
            </div>
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

.dict-types-split {
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

  input {
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

.btn-add-dict-type {
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

.dict-table {
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

.cell-key {
  font-family: ui-monospace, monospace;
  font-size: 0.84rem;
  white-space: nowrap;
}

.code-pill {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  background: rgba(21, 59, 54, 0.06);
  color: var(--orbit-ink);
  font-weight: 600;
}

.cell-name {
  white-space: nowrap;
  font-weight: 500;
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

.cell-actions {
  white-space: nowrap;
}

.btn-edit-dict-type {
  display: inline-flex;
  align-items: center;
  height: 2rem;
  margin-right: 0.6rem;
  padding: 0 0.75rem;
  border: 1px solid var(--orbit-line-soft);
  border-radius: 6px;
  background: var(--orbit-paper);
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--orbit-orange);
    color: var(--orbit-orange);
    background: rgba(232, 117, 59, 0.05);
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.link-dict-items {
  display: inline-flex;
  align-items: center;
  height: 2rem;
  padding: 0 0.75rem;
  border: 1px solid rgba(232, 117, 59, 0.3);
  border-radius: 6px;
  background: rgba(232, 117, 59, 0.06);
  color: var(--orbit-orange);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--orbit-orange);
    color: #0b2925;
    border-color: var(--orbit-orange);
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
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

.table-card-footer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 1.75rem 1.5rem;
  border-top: 1px solid var(--orbit-line-soft);
}

.list-summary {
  margin: 0;
  color: var(--orbit-body-muted);
  font-size: 0.82rem;
}

.pagination-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
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
  padding: 0 0.75rem;
  border: 1px solid var(--orbit-line-soft);
  border-radius: 6px;
  background: var(--orbit-paper);
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  outline-offset: 2px;
  transition: border-color 0.15s;

  &:hover {
    border-color: rgba(21, 59, 54, 0.3);
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
}

.btn-page {
  height: 2.2rem;
  padding: 0 1rem;
  border: 1px solid var(--orbit-line-soft);
  border-radius: 6px;
  background: transparent;
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  outline-offset: 2px;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(21, 59, 54, 0.05);
    border-color: var(--orbit-ink);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
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

:deep(.dict-type-dialog) {
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

.dict-type-form {
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

  &:disabled,
  &[readonly] {
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

.form-item.has-error input {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.02);

  &:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
  }
}

.dict-type-error-message {
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
}

.dialog-error-icon {
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

.btn-cancel {
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

.btn-submit {
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

@media (max-width: 960px) {
  .dict-types-split {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .dict-types-rail {
    position: static;
  }
}
</style>
