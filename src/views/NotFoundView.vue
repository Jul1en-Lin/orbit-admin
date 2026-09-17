<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push({ name: 'workbench' })
}
</script>

<template>
  <main class="not-found-page">
    <section class="not-found-panel" aria-labelledby="not-found-title">
      <div class="not-found-kicker">404 / PAGE NOT FOUND</div>
      <h1 id="not-found-title">页面不存在</h1>
      <p class="not-found-copy">请检查地址是否正确，或返回管理端首页继续工作。</p>
      <el-button class="not-found-action" type="primary" @click="goHome">返回管理端首页</el-button>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.not-found-page {
  min-height: 100vh;
  display: grid;
  place-content: center;
  background: var(--orbit-ink);
  color: var(--orbit-cream);
}

.not-found-panel {
  width: min(480px, calc(100% - 4rem));
  text-align: center;
}

.not-found-kicker {
  color: var(--orbit-orange);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.not-found-page h1 {
  margin: 0.7rem 0 1rem;
  font-family: var(--orbit-font-serif);
  font-size: clamp(2.5rem, 5vw, 4.6rem);
  font-weight: 400;
  line-height: 1;
}

.not-found-copy {
  color: var(--orbit-muted);
  line-height: 1.7;
}

.not-found-action {
  width: 100%;
  max-width: 280px;
  height: 3rem;
  margin-top: var(--orbit-space-xl);
  border: 0;
  border-radius: 0;
  background: var(--orbit-orange);
  color: var(--orbit-ink-deep);
  font-weight: 700;
}

.not-found-action:hover,
.not-found-action:focus {
  background: var(--orbit-orange-hover);
  color: var(--orbit-ink-deep);
}
</style>
