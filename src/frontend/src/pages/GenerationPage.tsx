import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useExplainRun,
  useGenerationRun,
  usePublishRun,
  useReferenceData,
  useSchedule,
  useStartGeneration,
  useTeachingLoad,
} from '../api/hooks'
import type { GenerationRun, GenerationWeights, InfeasibilityReason, LoadItem } from '../api/types'
import { ScheduleGrid } from '../components/ScheduleGrid'
import { DEFAULT_WEIGHTS } from '../lib/generator'
import type { Lookup } from '../lib/lookup'

const WEIGHT_KEYS: (keyof GenerationWeights)[] = ['gaps', 'preferences', 'daily_load', 'last_slot']

function ReasonText({ reason, lookup, load }: { reason: InfeasibilityReason; lookup: Lookup; load: LoadItem[] }) {
  const { t } = useTranslation()
  const loadTitle = (id: number) => {
    const item = load.find((l) => l.id === id)
    if (!item) return `#${id}`
    const groups = item.group_ids.map((g) => lookup.group(g)?.code).join(', ')
    return `${lookup.course(item.course_id)?.title} · ${t(`lesson.${item.lesson_type}`)} · ${groups}`
  }
  switch (reason.type) {
    case 'teacher_overload':
      return <>{t('generate.reason.teacher', { teacher: lookup.teacher(reason.teacher_id)?.full_name, required: reason.required, available: reason.available })}</>
    case 'group_overload':
      return <>{t('generate.reason.group', { group: lookup.group(reason.group_id)?.code, required: reason.required, available: reason.available })}</>
    case 'no_room':
      return <>{t('generate.reason.room', { lesson: loadTitle(reason.load_id), students: reason.students })}</>
    case 'unplaced':
      return <>{t('generate.reason.unplaced', { lesson: loadTitle(reason.load_id) })}</>
  }
}

function Explain({ run }: { run: GenerationRun }) {
  const { t, i18n } = useTranslation()
  const explain = useExplainRun()
  return (
    <div className="stack">
      <div>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={explain.isPending}
          onClick={() => explain.mutate({ runId: run.id, language: i18n.language })}
        >
          <span className="ai-mark" aria-hidden>
            ✦
          </span>{' '}
          {explain.isPending ? t('assistant.thinking') : t('generate.explain')}
        </button>
      </div>
      {explain.data && (
        <div className="proposal explanation">
          <div className="proposal__label">{t('generate.explanationTitle')}</div>
          <p className="explanation__text">{explain.data}</p>
        </div>
      )}
    </div>
  )
}

/** UC18–UC20: generate a draft timetable, check its quality, publish it. */
export function GenerationPage() {
  const { t } = useTranslation()
  const { data: reference, lookup } = useReferenceData()
  const load = useTeachingLoad()
  const [scope, setScope] = useState(0)
  const [weights, setWeights] = useState<GenerationWeights>(DEFAULT_WEIGHTS)
  const [timeLimit, setTimeLimit] = useState(60)
  const [runId, setRunId] = useState<number | null>(null)
  const [previewGroup, setPreviewGroup] = useState(1)
  const start = useStartGeneration()
  const run = useGenerationRun(runId)
  const publish = usePublishRun()
  const current = run.data
  const draft = useSchedule(current?.status === 'done' && current.timetable_id ? { timetable_id: current.timetable_id, group_id: previewGroup } : null)

  if (!reference || !lookup || load.isLoading) return <p>{t('common.loading')}</p>

  const submit = (event: FormEvent) => {
    event.preventDefault()
    publish.reset()
    start.mutate(
      { group_ids: scope ? [scope] : [], weights, time_limit_s: timeLimit },
      { onSuccess: (r) => setRunId(r.id) },
    )
  }
  const busy = start.isPending || current?.status === 'queued' || current?.status === 'running'

  return (
    <div className="stack">
      <h1>{t('generate.title')}</h1>
      <p className="muted">{t('generate.intro')}</p>

      <form className="card stack" onSubmit={submit} aria-label={t('generate.title')}>
        <div className="filters">
          <div className="field">
            <label htmlFor="gen-scope">{t('generate.scope')}</label>
            <select id="gen-scope" value={scope} onChange={(e) => setScope(Number(e.target.value))}>
              <option value={0}>{t('generate.wholeUniversity')}</option>
              {reference.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {t('view.group')} {g.code}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="gen-limit">{t('generate.timeLimit')}</label>
            <select id="gen-limit" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))}>
              {[30, 60, 300].map((s) => (
                <option key={s} value={s}>
                  {s < 60 ? t('generate.seconds', { count: s }) : t('generate.minutes', { count: s / 60 })}
                </option>
              ))}
            </select>
          </div>
        </div>
        <fieldset className="weights">
          <legend>{t('generate.weights')}</legend>
          {WEIGHT_KEYS.map((k) => (
            <div key={k} className="weight">
              <label htmlFor={`w-${k}`}>{t(`generate.weight.${k}`)}</label>
              <input
                id={`w-${k}`}
                type="range"
                min={0}
                max={5}
                value={weights[k]}
                onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })}
              />
              <output htmlFor={`w-${k}`}>{weights[k]}</output>
            </div>
          ))}
        </fieldset>
        <div>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {t('generate.start')}
          </button>
        </div>
      </form>

      {current && (current.status === 'queued' || current.status === 'running') && (
        <div className="card stack" role="status">
          <div>{t(`generate.status.${current.status}`)}</div>
          <progress max={100} value={current.progress} aria-label={t('generate.progress')} />
        </div>
      )}

      {current?.status === 'infeasible' && (
        <div className="card stack">
          <div className="alert alert--error" role="alert">
            <strong>{t('generate.infeasible')}</strong>
            <ul>
              {current.reasons?.map((r, i) => (
                <li key={i}>
                  <ReasonText reason={r} lookup={lookup} load={load.data ?? []} />
                </li>
              ))}
            </ul>
          </div>
          <Explain run={current} />
        </div>
      )}

      {current?.status === 'done' && current.report && (
        <div className="card stack">
          <div className="page-head">
            <h2>{t('generate.draftTitle')}</h2>
            {current.published ? (
              <span className="alert alert--success" role="status">
                {t('generate.published')}
              </span>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                disabled={publish.isPending}
                onClick={() => publish.mutate(current.id)}
              >
                {t('generate.publish')}
              </button>
            )}
          </div>

          <dl className="tiles" aria-label={t('generate.report')}>
            <div className="tile tile--ok">
              <dt>{t('generate.metric.placed')}</dt>
              <dd>
                {current.report.placed} / {current.report.required}
              </dd>
            </div>
            <div className={current.report.hard_violations === 0 ? 'tile tile--ok' : 'tile tile--bad'}>
              <dt>{t('generate.metric.hard')}</dt>
              <dd>{current.report.hard_violations}</dd>
            </div>
            <div className="tile">
              <dt>{t('generate.metric.gaps')}</dt>
              <dd>{current.report.gaps}</dd>
            </div>
            <div className="tile">
              <dt>{t('generate.metric.preferences')}</dt>
              <dd>{current.report.preference_violations}</dd>
            </div>
            <div className="tile">
              <dt>{t('generate.metric.overloaded')}</dt>
              <dd>{current.report.overloaded_days}</dd>
            </div>
            <div className="tile">
              <dt>{t('generate.metric.penalty')}</dt>
              <dd>{current.report.penalty}</dd>
            </div>
          </dl>

          <Explain run={current} />

          <div className="filters">
            <div className="field">
              <label htmlFor="preview-group">{t('generate.preview')}</label>
              <select id="preview-group" value={previewGroup} onChange={(e) => setPreviewGroup(Number(e.target.value))}>
                {reference.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {draft.data && <ScheduleGrid entries={draft.data} lookup={lookup} mode="group" />}
        </div>
      )}
    </div>
  )
}
