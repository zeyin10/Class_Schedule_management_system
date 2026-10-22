import type { Course, Group, ReferenceData, Room, Teacher, TimeSlot } from '../api/types'

export interface Lookup {
  group(id: number): Group | undefined
  teacher(id: number): Teacher | undefined
  room(id: number): Room | undefined
  course(id: number): Course | undefined
  slot(id: number): TimeSlot | undefined
  slots: TimeSlot[]
}

function byId<T extends { id: number }>(items: T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]))
}

export function buildLookup(ref: ReferenceData): Lookup {
  const groups = byId(ref.groups)
  const teachers = byId(ref.teachers)
  const rooms = byId(ref.rooms)
  const courses = byId(ref.courses)
  const slots = byId(ref.timeSlots)
  return {
    group: (id) => groups.get(id),
    teacher: (id) => teachers.get(id),
    room: (id) => rooms.get(id),
    course: (id) => courses.get(id),
    slot: (id) => slots.get(id),
    slots: [...ref.timeSlots].sort((a, b) => a.number - b.number),
  }
}
