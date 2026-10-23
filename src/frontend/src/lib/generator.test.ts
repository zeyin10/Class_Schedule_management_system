import { referenceData, seedLoad } from '../api/mockData'
import type { ConstraintRule } from '../api/types'
import { findConflicts } from './conflicts'
import { DEFAULT_WEIGHTS, generateTimetable } from './generator'

const load = seedLoad()
const required = load.reduce((sum, l) => sum + l.lessons_per_week, 0)
const generate = (constraints: ConstraintRule[] = [], weights = DEFAULT_WEIGHTS) =>
  generateTimetable({ load, reference: referenceData, constraints, weights })

const ALL_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8]

// Frontend-level versions of T-GEN-01, T-GEN-02 and T-GEN-05 (docs/09).
describe('timetable generator (mock)', () => {
  it('places every lesson of the load with no hard-constraint violations', () => {
    const { entries, report, reasons } = generate()
    expect(reasons).toEqual([])
    expect(entries).toHaveLength(required)
    expect(report).toMatchObject({ placed: required, required, hard_violations: 0 })
    entries.forEach((e, i) => expect(findConflicts(e, entries.slice(i + 1))).toEqual([]))
  })

  it('uses only rooms of a suitable type and size', () => {
    const { entries } = generate()
    for (const e of entries) {
      const room = referenceData.rooms.find((r) => r.id === e.room_id)!
      const students = referenceData.groups.filter((g) => e.group_ids.includes(g.id)).reduce((s, g) => s + g.size, 0)
      expect(room.capacity).toBeGreaterThanOrEqual(students)
      if (e.lesson_type === 'lecture') expect(room.room_type).toBe('lecture')
      if (e.lesson_type === 'lab') expect(room.room_type).toBe('lab')
    }
  })

  it('never uses a slot where the teacher is unavailable', () => {
    const rule: ConstraintRule = { id: 1, type: 'teacher_unavailable', teacher_id: 2, weekday: 1, slot_ids: ALL_SLOTS, hard: true }
    const { entries, report } = generate([rule])
    expect(report.hard_violations).toBe(0)
    expect(entries.filter((e) => e.teacher_id === 2 && e.weekday === 1)).toEqual([])
  })

  it('respects a hard daily limit for a group', () => {
    const rule: ConstraintRule = { id: 1, type: 'group_max_per_day', group_id: 1, max: 2, hard: true }
    const { entries } = generate([rule])
    for (const day of [1, 2, 3, 4, 5]) {
      expect(entries.filter((e) => e.weekday === day && e.group_ids.includes(1)).length).toBeLessThanOrEqual(2)
    }
  })

  it('reports an overloaded teacher instead of returning a broken timetable', () => {
    const rules: ConstraintRule[] = [1, 2, 3, 4, 5].map((day) => ({
      id: day,
      type: 'teacher_unavailable',
      teacher_id: 1,
      weekday: day,
      slot_ids: day === 5 ? [1, 2, 3, 4, 5, 6] : ALL_SLOTS,
      hard: true,
    }))
    const { entries, reasons } = generate(rules)
    expect(entries).toEqual([])
    // Bekova teaches 1 + 1 + 1 + 2 + 2 = 7 lessons and is free in 2 slots
    expect(reasons).toContainEqual({ type: 'teacher_overload', teacher_id: 1, required: 7, available: 2 })
  })

  it('counts preference violations as soft penalties', () => {
    const rule: ConstraintRule = { id: 1, type: 'teacher_preference', kind: 'avoid', teacher_id: 4, weekday: null, slot_ids: ALL_SLOTS, hard: false }
    const { report } = generate([rule])
    // Kassymov cannot avoid every slot: the timetable is still built, with penalties
    expect(report.hard_violations).toBe(0)
    expect(report.preference_violations).toBe(4)
    expect(report.penalty).toBeGreaterThanOrEqual(4 * DEFAULT_WEIGHTS.preferences)
  })
})
