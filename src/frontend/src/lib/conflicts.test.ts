import type { Group, Room, ScheduleEntry, ScheduleEntryInput } from '../api/types'
import { checkRoom, findConflicts, parityOverlaps } from './conflicts'

const existing: ScheduleEntry = {
  id: 1,
  term_id: 1,
  course_id: 1,
  teacher_id: 1,
  room_id: 1,
  group_ids: [1],
  lesson_type: 'lecture',
  weekday: 1,
  time_slot_id: 1,
  week_pattern: 'every',
}

const candidate = (patch: Partial<ScheduleEntryInput>): ScheduleEntryInput => ({
  term_id: 1,
  course_id: 2,
  teacher_id: 2,
  room_id: 2,
  group_ids: [2],
  lesson_type: 'practice',
  weekday: 1,
  time_slot_id: 1,
  week_pattern: 'every',
  ...patch,
})

describe('parityOverlaps', () => {
  it('treats odd and even weeks as disjoint', () => {
    expect(parityOverlaps('odd', 'even')).toBe(false)
    expect(parityOverlaps('odd', 'odd')).toBe(true)
    expect(parityOverlaps('every', 'even')).toBe(true)
  })
})

describe('findConflicts (FR-08)', () => {
  it('finds no conflict when teacher, room and groups differ', () => {
    expect(findConflicts(candidate({}), [existing])).toEqual([])
  })

  it.each<[string, Partial<ScheduleEntryInput>]>([
    ['teacher', { teacher_id: 1 }],
    ['room', { room_id: 1 }],
    ['group', { group_ids: [1] }],
  ])('detects a %s conflict in the same slot', (type, patch) => {
    const conflicts = findConflicts(candidate(patch), [existing])
    expect(conflicts.map((c) => c.type)).toEqual([type])
  })

  it('ignores lessons in another slot, day or term', () => {
    const same = { teacher_id: 1, room_id: 1, group_ids: [1] }
    expect(findConflicts(candidate({ ...same, time_slot_id: 2 }), [existing])).toEqual([])
    expect(findConflicts(candidate({ ...same, weekday: 2 }), [existing])).toEqual([])
    expect(findConflicts(candidate({ ...same, term_id: 2 }), [existing])).toEqual([])
  })

  it('allows an odd-week and an even-week lesson in the same slot', () => {
    const odd = { ...existing, week_pattern: 'odd' as const }
    expect(findConflicts(candidate({ teacher_id: 1, week_pattern: 'even' }), [odd])).toEqual([])
    expect(findConflicts(candidate({ teacher_id: 1, week_pattern: 'odd' }), [odd])).toHaveLength(1)
  })

  it('does not report the edited entry as conflicting with itself', () => {
    expect(findConflicts({ ...existing, id: 1 }, [existing])).toEqual([])
  })
})

describe('checkRoom (FR-09)', () => {
  const groups: Group[] = [
    { id: 1, code: 'A', size: 25 },
    { id: 2, code: 'B', size: 24 },
  ]
  const lab: Room = { id: 3, name: 'Lab', building: 'C1', capacity: 30, room_type: 'lab' }

  it('warns when groups do not fit into the room', () => {
    const warnings = checkRoom(candidate({ group_ids: [1, 2], lesson_type: 'lab' }), lab, groups)
    expect(warnings).toEqual([{ type: 'capacity', required: 49, capacity: 30 }])
  })

  it('warns when the room type does not suit the lesson type', () => {
    const warnings = checkRoom(candidate({ group_ids: [1], lesson_type: 'lecture' }), lab, groups)
    expect(warnings).toEqual([{ type: 'room_type', expected: ['lecture'], actual: 'lab' }])
  })

  it('returns no warnings for a suitable room', () => {
    expect(checkRoom(candidate({ group_ids: [1], lesson_type: 'practice' }), lab, groups)).toEqual([])
  })
})
