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
      <div class="topbar-inner">
        <div
          class="brand"
          aria-label="Orbit Admin"
          role="button"
          tabindex="0"
          @click="router.push('/workbench')"
          @keydown.enter="router.push('/workbench')"
        >
          <div class="brand-text">
            <span class="brand-title">ORBIT ADMIN</span>
            <span class="brand-tag">CONSOLE</span>
          </div>
        </div>

        <nav class="primary-nav" aria-label="主导航">
          <router-link to="/accounts" class="nav-item" active-class="is-active">
            <svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M8 8a3 3 0 100-6 3 3 0 000 6zm2 1.5H6a4 4 0 00-4 4v.5a1 1 0 001 1h10a1 1 0 001-1v-.5a4 4 0 00-4-4z"
              />
            </svg>
            <span>管理端账号</span>
          </router-link>
          <router-link to="/dictionaries" class="nav-item" active-class="is-active">
            <svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M2.5 3A1.5 1.5 0 014 1.5h8A1.5 1.5 0 0113.5 3v10a1.5 1.5 0 01-1.5 1.5H4A1.5 1.5 0 012.5 13V3zm3 3a.75.75 0 000 1.5h5a.75.75 0 000-1.5h-5zm0 3a.75.75 0 000 1.5h5a.75.75 0 000-1.5h-5z"
              />
            </svg>
            <span>字典</span>
          </router-link>
          <router-link to="/parameters" class="nav-item" active-class="is-active">
            <svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M8 1a1 1 0 011 1v1.1a5 5 0 012.12.88l.78-.78a1 1 0 011.42 1.42l-.78.78A5 5 0 0113.4 7.5H14.5a1 1 0 110 2h-1.1a5 5 0 01-.88 2.12l.78.78a1 1 0 01-1.42 1.42l-.78-.78A5 5 0 019 13.9V15a1 1 0 11-2 0v-1.1a5 5 0 01-2.12-.88l-.78.78a1 1 0 01-1.42-1.42l.78-.78A5 5 0 012.6 9.5H1.5a1 1 0 010-2h1.1a5 5 0 01.88-2.12l-.78-.78a1 1 0 011.42-1.42l.78.78A5 5 0 017 3.1V2a1 1 0 011-1zm0 5a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
            <span>参数</span>
          </router-link>
        </nav>

        <div class="account-bar">
          <div class="user-pill">
            <span class="account-name">{{
              auth.managementAccount?.nickName || auth.managementAccount?.userName || 'admin'
            }}</span>
          </div>
          <button data-test="logout" class="logout-button" type="button" @click="signOut">
            <svg class="logout-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor">
              <path
                d="M6 2H3.5A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14H6M10.5 11.5L14 8l-3.5-3.5M14 8H5.5"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>退出</span>
          </button>
        </div>
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
  background-image:
    linear-gradient(180deg, rgba(21, 59, 54, 0.03) 0%, transparent 260px),
    radial-gradient(rgba(21, 59, 54, 0.04) 1px, transparent 1px);
  background-size:
    100% 100%,
    20px 20px;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  min-height: 4.25rem;
  background: var(--orbit-ink);
  color: var(--orbit-cream);
  border-bottom: 1px solid rgba(243, 239, 229, 0.12);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.topbar-inner {
  max-width: 1440px;
  min-height: 4.25rem;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: var(--orbit-space-xl);
  padding: 0 var(--orbit-space-2xl);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.9;
  }
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.brand-title {
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.brand-tag {
  color: var(--orbit-orange);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  opacity: 0.9;
}

.primary-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1.5rem;
}

.nav-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  border-bottom: 2px solid transparent;
  color: rgba(243, 239, 229, 0.75);
  font-size: 0.88rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.07);
  }

  &.is-active {
    color: #ffffff;
    background: rgba(232, 117, 59, 0.14);
    border-color: var(--orbit-orange);
    box-shadow: 0 1px 0 0 rgba(232, 117, 59, 0.5) inset;
    font-weight: 600;

    .nav-icon {
      color: var(--orbit-orange);
    }
  }
}

.nav-icon {
  width: 0.95rem;
  height: 0.95rem;
  opacity: 0.85;
  transition: transform 0.15s ease;
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
  opacity: 1;
}

.account-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

.user-pill {
  display: flex;
  align-items: center;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.account-name {
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--orbit-cream);
  font-size: 0.85rem;
  font-weight: 500;
}

.logout-button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  border: 1px solid rgba(243, 239, 229, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--orbit-cream);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(225, 29, 72, 0.15);
    border-color: rgba(225, 29, 72, 0.4);
    color: #ff9fb4;

    .logout-icon {
      stroke: #ff9fb4;
      transform: translateX(2px);
    }
  }

  &:active {
    transform: scale(0.96);
  }
}

.logout-icon {
  width: 0.85rem;
  height: 0.85rem;
  stroke: var(--orbit-cream);
  transition: transform 0.15s ease;
}

.shell-content {
  max-width: 1440px;
  margin: 0 auto;
  padding: clamp(var(--orbit-space-lg), 4vw, 3.5rem) var(--orbit-space-2xl);
}

@media (max-width: 760px) {
  .topbar {
    min-height: auto;
  }

  .topbar-inner {
    flex-wrap: wrap;
    gap: var(--orbit-space-md);
    padding: var(--orbit-space-md) var(--orbit-space-lg);
  }

  .primary-nav {
    order: 3;
    width: 100%;
    min-height: 2.5rem;
    margin-left: 0;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }

  .account-bar {
    margin-left: auto;
  }

  .shell-content {
    padding: var(--orbit-space-xl) var(--orbit-space-lg);
  }
}
</style>
