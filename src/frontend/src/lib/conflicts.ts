import type {
  ConflictDetail,
  Group,
  LessonType,
  Room,
  RoomType,
  RoomWarning,
  ScheduleEntry,
  ScheduleEntryInput,
  WeekPattern,
} from '../api/types'

/** 'every' overlaps with everything; 'odd' and 'even' never overlap each other. */
export function parityOverlaps(a: WeekPattern, b: WeekPattern): boolean {
  return a === 'every' || b === 'every' || a === b
}

/**
 * Same rule as the PostgreSQL EXCLUDE constraints (docs/07, section 5):
 * a teacher, room or group cannot have two lessons in the same term, weekday,
 * time slot and overlapping week parity. The backend is the final guard;
 * this check only gives fast feedback.
 */
export function findConflicts(
  candidate: ScheduleEntryInput & { id?: number },
  entries: ScheduleEntry[],
): ConflictDetail[] {
  const conflicts: ConflictDetail[] = []
  for (const entry of entries) {
    if (candidate.id !== undefined && entry.id === candidate.id) continue
    if (
      entry.term_id !== candidate.term_id ||
      entry.weekday !== candidate.weekday ||
      entry.time_slot_id !== candidate.time_slot_id ||
      !parityOverlaps(entry.week_pattern, candidate.week_pattern)
    ) {
      continue
    }
    if (entry.teacher_id === candidate.teacher_id) conflicts.push({ type: 'teacher', entry })
    if (entry.room_id === candidate.room_id) conflicts.push({ type: 'room', entry })
    for (const groupId of candidate.group_ids) {
      if (entry.group_ids.includes(groupId)) conflicts.push({ type: 'group', entry, group_id: groupId })
    }
  }
  return conflicts
}

const SUITABLE_ROOMS: Record<LessonType, RoomType[]> = {
  lecture: ['lecture'],
  practice: ['classroom', 'lab'],
  lab: ['lab'],
}

export function suitableRoomTypes(lessonType: LessonType): RoomType[] {
  return SUITABLE_ROOMS[lessonType]
}

/** FR-09: capacity and room type warnings (can be overridden by the admin). */
export function checkRoom(candidate: ScheduleEntryInput, room: Room, groups: Group[]): RoomWarning[] {
  const warnings: RoomWarning[] = []
  const required = groups
    .filter((g) => candidate.group_ids.includes(g.id))
    .reduce((sum, g) => sum + g.size, 0)
  if (required > room.capacity) {
    warnings.push({ type: 'capacity', required, capacity: room.capacity })
  }
  const expected = suitableRoomTypes(candidate.lesson_type)
  if (!expected.includes(room.room_type)) {
    warnings.push({ type: 'room_type', expected, actual: room.room_type })
  }
  return warnings
}
