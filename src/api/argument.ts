import { apiClient } from './client'
import type { BasePageVO } from './dict'

export interface ArgumentVO {
  id: number
  name: string
  configKey: string
  value: string
  remark?: string | null
}

export interface ArgumentListParams {
  pageNo?: number
  pageSize?: number
  configKey?: string
  name?: string
}

/**
 * Fetch a page of arguments.
 * Backend endpoint: GET /argument/list?pageNo=&pageSize=&configKey=&name=
 */
export async function fetchArgumentList(params?: ArgumentListParams): Promise<BasePageVO<ArgumentVO>> {
  const queryParams: Record<string, string | number> = {
    pageNo: params?.pageNo ?? 1,
    pageSize: params?.pageSize ?? 10,
  }

  if (params?.configKey !== undefined && params?.configKey !== null && params.configKey.trim() !== '') {
    queryParams.configKey = params.configKey.trim()
  }

  if (params?.name !== undefined && params?.name !== null && params.name.trim() !== '') {
    queryParams.name = params.name.trim()
  }

  const response = await apiClient.get<BasePageVO<ArgumentVO>>('/argument/list', {
    params: queryParams,
  })
  return response.data
}

export interface CreateArgumentPayload {
  configKey: string
  name: string
  value: string
  remark?: string | null
}

export interface UpdateArgumentPayload {
  configKey: string
  name: string
  value: string
  remark?: string | null
}

/**
 * Create a new argument.
 * Backend endpoint: POST /argument/add
 */
export async function createArgument(payload: CreateArgumentPayload): Promise<number> {
  const body: Record<string, unknown> = {
    configKey: payload.configKey,
    name: payload.name,
    value: payload.value,
  }
  if (payload.remark !== undefined) {
    body.remark = payload.remark
  }
  const response = await apiClient.post<number>('/argument/add', body)
  return response.data
}

/**
 * Update an existing argument by configKey.
 * Backend endpoint: POST /argument/edit
 */
export async function updateArgument(payload: UpdateArgumentPayload): Promise<number> {
  const body: Record<string, unknown> = {
    configKey: payload.configKey,
    name: payload.name,
    value: payload.value,
  }
  if (payload.remark !== undefined) {
    body.remark = payload.remark
  }
  const response = await apiClient.post<number>('/argument/edit', body)
  return response.data
}
