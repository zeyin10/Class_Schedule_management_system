import { loadSession } from '../auth/session'
import { createHttpClient } from './httpClient'
import { createMockClient } from './mockClient'
import type { ApiClient } from './types'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export const api: ApiClient = useMock
  ? createMockClient(import.meta.env.MODE === 'test' ? 0 : 250)
  : createHttpClient(
      import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
      () => loadSession()?.token ?? null,
    )
