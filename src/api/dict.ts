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

export interface BasePageVO<T> {
  totals: number
  totalPages: number
  list: T[]
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
