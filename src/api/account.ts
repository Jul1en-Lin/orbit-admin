import { apiClient } from './client'

export interface SysUserVO {
  userId: number
  identity: string
  phoneNumber: string
  nickName: string
  status: string
  remark?: string | null
}

export interface SysUserListParams {
  userId?: number | string | null
  phoneNumber?: string | null
  status?: string | null
}

export async function fetchAccountList(params?: SysUserListParams): Promise<SysUserVO[]> {
  const payload: Record<string, unknown> = {}

  if (params?.userId !== undefined && params?.userId !== null && String(params.userId).trim() !== '') {
    const num = Number(params.userId)
    payload.userId = Number.isNaN(num) ? params.userId : num
  }

  if (params?.phoneNumber !== undefined && params?.phoneNumber !== null && params.phoneNumber.trim() !== '') {
    payload.phoneNumber = params.phoneNumber.trim()
  }

  if (params?.status !== undefined && params?.status !== null && params.status.trim() !== '') {
    payload.status = params.status.trim()
  }

  const response = await apiClient.post<SysUserVO[]>('/sys_user/list', payload)
  return response.data
}
