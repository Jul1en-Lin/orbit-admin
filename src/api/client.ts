import axios, { type AxiosError, type AxiosInstance } from 'axios'

export type ApiErrorKind = 'http' | 'business' | 'network'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: ApiErrorKind,
    public readonly status?: number,
    public readonly code?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiEnvelope<T> {
  code: number
  msg: string
  data: T
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem('accessToken')
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiEnvelope<unknown>
    if (envelope.code !== 200000) {
      throw new ApiError('业务请求失败', 'business', response.status, envelope.code)
    }
    response.data = envelope.data
    return response
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    if (!error.response) {
      throw new ApiError('网络请求失败', 'network')
    }

    const { status, data } = error.response
    throw new ApiError(status === 401 ? '登录状态已失效' : '请求失败', 'http', status, data?.code)
  },
)
