// Timetable generator used by the mock API so that the generation screens can be
// demonstrated before the backend exists. It is a penalty-aware greedy algorithm
// (the greedy baseline B-3 of docs/09); the real generator is the CP-SAT worker
// in the backend (docs/07, AD-6, AD-9). Both must satisfy the same hard constraints.
import type {
  ConstraintRule,
  GenerationWeights,
  InfeasibilityReason,
  LoadItem,
  QualityReport,
  ReferenceData,
  Room,
  ScheduleEntry,
  ScheduleEntryInput,
} from '../api/types'
import { findConflicts, suitableRoomTypes } from './conflicts'
import { CURRENT_TERM_ID } from './schedule'

/** Days used by the generator (Monday–Friday). */
export const GENERATION_DAYS = [1, 2, 3, 4, 5]
/** Soft limit of lessons per group and day (FR-26). */
export const DAILY_LIMIT = 4

export const DEFAULT_WEIGHTS: GenerationWeights = { gaps: 3, preferences: 2, daily_load: 2, last_slot: 1 }

export interface GenerationInput {
  load: LoadItem[]
  reference: ReferenceData
  constraints: ConstraintRule[]
  weights: GenerationWeights
  /** Only these groups (empty = whole university). */
  groupIds?: number[]
}

export interface GenerationResult {
  entries: ScheduleEntry[]
  report: QualityReport
  reasons: InfeasibilityReason[]
}

const key = (id: number, day: number, slot: number) => `${id}:${day}:${slot}`

function ruleDays(weekday: number | null): number[] {
  return weekday === null ? GENERATION_DAYS : [weekday]
}

/** Resolved constraints in a form that is quick to check. */
export interface Rules {
  unavailable: Set<string>
  avoid: Set<string>
  prefer: Map<number, Set<string>>
  groupMax: Map<number, number>
}

export function compileRules(constraints: ConstraintRule[]): Rules {
  const rules: Rules = { unavailable: new Set(), avoid: new Set(), prefer: new Map(), groupMax: new Map() }
  for (const c of constraints) {
    if (c.type === 'group_max_per_day') {
      const current = rules.groupMax.get(c.group_id)
      if (c.hard) rules.groupMax.set(c.group_id, Math.min(current ?? Infinity, c.max))
      continue
    }
    for (const day of ruleDays(c.weekday)) {
      for (const slot of c.slot_ids) {
        const k = key(c.teacher_id, day, slot)
        if (c.type === 'teacher_unavailable') rules.unavailable.add(k)
        else if (c.kind === 'avoid') rules.avoid.add(k)
        else {
          if (!rules.prefer.has(c.teacher_id)) rules.prefer.set(c.teacher_id, new Set())
          rules.prefer.get(c.teacher_id)!.add(k)
        }
      }
    }
  }
  return rules
}

function studentsOf(groupIds: number[], reference: ReferenceData): number {
  return reference.groups.filter((g) => groupIds.includes(g.id)).reduce((sum, g) => sum + g.size, 0)
}

function roomsFor(item: LoadItem, reference: ReferenceData): Room[] {
  const types = suitableRoomTypes(item.lesson_type)
  const students = studentsOf(item.group_ids, reference)
  return reference.rooms
    .filter((r) => types.includes(r.room_type) && r.capacity >= students)
    .sort((a, b) => a.capacity - b.capacity)
}

/** FR-30: problems that make any timetable impossible, found before solving. */
export function precheck(input: GenerationInput, rules: Rules): InfeasibilityReason[] {
  const reasons: InfeasibilityReason[] = []
  const slotIds = input.reference.timeSlots.map((s) => s.id)
  const totalSlots = GENERATION_DAYS.length * slotIds.length

  const teacherLoad = new Map<number, number>()
  const groupLoad = new Map<number, number>()
  for (const item of input.load) {
    teacherLoad.set(item.teacher_id, (teacherLoad.get(item.teacher_id) ?? 0) + item.lessons_per_week)
    for (const g of item.group_ids) groupLoad.set(g, (groupLoad.get(g) ?? 0) + item.lessons_per_week)
    if (roomsFor(item, input.reference).length === 0) {
      reasons.push({
        type: 'no_room',
        load_id: item.id,
        students: studentsOf(item.group_ids, input.reference),
        room_types: suitableRoomTypes(item.lesson_type),
      })
    }
  }
  for (const [teacherId, required] of teacherLoad) {
    let available = 0
    for (const day of GENERATION_DAYS) {
      for (const slot of slotIds) if (!rules.unavailable.has(key(teacherId, day, slot))) available++
    }
    if (required > available) reasons.push({ type: 'teacher_overload', teacher_id: teacherId, required, available })
  }
  for (const [groupId, required] of groupLoad) {
    const max = rules.groupMax.get(groupId)
    const available = max === undefined ? totalSlots : Math.min(totalSlots, max * GENERATION_DAYS.length)
    if (required > available) reasons.push({ type: 'group_overload', group_id: groupId, required, available })
  }
  return reasons
}

interface Ctx {
  reference: ReferenceData
  rules: Rules
  weights: GenerationWeights
  slotNumber: Map<number, number>
  lastSlotId: number
}

function groupDay(entries: ScheduleEntry[], groupId: number, day: number): ScheduleEntry[] {
  return entries.filter((e) => e.weekday === day && e.group_ids.includes(groupId))
}

function gapsOf(dayEntries: ScheduleEntry[], ctx: Ctx): number {
  const numbers = [...new Set(dayEntries.map((e) => ctx.slotNumber.get(e.time_slot_id) ?? 0))]
  if (numbers.length < 2) return 0
  return Math.max(...numbers) - Math.min(...numbers) + 1 - numbers.length
}

function preferenceViolation(e: ScheduleEntry, rules: Rules): boolean {
  const k = key(e.teacher_id, e.weekday, e.time_slot_id)
  if (rules.avoid.has(k)) return true
  const preferred = rules.prefer.get(e.teacher_id)
  return preferred !== undefined && !preferred.has(k)
}

/** Soft-constraint measures of a timetable (docs/09, M-11). */
export function evaluate(entries: ScheduleEntry[], ctx: Ctx, required: number): QualityReport {
  const groupIds = [...new Set(entries.flatMap((e) => e.group_ids))]
  let gaps = 0
  let overloadedDays = 0
  for (const g of groupIds) {
    for (const day of GENERATION_DAYS) {
      const dayEntries = groupDay(entries, g, day)
      gaps += gapsOf(dayEntries, ctx)
      if (dayEntries.length > DAILY_LIMIT) overloadedDays++
    }
  }
  const preferenceViolations = entries.filter((e) => preferenceViolation(e, ctx.rules)).length
  const lastSlotLessons = entries.filter((e) => e.time_slot_id === ctx.lastSlotId).length
  const w = ctx.weights
  return {
    placed: entries.length,
    required,
    hard_violations: countHardViolations(entries, ctx),
    gaps,
    preference_violations: preferenceViolations,
    overloaded_days: overloadedDays,
    last_slot_lessons: lastSlotLessons,
    penalty:
      w.gaps * gaps + w.preferences * preferenceViolations + w.daily_load * overloadedDays + w.last_slot * lastSlotLessons,
  }
}

/** Independent validator: the same hard rules the backend checks (docs/07, Independent Validator). */
export function countHardViolations(entries: ScheduleEntry[], ctx: Ctx): number {
  let violations = 0
  entries.forEach((e, i) => {
    // count each overlapping pair once
    violations += findConflicts(e, entries.slice(i + 1)).length
    if (ctx.rules.unavailable.has(key(e.teacher_id, e.weekday, e.time_slot_id))) violations++
    const room = ctx.reference.rooms.find((r) => r.id === e.room_id)
    if (
      !room ||
      !suitableRoomTypes(e.lesson_type).includes(room.room_type) ||
      room.capacity < studentsOf(e.group_ids, ctx.reference)
    ) {
      violations++
    }
  })
  for (const [groupId, max] of ctx.rules.groupMax) {
    for (const day of GENERATION_DAYS) if (groupDay(entries, groupId, day).length > max) violations++
  }
  return violations
}

/** Penalty of the part of the timetable that a new lesson can change. */
function localPenalty(entries: ScheduleEntry[], item: LoadItem, day: number, ctx: Ctx): number {
  const w = ctx.weights
  let penalty = 0
  for (const g of item.group_ids) {
    const dayEntries = groupDay(entries, g, day)
    penalty += w.gaps * gapsOf(dayEntries, ctx)
    if (dayEntries.length > DAILY_LIMIT) penalty += w.daily_load
    // spread lessons of the same course over the week
    penalty += 0.5 * Math.max(0, dayEntries.filter((e) => e.course_id === item.course_id).length - 1)
  }
  return penalty
}

export function generateTimetable(input: GenerationInput): GenerationResult {
  const rules = compileRules(input.constraints)
  const slots = [...input.reference.timeSlots].sort((a, b) => a.number - b.number)
  const ctx: Ctx = {
    reference: input.reference,
    rules,
    weights: input.weights,
    slotNumber: new Map(slots.map((s) => [s.id, s.number])),
    lastSlotId: slots[slots.length - 1]?.id ?? 0,
  }
  const scope = input.groupIds ?? []
  const load = input.load.filter((l) => scope.length === 0 || l.group_ids.some((g) => scope.includes(g)))
  const required = load.reduce((sum, l) => sum + l.lessons_per_week, 0)

  const reasons = precheck({ ...input, load }, rules)
  if (reasons.length > 0) return { entries: [], report: evaluate([], ctx, required), reasons }

  // Most constrained lessons first: fewest suitable rooms, then most students.
  const lessons = load
    .flatMap((item) => Array.from({ length: item.lessons_per_week }, () => item))
    .map((item) => ({ item, rooms: roomsFor(item, input.reference) }))
    .sort(
      (a, b) =>
        a.rooms.length - b.rooms.length ||
        studentsOf(b.item.group_ids, input.reference) - studentsOf(a.item.group_ids, input.reference) ||
        a.item.id - b.item.id,
    )

  const entries: ScheduleEntry[] = []
  for (const { item, rooms } of lessons) {
    let best: { entry: ScheduleEntry; cost: number } | null = null
    for (const day of GENERATION_DAYS) {
      const before = localPenalty(entries, item, day, ctx)
      for (const slot of slots) {
        if (rules.unavailable.has(key(item.teacher_id, day, slot.id))) continue
        if (item.group_ids.some((g) => groupDay(entries, g, day).length >= (rules.groupMax.get(g) ?? Infinity))) continue
        for (const room of rooms) {
          const candidate: ScheduleEntryInput = {
            term_id: CURRENT_TERM_ID,
            course_id: item.course_id,
            lesson_type: item.lesson_type,
            teacher_id: item.teacher_id,
            room_id: room.id,
            group_ids: item.group_ids,
            weekday: day,
            time_slot_id: slot.id,
            week_pattern: item.week_pattern,
          }
          if (findConflicts(candidate, entries).length > 0) continue
          const entry: ScheduleEntry = { ...candidate, id: entries.length + 1 }
          const w = ctx.weights
          const cost =
            localPenalty([...entries, entry], item, day, ctx) -
            before +
            (preferenceViolation(entry, rules) ? w.preferences : 0) +
            (slot.id === ctx.lastSlotId ? w.last_slot : 0) +
            slot.number * 0.01 // earlier slots on ties
          if (!best || cost < best.cost) best = { entry, cost }
          break // rooms are sorted by size: the first free one is the best fit
        }
      }
    }
    if (!best) return { entries: [], report: evaluate(entries, ctx, required), reasons: [{ type: 'unplaced', load_id: item.id }] }
    entries.push(best.entry)
  }
  return { entries, report: evaluate(entries, ctx, required), reasons: [] }
}
