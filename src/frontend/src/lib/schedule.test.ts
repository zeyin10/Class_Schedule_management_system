import type { ScheduleEntry, TimeSlot } from '../api/types'
import { nextLesson, parityOf, weekNumber } from './schedule'

const termStart = new Date(2026, 8, 1) // Tuesday, 1 September 2026

describe('weekNumber / parityOf', () => {
  it('counts Monday-based weeks from the term start', () => {
    expect(weekNumber(new Date(2026, 8, 1), termStart)).toBe(1)
    expect(weekNumber(new Date(2026, 8, 6), termStart)).toBe(1) // Sunday
    expect(weekNumber(new Date(2026, 8, 7), termStart)).toBe(2) // next Monday
    expect(parityOf(new Date(2026, 8, 7), termStart)).toBe('even')
    expect(parityOf(new Date(2026, 8, 14), termStart)).toBe('odd')
  })
})

describe('nextLesson (FR-12)', () => {
  const slots: TimeSlot[] = [
    { id: 1, number: 1, start_time: '08:00', end_time: '08:50' },
    { id: 2, number: 2, start_time: '09:00', end_time: '09:50' },
  ]
  const entry = (id: number, weekday: number, slot: number, pattern: ScheduleEntry['week_pattern'] = 'every') =>
    ({
      id,
      term_id: 1,
      course_id: 1,
      teacher_id: 1,
      room_id: 1,
      group_ids: [1],
      lesson_type: 'lecture',
      weekday,
      time_slot_id: slot,
      week_pattern: pattern,
    }) satisfies ScheduleEntry

  it('returns the next lesson later today', () => {
    // Monday 7 Sep 2026, 08:55 - first lesson is over, second has not started
    const result = nextLesson([entry(1, 1, 1), entry(2, 1, 2)], slots, new Date(2026, 8, 7, 8, 55), termStart)
    expect(result?.entry.id).toBe(2)
  })

  it('skips lessons of the other week parity', () => {
    // Week of 7 Sep is even: the odd-only Tuesday lesson moves to 15 Sep
    const result = nextLesson([entry(1, 2, 1, 'odd')], slots, new Date(2026, 8, 7, 12, 0), termStart)
    expect(result?.date.getDate()).toBe(15)
  })

  it('returns null when there are no lessons', () => {
    expect(nextLesson([], slots, new Date(2026, 8, 7), termStart)).toBeNull()
  })
})
