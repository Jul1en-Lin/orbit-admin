<script setup lang="ts">
import AppShell from '../components/AppShell.vue'
</script>

<template>
  <AppShell>
    <section class="workbench-intro" aria-labelledby="workbench-title">
      <div>
        <p class="section-kicker">WORKSPACE / READY</p>
        <h1 id="workbench-title">工作台已就绪</h1>
        <p class="intro-copy">当前登录身份已确认。请从顶部导航进入已交付的管理功能。</p>
      </div>
      <aside class="boundary-note" aria-label="当前操作边界">
        <span class="note-label">当前边界</span>
        <p>登录、账号识别与本地退出已就绪。</p>
        <p>业务列表将在对应功能交付后开放。</p>
      </aside>
    </section>
  </AppShell>
</template>

<style lang="scss" scoped>
.workbench-intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 4rem;
  padding-bottom: 4rem;
  border-bottom: var(--orbit-content-border);
}

.section-kicker {
  color: var(--orbit-orange);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.workbench-intro h1 {
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

.boundary-note {
  align-self: end;
  padding: 1.5rem;
  border-left: 3px solid var(--orbit-orange);
  background: var(--orbit-paper);
  color: var(--orbit-body-muted);
  line-height: 1.6;
}

.boundary-note p {
  margin: 0.5rem 0 0;
}

.note-label {
  color: var(--orbit-ink);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

@media (max-width: 760px) {
  .workbench-intro {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
</style>
