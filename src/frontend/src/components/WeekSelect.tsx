import { useTranslation } from 'react-i18next'
import type { Parity } from '../api/types'
import { parityOf } from '../lib/schedule'

interface WeekSelectProps {
  id: string
  value: Parity
  onChange(value: Parity): void
}

export function WeekSelect({ id, value, onChange }: WeekSelectProps) {
  const { t } = useTranslation()
  const current = parityOf(new Date())
  const label = (p: Parity) => `${t(`week.${p}`)}${p === current ? ` (${t('week.current')})` : ''}`
  return (
    <div className="field">
      <label htmlFor={id}>{t('week.label')}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as Parity)}>
        <option value="odd">{label('odd')}</option>
        <option value="even">{label('even')}</option>
      </select>
    </div>
  )
}
