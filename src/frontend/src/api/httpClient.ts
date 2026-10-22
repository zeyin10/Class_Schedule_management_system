// Client for the real FastAPI backend (endpoints from docs/07-architecture.md, section 6).
// To be regenerated from the OpenAPI spec once the backend publishes it (AD-1).
import {
  ApiError,
  type ApiClient,
  type ApiErrorBody,
  type Course,
  type Group,
  type Room,
  type ScheduleEntry,
  type Teacher,
  type TimeSlot,
  type User,
} from './types'

type Params = Record<string, string | number | boolean | undefined>

function toQuery(params: Params): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export function createHttpClient(baseUrl: string, getToken: () => string | null): ApiClient {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken()
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiErrorBody | null
      throw new ApiError(
        response.status,
        body?.error?.code ?? 'HTTP_ERROR',
        body?.error?.message ?? response.statusText,
        body?.error?.details,
      )
    }
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  return {
    async login(email, password) {
      const data = await request<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      return { token: data.access_token, user: data.user }
    },

    async getReferenceData() {
      const [groups, teachers, rooms, courses, timeSlots] = await Promise.all([
        request<Group[]>('/groups'),
        request<Teacher[]>('/teachers'),
        request<Room[]>('/rooms'),
        request<Course[]>('/courses'),
        request<TimeSlot[]>('/time-slots'),
      ])
      return { groups, teachers, rooms, courses, timeSlots }
    },

    getSchedule(query) {
      return request<ScheduleEntry[]>(`/schedule${toQuery({ ...query })}`)
    },

    getFreeRooms(query) {
      return request<Room[]>(
        `/rooms/free${toQuery({
          weekday: query.weekday,
          slot: query.time_slot_id,
          week: query.week,
          type: query.room_type,
          min_capacity: query.min_capacity,
        })}`,
      )
    },

    createEntry(input, options) {
      return request<ScheduleEntry>(`/schedule-entries${toQuery({ force_capacity: options?.force || undefined })}`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },

    updateEntry(id, input, options) {
      return request<ScheduleEntry>(
        `/schedule-entries/${id}${toQuery({ force_capacity: options?.force || undefined })}`,
        { method: 'PUT', body: JSON.stringify(input) },
      )
    },

    deleteEntry(id) {
      return request<void>(`/schedule-entries/${id}`, { method: 'DELETE' })
    },
  }
}
