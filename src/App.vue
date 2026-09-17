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
    <span class="loading-mark">ORBIT</span>
    <span>正在确认管理端账号…</span>
  </div>
  <RouterView v-else />
</template>

<style lang="scss" scoped>
.app-loading {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 1rem;
  color: var(--orbit-cream);
}

.loading-mark {
  color: var(--orbit-orange);
  letter-spacing: 0.18em;
  font-weight: 700;
}
</style>
