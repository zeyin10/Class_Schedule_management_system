import { useTranslation } from 'react-i18next'
import type { ScheduleEntry } from '../api/types'
import type { Lookup } from '../lib/lookup'
import { slotLabel, sortEntries, WEEKDAYS } from '../lib/schedule'

export type ViewMode = 'group' | 'teacher' | 'room'

interface LessonCardProps {
  entry: ScheduleEntry
  lookup: Lookup
  mode: ViewMode
}

export function LessonCard({ entry, lookup, mode }: LessonCardProps) {
  const { t } = useTranslation()
  const teacher = lookup.teacher(entry.teacher_id)?.full_name
  const room = lookup.room(entry.room_id)?.name
  const groups = entry.group_ids
    .map((id) => lookup.group(id)?.code)
    .filter(Boolean)
    .join(', ')
  // Show what the viewer does not already know from the selected view.
  const details = mode === 'group' ? [room, teacher] : mode === 'teacher' ? [room, groups] : [groups, teacher]

  return (
    <div className={`lesson lesson--${entry.lesson_type}`}>
      <div className="lesson__title">{lookup.course(entry.course_id)?.title}</div>
      <div className="lesson__meta">
        {t(`lesson.${entry.lesson_type}`)}
        {entry.week_pattern !== 'every' && <span className="badge">{t(`pattern.${entry.week_pattern}`)}</span>}
      </div>
      <div className="lesson__details">{details.filter(Boolean).join(' · ')}</div>
    </div>
  )
}

interface ScheduleGridProps {
  entries: ScheduleEntry[]
  lookup: Lookup
  mode: ViewMode
  days?: number[]
}

/**
 * FR-10: week view. A table on wide screens and a list of days on phones
 * (NFR-05: no horizontal scrolling at 360 px); CSS decides which one is visible.
 */
export function ScheduleGrid({ entries, lookup, mode, days = WEEKDAYS }: ScheduleGridProps) {
  const { t } = useTranslation()
  if (entries.length === 0) return <p className="empty">{t('schedule.empty')}</p>

  const usedSlots = entries.map((e) => lookup.slot(e.time_slot_id)?.number ?? 0)
  const lastSlot = Math.max(4, ...usedSlots)
  const slots = lookup.slots.filter((s) => s.number <= lastSlot)
  const visibleDays = days.filter((d) => d !== 6 || entries.some((e) => e.weekday === 6))
  const cell = (day: number, slotId: number) =>
    entries.filter((e) => e.weekday === day && e.time_slot_id === slotId)

  return (
    <>
      <table className="grid grid--desktop">
        <thead>
          <tr>
            <th className="grid__time" />
            {visibleDays.map((d) => (
              <th key={d}>{t(`days.${d}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot.id}>
              <th className="grid__time" scope="row">
                <span className="grid__slot-number">{slot.number}</span>
                {slotLabel(slot)}
              </th>
              {visibleDays.map((d) => (
                <td key={d}>
                  {cell(d, slot.id).map((e) => (
                    <LessonCard key={e.id} entry={e} lookup={lookup} mode={mode} />
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid--mobile">
        {visibleDays.map((d) => {
          const dayEntries = sortEntries(
            entries.filter((e) => e.weekday === d),
            lookup.slots,
          )
          if (dayEntries.length === 0) return null
          return (
            <section key={d} className="day">
              <h3 className="day__title">{t(`days.${d}`)}</h3>
              {dayEntries.map((e) => {
                const slot = lookup.slot(e.time_slot_id)
                return (
                  <div key={e.id} className="day__row">
                    <div className="day__time">{slot && slotLabel(slot)}</div>
                    <LessonCard entry={e} lookup={lookup} mode={mode} />
                  </div>
                )
              })}
            </section>
          )
        })}
      </div>
    </>
  )
}
