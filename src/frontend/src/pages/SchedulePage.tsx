import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useReferenceData, useSchedule } from '../api/hooks'
import type { Parity, ScheduleEntry } from '../api/types'
import { ScheduleGrid, type ViewMode } from '../components/ScheduleGrid'
import { WeekSelect } from '../components/WeekSelect'
import type { Lookup } from '../lib/lookup'
import { appliesTo, parityOf, WEEKDAYS } from '../lib/schedule'

const MODES: ViewMode[] = ['group', 'teacher', 'room']

function matchesSearch(entry: ScheduleEntry, lookup: Lookup, search: string): boolean {
  if (!search) return true
  const course = lookup.course(entry.course_id)
  const haystack = [
    course?.title,
    course?.code,
    lookup.teacher(entry.teacher_id)?.full_name,
    lookup.room(entry.room_id)?.name,
    ...entry.group_ids.map((id) => lookup.group(id)?.code),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(search.toLowerCase())
}

/** UC02 / UC03: public schedule by group, teacher or room with search and filters. */
export function SchedulePage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const mode = MODES.find((m) => m === params.get('view')) ?? 'group'
  const selectedId = Number(params.get('id')) || 0
  const [parity, setParity] = useState<Parity>(() => parityOf(new Date()))
  const [day, setDay] = useState(0)
  const [search, setSearch] = useState('')

  const { data: ref, lookup, isLoading: refLoading, isError: refError } = useReferenceData()
  const schedule = useSchedule(selectedId ? { [`${mode}_id`]: selectedId } : null)

  const options = useMemo(() => {
    if (!ref) return []
    if (mode === 'group') return ref.groups.map((g) => ({ id: g.id, label: g.code }))
    if (mode === 'teacher') return ref.teachers.map((x) => ({ id: x.id, label: x.full_name }))
    return ref.rooms.map((r) => ({ id: r.id, label: `${r.name} (${r.capacity})` }))
  }, [ref, mode])

  const entries = useMemo(() => {
    if (!schedule.data || !lookup) return []
    return schedule.data
      .filter((e) => appliesTo(e, parity))
      .filter((e) => day === 0 || e.weekday === day)
      .filter((e) => matchesSearch(e, lookup, search.trim()))
  }, [schedule.data, lookup, parity, day, search])

  if (refLoading) return <p>{t('common.loading')}</p>
  if (refError || !lookup) return <p className="alert alert--error">{t('common.error')}</p>

  return (
    <div className="stack">
      <h1>{t('nav.schedule')}</h1>

      <div className="tabs" role="tablist">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={m === mode}
            className={m === mode ? 'tabs__tab tabs__tab--active' : 'tabs__tab'}
            onClick={() => setParams({ view: m })}
          >
            {t(`view.${m}`)}
          </button>
        ))}
      </div>

      <div className="filters">
        <div className="field">
          <label htmlFor="entity">{t(`view.${mode}`)}</label>
          <select
            id="entity"
            value={selectedId}
            onChange={(e) => setParams({ view: mode, id: e.target.value })}
          >
            <option value={0}>{t('view.select')}</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <WeekSelect id="week" value={parity} onChange={setParity} />
        <div className="field">
          <label htmlFor="day">{t('filter.day')}</label>
          <select id="day" value={day} onChange={(e) => setDay(Number(e.target.value))}>
            <option value={0}>{t('filter.allDays')}</option>
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {t(`days.${d}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field field--grow">
          <label htmlFor="search">{t('filter.search')}</label>
          <input id="search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {!selectedId ? (
        <p className="empty">{t('view.choose')}</p>
      ) : schedule.isLoading ? (
        <p>{t('common.loading')}</p>
      ) : schedule.isError ? (
        <p className="alert alert--error">{t('common.error')}</p>
      ) : (
        <ScheduleGrid entries={entries} lookup={lookup} mode={mode} />
      )}
    </div>
  )
}
