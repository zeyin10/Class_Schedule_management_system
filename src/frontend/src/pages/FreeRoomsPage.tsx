import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useFreeRooms, useReferenceData } from '../api/hooks'
import type { FreeRoomsQuery, Parity, RoomType } from '../api/types'
import { WeekSelect } from '../components/WeekSelect'
import { isoWeekday, parityOf, slotLabel, WEEKDAYS } from '../lib/schedule'

const ROOM_TYPES: RoomType[] = ['lecture', 'classroom', 'lab']

/** UC05 / FR-13: rooms without bookings in the selected slot. */
export function FreeRoomsPage() {
  const { t } = useTranslation()
  const { lookup } = useReferenceData()
  const todayWeekday = Math.min(isoWeekday(new Date()), 6)
  const [weekday, setWeekday] = useState(todayWeekday)
  const [slotId, setSlotId] = useState(1)
  const [week, setWeek] = useState<Parity>(() => parityOf(new Date()))
  const [roomType, setRoomType] = useState<RoomType | ''>('')
  const [minCapacity, setMinCapacity] = useState('')
  const [query, setQuery] = useState<FreeRoomsQuery | null>(null)
  const result = useFreeRooms(query)

  function submit(event: FormEvent) {
    event.preventDefault()
    setQuery({
      weekday,
      time_slot_id: slotId,
      week,
      room_type: roomType || undefined,
      min_capacity: minCapacity ? Number(minCapacity) : undefined,
    })
  }

  if (!lookup) return <p>{t('common.loading')}</p>

  return (
    <div className="stack">
      <h1>{t('free.title')}</h1>
      <form className="filters" onSubmit={submit}>
        <div className="field">
          <label htmlFor="fr-day">{t('form.weekday')}</label>
          <select id="fr-day" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {t(`days.${d}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="fr-slot">{t('form.slot')}</label>
          <select id="fr-slot" value={slotId} onChange={(e) => setSlotId(Number(e.target.value))}>
            {lookup.slots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.number}. {slotLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <WeekSelect id="fr-week" value={week} onChange={setWeek} />
        <div className="field">
          <label htmlFor="fr-type">{t('free.type')}</label>
          <select id="fr-type" value={roomType} onChange={(e) => setRoomType(e.target.value as RoomType | '')}>
            <option value="">{t('free.anyType')}</option>
            {ROOM_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {t(`roomType.${rt}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="fr-cap">{t('free.minCapacity')}</label>
          <input
            id="fr-cap"
            type="number"
            min={1}
            inputMode="numeric"
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value)}
          />
        </div>
        <div className="field field--action">
          <button type="submit" className="btn btn--primary">
            {t('free.search')}
          </button>
        </div>
      </form>

      {result.isLoading && <p>{t('common.loading')}</p>}
      {result.isError && <p className="alert alert--error">{t('common.error')}</p>}
      {result.data &&
        (result.data.length === 0 ? (
          <p className="empty">{t('free.empty')}</p>
        ) : (
          <>
            <p className="muted">{t('free.result', { count: result.data.length })}</p>
            <ul className="rooms">
              {result.data.map((r) => (
                <li key={r.id} className="rooms__item">
                  <strong>{r.name}</strong>
                  <span>{t(`roomType.${r.room_type}`)}</span>
                  <span>
                    {t('free.capacity')}: {r.capacity}
                  </span>
                  <span>
                    {t('free.building')}: {r.building}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ))}
    </div>
  )
}
