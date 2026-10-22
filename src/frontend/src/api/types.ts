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
}
