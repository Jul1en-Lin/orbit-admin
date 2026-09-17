<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import AppShell from '../components/AppShell.vue'
import { fetchAccountList, type SysUserVO } from '../api/account'

const accounts = ref<SysUserVO[]>([])
const loading = ref(false)

const filters = reactive({
  userId: '',
  phoneNumber: '',
  status: '',
})

async function loadAccounts(queryPayload?: { userId?: string; phoneNumber?: string; status?: string }) {
  loading.value = true
  try {
    accounts.value = await fetchAccountList(queryPayload)
  } catch {
    accounts.value = []
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  loadAccounts({
    userId: filters.userId,
    phoneNumber: filters.phoneNumber,
    status: filters.status,
  })
}

function handleReset() {
  filters.userId = ''
  filters.phoneNumber = ''
  filters.status = ''
  loadAccounts({})
}

onMounted(() => {
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
                <option value="enable">启用</option>
                <option value="disable">停用</option>
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
                <tr v-for="account in accounts" :key="account.userId" data-test="account-row">
                  <td class="cell-id">{{ account.userId }}</td>
                  <td class="cell-phone">{{ account.phoneNumber }}</td>
                  <td class="cell-nickname">{{ account.nickName }}</td>
                  <td class="cell-identity">{{ account.identity }}</td>
                  <td class="cell-status">
                    <span :class="['status-badge', account.status === 'disable' ? 'is-disabled' : 'is-enabled']">
                      {{ account.status }}
                    </span>
                  </td>
                  <td class="cell-remark">{{ account.remark || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="accounts.length > 0" class="list-summary">已显示全部 {{ accounts.length }} 个账号</p>
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

  &:hover {
    opacity: 0.9;
  }
}

.btn-reset {
  height: 2.4rem;
  padding: 0 1rem;
  border: 1px solid var(--orbit-line-soft);
  background: transparent;
  color: var(--orbit-ink);
  cursor: pointer;

  &:hover {
    background: var(--orbit-paper);
  }
}

.table-wrap {
  margin-top: 1.5rem;
  overflow-x: auto;
}

.account-table {
  width: 100%;
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
