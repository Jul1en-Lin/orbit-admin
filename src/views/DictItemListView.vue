<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElDialog } from 'element-plus'
import AppShell from '../components/AppShell.vue'
import { createDictItem, fetchDictItemList, updateDictItem, type DictDataVO } from '../api/dict'
import { ApiError } from '../api/client'
import { useAuthStore } from '../auth/store'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const typeKey = ref('')

const dictItems = ref<DictDataVO[]>([])
const loading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const totals = ref(0)
const totalPages = ref(0)
const pageNo = ref(1)
const pageSize = ref(10)
let querySeq = 0

const filters = reactive({
  value: '',
})

const lastQueryParams = ref<{ value?: string }>({})

// Modal state
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const dialogSubmitting = ref(false)
const dialogErrorMessage = ref('')
const refreshFailureNotice = ref('')
const hasOriginalRemark = ref(false)

const initialSnapshot = reactive({
  dataKey: '',
  value: '',
  sort: '',
  remark: '',
})

type FormFieldName = 'dataKey' | 'value' | 'sort' | 'remark'

const form = reactive({
  dataKey: '',
  value: '',
  sort: '',
  remark: '',
})

const fieldErrors = reactive<Record<FormFieldName, string>>({
  dataKey: '',
  value: '',
  sort: '',
  remark: '',
})

const fieldTouched = reactive<Record<FormFieldName, boolean>>({
  dataKey: false,
  value: false,
  sort: false,
  remark: false,
})

function validateDataKey(): string {
  if (dialogMode.value === 'add' && !form.dataKey.trim()) {
    return '请输入字典项编码'
  }
  return ''
}

function validateValue(): string {
  if (!form.value.trim()) {
    return '请输入字典项名称'
  }
  return ''
}

function validateSort(): string {
  const trimmed = form.sort.trim()
  if (!trimmed) {
    return ''
  }
  if (!/^-?\d+$/.test(trimmed)) {
    return '排序必须为整数'
  }
  return ''
}

function validateRemark(): string {
  if (dialogMode.value === 'edit' && hasOriginalRemark.value) {
    if (!form.remark.trim()) {
      return '当前接口不支持清空备注'
    }
  }
  return ''
}

function validateSingleField(field: FormFieldName): string {
  let error = ''
  if (field === 'dataKey') {
    error = validateDataKey()
  } else if (field === 'value') {
    error = validateValue()
  } else if (field === 'sort') {
    error = validateSort()
  } else if (field === 'remark') {
    error = validateRemark()
  }
  fieldErrors[field] = error
  return error
}

function handleFieldBlur(field: FormFieldName) {
  fieldTouched[field] = true
  validateSingleField(field)
}

function handleFieldInput(field: FormFieldName) {
  if (fieldTouched[field] || fieldErrors[field]) {
    validateSingleField(field)
  }
}

function validateAllFields(): boolean {
  fieldTouched.dataKey = true
  fieldTouched.value = true
  fieldTouched.sort = true
  fieldTouched.remark = true

  const keyErr = validateDataKey()
  const valErr = validateValue()
  const sortErr = validateSort()
  const remarkErr = validateRemark()

  fieldErrors.dataKey = keyErr
  fieldErrors.value = valErr
  fieldErrors.sort = sortErr
  fieldErrors.remark = remarkErr

  return !keyErr && !valErr && !sortErr && !remarkErr
}

function clearFieldErrors() {
  fieldErrors.dataKey = ''
  fieldErrors.value = ''
  fieldErrors.sort = ''
  fieldErrors.remark = ''
  fieldTouched.dataKey = false
  fieldTouched.value = false
  fieldTouched.sort = false
  fieldTouched.remark = false
}

function resetForm() {
  form.dataKey = ''
  form.value = ''
  form.sort = ''
  form.remark = ''
  initialSnapshot.dataKey = ''
  initialSnapshot.value = ''
  initialSnapshot.sort = ''
  initialSnapshot.remark = ''
  hasOriginalRemark.value = false
  dialogErrorMessage.value = ''
  clearFieldErrors()
}

const CONFIRM_DISCARD_MESSAGE = '表单有未保存的修改，确定放弃吗？'

const isFormDirty = computed(() => {
  if (dialogMode.value === 'add') {
    return form.dataKey !== '' || form.value !== '' || form.sort !== '' || form.remark !== ''
  }
  return (
    form.value !== initialSnapshot.value || form.sort !== initialSnapshot.sort || form.remark !== initialSnapshot.remark
  )
})

function confirmDiscardChanges(): boolean {
  if (!isFormDirty.value) {
    return true
  }
  // eslint-disable-next-line no-undef
  return window.confirm(CONFIRM_DISCARD_MESSAGE)
}

function openAddDialog() {
  refreshFailureNotice.value = ''
  dialogMode.value = 'add'
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(item: DictDataVO) {
  refreshFailureNotice.value = ''
  dialogMode.value = 'edit'
  resetForm()
  form.dataKey = item.dataKey
  form.value = item.value
  form.sort = item.sort !== undefined && item.sort !== null ? String(item.sort) : ''
  form.remark = item.remark ?? ''

  initialSnapshot.dataKey = form.dataKey
  initialSnapshot.value = form.value
  initialSnapshot.sort = form.sort
  initialSnapshot.remark = form.remark

  hasOriginalRemark.value = Boolean(item.remark && item.remark.trim() !== '')

  dialogVisible.value = true
}

function closeDialog() {
  if (dialogSubmitting.value) {
    return
  }
  if (!confirmDiscardChanges()) {
    return
  }
  dialogVisible.value = false
  resetForm()
}

function handleDialogBeforeClose(done: () => void) {
  if (dialogSubmitting.value) {
    return
  }
  if (!confirmDiscardChanges()) {
    return
  }
  resetForm()
  done()
}

onBeforeRouteLeave(() => {
  if (!auth.isAuthenticated || auth.sessionExpired) {
    dialogVisible.value = false
    resetForm()
    return true
  }

  if (dialogVisible.value && isFormDirty.value) {
    const ok = confirmDiscardChanges()
    if (!ok) {
      return false
    }
    dialogVisible.value = false
    resetForm()
    return true
  }

  if (dialogVisible.value) {
    dialogVisible.value = false
    resetForm()
  }

  return true
})

watch(
  () => [auth.accessToken, auth.sessionExpired, auth.isAuthenticated],
  () => {
    if (!auth.isAuthenticated || auth.sessionExpired) {
      dialogVisible.value = false
      resetForm()
    }
  },
)

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
  refreshFailureNotice.value = ''

  const mode = dialogMode.value

  try {
    const trimmedSort = form.sort.trim()
    const sortVal = trimmedSort !== '' ? parseInt(trimmedSort, 10) : undefined
    const trimmedRemark = form.remark.trim()

    if (mode === 'add') {
      await createDictItem({
        typeKey: typeKey.value,
        dataKey: form.dataKey.trim(),
        value: form.value.trim(),
        sort: sortVal,
        remark: trimmedRemark ? trimmedRemark : undefined,
      })
    } else {
      await updateDictItem({
        dataKey: form.dataKey.trim(),
        value: form.value.trim(),
        sort: sortVal,
        remark: trimmedRemark ? trimmedRemark : undefined,
      })
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
        dialogErrorMessage.value = err.message || (mode === 'add' ? '新增字典项失败，请重试' : '保存字典项失败，请重试')
      }
    } else if (err instanceof Error && err.message) {
      dialogErrorMessage.value = err.message
    } else {
      dialogErrorMessage.value = mode === 'add' ? '新增字典项失败，请重试' : '保存字典项失败，请重试'
    }
    return
  } finally {
    dialogSubmitting.value = false
  }

  dialogVisible.value = false
  resetForm()

  let refreshOk: boolean
  try {
    if (mode === 'add') {
      pageNo.value = 1
      refreshOk = await loadDictItems(lastQueryParams.value, 1, pageSize.value)
    } else {
      refreshOk = await loadDictItems(lastQueryParams.value, pageNo.value, pageSize.value)
    }
  } catch (refreshErr: unknown) {
    refreshOk = false
    hasError.value = true
    errorMessage.value = refreshErr instanceof Error && refreshErr.message ? refreshErr.message : '加载失败，请重试'
  }

  if (!refreshOk || hasError.value) {
    refreshFailureNotice.value =
      mode === 'add'
        ? '字典项创建成功，但列表刷新失败。请通过下方表格重试刷新查看最新数据，无需重复提交保存。'
        : '字典项保存成功，但列表刷新失败。请通过下方表格重试刷新查看最新数据，无需重复提交保存。'
  }
}

function getStatusLabel(status: number): string {
  return status === 1 ? '启用' : '停用'
}

async function loadDictItems(
  queryPayload?: { value?: string },
  targetPageNo: number = pageNo.value,
  targetPageSize: number = pageSize.value,
): Promise<boolean> {
  const currentSeq = ++querySeq
  loading.value = true
  hasError.value = false
  errorMessage.value = ''

  try {
    const result = await fetchDictItemList({
      typeKey: typeKey.value,
      pageNo: targetPageNo,
      pageSize: targetPageSize,
      value: queryPayload?.value,
    })
    if (currentSeq !== querySeq) {
      return false
    }
    dictItems.value = result?.list ?? []
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
    dictItems.value = []
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
    value: filters.value,
  }
  loadDictItems(lastQueryParams.value, 1, pageSize.value)
}

function handleReset() {
  filters.value = ''
  lastQueryParams.value = {}
  pageNo.value = 1
  loadDictItems({}, 1, pageSize.value)
}

function handlePageSizeChange(newSize?: number) {
  if (typeof newSize === 'number' && !Number.isNaN(newSize) && newSize > 0) {
    pageSize.value = newSize
  }
  pageNo.value = 1
  loadDictItems(lastQueryParams.value, 1, pageSize.value)
}

function handlePageChange(newPageNo: number) {
  if (newPageNo < 1 || (totalPages.value > 0 && newPageNo > totalPages.value)) {
    return
  }
  pageNo.value = newPageNo
  loadDictItems(lastQueryParams.value, newPageNo, pageSize.value)
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
  await loadDictItems(lastQueryParams.value, pageNo.value, pageSize.value)
}

function goBackToTypes() {
  router.push('/dictionaries')
}

onMounted(() => {
  typeKey.value = route.params.typeKey as string
  filters.value = ''
  lastQueryParams.value = {}
  pageNo.value = 1
  pageSize.value = 10
  loadDictItems({}, 1, 10)
})

defineExpose({
  typeKey,
  pageNo,
  pageSize,
  totals,
  totalPages,
  loadDictItems,
  handleQuery,
  handleReset,
  handlePageSizeChange,
  handlePageChange,
  handlePrevPage,
  handleNextPage,
  openAddDialog,
  openEditDialog,
  closeDialog,
  handleSubmit,
  dialogVisible,
  dialogMode,
  dialogSubmitting,
  form,
})
</script>

<template>
  <AppShell>
    <div class="dict-items-page">
      <header class="page-heading">
        <p class="section-kicker">DICTIONARY / {{ typeKey }}</p>
        <h1 id="dict-items-title">字典项</h1>
        <p class="intro-copy">
          当前所属字典类型：<strong class="parent-type-key" data-test="parent-type-key">{{ typeKey }}</strong>
        </p>
      </header>

      <div class="dict-items-split">
        <section class="dict-items-main" aria-labelledby="dict-items-title">
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

          <div class="back-bar">
            <button type="button" class="btn-back" data-test="btn-back-to-types" @click="goBackToTypes">
              ← 返回字典类型
            </button>
          </div>

          <form class="filters-form" @submit.prevent="handleQuery">
            <div class="filter-field">
              <label for="filter-item-value">字典项名称</label>
              <input
                id="filter-item-value"
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
            <button type="button" class="btn-add-dict-item" data-test="btn-add-dict-item" @click="openAddDialog">
              + 新增字典项
            </button>
          </div>

          <div class="table-wrap">
            <table class="dict-table" data-test="dict-item-table">
              <thead>
                <tr>
                  <th scope="col">字典项编码</th>
                  <th scope="col">名称</th>
                  <th scope="col">排序</th>
                  <th scope="col">状态</th>
                  <th scope="col">备注</th>
                  <th scope="col">操作</th>
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
                <tr v-else-if="dictItems.length === 0" data-test="state-empty" class="state-row is-empty">
                  <td colspan="6" class="cell-state is-empty">暂无数据</td>
                </tr>
                <tr v-for="item in dictItems" v-else :key="item.id" data-test="dict-item-row">
                  <td class="cell-data-key">{{ item.dataKey }}</td>
                  <td class="cell-value">{{ item.value }}</td>
                  <td class="cell-sort">{{ item.sort ?? '—' }}</td>
                  <td class="cell-status">
                    <span :class="['status-badge', item.status === 1 ? 'is-enabled' : 'is-disabled']">
                      {{ getStatusLabel(item.status) }}
                    </span>
                  </td>
                  <td class="cell-remark">{{ item.remark || '—' }}</td>
                  <td class="cell-actions">
                    <button
                      type="button"
                      class="btn-edit-dict-item"
                      data-test="btn-edit-dict-item"
                      @click="openEditDialog(item)"
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="!loading && !hasError && dictItems.length > 0" class="list-summary">
            已显示本页 {{ dictItems.length }} 个字典项
          </p>

          <div data-test="pagination-wrap" class="pagination-wrap">
            <div class="pagination-info">
              <span data-test="page-totals" class="page-totals">共 {{ totals }} 条，共 {{ totalPages }} 页</span>
              <span data-test="page-current" class="page-current">第 {{ pageNo }} / {{ totalPages || 1 }} 页</span>
            </div>

            <div class="pagination-controls">
              <label for="item-page-size-select" class="sr-only">每页条数</label>
              <select
                id="item-page-size-select"
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

        <aside class="dict-items-rail" aria-label="当前操作边界">
          <div class="rail-eyebrow">DICTIONARY ITEMS</div>
          <h2>维护字典项选项。</h2>
          <p>在所属字典类型下查看与筛选字典项，管理业务枚举的具体选项。</p>
          <div class="boundary-note">
            <span class="note-label">当前边界</span>
            <p>当前页面支持按字典项名称（前缀）筛选查询，支持新增与编辑字典项。</p>
            <p>编辑时字典项编码只读且不可变更所属类型；清空已有备注受接口约束被明确阻止；本版不提供删除或状态写入。</p>
          </div>
        </aside>
      </div>

      <el-dialog
        v-if="dialogVisible"
        v-model="dialogVisible"
        width="520px"
        class="dict-item-dialog"
        destroy-on-close
        :close-on-click-modal="!dialogSubmitting"
        :close-on-press-escape="!dialogSubmitting"
        :show-close="!dialogSubmitting"
        :before-close="handleDialogBeforeClose"
      >
        <template #header>
          <span class="el-dialog__title" data-test="dict-item-dialog-title">
            {{ dialogMode === 'add' ? '新增字典项' : '编辑字典项' }}
          </span>
        </template>

        <div data-test="dict-item-dialog">
          <form class="dict-item-form" data-test="dict-item-form" @submit.prevent="handleSubmit">
            <div class="form-item">
              <label for="form-item-type-key" class="form-label">所属字典类型</label>
              <input id="form-item-type-key" :value="typeKey" data-test="form-type-key" type="text" disabled readonly />
            </div>

            <div class="form-item" :class="{ 'has-error': fieldErrors.dataKey }">
              <label for="form-item-data-key" class="form-label required">字典项编码</label>
              <input
                id="form-item-data-key"
                v-model="form.dataKey"
                data-test="form-data-key"
                type="text"
                placeholder="请输入字典项编码"
                :disabled="dialogSubmitting || dialogMode === 'edit'"
                :readonly="dialogMode === 'edit'"
                @blur="handleFieldBlur('dataKey')"
                @input="handleFieldInput('dataKey')"
              />
              <span v-if="fieldErrors.dataKey" class="field-error" data-test="error-data-key" role="alert">
                {{ fieldErrors.dataKey }}
              </span>
            </div>

            <div class="form-item" :class="{ 'has-error': fieldErrors.value }">
              <label for="form-item-value-input" class="form-label required">字典项名称</label>
              <input
                id="form-item-value-input"
                v-model="form.value"
                data-test="form-value"
                type="text"
                placeholder="请输入字典项名称"
                :disabled="dialogSubmitting"
                @blur="handleFieldBlur('value')"
                @input="handleFieldInput('value')"
              />
              <span v-if="fieldErrors.value" class="field-error" data-test="error-value" role="alert">
                {{ fieldErrors.value }}
              </span>
            </div>

            <div class="form-item" :class="{ 'has-error': fieldErrors.sort }">
              <label for="form-item-sort" class="form-label">排序</label>
              <input
                id="form-item-sort"
                v-model="form.sort"
                data-test="form-sort"
                type="text"
                placeholder="可选整数排序（支持正数、零、负数）"
                :disabled="dialogSubmitting"
                @blur="handleFieldBlur('sort')"
                @input="handleFieldInput('sort')"
              />
              <span v-if="fieldErrors.sort" class="field-error" data-test="error-sort" role="alert">
                {{ fieldErrors.sort }}
              </span>
            </div>

            <div class="form-item" :class="{ 'has-error': fieldErrors.remark }">
              <label for="form-item-remark" class="form-label">备注</label>
              <textarea
                id="form-item-remark"
                v-model="form.remark"
                data-test="form-remark"
                rows="3"
                placeholder="可选备注信息"
                :disabled="dialogSubmitting"
                @blur="handleFieldBlur('remark')"
                @input="handleFieldInput('remark')"
              />
              <span v-if="fieldErrors.remark" class="field-error" data-test="error-remark" role="alert">
                {{ fieldErrors.remark }}
              </span>
            </div>

            <div
              v-if="dialogErrorMessage"
              class="dict-item-error-message"
              data-test="dict-item-error-message"
              role="alert"
            >
              <span class="dialog-error-icon" aria-hidden="true">!</span>
              <span class="dialog-error-text">{{ dialogErrorMessage }}</span>
            </div>

            <div class="dialog-actions">
              <button
                type="button"
                class="btn-cancel"
                data-test="btn-cancel-dict-item"
                :disabled="dialogSubmitting"
                @click="closeDialog"
              >
                取消
              </button>
              <button type="submit" class="btn-submit" data-test="btn-submit-dict-item" :disabled="dialogSubmitting">
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
.dict-items-page {
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

.parent-type-key {
  display: inline-block;
  max-width: 20rem;
  vertical-align: bottom;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dict-items-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 3rem;
  align-items: start;
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
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.refresh-notice-text {
  margin: 0;
  color: var(--orbit-ink);
  font-size: 0.85rem;
  line-height: 1.4;
}

.btn-notice-dismiss {
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--orbit-line-soft);
  background: transparent;
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: var(--orbit-paper);
    border-color: var(--orbit-ink);
  }
}

.back-bar {
  margin-bottom: 1rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.4rem;
  padding: 0 1.25rem;
  border: 1px solid var(--orbit-line-soft);
  background: transparent;
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  outline-offset: 2px;

  &:hover {
    background: var(--orbit-paper);
    border-color: var(--orbit-orange);
    color: var(--orbit-orange);
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
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

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.25rem;
}

.btn-add-dict-item {
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
  min-width: 720px;
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

.cell-data-key {
  font-family: ui-monospace, monospace;
  font-size: 0.84rem;
  white-space: nowrap;
}

.cell-value {
  white-space: nowrap;
}

.cell-sort {
  white-space: nowrap;
  text-align: center;
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
  min-width: 10rem;
  line-height: 1.5;
  word-break: break-all;
  white-space: normal;
}

.cell-actions {
  white-space: nowrap;
}

.btn-edit-dict-item {
  display: inline-flex;
  align-items: center;
  height: 1.8rem;
  padding: 0 0.6rem;
  border: 1px solid var(--orbit-line-soft);
  background: transparent;
  color: var(--orbit-ink);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  outline-offset: 2px;

  &:hover {
    background: var(--orbit-paper);
    border-color: var(--orbit-orange);
    color: var(--orbit-orange);
  }

  &:focus-visible {
    outline: 2px solid var(--orbit-orange);
  }
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

.dict-items-rail {
  padding-left: 1.5rem;
  border-left: 1px dashed var(--orbit-line-soft);
}

.rail-eyebrow {
  color: var(--orbit-body-muted);
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
}

.dict-items-rail h2 {
  margin: 0.5rem 0 0.5rem;
  color: var(--orbit-ink);
  font-family: var(--orbit-font-serif);
  font-size: 1.5rem;
  font-weight: 400;
}

.dict-items-rail p {
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

:deep(.dict-item-dialog) {
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

.dict-item-form {
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

.form-item.has-error input,
.form-item.has-error textarea {
  border-color: #d9534f;
}

.dict-item-error-message {
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
  .dict-items-page {
    padding: 1.5rem;
  }

  .dict-items-split {
    grid-template-columns: 1fr;
  }

  .dict-items-rail {
    padding-left: 0;
    border-left: 0;
    border-top: 1px dashed var(--orbit-line-soft);
    padding-top: 2rem;
  }
}
</style>
