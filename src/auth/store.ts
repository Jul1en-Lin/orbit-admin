import { defineStore } from 'pinia'
import { getCurrentManagementAccount, login, type ManagementAccount } from '../api/auth'
import { ApiError } from '../api/client'
import { encryptLoginPassword } from './password'

interface AuthState {
  accessToken: string | null
  managementAccount: ManagementAccount | null
  restoring: boolean
  restoreAttempted: boolean
  restoreError: unknown | null
}

let inFlightRestore: Promise<ManagementAccount | null> | null = null

export function resetAuthSession(): void {
  inFlightRestore = null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: sessionStorage.getItem('accessToken'),
    managementAccount: null,
    restoring: false,
    restoreAttempted: false,
    restoreError: null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken && state.managementAccount),
  },
  actions: {
    async signIn(phone: string, plainPassword: string) {
      const token = await login(phone, encryptLoginPassword(plainPassword))
      this.accessToken = token.accessToken
      this.restoreAttempted = true
      this.restoreError = null
      sessionStorage.setItem('accessToken', token.accessToken)
      try {
        this.managementAccount = await getCurrentManagementAccount()
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) this.signOut()
        throw error
      }
    },
    async restoreSession(): Promise<ManagementAccount | null> {
      if (!this.accessToken) return null
      if (this.managementAccount) return this.managementAccount
      if (this.restoring && inFlightRestore) return inFlightRestore

      this.restoring = true
      this.restoreAttempted = true
      this.restoreError = null

      inFlightRestore = (async () => {
        try {
          const account = await getCurrentManagementAccount()
          this.managementAccount = account
          this.restoreError = null
          return account
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            this.signOut()
          }
          this.restoreError = error
          throw error
        } finally {
          this.restoring = false
          inFlightRestore = null
        }
      })()

      return inFlightRestore
    },
    async retryManagementAccount(): Promise<ManagementAccount | null> {
      return this.restoreSession()
    },
    signOut() {
      this.accessToken = null
      this.managementAccount = null
      this.restoring = false
      this.restoreAttempted = false
      this.restoreError = null
      inFlightRestore = null
      sessionStorage.removeItem('accessToken')
    },
  },
})
