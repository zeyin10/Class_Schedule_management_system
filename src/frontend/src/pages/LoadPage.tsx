import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useConstraints,
  useCreateConstraint,
  useDeleteConstraint,
  useParseConstraint,
  useReferenceData,
  useTeachingLoad,
} from '../api/hooks'
import type { ParseResult } from '../api/types'
import { describeConstraint } from '../lib/constraintText'
import type { Lookup } from '../lib/lookup'

const EXAMPLES = ['example1', 'example2', 'example3']

/** FR-31: constraints written in plain language, confirmed by the admin before saving (AD-8). */
function AssistantPanel({ lookup }: { lookup: Lookup }) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [result, setResult] = useState<ParseResult | null>(null)
  const [saved, setSaved] = useState(false)
  const parse = useParseConstraint()
  const create = useCreateConstraint()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSaved(false)
    setResult(null)
    parse.mutate(text, { onSuccess: setResult })
  }

  return (
    <section className="card assistant" aria-labelledby="assistant-title">
      <h2 id="assistant-title">
        <span className="ai-mark" aria-hidden>
          ✦
        </span>{' '}
        {t('assistant.title')}
      </h2>
      <p className="muted">{t('assistant.hint')}</p>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label htmlFor="assistant-text">{t('assistant.label')}</label>
          <textarea
            id="assistant-text"
            rows={2}
            value={text}
            placeholder={t('assistant.placeholder')}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="chips">
          <span className="muted">{t('assistant.examples')}:</span>
          {EXAMPLES.map((key) => (
            <button key={key} type="button" className="chip" onClick={() => setText(t(`assistant.${key}`))}>
              {t(`assistant.${key}`)}
            </button>
          ))}
        </div>
        <div>
          <button type="submit" className="btn btn--primary" disabled={!text.trim() || parse.isPending}>
            {parse.isPending ? t('assistant.thinking') : t('assistant.recognise')}
          </button>
        </div>
      </form>

      {parse.isError && <p className="alert alert--error">{t('common.error')}</p>}

      {result?.status === 'ok' && !saved && (
        <div className="proposal" role="status">
          <div className="proposal__label">{t('assistant.understood')}</div>
          <div className="proposal__text">
            {describeConstraint(result.constraint, lookup, t)}{' '}
            <span className={result.constraint.hard ? 'badge badge--hard' : 'badge'}>
              {t(result.constraint.hard ? 'constraint.hard' : 'constraint.soft')}
            </span>
          </div>
          <p className="muted">{t('assistant.check')}</p>
          <div className="row">
            <button
              type="button"
              className="btn btn--primary"
              disabled={create.isPending}
              onClick={() =>
                create.mutate(result.constraint, {
                  onSuccess: () => {
                    setSaved(true)
                    setText('')
                  },
                })
              }
            >
              {t('assistant.confirm')}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setResult(null)}>
              {t('assistant.discard')}
            </button>
          </div>
        </div>
      )}
      {result?.status === 'unknown_name' && (
        <p className="alert alert--warning" role="alert">
          {t('assistant.unknownName', { name: result.name })}
        </p>
      )}
      {result?.status === 'not_understood' && (
        <p className="alert alert--warning" role="alert">
          {t('assistant.notUnderstood')}
        </p>
      )}
      {saved && (
        <p className="alert alert--success" role="status">
          {t('assistant.saved')}
        </p>
      )}
    </section>
  )
}

/** UC16, UC17: teaching load and constraints that the generator uses. */
export function LoadPage() {
  const { t } = useTranslation()
  const { lookup } = useReferenceData()
  const load = useTeachingLoad()
  const constraints = useConstraints()
  const remove = useDeleteConstraint()

  if (!lookup || load.isLoading || constraints.isLoading) return <p>{t('common.loading')}</p>
  if (load.isError || constraints.isError) return <p className="alert alert--error">{t('common.error')}</p>

  const total = (load.data ?? []).reduce((sum, l) => sum + l.lessons_per_week, 0)

  return (
    <div className="stack">
      <h1>{t('load.title')}</h1>

      <AssistantPanel lookup={lookup} />

      <section className="stack">
        <h2>{t('load.constraints', { count: constraints.data?.length ?? 0 })}</h2>
        {constraints.data?.length === 0 ? (
          <p className="empty">{t('load.noConstraints')}</p>
        ) : (
          <ul className="rules">
            {constraints.data?.map((c) => (
              <li key={c.id} className="rule">
                <div>
                  <div>
                    {describeConstraint(c, lookup, t)}{' '}
                    <span className={c.hard ? 'badge badge--hard' : 'badge'}>
                      {t(c.hard ? 'constraint.hard' : 'constraint.soft')}
                    </span>
                  </div>
                  {c.source_text && (
                    <div className="muted rule__source">
                      <span aria-hidden>✦</span> «{c.source_text}»
                    </div>
                  )}
                </div>
                <button type="button" className="btn btn--ghost btn--small" onClick={() => remove.mutate(c.id)}>
                  {t('admin.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stack">
        <div className="page-head">
          <h2>{t('load.loadTitle')}</h2>
          <p className="muted">{t('load.total', { count: total })}</p>
        </div>
        <div className="table-wrap">
          <table className="entries">
            <thead>
              <tr>
                <th>{t('form.course')}</th>
                <th>{t('form.teacher')}</th>
                <th>{t('form.groups')}</th>
                <th>{t('load.perWeek')}</th>
                <th>{t('form.pattern')}</th>
              </tr>
            </thead>
            <tbody>
              {load.data?.map((l) => (
                <tr key={l.id}>
                  <td data-label={t('form.course')}>
                    {lookup.course(l.course_id)?.title}
                    <span className="muted"> · {t(`lesson.${l.lesson_type}`)}</span>
                  </td>
                  <td data-label={t('form.teacher')}>{lookup.teacher(l.teacher_id)?.full_name}</td>
                  <td data-label={t('form.groups')}>{l.group_ids.map((id) => lookup.group(id)?.code).join(', ')}</td>
                  <td data-label={t('load.perWeek')}>{l.lessons_per_week}</td>
                  <td data-label={t('form.pattern')}>{t(`pattern.${l.week_pattern}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
