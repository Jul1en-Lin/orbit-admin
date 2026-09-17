import { createRouter, createWebHistory, type Router } from 'vue-router'
import WorkbenchView from '../views/WorkbenchView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../auth/store'

type AuthStore = ReturnType<typeof useAuthStore>

export function createOrbitRouter(auth: AuthStore): Router {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', redirect: '/workbench' },
      { path: '/login', name: 'login', component: LoginView },
      {
        path: '/workbench',
        name: 'workbench',
        component: WorkbenchView,
        meta: { requiresAuth: true },
      },
    ],
  })

  router.beforeEach((to) => {
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return {
        name: 'login',
        query: {
          redirect: to.fullPath,
          ...(auth.accessToken ? { restore: 'failed' } : {}),
        },
      }
    }

    if (to.name === 'login' && auth.isAuthenticated) {
      return { name: 'workbench' }
    }
    return true
  })

  return router
}
