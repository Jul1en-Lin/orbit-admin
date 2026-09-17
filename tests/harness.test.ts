import { describe, expect, it } from 'vitest'
import { httpMock, mountApplication } from './harness'

describe('page test harness', () => {
  it('supports mounting with an options object', async () => {
    const { router } = mountApplication({ initialPath: '/workbench' })
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/workbench')
  })

  it('resets httpMock and storage between tests via setup', () => {
    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(httpMock.history.get).toHaveLength(0)
    expect(httpMock.history.post).toHaveLength(0)
  })
})
