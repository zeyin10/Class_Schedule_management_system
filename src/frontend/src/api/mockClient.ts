// In-browser mock of the backend. It follows the same contract and error format
// as the planned FastAPI service so the UI can be built before the backend exists.
import { checkRoom, findConflicts } from '../lib/conflicts'
import { appliesTo } from '../lib/schedule'
import { DEMO_PASSWORD, demoUsers, referenceData, seedEntries } from './mockData'
import {
  ApiError,
  type ApiClient,
  type FreeRoomsQuery,
  type SaveOptions,
  type ScheduleEntry,
  type ScheduleEntryInput,
  type ScheduleQuery,
} from './types'

export function createMockClient(latencyMs = 250): ApiClient {
  let entries = seedEntries()
  let nextId = entries.length + 1

  const delay = <T>(value: T): Promise<T> =>
    new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), latencyMs))

  function validate(input: ScheduleEntryInput, id: number | undefined, options: SaveOptions = {}) {
    if (input.group_ids.length === 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'At least one group is required')
    }
    const conflicts = findConflicts({ ...input, id }, entries)
    if (conflicts.length > 0) {
      throw new ApiError(409, 'SCHEDULE_CONFLICT', 'The entry conflicts with existing lessons', { conflicts })
    }
    const room = referenceData.rooms.find((r) => r.id === input.room_id)
    if (room && !options.force) {
      const warnings = checkRoom(input, room, referenceData.groups)
      if (warnings.length > 0) {
        throw new ApiError(422, 'ROOM_WARNING', 'Room capacity or type does not match', { warnings })
      }
    }
  }

  return {
    async login(email, password) {
      const user = demoUsers.find((u) => u.email === email.trim().toLowerCase())
      if (!user || password !== DEMO_PASSWORD) {
        await delay(null)
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid e-mail or password')
      }
      return delay({ token: `mock-token-${user.id}`, user })
    },

    getReferenceData() {
      return delay(referenceData)
    },

    getSchedule(query: ScheduleQuery) {
      const result = entries.filter(
        (e) =>
          (query.group_id === undefined || e.group_ids.includes(query.group_id)) &&
          (query.teacher_id === undefined || e.teacher_id === query.teacher_id) &&
          (query.room_id === undefined || e.room_id === query.room_id),
      )
      return delay(result)
    },

    getFreeRooms(query: FreeRoomsQuery) {
      const busy = new Set(
        entries
          .filter(
            (e) =>
              e.weekday === query.weekday && e.time_slot_id === query.time_slot_id && appliesTo(e, query.week),
          )
          .map((e) => e.room_id),
      )
      const result = referenceData.rooms.filter(
        (r) =>
          !busy.has(r.id) &&
          (query.room_type === undefined || r.room_type === query.room_type) &&
          (query.min_capacity === undefined || r.capacity >= query.min_capacity),
      )
      return delay(result)
    },

    async createEntry(input, options) {
      validate(input, undefined, options)
      const entry: ScheduleEntry = { ...input, id: nextId++, updated_at: new Date().toISOString() }
      entries = [...entries, entry]
      return delay(entry)
    },

    async updateEntry(id, input, options) {
      if (!entries.some((e) => e.id === id)) throw new ApiError(404, 'NOT_FOUND', 'Entry not found')
      validate(input, id, options)
      const entry: ScheduleEntry = { ...input, id, updated_at: new Date().toISOString() }
      entries = entries.map((e) => (e.id === id ? entry : e))
      return delay(entry)
    },

    async deleteEntry(id) {
      entries = entries.filter((e) => e.id !== id)
      await delay(null)
    },
  }
}
