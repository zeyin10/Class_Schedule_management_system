import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteEntry, useReferenceData, useSchedule } from '../api/hooks'
import type { ScheduleEntry } from '../api/types'
import { EntryForm } from '../components/EntryForm'
import { slotLabel, sortEntries } from '../lib/schedule'

/** UC09: list of schedule entries for the administrator. */
export function AdminEntriesPage() {
  const { t } = useTranslation()
  const { data: reference, lookup } = useReferenceData()
  const [groupId, setGroupId] = useState(0)
  const schedule = useSchedule(groupId ? { group_id: groupId } : {})
  const remove = useDeleteEntry()
  const [editing, setEditing] = useState<ScheduleEntry | 'new' | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const entries = useMemo(
    () => (schedule.data && lookup ? sortEntries(schedule.data, lookup.slots) : []),
    [schedule.data, lookup],
  )

  if (!reference || !lookup || schedule.isLoading) return <p>{t('common.loading')}</p>
  if (schedule.isError) return <p className="alert alert--error">{t('common.error')}</p>

  return (
    <div className="stack">
      <div className="page-head">
        <h1>{t('admin.title')}</h1>
        {editing === null && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setNotice(null)
              setEditing('new')
            }}
          >
            + {t('admin.new')}
          </button>
        )}
      </div>

      {notice && (
        <p className="alert alert--success" role="status">
          {notice}
        </p>
      )}

      {editing !== null && (
        <EntryForm
          key={editing === 'new' ? 'new' : editing.id}
          entry={editing === 'new' ? undefined : editing}
          reference={reference}
          lookup={lookup}
          onSaved={() => {
            setEditing(null)
            setNotice(t('admin.saved'))
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="filters">
        <div className="field">
          <label htmlFor="admin-group">{t('admin.filterGroup')}</label>
          <select id="admin-group" value={groupId} onChange={(e) => setGroupId(Number(e.target.value))}>
            <option value={0}>{t('admin.allGroups')}</option>
            {reference.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.code}
              </option>
            ))}
          </select>
        </div>
        <p className="muted filters__count">{t('admin.count', { count: entries.length })}</p>
      </div>

      <div className="table-wrap">
        <table className="entries">
          <thead>
            <tr>
              <th>{t('form.weekday')}</th>
              <th>{t('form.slot')}</th>
              <th>{t('form.course')}</th>
              <th>{t('form.teacher')}</th>
              <th>{t('form.room')}</th>
              <th>{t('form.groups')}</th>
              <th>{t('form.pattern')}</th>
              <th>{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const slot = lookup.slot(e.time_slot_id)
              return (
                <tr key={e.id}>
                  <td data-label={t('form.weekday')}>{t(`daysShort.${e.weekday}`)}</td>
                  <td data-label={t('form.slot')}>{slot && slotLabel(slot)}</td>
                  <td data-label={t('form.course')}>
                    {lookup.course(e.course_id)?.title}
                    <span className="muted"> · {t(`lesson.${e.lesson_type}`)}</span>
                  </td>
                  <td data-label={t('form.teacher')}>{lookup.teacher(e.teacher_id)?.full_name}</td>
                  <td data-label={t('form.room')}>{lookup.room(e.room_id)?.name}</td>
                  <td data-label={t('form.groups')}>{e.group_ids.map((id) => lookup.group(id)?.code).join(', ')}</td>
                  <td data-label={t('form.pattern')}>{t(`pattern.${e.week_pattern}`)}</td>
                  <td className="entries__actions">
                    {confirmId === e.id ? (
                      <>
                        <span>{t('admin.confirmDelete')}</span>
                        <button
                          type="button"
                          className="btn btn--danger btn--small"
                          onClick={() =>
                            remove.mutate(e.id, {
                              onSuccess: () => {
                                setConfirmId(null)
                                setNotice(t('admin.deleted'))
                              },
                            })
                          }
                        >
                          {t('admin.yes')}
                        </button>
                        <button type="button" className="btn btn--ghost btn--small" onClick={() => setConfirmId(null)}>
                          {t('admin.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={() => {
                            setNotice(null)
                            setEditing(e)
                          }}
                        >
                          {t('admin.edit')}
                        </button>
                        <button type="button" className="btn btn--ghost btn--small" onClick={() => setConfirmId(e.id)}>
                          {t('admin.delete')}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
