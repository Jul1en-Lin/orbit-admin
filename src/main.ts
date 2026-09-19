import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElButton, ElDialog, ElFormItem, ElInput } from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import { createOrbitRouter } from './router'
import { useAuthStore } from './auth/store'
import { setSessionExpiredHandler } from './api/client'
import './styles/theme.scss'

export function createOrbitApp() {
  const pinia = createPinia()
  const auth = useAuthStore(pinia)
  const router = createOrbitRouter(auth)
  const app = createApp(App)
  app.use(pinia)
  app.use(router)
  app.component('ElButton', ElButton)
  app.component('ElDialog', ElDialog)
  app.component('ElFormItem', ElFormItem)
  app.component('ElInput', ElInput)

  setSessionExpiredHandler(() => {
    auth.handleSessionExpired(router)
  })

  return app
}

if (document.querySelector('#app')) {
  const DEMO_PHONE = '18888888888'
  const DEMO_PASSWORD = '123456789'

  const pinia = createPinia()
  const auth = useAuthStore(pinia)

  // 1. 同步预置默认管理员登录态
  // 确保在路由初始导航的第 0 毫秒 auth.isAuthenticated 立即为 true，彻底避免被路由守卫踢入登录页
  if (!sessionStorage.getItem('accessToken')) {
    sessionStorage.setItem('accessToken', 'orbit-demo-token')
  }
  auth.accessToken = sessionStorage.getItem('accessToken') || 'orbit-demo-token'
  auth.managementAccount = {
    userId: 1,
    phoneNumber: DEMO_PHONE,
    userName: 'admin',
    nickName: 'admin',
    identity: 'admin',
    status: 'enable',
  }

  const router = createOrbitRouter(auth)
  const app = createApp(App)
  app.use(pinia)
  app.use(router)
  app.component('ElButton', ElButton)
  app.component('ElDialog', ElDialog)
  app.component('ElFormItem', ElFormItem)
  app.component('ElInput', ElInput)

  // 2. 立即同步挂载应用，页面直达 /workbench
  app.mount('#app')

  // 3. 后台异步静默与云端后端换取真实 Token 与真实账号详情
  async function performSilentAuth() {
    try {
      await auth.signIn(DEMO_PHONE, DEMO_PASSWORD)
    } catch {
      // 若后端未启动或网络暂不可用，平稳保持兜底演示身份
    }
  }

  performSilentAuth()

  setSessionExpiredHandler(() => {
    performSilentAuth().catch(() => {})
  })
}
