import type { Parity, ScheduleEntry, TimeSlot } from '../api/types'

/** First day of the autumn term; week 1 is the (Monday-based) week containing it. */
export const TERM_START = new Date(2026, 8, 1)
export const CURRENT_TERM_ID = 1
export const WEEKDAYS = [1, 2, 3, 4, 5, 6]

const DAY_MS = 24 * 60 * 60 * 1000

/** 1 = Monday … 7 = Sunday */
export function isoWeekday(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function weekNumber(date: Date, termStart: Date = TERM_START): number {
  const start = startOfDay(termStart)
  const firstMonday = new Date(start.getTime() - (isoWeekday(start) - 1) * DAY_MS)
  const days = Math.round((startOfDay(date).getTime() - firstMonday.getTime()) / DAY_MS)
  return days < 0 ? 1 : Math.floor(days / 7) + 1
}

export function parityOf(date: Date, termStart: Date = TERM_START): Parity {
  return weekNumber(date, termStart) % 2 === 1 ? 'odd' : 'even'
}

export function appliesTo(entry: ScheduleEntry, parity: Parity): boolean {
  return entry.week_pattern === 'every' || entry.week_pattern === parity
}

export function sortEntries(entries: ScheduleEntry[], slots: TimeSlot[]): ScheduleEntry[] {
  const slotNumber = new Map(slots.map((s) => [s.id, s.number]))
  return [...entries].sort(
    (a, b) =>
      a.weekday - b.weekday || (slotNumber.get(a.time_slot_id) ?? 0) - (slotNumber.get(b.time_slot_id) ?? 0),
  )
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export interface NextLesson {
  entry: ScheduleEntry
  slot: TimeSlot
  date: Date
}

/** FR-12: the next lesson that has not finished yet, looking up to two weeks ahead. */
export function nextLesson(
  entries: ScheduleEntry[],
  slots: TimeSlot[],
  now: Date,
  termStart: Date = TERM_START,
): NextLesson | null {
  const slotById = new Map(slots.map((s) => [s.id, s]))
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  for (let offset = 0; offset < 14; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    const weekday = isoWeekday(date)
    if (weekday === 7) continue
    const parity = parityOf(date, termStart)
    const candidates = entries
      .filter((e) => e.weekday === weekday && appliesTo(e, parity))
      .map((e) => ({ entry: e, slot: slotById.get(e.time_slot_id) }))
      .filter((c): c is { entry: ScheduleEntry; slot: TimeSlot } => c.slot !== undefined)
      .filter((c) => offset > 0 || toMinutes(c.slot.end_time) > nowMinutes)
      .sort((a, b) => a.slot.number - b.slot.number)
    if (candidates.length > 0) return { ...candidates[0], date }
  }
  return null
}

export function slotLabel(slot: TimeSlot): string {
  return `${slot.start_time}–${slot.end_time}`
}
