import { DOMWrapper } from '@vue/test-utils'
import AxiosMockAdapter from 'axios-mock-adapter'
import type { App } from 'vue'
import type { Router } from 'vue-router'
import { apiClient } from '../src/api/client'
import { createOrbitApp } from '../src/main'

export const httpMock = new AxiosMockAdapter(apiClient)

export interface MountApplicationOptions {
  initialPath?: string
}

export interface TestAppInstance {
  app: App
  wrapper: DOMWrapper<Element>
  router: Router
}

export function mountApplication(initialPathOrOptions: string | MountApplicationOptions = '/login'): TestAppInstance {
  const initialPath =
    typeof initialPathOrOptions === 'string' ? initialPathOrOptions : (initialPathOrOptions.initialPath ?? '/login')

  window.history.replaceState({}, '', initialPath)
  const app = createOrbitApp()
  const root = document.createElement('div')
  document.body.appendChild(root)
  app.mount(root)
  const wrapper = new DOMWrapper(root)
  const router = app.config.globalProperties.$router as Router
  return { app, wrapper, router }
}

export function resetTestHarness(): void {
  httpMock.reset()
  sessionStorage.clear()
  document.body.innerHTML = ''
}
