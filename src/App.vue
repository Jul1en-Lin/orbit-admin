<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from './auth/store'

const auth = useAuthStore()
const route = useRoute()
</script>

<template>
  <div
    v-if="auth.restoring || (auth.accessToken && !auth.managementAccount && route.name !== 'login')"
    class="app-loading"
    role="status"
  >
    <div class="loading-spinner-wrap" aria-hidden="true">
      <div class="orbit-glow" />
      <div class="orbit-track" />
      <div class="orbit-spinner" />
      <div class="orbit-center" />
    </div>
    <span class="loading-mark">ORBIT</span>
    <span class="loading-text">正在确认管理端账号…</span>
  </div>
  <RouterView v-else />
</template>

<style lang="scss" scoped>
.app-loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  background: var(--orbit-ink);
  background-image:
    radial-gradient(rgba(243, 239, 229, 0.05) 1px, transparent 1px),
    linear-gradient(135deg, var(--orbit-ink-deep) 0%, var(--orbit-ink) 100%);
  background-size:
    24px 24px,
    100% 100%;
  color: var(--orbit-cream);
}

.loading-spinner-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  margin-bottom: 0.5rem;
}

.orbit-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--orbit-orange);
  filter: blur(14px);
  opacity: 0.25;
  animation: pulse-glow 2s ease-in-out infinite;
}

.orbit-track {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px dashed rgba(243, 239, 229, 0.15);
}

.orbit-spinner {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  border-top-color: var(--orbit-orange);
  animation: spin 1s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}

.orbit-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--orbit-orange);
  box-shadow: 0 0 10px var(--orbit-orange);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.25;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.45;
  }
}

.loading-mark {
  color: var(--orbit-orange);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  letter-spacing: 0.24em;
  font-size: 0.95rem;
  font-weight: 800;
}

.loading-text {
  color: var(--orbit-muted);
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}
</style>
