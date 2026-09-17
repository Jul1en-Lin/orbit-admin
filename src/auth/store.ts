import { defineStore } from 'pinia'
import type { Router } from 'vue-router'
import { getCurrentManagementAccount, login, type ManagementAccount } from '../api/auth'
import { advanceSessionSeq, ApiError, getCurrentSessionSeq, resetSessionSeq } from '../api/client'
import { encryptLoginPassword } from './password'

interface AuthState {
  accessToken: string | null
  managementAccount: ManagementAccount | null
  restoring: boolean
  restoreAttempted: boolean
  restoreError: unknown | null
  sessionExpired: boolean
}

let inFlightRestore: Promise<ManagementAccount | null> | null = null

export function resetAuthSession(): void {
  inFlightRestore = null
  resetSessionSeq()
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: sessionStorage.getItem('accessToken'),
    managementAccount: null,
    restoring: false,
    restoreAttempted: false,
    restoreError: null,
    sessionExpired: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken && state.managementAccount),
  },
  actions: {
    async signIn(phone: string, plainPassword: string) {
      const actionSeq = advanceSessionSeq()
      this.sessionExpired = false
      const token = await login(phone, encryptLoginPassword(plainPassword))
      if (getCurrentSessionSeq() !== actionSeq) return
      this.accessToken = token.accessToken
      this.restoreAttempted = true
      this.restoreError = null
      sessionStorage.setItem('accessToken', token.accessToken)
      try {
        const account = await getCurrentManagementAccount()
        if (getCurrentSessionSeq() !== actionSeq) return
        this.managementAccount = account
      } catch (error) {
        if (getCurrentSessionSeq() !== actionSeq) return
        if (error instanceof ApiError && error.status === 401) this.signOut()
        throw error
      }
    },
    async restoreSession(): Promise<ManagementAccount | null> {
      if (!this.accessToken) return null
      if (this.managementAccount) return this.managementAccount
      if (this.restoring && inFlightRestore) return inFlightRestore

      const actionSeq = getCurrentSessionSeq()

      this.restoring = true
      this.restoreAttempted = true
      this.restoreError = null

      inFlightRestore = (async () => {
        try {
          const account = await getCurrentManagementAccount()
          if (getCurrentSessionSeq() !== actionSeq) return null
          this.managementAccount = account
          this.restoreError = null
          return account
        } catch (error) {
          if (getCurrentSessionSeq() !== actionSeq) return null
          if (error instanceof ApiError && error.status === 401) {
            this.handleSessionExpired()
          } else {
            this.restoreError = error
          }
          throw error
        } finally {
          if (getCurrentSessionSeq() === actionSeq) {
            this.restoring = false
            inFlightRestore = null
          }
        }
      })()

      return inFlightRestore
    },
    async retryManagementAccount(): Promise<ManagementAccount | null> {
      return this.restoreSession()
    },
    handleSessionExpired(router?: Router) {
      this.signOut()
      this.sessionExpired = true
      if (router) {
        const currentRoute = router.currentRoute.value
        if (currentRoute.name !== 'login') {
          const redirect = currentRoute.fullPath
          const isSafe = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
          router
            .push({
              name: 'login',
              query: isSafe ? { redirect } : undefined,
            })
            .catch(() => {})
        }
      }
    },
    signOut() {
      this.accessToken = null
      this.managementAccount = null
      this.restoring = false
      this.restoreAttempted = false
      this.restoreError = null
      this.sessionExpired = false
      inFlightRestore = null
      advanceSessionSeq()
      sessionStorage.removeItem('accessToken')
    },
  },
})
