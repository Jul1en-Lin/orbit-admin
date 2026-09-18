import { apiClient } from './client'

export interface DictDataVO {
  id: number
  typeKey: string
  dataKey: string
  value: string
  remark?: string | null
  sort?: number
  status: number
}

export interface DictTypeVO {
  id: number
  typeKey: string
  value: string
  remark?: string | null
  status: number
}

export interface BasePageVO<T> {
  totals: number
  totalPages: number
  list: T[]
}

export interface DictTypeListParams {
  pageNo?: number
  pageSize?: number
  typeKey?: string
  value?: string
}

export interface DictDataListParams {
  typeKey: string
  value?: string
  pageNo?: number
  pageSize?: number
}

export interface AccountDictionaries {
  admin: DictDataVO[]
  common_status: DictDataVO[]
}

/**
 * Fetch a single page of dictionary data for a given typeKey.
 * Backend endpoint: GET /dictionary_data/list?typeKey=&value=&pageNo=&pageSize=
 */
export async function fetchDictDataPage(params: DictDataListParams): Promise<BasePageVO<DictDataVO>> {
  const queryParams: Record<string, string | number> = {
    typeKey: params.typeKey,
    pageNo: params.pageNo ?? 1,
    pageSize: params.pageSize ?? 10,
  }

  if (params.value !== undefined && params.value !== null && params.value.trim() !== '') {
    queryParams.value = params.value.trim()
  }

  const response = await apiClient.get<BasePageVO<DictDataVO>>('/dictionary_data/list', {
    params: queryParams,
  })
  return response.data
}

/**
 * Fetch all pages of dictionary data for a given typeKey.
 * Iterates through all pages until pageNo >= totalPages or list is exhausted.
 */
export async function fetchAllDictData(typeKey: string, pageSize = 20): Promise<DictDataVO[]> {
  let pageNo = 1
  const allItems: DictDataVO[] = []

  while (true) {
    const pageData = await fetchDictDataPage({ typeKey, pageNo, pageSize })
    const list = pageData?.list ?? []
    allItems.push(...list)

    const totalPages = pageData?.totalPages ?? 1
    if (pageNo >= totalPages || list.length === 0) {
      break
    }
    pageNo++
  }

  return allItems
}

/**
 * Fetch both management identity ('admin') and common status ('common_status')
 * dictionary items in parallel.
 */
export async function fetchAccountDictionaries(): Promise<AccountDictionaries> {
  const [admin, common_status] = await Promise.all([fetchAllDictData('admin'), fetchAllDictData('common_status')])
  return { admin, common_status }
}

/**
 * Fetch a page of dictionary types.
 * Backend endpoint: GET /dictionary_type/list?pageNo=&pageSize=&typeKey=&value=
 */
export async function fetchDictTypeList(params?: DictTypeListParams): Promise<BasePageVO<DictTypeVO>> {
  const queryParams: Record<string, string | number> = {
    pageNo: params?.pageNo ?? 1,
    pageSize: params?.pageSize ?? 10,
  }

  if (params?.typeKey !== undefined && params?.typeKey !== null && params.typeKey.trim() !== '') {
    queryParams.typeKey = params.typeKey.trim()
  }

  if (params?.value !== undefined && params?.value !== null && params.value.trim() !== '') {
    queryParams.value = params.value.trim()
  }

  const response = await apiClient.get<BasePageVO<DictTypeVO>>('/dictionary_type/list', {
    params: queryParams,
  })
  return response.data
}

export interface CreateDictTypePayload {
  typeKey: string
  value: string
  remark?: string | null
}

export interface UpdateDictTypePayload {
  typeKey: string
  value: string
  remark?: string | null
}

/**
 * Create a new dictionary type.
 * Backend endpoint: POST /dictionary_type/add
 */
export async function createDictType(payload: {
  typeKey: string
  value: string
  remark?: string | null
}): Promise<number> {
  const body: Record<string, unknown> = {
    typeKey: payload.typeKey,
    value: payload.value,
  }
  if (payload.remark !== undefined) {
    body.remark = payload.remark
  }
  const response = await apiClient.post<number>('/dictionary_type/add', body)
  return response.data
}

/**
 * Update an existing dictionary type by typeKey.
 * Backend endpoint: POST /dictionary_type/edit
 */
export async function updateDictType(payload: {
  typeKey: string
  value: string
  remark?: string | null
}): Promise<number> {
  const body: Record<string, unknown> = {
    typeKey: payload.typeKey,
    value: payload.value,
  }
  if (payload.remark !== undefined) {
    body.remark = payload.remark
  }
  const response = await apiClient.post<number>('/dictionary_type/edit', body)
  return response.data
}
