<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../api/client'
import { useAuthStore } from '../auth/store'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const phone = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref(
  auth.sessionExpired
    ? '登录状态已失效，请重新输入'
    : auth.restoreError
      ? loginError(auth.restoreError)
      : route.query.restore === 'failed'
        ? '暂时无法确认当前管理端账号，请重试或返回登录'
        : '',
)
const canRetryAccount = computed(() => Boolean(auth.accessToken && !auth.managementAccount))

function loginError(error: unknown): string {
  if (error instanceof ApiError && error.kind === 'network') return '网络暂时不可用，请稍后重试'
  if (error instanceof ApiError && error.status === 401) return '登录状态已失效，请重新输入'
  if (auth.accessToken) return '暂时无法确认当前管理端账号，请重试或返回登录'
  return '手机号或密码错误，请检查后重试'
}

function submitError(error: unknown): string {
  if (error instanceof ApiError && error.kind === 'network') return '网络暂时不可用，请稍后重试'
  return '手机号或密码错误，请检查后重试'
}

function validRedirect(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (!value.startsWith('/')) return false
  if (value.startsWith('//')) return false
  if (value.includes('\\')) return false
  if (value.startsWith('/login')) return false
  return true
}

async function retryAccount() {
  if (!canRetryAccount.value || submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    await auth.retryManagementAccount()
    await router.push(validRedirect(route.query.redirect) ? route.query.redirect : { name: 'workbench' })
  } catch (error) {
    errorMessage.value = loginError(error)
  } finally {
    submitting.value = false
  }
}

function returnToLogin() {
  auth.signOut()
  errorMessage.value = ''
}

async function submit() {
  if (!phone.value || !password.value || submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  auth.sessionExpired = false
  try {
    await auth.signIn(phone.value, password.value)
    await router.push(validRedirect(route.query.redirect) ? route.query.redirect : { name: 'workbench' })
  } catch (error) {
    errorMessage.value = submitError(error)
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(() => {
  password.value = ''
  auth.restoreError = null
  auth.sessionExpired = false
})
</script>

<template>
  <main class="login-page">
    <div class="ambient-glow ambient-glow--1" aria-hidden="true" />
    <div class="ambient-glow ambient-glow--2" aria-hidden="true" />

    <section class="login-panel" aria-labelledby="login-title">
      <div class="panel-card">
        <div class="brand-badge">
          <svg class="brand-orbit-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" />
            <ellipse
              cx="12"
              cy="12"
              rx="11"
              ry="4"
              stroke="currentColor"
              stroke-width="1.2"
              transform="rotate(-25 12 12)"
            />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
          <span class="login-kicker">ORBIT / ADMIN WORKBENCH</span>
        </div>

        <h1 id="login-title">进入工作台</h1>
        <p class="login-intro">使用管理端账号登录 Orbit Admin 控制台系统。</p>

        <form class="login-form" @submit.prevent="submit">
          <el-form-item label="手机号" label-width="80px">
            <el-input v-model="phone" type="text" autocomplete="username" placeholder="请输入手机号" size="large" />
          </el-form-item>

          <el-form-item label="密码" label-width="80px">
            <el-input
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="请输入密码"
              show-password
              size="large"
            />
          </el-form-item>

          <transition name="fade-scale">
            <div v-if="errorMessage" class="form-error" role="alert">
              <svg class="error-icon" viewBox="0 0 16 16" fill="currentColor">
                <path
                  d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4.5zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
              <span>{{ errorMessage }}</span>
            </div>
          </transition>

          <template v-if="canRetryAccount">
            <el-button class="login-submit" type="primary" :loading="submitting" @click="retryAccount">
              {{ submitting ? '确认中' : '重试确认账号' }}
            </el-button>
            <button class="return-login" type="button" @click="returnToLogin">返回登录</button>
          </template>
          <el-button v-else class="login-submit" type="primary" native-type="submit" :loading="submitting">
            <span v-if="!submitting" class="submit-content">
              <span>立即登录</span>
              <svg class="arrow-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                <path
                  d="M3.33 8h9.34M8.67 4l4 4-4 4"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span v-else>登录中...</span>
          </el-button>
        </form>
      </div>
    </section>

    <aside class="login-aside" aria-label="产品说明">
      <div class="aside-backdrop" aria-hidden="true" />

      <div class="aside-body">
        <span class="aside-caption">统一调度企业级核心配置、账号体系与数据字典。</span>

        <div class="tech-graphic" aria-hidden="true">
          <div class="orbit-center-orb" />
          <div class="orbit-ring orbit-ring--outer" />
          <div class="orbit-ring orbit-ring--inner" />
          <div class="satellite satellite--1" />
          <div class="satellite satellite--2" />
        </div>
      </div>

      <div class="aside-footer">
        <div class="metric-pill">
          <span class="metric-label">RELEASE</span>
          <span class="metric-value">v0.1.0</span>
        </div>
      </div>
    </aside>
  </main>
</template>

<style lang="scss" scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
  background: var(--orbit-ink);
  background-image:
    radial-gradient(rgba(243, 239, 229, 0.05) 1px, transparent 1px),
    linear-gradient(135deg, var(--orbit-ink-deep) 0%, var(--orbit-ink) 100%);
  background-size:
    24px 24px,
    100% 100%;
  overflow: hidden;
}

.ambient-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(90px);
  z-index: 0;

  &--1 {
    top: -10%;
    left: 10%;
    width: 480px;
    height: 480px;
    background: radial-gradient(circle, rgba(232, 117, 59, 0.16) 0%, transparent 70%);
  }

  &--2 {
    bottom: -15%;
    right: 25%;
    width: 520px;
    height: 520px;
    background: radial-gradient(circle, rgba(38, 166, 154, 0.12) 0%, transparent 70%);
  }
}

.login-panel {
  position: relative;
  z-index: 1;
  align-self: center;
  width: min(500px, calc(100% - 3rem));
  margin: auto;
  padding: var(--orbit-space-2xl) 0;
}

.panel-card {
  padding: 3rem 2.75rem;
  background: rgba(11, 41, 37, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(243, 239, 229, 0.12);
  border-radius: 18px;
  box-shadow:
    0 24px 48px -12px rgba(0, 0, 0, 0.35),
    0 1px 0 0 rgba(255, 255, 255, 0.08) inset;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  background: rgba(232, 117, 59, 0.1);
  border: 1px solid rgba(232, 117, 59, 0.25);
  margin-bottom: 1.5rem;
}

.brand-orbit-icon {
  width: 1.1rem;
  height: 1.1rem;
  color: var(--orbit-orange);
  animation: pulse-spin 14s linear infinite;
}

@keyframes pulse-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.login-kicker {
  color: var(--orbit-orange);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.login-page h1 {
  margin: 0 0 0.75rem;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  font-size: clamp(2rem, 3.5vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.login-intro {
  margin: 0 0 2rem;
  color: var(--orbit-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}

.login-form {
  margin-top: 1.5rem;
  width: 100%;

  :deep(.el-form-item) {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    width: 100%;
  }

  :deep(.el-form-item__label) {
    width: 80px !important;
    min-width: 80px !important;
    max-width: 80px !important;
    flex: 0 0 80px !important;
    height: 3.15rem;
    line-height: 3.15rem;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 16px 0 0;
    color: rgba(243, 239, 229, 0.9);
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    box-sizing: border-box;
  }

  :deep(.el-form-item__content) {
    flex: 1 1 0%;
    min-width: 0;
    width: 0;
    display: flex;
    line-height: normal;
  }

  :deep(.el-input) {
    width: 100%;
    display: flex;
    flex: 1 1 auto;
  }

  :deep(.el-input__wrapper) {
    width: 100%;
    box-sizing: border-box;
    height: 3.15rem;
    padding: 0 14px;
    border-radius: 10px;
    background: #081d1a;
    background-color: #081d1a;
    box-shadow: 0 0 0 1px rgba(243, 239, 229, 0.16) inset;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

    &:hover {
      background: #0b2622;
      background-color: #0b2622;
      box-shadow: 0 0 0 1px rgba(243, 239, 229, 0.3) inset;
    }

    &.is-focus {
      background: #0b2622;
      background-color: #0b2622;
      box-shadow: 0 0 0 1.5px rgba(243, 239, 229, 0.4) inset !important;
      outline: none !important;
    }
  }

  :deep(.el-input__inner) {
    height: 100%;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    background: transparent !important;
    background-color: transparent !important;
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    font-size: 0.95rem;

    &::placeholder {
      color: rgba(243, 239, 229, 0.35);
      -webkit-text-fill-color: rgba(243, 239, 229, 0.35);
    }

    /* 拦截 Chrome / Safari / Edge 账号密码自动填充产生的底色，与 wrapper 完全同色，彻底消除内外嵌套层 */
    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
      -webkit-text-fill-color: #ffffff !important;
      -webkit-box-shadow: 0 0 0 1000px #081d1a inset !important;
      box-shadow: 0 0 0 1000px #081d1a inset !important;
      caret-color: #ffffff !important;
      border-radius: 0 !important;
      background-color: transparent !important;
      transition: background-color 50000s ease-in-out 0s !important;
    }
  }

  :deep(.el-input__wrapper:hover .el-input__inner:-webkit-autofill),
  :deep(.el-input__wrapper.is-focus .el-input__inner:-webkit-autofill) {
    -webkit-box-shadow: 0 0 0 1000px #0b2622 inset !important;
    box-shadow: 0 0 0 1000px #0b2622 inset !important;
  }

  :deep(.el-input__suffix) {
    .el-icon {
      color: rgba(243, 239, 229, 0.6);
      cursor: pointer;
      transition: color 0.15s ease;

      &:hover {
        color: #ffffff;
      }
    }
  }
}

.login-submit {
  width: 100%;
  height: 3.15rem;
  margin-top: 0.75rem;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--orbit-orange) 0%, #ff8a4c 100%);
  color: #0b2925;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow:
    0 10px 24px -6px rgba(232, 117, 59, 0.45),
    0 1px 0 0 rgba(255, 255, 255, 0.3) inset;
  transition:
    transform 0.15s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.2s ease,
    opacity 0.15s ease;

  &:hover {
    background: linear-gradient(135deg, var(--orbit-orange-hover) 0%, #ff9d66 100%);
    box-shadow:
      0 14px 28px -4px rgba(232, 117, 59, 0.55),
      0 1px 0 0 rgba(255, 255, 255, 0.4) inset;
    transform: translateY(-1px);
    color: #0b2925;
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4px 12px -2px rgba(232, 117, 59, 0.4);
  }
}

.submit-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.arrow-icon {
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s ease;
}

.login-submit:hover .arrow-icon {
  transform: translateX(3px);
}

.form-error {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0.25rem 0 1.25rem;
  padding: 0.7rem 0.9rem;
  border-radius: 8px;
  background: rgba(225, 29, 72, 0.12);
  border: 1px solid rgba(225, 29, 72, 0.3);
  color: #ff9fb4;
  font-size: 0.85rem;
}

.error-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  fill: #ff6b8b;
}

.return-login {
  display: block;
  margin: 1.25rem auto 0;
  padding: 0.4rem 0.8rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--orbit-cream);
  font-size: 0.88rem;
  cursor: pointer;
  opacity: 0.8;
  transition:
    opacity 0.15s,
    background 0.15s;

  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.06);
    color: var(--orbit-orange);
  }
}

.login-aside {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4rem 3.5rem;
  border-left: 1px solid rgba(243, 239, 229, 0.1);
  background: rgba(6, 21, 19, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  overflow: hidden;
}

.aside-backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 70% 30%, rgba(232, 117, 59, 0.08) 0%, transparent 60%),
    radial-gradient(circle at 20% 80%, rgba(38, 166, 154, 0.06) 0%, transparent 60%);
  pointer-events: none;
}

.aside-body {
  position: relative;
  z-index: 1;
  margin: auto 0;
}

.aside-caption {
  display: block;
  max-width: 18rem;
  color: var(--orbit-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}

.tech-graphic {
  position: relative;
  width: 220px;
  height: 220px;
  margin: 3rem auto 0;
}

.orbit-center-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--orbit-orange) 0%, rgba(232, 117, 59, 0.2) 70%);
  box-shadow: 0 0 24px var(--orbit-orange);
}

.orbit-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 1px dashed rgba(243, 239, 229, 0.18);
  transform: translate(-50%, -50%);

  &--inner {
    width: 110px;
    height: 110px;
    animation: spin 30s linear infinite;
  }

  &--outer {
    width: 190px;
    height: 190px;
    border-color: rgba(243, 239, 229, 0.12);
    animation: spin 50s linear infinite reverse;
  }
}

.satellite {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 10px #ffffff;

  &--1 {
    top: 6px;
    left: 45px;
  }

  &--2 {
    bottom: 25px;
    right: 20px;
    width: 6px;
    height: 6px;
    background: var(--orbit-orange);
    box-shadow: 0 0 8px var(--orbit-orange);
  }
}

@keyframes spin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.aside-footer {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 0.75rem;
}

.metric-pill {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.metric-label {
  color: var(--orbit-muted);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.metric-value {
  color: var(--orbit-cream);
  font-size: 0.8rem;
  font-weight: 600;
  font-family: ui-monospace, monospace;
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-panel {
    width: min(500px, calc(100% - 2.5rem));
    padding: 2.5rem 0;
  }

  .login-aside {
    min-height: auto;
    padding: 2.5rem 2rem;
    border-top: 1px solid rgba(243, 239, 229, 0.1);
    border-left: 0;
  }

  .tech-graphic {
    display: none;
  }
}
</style>
