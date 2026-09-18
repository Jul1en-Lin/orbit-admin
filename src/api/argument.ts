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
