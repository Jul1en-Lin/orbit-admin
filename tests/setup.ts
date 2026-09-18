import { afterEach } from 'vitest'
import { resetTestHarness } from './harness'

if (typeof window !== 'undefined') {
  window.confirm = () => true
}

afterEach(() => {
  resetTestHarness()
})
