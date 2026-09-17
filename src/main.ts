import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElButton, ElFormItem, ElInput } from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import { createOrbitRouter } from './router'
import { useAuthStore } from './auth/store'
import './styles/theme.scss'

export function createOrbitApp() {
  const pinia = createPinia()
  const auth = useAuthStore(pinia)
  const router = createOrbitRouter(auth)
  const app = createApp(App)
  app.use(pinia)
  app.use(router)
  app.component('ElButton', ElButton)
  app.component('ElFormItem', ElFormItem)
  app.component('ElInput', ElInput)
  return app
}

if (document.querySelector('#app')) {
  createOrbitApp().mount('#app')
}
