import { defineStore } from 'pinia'
import { getCurrentManagementAccount, login, type ManagementAccount } from '../api/auth'
import { ApiError } from '../api/client'
import { encryptLoginPassword } from './password'

interface AuthState {
  accessToken: string | null
  managementAccount: ManagementAccount | null
  restoring: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: sessionStorage.getItem('accessToken'),
    managementAccount: null,
    restoring: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken && state.managementAccount),
  },
  actions: {
    async signIn(phone: string, plainPassword: string) {
      const token = await login(phone, encryptLoginPassword(plainPassword))
      this.accessToken = token.accessToken
      sessionStorage.setItem('accessToken', token.accessToken)
      try {
        this.managementAccount = await getCurrentManagementAccount()
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) this.signOut()
        throw error
      }
    },
    async retryManagementAccount() {
      if (!this.accessToken) return
      this.restoring = true
      try {
        this.managementAccount = await getCurrentManagementAccount()
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) this.signOut()
        throw error
      } finally {
        this.restoring = false
      }
    },
    signOut() {
      this.accessToken = null
      this.managementAccount = null
      this.restoring = false
      sessionStorage.removeItem('accessToken')
    },
  },
})
