import { createMockClient } from './mockClient'
import { ApiError, type ScheduleEntryInput } from './types'

// Seed entry 1: Monday, slot 1, teacher 1, room 1, groups 1 and 2, every week.
const free: ScheduleEntryInput = {
  term_id: 1,
  course_id: 6,
  lesson_type: 'practice',
  teacher_id: 3,
  room_id: 4,
  group_ids: [4],
  weekday: 6,
  time_slot_id: 5,
  week_pattern: 'every',
}

describe('mock API', () => {
  it('rejects a conflicting entry with 409 and describes the conflict', async () => {
    const api = createMockClient(0)
    const error = await api.createEntry({ ...free, weekday: 1, time_slot_id: 1, room_id: 1 }).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(error.code).toBe('SCHEDULE_CONFLICT')
    expect(error.details.conflicts[0]).toMatchObject({ type: 'room', entry: { id: 1 } })
  })

  it('returns a 422 room warning that can be overridden with force', async () => {
    const api = createMockClient(0)
    const smallRoom = { ...free, room_id: 6, group_ids: [3] } // 28 students, 20 seats
    await expect(api.createEntry(smallRoom)).rejects.toMatchObject({ status: 422, code: 'ROOM_WARNING' })
    await expect(api.createEntry(smallRoom, { force: true })).resolves.toMatchObject({ room_id: 6 })
  })

  it('saves a valid entry and shows it in the group schedule', async () => {
    const api = createMockClient(0)
    const created = await api.createEntry(free)
    const schedule = await api.getSchedule({ group_id: 4 })
    expect(schedule.map((e) => e.id)).toContain(created.id)
  })

  it('excludes booked rooms from free rooms (FR-13)', async () => {
    const api = createMockClient(0)
    const rooms = await api.getFreeRooms({ weekday: 1, time_slot_id: 1, week: 'odd' })
    expect(rooms.map((r) => r.id)).not.toContain(1)
    expect(rooms.length).toBeGreaterThan(0)
  })

  it('rejects wrong credentials with 401', async () => {
    const api = createMockClient(0)
    await expect(api.login('admin@demo.kz', 'wrong')).rejects.toMatchObject({ status: 401 })
  })
})
