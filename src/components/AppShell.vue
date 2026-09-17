<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../auth/store'

const router = useRouter()
const auth = useAuthStore()

function signOut() {
  auth.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div class="brand" aria-label="Orbit Admin">
        <span class="brand-mark">O</span>
        <span>ORBIT ADMIN</span>
      </div>
      <nav class="primary-nav" aria-label="主导航">
        <a class="nav-item is-active" href="#" @click.prevent>工作台</a>
        <span class="nav-item is-disabled" aria-disabled="true">管理端账号</span>
        <span class="nav-item is-disabled" aria-disabled="true">字典</span>
        <span class="nav-item is-disabled" aria-disabled="true">参数</span>
      </nav>
      <div class="account-bar">
        <span class="account-name">{{ auth.managementAccount?.nickName || auth.managementAccount?.userName }}</span>
        <button data-test="logout" class="logout-button" type="button" @click="signOut">退出</button>
      </div>
    </header>
    <main class="shell-content">
      <slot />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.shell {
  min-height: 100vh;
  background: var(--orbit-cream);
  color: var(--orbit-ink-deep);
}

.topbar {
  min-height: 5.5rem;
  display: flex;
  align-items: center;
  gap: var(--orbit-space-xl);
  padding: 0 var(--orbit-space-2xl);
  background: var(--orbit-ink);
  color: var(--orbit-cream);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--orbit-space-sm);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  white-space: nowrap;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--orbit-orange);
  color: var(--orbit-orange);
  font-family: var(--orbit-font-serif);
  font-size: 1.2rem;
}

.primary-nav {
  display: flex;
  align-items: stretch;
  align-self: stretch;
  gap: var(--orbit-space-lg);
  margin-left: var(--orbit-space-xl);
}

.nav-item {
  display: grid;
  place-items: center;
  border-bottom: 2px solid transparent;
  color: var(--orbit-cream);
  font-size: 0.85rem;
  text-decoration: none;
}

.nav-item.is-active {
  border-color: var(--orbit-orange);
}

.nav-item.is-disabled {
  color: var(--orbit-muted);
  cursor: not-allowed;
}

.account-bar {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-left: auto;
}

.account-name {
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-button {
  padding: var(--orbit-space-xs) 0;
  border: 0;
  border-bottom: 1px solid var(--orbit-orange);
  background: transparent;
  color: var(--orbit-cream);
  cursor: pointer;
}

.shell-content {
  max-width: 1440px;
  margin: 0 auto;
  padding: clamp(var(--orbit-space-xl), 5vw, 5rem) var(--orbit-space-2xl);
}

@media (max-width: 760px) {
  .topbar {
    flex-wrap: wrap;
    gap: var(--orbit-space-md);
    padding: var(--orbit-space-md) var(--orbit-space-lg);
  }

  .primary-nav {
    order: 3;
    width: 100%;
    min-height: 2.5rem;
    margin-left: 0;
    gap: 1rem;
  }

  .account-bar {
    margin-left: auto;
  }

  .shell-content {
    padding: var(--orbit-space-xl) var(--orbit-space-lg);
  }
}
</style>
