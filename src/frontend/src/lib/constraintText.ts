import type { TFunction } from 'i18next'
import type { ConstraintBody } from '../api/types'
import type { Lookup } from './lookup'

/** "Friday, 12:00–15:50" — the days and times a teacher rule applies to. */
function when(c: { weekday: number | null; slot_ids: number[] }, lookup: Lookup, t: TFunction): string {
  const day = c.weekday === null ? t('constraint.everyDay') : t(`days.${c.weekday}`)
  const slots = c.slot_ids
    .map((id) => lookup.slot(id))
    .filter((s) => s !== undefined)
    .sort((a, b) => a.number - b.number)
  if (slots.length === 0 || slots.length === lookup.slots.length) return `${day}, ${t('constraint.allDay')}`
  return `${day}, ${slots[0].start_time}–${slots[slots.length - 1].end_time}`
}

/** Readable form of a constraint, shown before the admin confirms it (AD-8). */
export function describeConstraint(c: ConstraintBody, lookup: Lookup, t: TFunction): string {
  switch (c.type) {
    case 'teacher_unavailable':
      return t('constraint.unavailable', { teacher: lookup.teacher(c.teacher_id)?.full_name, when: when(c, lookup, t) })
    case 'teacher_preference':
      return t(c.kind === 'prefer' ? 'constraint.prefer' : 'constraint.avoid', {
        teacher: lookup.teacher(c.teacher_id)?.full_name,
        when: when(c, lookup, t),
      })
    case 'group_max_per_day':
      return t('constraint.groupMax', { group: lookup.group(c.group_id)?.code, max: c.max })
  }
}
