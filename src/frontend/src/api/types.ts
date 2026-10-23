// Types mirror the REST API contract in docs/07-architecture.md (snake_case JSON).

export type Role = 'student' | 'teacher' | 'admin'
export type RoomType = 'lecture' | 'lab' | 'classroom'
export type LessonType = 'lecture' | 'practice' | 'lab'
export type WeekPattern = 'every' | 'odd' | 'even'
export type Parity = 'odd' | 'even'

export interface Group {
  id: number
  code: string
  size: number
}

export interface Teacher {
  id: number
  full_name: string
  email?: string
}

export interface Room {
  id: number
  name: string
  building: string
  capacity: number
  room_type: RoomType
}

export interface Course {
  id: number
  code: string
  title: string
}

export interface TimeSlot {
  id: number
  number: number
  start_time: string
  end_time: string
}

export interface ScheduleEntry {
  id: number
  term_id: number
  course_id: number
  teacher_id: number
  room_id: number
  group_ids: number[]
  lesson_type: LessonType
  /** 1 = Monday … 6 = Saturday */
  weekday: number
  time_slot_id: number
  week_pattern: WeekPattern
  updated_at?: string
}

export type ScheduleEntryInput = Omit<ScheduleEntry, 'id' | 'updated_at'>

export interface User {
  id: number
  email: string
  full_name: string
  role: Role
  group_id?: number
  teacher_id?: number
}

export interface ReferenceData {
  groups: Group[]
  teachers: Teacher[]
  rooms: Room[]
  courses: Course[]
  timeSlots: TimeSlot[]
}

export interface ScheduleQuery {
  group_id?: number
  teacher_id?: number
  room_id?: number
  /** Draft timetable produced by a generation run; the published one when omitted. */
  timetable_id?: number
}

/** FR-23: one line of the teaching load (who teaches what to whom, how often). */
export interface LoadItem {
  id: number
  course_id: number
  lesson_type: LessonType
  teacher_id: number
  group_ids: number[]
  lessons_per_week: number
  week_pattern: WeekPattern
}

/**
 * FR-24, FR-31: constraints, entered with forms or proposed by the AI assistant.
 * weekday = null means every day.
 */
export type ConstraintBody =
  | { type: 'teacher_unavailable'; teacher_id: number; weekday: number | null; slot_ids: number[] }
  | { type: 'teacher_preference'; teacher_id: number; weekday: number | null; slot_ids: number[]; kind: 'prefer' | 'avoid' }
  | { type: 'group_max_per_day'; group_id: number; max: number }

export type ConstraintInput = ConstraintBody & {
  /** Hard constraints are never violated by the generator; soft ones are penalised. */
  hard: boolean
  /** Text typed by the admin when the rule came from the AI assistant. */
  source_text?: string
}

export type ConstraintRule = ConstraintInput & { id: number }

/** Response of POST /assistant/parse-constraint (not saved until the admin confirms). */
export type ParseResult =
  | { status: 'ok'; constraint: ConstraintInput }
  | { status: 'unknown_name'; name: string }
  | { status: 'not_understood' }

/** FR-26: weights of soft constraints chosen by the admin. */
export interface GenerationWeights {
  gaps: number
  preferences: number
  daily_load: number
  last_slot: number
}

export interface GenerationParams {
  /** Empty = whole university. */
  group_ids: number[]
  weights: GenerationWeights
  time_limit_s: number
}

export interface QualityReport {
  placed: number
  required: number
  hard_violations: number
  gaps: number
  preference_violations: number
  overloaded_days: number
  last_slot_lessons: number
  penalty: number
}

/** FR-30: why no timetable exists. */
export type InfeasibilityReason =
  | { type: 'teacher_overload'; teacher_id: number; required: number; available: number }
  | { type: 'group_overload'; group_id: number; required: number; available: number }
  | { type: 'no_room'; load_id: number; students: number; room_types: RoomType[] }
  | { type: 'unplaced'; load_id: number }

export type RunStatus = 'queued' | 'running' | 'done' | 'infeasible' | 'failed'

export interface GenerationRun {
  id: number
  status: RunStatus
  /** 0–100 while running */
  progress: number
  params: GenerationParams
  /** Draft timetable when status = done. */
  timetable_id?: number
  report?: QualityReport
  reasons?: InfeasibilityReason[]
  published: boolean
  duration_ms?: number
}

export interface FreeRoomsQuery {
  weekday: number
  time_slot_id: number
  week: Parity
  room_type?: RoomType
  min_capacity?: number
}

/** details.conflicts of a 409 SCHEDULE_CONFLICT response */
export interface ConflictDetail {
  type: 'teacher' | 'room' | 'group'
  entry: ScheduleEntry
  group_id?: number
}

/** details.warnings of a 422 ROOM_WARNING response */
export type RoomWarning =
  | { type: 'capacity'; required: number; capacity: number }
  | { type: 'room_type'; expected: RoomType[]; actual: RoomType }

export interface SaveOptions {
  /** Save despite capacity / room type warnings (force_capacity=true). */
  force?: boolean
}

/** Error format of all endpoints (docs/07, section 6). */
export interface ApiErrorBody {
  error?: { code: string; message: string; details?: Record<string, unknown> }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: Record<string, unknown>

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export interface ApiClient {
  login(email: string, password: string): Promise<{ token: string; user: User }>
  getReferenceData(): Promise<ReferenceData>
  getSchedule(query: ScheduleQuery): Promise<ScheduleEntry[]>
  getFreeRooms(query: FreeRoomsQuery): Promise<Room[]>
  createEntry(input: ScheduleEntryInput, options?: SaveOptions): Promise<ScheduleEntry>
  updateEntry(id: number, input: ScheduleEntryInput, options?: SaveOptions): Promise<ScheduleEntry>
  deleteEntry(id: number): Promise<void>

  // Teaching load, constraints and AI assistant (FR-23, FR-24, FR-31, FR-32)
  getTeachingLoad(): Promise<LoadItem[]>
  getConstraints(): Promise<ConstraintRule[]>
  createConstraint(input: ConstraintInput): Promise<ConstraintRule>
  deleteConstraint(id: number): Promise<void>
  parseConstraint(text: string): Promise<ParseResult>
  explainRun(runId: number, language: string): Promise<string>

  // Generation (FR-25 – FR-28, FR-30)
  startGeneration(params: GenerationParams): Promise<GenerationRun>
  getGenerationRun(id: number): Promise<GenerationRun>
  publishRun(id: number): Promise<GenerationRun>
}
