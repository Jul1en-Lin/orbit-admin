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
const errorMessage = ref('')
const canRetryAccount = computed(() => Boolean(auth.accessToken && !auth.managementAccount))

function loginError(error: unknown): string {
  if (error instanceof ApiError && error.kind === 'network') return '网络暂时不可用，请稍后重试'
  if (error instanceof ApiError && error.status === 401) return '登录状态已失效，请重新输入'
  if (auth.accessToken) return '暂时无法确认当前管理端账号，请重试或返回登录'
  return '手机号或密码错误，请检查后重试'
}

function validRedirect(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
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
  try {
    await auth.signIn(phone.value, password.value)
    await router.push(validRedirect(route.query.redirect) ? route.query.redirect : { name: 'workbench' })
  } catch (error) {
    errorMessage.value = loginError(error)
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(() => {
  password.value = ''
})
</script>

<template>
  <main class="login-page">
    <section class="login-panel" aria-labelledby="login-title">
      <div class="login-kicker">ORBIT / ADMIN WORKBENCH</div>
      <h1 id="login-title">进入工作台</h1>
      <p class="login-intro">使用管理端账号登录 Orbit Admin。</p>
      <form class="login-form" @submit.prevent="submit">
        <el-form-item label="手机号">
          <el-input v-model="phone" type="text" autocomplete="username" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>
        <template v-if="canRetryAccount">
          <el-button class="login-submit" type="primary" :loading="submitting" @click="retryAccount">
            {{ submitting ? '确认中' : '重试确认账号' }}
          </el-button>
          <button class="return-login" type="button" @click="returnToLogin">返回登录</button>
        </template>
        <el-button v-else class="login-submit" type="primary" native-type="submit" :loading="submitting">
          {{ submitting ? '登录中' : '登录' }}
        </el-button>
      </form>
    </section>
    <aside class="login-aside" aria-label="产品说明">
      <span class="aside-index">01</span>
      <p>管理端工作从这里开始。</p>
    </aside>
  </main>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 35%);
  background: var(--orbit-ink);
}

.login-panel {
  align-self: center;
  width: min(480px, calc(100% - 4rem));
  margin: auto;
  padding: var(--orbit-space-xl) 0;
}

.login-kicker,
.aside-index {
  color: var(--orbit-orange);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.login-page h1 {
  margin: 0.7rem 0 var(--orbit-space-md);
  font-family: var(--orbit-font-serif);
  font-size: clamp(2.5rem, 5vw, 4.6rem);
  font-weight: 400;
  line-height: 1;
}

.login-intro {
  color: var(--orbit-muted);
  line-height: 1.7;
}

.login-form {
  margin-top: 2.5rem;
}

.login-submit {
  width: 100%;
  height: 3rem;
  margin-top: var(--orbit-space-xs);
  border: 0;
  border-radius: 0;
  background: var(--orbit-orange);
  color: var(--orbit-ink-deep);
  font-weight: 700;
}

.login-submit:hover,
.login-submit:focus {
  background: var(--orbit-orange-hover);
  color: var(--orbit-ink-deep);
}

.form-error {
  margin: var(--orbit-space-md) 0;
  color: var(--orbit-error);
}

.return-login {
  display: block;
  margin: var(--orbit-space-md) auto 0;
  padding: var(--orbit-space-xs) 0;
  border: 0;
  border-bottom: 1px solid var(--orbit-orange);
  background: transparent;
  color: var(--orbit-cream);
  cursor: pointer;
}

.login-aside {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--orbit-space-2xl);
  border-left: var(--orbit-border);
  background: var(--orbit-ink-deep);
}

.login-aside p {
  max-width: 12rem;
  margin: 0;
  font-family: var(--orbit-font-serif);
  font-size: 2rem;
  line-height: 1.15;
}

@media (max-width: 760px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-panel {
    width: min(480px, calc(100% - 3rem));
  }

  .login-aside {
    min-height: 12rem;
    padding: var(--orbit-space-xl) var(--orbit-space-lg);
    border-top: var(--orbit-border);
    border-left: 0;
  }

  .login-aside p {
    font-size: 1.5rem;
  }
}
</style>
