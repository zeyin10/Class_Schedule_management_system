import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReferenceData, useSchedule } from '../api/hooks'
import type { Parity } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { LessonCard, ScheduleGrid } from '../components/ScheduleGrid'
import { WeekSelect } from '../components/WeekSelect'
import { appliesTo, isoWeekday, nextLesson, parityOf, slotLabel } from '../lib/schedule'

/** UC04 / FR-12: personal schedule with the next upcoming lesson. */
export function MySchedulePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [parity, setParity] = useState<Parity>(() => parityOf(new Date()))
  const { lookup } = useReferenceData()

  const query = user?.group_id
    ? { group_id: user.group_id }
    : user?.teacher_id
      ? { teacher_id: user.teacher_id }
      : null
  const mode = user?.group_id ? 'group' : 'teacher'
  const schedule = useSchedule(query)

  const next = useMemo(
    () => (schedule.data && lookup ? nextLesson(schedule.data, lookup.slots, new Date()) : null),
    [schedule.data, lookup],
  )

  if (!query) return <p className="alert">{t('my.noProfile')}</p>
  if (schedule.isLoading || !lookup) return <p>{t('common.loading')}</p>
  if (schedule.isError) return <p className="alert alert--error">{t('common.error')}</p>

  const entries = (schedule.data ?? []).filter((e) => appliesTo(e, parity))

  return (
    <div className="stack">
      <h1>{t('my.title')}</h1>

      <section className="next" aria-label={t('my.next')}>
        <h2 className="next__title">{t('my.next')}</h2>
        {next ? (
          <div className="next__body">
            <div className="next__when">
              {next.date.toDateString() === new Date().toDateString()
                ? t('my.today')
                : `${t(`days.${isoWeekday(next.date)}`)}, ${next.date.toLocaleDateString()}`}
              <strong>{slotLabel(next.slot)}</strong>
            </div>
            <LessonCard entry={next.entry} lookup={lookup} mode={mode} />
          </div>
        ) : (
          <p className="empty">{t('my.none')}</p>
        )}
      </section>

      <div className="filters">
        <WeekSelect id="my-week" value={parity} onChange={setParity} />
      </div>
      <ScheduleGrid entries={entries} lookup={lookup} mode={mode} />
    </div>
  )
}
