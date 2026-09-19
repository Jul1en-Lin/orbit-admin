<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push({ name: 'workbench' })
}
</script>

<template>
  <main class="not-found-page">
    <div class="ambient-glow" aria-hidden="true" />
    <section class="not-found-panel" aria-labelledby="not-found-title">
      <div class="art-404" aria-hidden="true">
        <span class="digit">4</span>
        <div class="lost-planet">
          <div class="planet-core" />
          <div class="planet-ring" />
        </div>
        <span class="digit">4</span>
      </div>

      <div class="not-found-kicker">404 / PAGE NOT FOUND</div>
      <h1 id="not-found-title">页面不存在</h1>
      <p class="not-found-copy">请检查地址是否正确，或返回管理端首页继续工作。</p>
      <el-button class="not-found-action" type="primary" @click="goHome">
        <span>返回管理端首页</span>
        <svg class="action-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor">
          <path d="M3.33 8h9.34M8.67 4l4 4-4 4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </el-button>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.not-found-page {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-content: center;
  background: var(--orbit-ink);
  background-image:
    radial-gradient(rgba(243, 239, 229, 0.05) 1px, transparent 1px),
    linear-gradient(135deg, var(--orbit-ink-deep) 0%, var(--orbit-ink) 100%);
  background-size:
    24px 24px,
    100% 100%;
  color: var(--orbit-cream);
  overflow: hidden;
}

.ambient-glow {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(232, 117, 59, 0.12) 0%, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
}

.not-found-panel {
  position: relative;
  z-index: 1;
  width: min(520px, calc(100% - 3rem));
  margin: 0 auto;
  padding: 3rem 2.5rem;
  text-align: center;
  background: rgba(11, 41, 37, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(243, 239, 229, 0.12);
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.4);
}

.art-404 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.digit {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  font-size: 5.5rem;
  font-weight: 900;
  line-height: 1;
  color: rgba(243, 239, 229, 0.2);
  letter-spacing: -0.05em;
}

.lost-planet {
  position: relative;
  width: 54px;
  height: 54px;
}

.planet-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--orbit-orange) 0%, #ff8a4c 100%);
  box-shadow: 0 0 20px rgba(232, 117, 59, 0.6);
}

.planet-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  width: 54px;
  height: 18px;
  border: 2px solid rgba(243, 239, 229, 0.4);
  border-radius: 50%;
}

.not-found-kicker {
  display: inline-block;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  background: rgba(232, 117, 59, 0.1);
  border: 1px solid rgba(232, 117, 59, 0.25);
  color: var(--orbit-orange);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  margin-bottom: 0.75rem;
}

.not-found-page h1 {
  margin: 0.5rem 0 0.75rem;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  font-size: clamp(2rem, 3.5vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.not-found-copy {
  margin: 0 auto 2rem;
  max-width: 24rem;
  color: var(--orbit-muted);
  font-size: 0.95rem;
  line-height: 1.65;
}

.not-found-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 240px;
  height: 3rem;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--orbit-orange) 0%, #ff8a4c 100%);
  color: #0b2925;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  box-shadow: 0 10px 24px -6px rgba(232, 117, 59, 0.4);
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover,
  &:focus {
    background: linear-gradient(135deg, var(--orbit-orange-hover) 0%, #ff9d66 100%);
    box-shadow: 0 14px 28px -4px rgba(232, 117, 59, 0.5);
    transform: translateY(-1px);
    color: #0b2925;
  }

  &:active {
    transform: scale(0.97);
  }
}

.action-icon {
  width: 1rem;
  height: 1rem;
  transition: transform 0.15s ease;
}

.not-found-action:hover .action-icon {
  transform: translateX(3px);
}
</style>
