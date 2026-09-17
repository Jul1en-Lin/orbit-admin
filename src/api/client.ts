import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      sessionSeq: number
      token: string | null
    }
  }
}

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

export type SessionExpiredHandler = () => void

let sessionExpiredHandler: SessionExpiredHandler | null = null
let currentSessionSeq = 1
let isHandlingExpiry = false

export function getCurrentSessionSeq(): number {
  return currentSessionSeq
}

export function advanceSessionSeq(): number {
  return ++currentSessionSeq
}

export function resetSessionSeq(): void {
  currentSessionSeq = 1
  isHandlingExpiry = false
  sessionExpiredHandler = null
}

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  sessionExpiredHandler = handler
}

export function triggerSessionExpired(): void {
  if (isHandlingExpiry) return
  isHandlingExpiry = true
  try {
    sessionExpiredHandler?.()
  } finally {
    isHandlingExpiry = false
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = sessionStorage.getItem('accessToken')
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  config.metadata = {
    sessionSeq: currentSessionSeq,
    token: accessToken,
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
    const isLoginEndpoint = error.config?.url?.includes('/sys_user/login/password')
    const reqSessionSeq = error.config?.metadata?.sessionSeq
    const isCurrentSession = reqSessionSeq !== undefined && reqSessionSeq === currentSessionSeq

    if (status === 401 && !isLoginEndpoint && isCurrentSession) {
      triggerSessionExpired()
    }

    throw new ApiError(status === 401 && !isLoginEndpoint ? '登录状态已失效' : '请求失败', 'http', status, data?.code)
  },
)
