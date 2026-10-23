// In-browser mock of the backend. It follows the same contract and error format
// as the planned FastAPI service so the UI can be built before the backend exists.
import { checkRoom, findConflicts } from '../lib/conflicts'
import { generateTimetable } from '../lib/generator'
import { appliesTo } from '../lib/schedule'
import { explainRunText, parseConstraintText } from './mockAssistant'
import { DEMO_PASSWORD, demoUsers, referenceData, seedConstraints, seedEntries, seedLoad } from './mockData'
import {
  ApiError,
  type ApiClient,
  type ConstraintRule,
  type FreeRoomsQuery,
  type GenerationRun,
  type SaveOptions,
  type ScheduleEntry,
  type ScheduleEntryInput,
  type ScheduleQuery,
} from './types'

/** How a generation job looks while it is still "running" in the worker. */
const QUEUED_MS = 400
const RUNNING_MS = 2200

export function createMockClient(latencyMs = 250): ApiClient {
  let entries = seedEntries()
  let nextId = entries.length + 1
  const load = seedLoad()
  let constraints: ConstraintRule[] = seedConstraints()
  let nextConstraintId = constraints.length + 1
  const runs = new Map<number, { run: GenerationRun; startedAt: number; final: GenerationRun }>()
  const drafts = new Map<number, ScheduleEntry[]>()
  let nextRunId = 1

  const delay = <T>(value: T): Promise<T> =>
    new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), latencyMs))

  /** Simulates the background worker: queued → running (progress) → final status. */
  function currentRun(id: number): GenerationRun {
    const job = runs.get(id)
    if (!job) throw new ApiError(404, 'NOT_FOUND', 'Generation run not found')
    const elapsed = Date.now() - job.startedAt
    if (latencyMs === 0 || elapsed >= QUEUED_MS + RUNNING_MS) return job.final
    if (elapsed < QUEUED_MS) return { ...job.run, status: 'queued', progress: 0 }
    return { ...job.run, status: 'running', progress: Math.round(((elapsed - QUEUED_MS) / RUNNING_MS) * 100) }
  }

  function loadTitle(loadId: number): string {
    const item = load.find((l) => l.id === loadId)
    if (!item) return `#${loadId}`
    const course = referenceData.courses.find((c) => c.id === item.course_id)?.title
    const groups = item.group_ids.map((g) => referenceData.groups.find((x) => x.id === g)?.code).join(', ')
    return `${course} (${item.lesson_type}, ${groups})`
  }

  function validate(input: ScheduleEntryInput, id: number | undefined, options: SaveOptions = {}) {
    if (input.group_ids.length === 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'At least one group is required')
    }
    const conflicts = findConflicts({ ...input, id }, entries)
    if (conflicts.length > 0) {
      throw new ApiError(409, 'SCHEDULE_CONFLICT', 'The entry conflicts with existing lessons', { conflicts })
    }
    const room = referenceData.rooms.find((r) => r.id === input.room_id)
    if (room && !options.force) {
      const warnings = checkRoom(input, room, referenceData.groups)
      if (warnings.length > 0) {
        throw new ApiError(422, 'ROOM_WARNING', 'Room capacity or type does not match', { warnings })
      }
    }
  }

  return {
    async login(email, password) {
      const user = demoUsers.find((u) => u.email === email.trim().toLowerCase())
      if (!user || password !== DEMO_PASSWORD) {
        await delay(null)
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid e-mail or password')
      }
      return delay({ token: `mock-token-${user.id}`, user })
    },

    getReferenceData() {
      return delay(referenceData)
    },

    getSchedule(query: ScheduleQuery) {
      const source = query.timetable_id === undefined ? entries : drafts.get(query.timetable_id)
      if (!source) return Promise.reject(new ApiError(404, 'NOT_FOUND', 'Timetable not found'))
      const result = source.filter(
        (e) =>
          (query.group_id === undefined || e.group_ids.includes(query.group_id)) &&
          (query.teacher_id === undefined || e.teacher_id === query.teacher_id) &&
          (query.room_id === undefined || e.room_id === query.room_id),
      )
      return delay(result)
    },

    getFreeRooms(query: FreeRoomsQuery) {
      const busy = new Set(
        entries
          .filter(
            (e) =>
              e.weekday === query.weekday && e.time_slot_id === query.time_slot_id && appliesTo(e, query.week),
          )
          .map((e) => e.room_id),
      )
      const result = referenceData.rooms.filter(
        (r) =>
          !busy.has(r.id) &&
          (query.room_type === undefined || r.room_type === query.room_type) &&
          (query.min_capacity === undefined || r.capacity >= query.min_capacity),
      )
      return delay(result)
    },

    async createEntry(input, options) {
      validate(input, undefined, options)
      const entry: ScheduleEntry = { ...input, id: nextId++, updated_at: new Date().toISOString() }
      entries = [...entries, entry]
      return delay(entry)
    },

    async updateEntry(id, input, options) {
      if (!entries.some((e) => e.id === id)) throw new ApiError(404, 'NOT_FOUND', 'Entry not found')
      validate(input, id, options)
      const entry: ScheduleEntry = { ...input, id, updated_at: new Date().toISOString() }
      entries = entries.map((e) => (e.id === id ? entry : e))
      return delay(entry)
    },

    async deleteEntry(id) {
      entries = entries.filter((e) => e.id !== id)
      await delay(null)
    },

    getTeachingLoad() {
      return delay(load)
    },

    getConstraints() {
      return delay(constraints)
    },

    async createConstraint(input) {
      const rule = { ...input, id: nextConstraintId++ } as ConstraintRule
      constraints = [...constraints, rule]
      return delay(rule)
    },

    async deleteConstraint(id) {
      constraints = constraints.filter((c) => c.id !== id)
      await delay(null)
    },

    async parseConstraint(text) {
      if (!text.trim()) throw new ApiError(422, 'VALIDATION_ERROR', 'Text is empty')
      // a language model needs a moment; keep the demo realistic
      await delay(null)
      return delay(parseConstraintText(text, referenceData))
    },

    async explainRun(runId, language) {
      return delay(explainRunText(currentRun(runId), referenceData, loadTitle, language))
    },

    async startGeneration(params) {
      const started = Date.now()
      const result = generateTimetable({ load, reference: referenceData, constraints, weights: params.weights, groupIds: params.group_ids })
      const id = nextRunId++
      const base: GenerationRun = { id, status: 'queued', progress: 0, params, published: false }
      let final: GenerationRun
      if (result.reasons.length > 0) {
        final = { ...base, status: 'infeasible', progress: 100, reasons: result.reasons, report: result.report }
      } else {
        drafts.set(id, result.entries)
        final = { ...base, status: 'done', progress: 100, timetable_id: id, report: result.report }
      }
      final.duration_ms = Date.now() - started
      runs.set(id, { run: base, startedAt: Date.now(), final })
      return delay(currentRun(id))
    },

    async getGenerationRun(id) {
      return delay(currentRun(id))
    },

    async publishRun(id) {
      const run = currentRun(id)
      const draft = drafts.get(id)
      if (run.status !== 'done' || !draft) throw new ApiError(409, 'NOT_PUBLISHABLE', 'Only a finished draft can be published')
      // FR-28: the draft becomes the current timetable in one step
      const scope = run.params.group_ids
      const kept = scope.length === 0 ? [] : entries.filter((e) => !e.group_ids.some((g) => scope.includes(g)))
      entries = [...kept, ...draft.map((e) => ({ ...e, id: nextId++, updated_at: new Date().toISOString() }))]
      const job = runs.get(id)!
      job.final = { ...job.final, published: true }
      return delay(job.final)
    },
  }
}
