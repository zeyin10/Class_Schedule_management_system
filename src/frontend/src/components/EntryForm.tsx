import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSaveEntry } from '../api/hooks'
import {
  ApiError,
  type ConflictDetail,
  type LessonType,
  type ReferenceData,
  type RoomWarning,
  type ScheduleEntry,
  type ScheduleEntryInput,
  type WeekPattern,
} from '../api/types'
import type { Lookup } from '../lib/lookup'
import { CURRENT_TERM_ID, slotLabel, WEEKDAYS } from '../lib/schedule'

const LESSON_TYPES: LessonType[] = ['lecture', 'practice', 'lab']
const PATTERNS: WeekPattern[] = ['every', 'odd', 'even']

interface EntryFormProps {
  entry?: ScheduleEntry
  reference: ReferenceData
  lookup: Lookup
  onSaved(): void
  onCancel(): void
}

function emptyInput(ref: ReferenceData): ScheduleEntryInput {
  return {
    term_id: CURRENT_TERM_ID,
    course_id: ref.courses[0]?.id ?? 0,
    lesson_type: 'lecture',
    teacher_id: ref.teachers[0]?.id ?? 0,
    room_id: ref.rooms[0]?.id ?? 0,
    group_ids: [],
    weekday: 1,
    time_slot_id: ref.timeSlots[0]?.id ?? 0,
    week_pattern: 'every',
  }
}

/** UC09: create / edit a schedule entry with conflict (FR-08) and room (FR-09) feedback. */
export function EntryForm({ entry, reference, lookup, onSaved, onCancel }: EntryFormProps) {
  const { t } = useTranslation()
  const save = useSaveEntry()
  const [input, setInput] = useState<ScheduleEntryInput>(() => {
    if (!entry) return emptyInput(reference)
    const { id: _id, updated_at: _updated, ...rest } = entry
    return rest
  })
  const [groupsMissing, setGroupsMissing] = useState(false)
  const [conflicts, setConflicts] = useState<ConflictDetail[]>([])
  const [warnings, setWarnings] = useState<RoomWarning[]>([])
  const [failed, setFailed] = useState(false)

  const set = <K extends keyof ScheduleEntryInput>(key: K, value: ScheduleEntryInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }))
    setConflicts([])
    setWarnings([])
  }

  function toggleGroup(id: number) {
    set(
      'group_ids',
      input.group_ids.includes(id) ? input.group_ids.filter((g) => g !== id) : [...input.group_ids, id],
    )
    setGroupsMissing(false)
  }

  function submit(force = false) {
    if (input.group_ids.length === 0) {
      setGroupsMissing(true)
      return
    }
    setFailed(false)
    save.mutate(
      { id: entry?.id, input, options: { force } },
      {
        onSuccess: onSaved,
        onError: (error) => {
          if (error instanceof ApiError && error.code === 'SCHEDULE_CONFLICT') {
            setConflicts((error.details?.conflicts as ConflictDetail[]) ?? [])
          } else if (error instanceof ApiError && error.code === 'ROOM_WARNING') {
            setWarnings((error.details?.warnings as RoomWarning[]) ?? [])
          } else {
            setFailed(true)
          }
        },
      },
    )
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    submit()
  }

  function describeConflict(c: ConflictDetail): string {
    const values = {
      course: lookup.course(c.entry.course_id)?.title ?? '',
      teacher: lookup.teacher(c.entry.teacher_id)?.full_name ?? '',
      room: lookup.room(c.entry.room_id)?.name ?? '',
      group: c.group_id ? (lookup.group(c.group_id)?.code ?? '') : '',
    }
    return t(`conflict.${c.type}`, values)
  }

  function describeWarning(w: RoomWarning): string {
    if (w.type === 'capacity') return t('warning.capacity', { capacity: w.capacity, required: w.required })
    return t('warning.roomType', {
      expected: w.expected.map((rt) => t(`roomType.${rt}`)).join(' / '),
      actual: t(`roomType.${w.actual}`),
    })
  }

  return (
    <form className="card stack" onSubmit={onSubmit} aria-label={entry ? t('admin.editTitle') : t('admin.new')}>
      <h2>{entry ? t('admin.editTitle') : t('admin.new')}</h2>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="f-course">{t('form.course')}</label>
          <select id="f-course" value={input.course_id} onChange={(e) => set('course_id', Number(e.target.value))}>
            {reference.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-type">{t('form.lessonType')}</label>
          <select
            id="f-type"
            value={input.lesson_type}
            onChange={(e) => set('lesson_type', e.target.value as LessonType)}
          >
            {LESSON_TYPES.map((lt) => (
              <option key={lt} value={lt}>
                {t(`lesson.${lt}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-teacher">{t('form.teacher')}</label>
          <select id="f-teacher" value={input.teacher_id} onChange={(e) => set('teacher_id', Number(e.target.value))}>
            {reference.teachers.map((x) => (
              <option key={x.id} value={x.id}>
                {x.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-room">{t('form.room')}</label>
          <select id="f-room" value={input.room_id} onChange={(e) => set('room_id', Number(e.target.value))}>
            {reference.rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} · {t(`roomType.${r.room_type}`)} · {r.capacity}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-day">{t('form.weekday')}</label>
          <select id="f-day" value={input.weekday} onChange={(e) => set('weekday', Number(e.target.value))}>
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {t(`days.${d}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-slot">{t('form.slot')}</label>
          <select
            id="f-slot"
            value={input.time_slot_id}
            onChange={(e) => set('time_slot_id', Number(e.target.value))}
          >
            {lookup.slots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.number}. {slotLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-pattern">{t('form.pattern')}</label>
          <select
            id="f-pattern"
            value={input.week_pattern}
            onChange={(e) => set('week_pattern', e.target.value as WeekPattern)}
          >
            {PATTERNS.map((p) => (
              <option key={p} value={p}>
                {t(`pattern.${p}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="groups">
        <legend>{t('form.groups')}</legend>
        {reference.groups.map((g) => (
          <label key={g.id} className="check">
            <input type="checkbox" checked={input.group_ids.includes(g.id)} onChange={() => toggleGroup(g.id)} />
            {g.code} <span className="muted">({g.size})</span>
          </label>
        ))}
        {groupsMissing && <p className="field-error">{t('form.groupsRequired')}</p>}
      </fieldset>

      {conflicts.length > 0 && (
        <div className="alert alert--error" role="alert">
          <strong>{t('conflict.title')}</strong>
          <ul>
            {conflicts.map((c, i) => (
              <li key={i}>{describeConflict(c)}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="alert alert--warning" role="alert">
          <strong>{t('warning.title')}</strong>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>{describeWarning(w)}</li>
            ))}
          </ul>
          <button type="button" className="btn btn--warning" onClick={() => submit(true)}>
            {t('warning.saveAnyway')}
          </button>
        </div>
      )}

      {failed && <p className="alert alert--error">{t('common.error')}</p>}

      <div className="actions">
        <button type="submit" className="btn btn--primary" disabled={save.isPending}>
          {t('admin.save')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {t('admin.cancel')}
        </button>
      </div>
    </form>
  )
}
