import { apiClient } from './client'

export interface LoginToken {
  accessToken: string
  expires: number
}

export interface ManagementAccount {
  userToken?: string
  userId: number
  userName?: string
  loginTime?: number
  expireTime?: number
  nickName: string
  identity: string
  status: string
  phoneNumber?: string
}

export async function login(phone: string, password: string): Promise<LoginToken> {
  const { data } = await apiClient.post<LoginToken>('/sys_user/login/password', { phone, password })
  return data
}

export async function getCurrentManagementAccount(): Promise<ManagementAccount> {
  const { data } = await apiClient.get<ManagementAccount>('/sys_user/login/get_info')
  return data
}
