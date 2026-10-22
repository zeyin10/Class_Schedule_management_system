// Synthetic demo data (no real people). The seed schedule is conflict-free.
import type { ReferenceData, ScheduleEntry, User } from './types'

export const referenceData: ReferenceData = {
  groups: [
    { id: 1, code: 'SE-2431', size: 25 },
    { id: 2, code: 'SE-2432', size: 24 },
    { id: 3, code: 'CS-2401', size: 28 },
    { id: 4, code: 'IT-2402', size: 22 },
  ],
  teachers: [
    { id: 1, full_name: 'Aliya Bekova' },
    { id: 2, full_name: 'Daniyar Omarov' },
    { id: 3, full_name: 'Saule Zhakupova' },
    { id: 4, full_name: 'Yerlan Kassymov' },
    { id: 5, full_name: 'Madina Tulegenova' },
  ],
  rooms: [
    { id: 1, name: 'C1.1.239', building: 'C1', capacity: 120, room_type: 'lecture' },
    { id: 2, name: 'C1.3.234', building: 'C1', capacity: 30, room_type: 'classroom' },
    { id: 3, name: 'C1.2.248', building: 'C1', capacity: 26, room_type: 'lab' },
    { id: 4, name: 'C1.3.361', building: 'C1', capacity: 40, room_type: 'classroom' },
    { id: 5, name: 'C1.2.250', building: 'C1', capacity: 30, room_type: 'lab' },
    { id: 6, name: 'C1.1.252', building: 'C1', capacity: 20, room_type: 'classroom' },
  ],
  courses: [
    { id: 1, code: 'SE301', title: 'Software Engineering' },
    { id: 2, code: 'DB201', title: 'Databases' },
    { id: 3, code: 'WD220', title: 'Web Development' },
    { id: 4, code: 'MA101', title: 'Calculus' },
    { id: 5, code: 'AL110', title: 'Algorithms and Data Structures' },
    { id: 6, code: 'EN150', title: 'Academic English' },
  ],
  timeSlots: [
    { id: 1, number: 1, start_time: '08:00', end_time: '08:50' },
    { id: 2, number: 2, start_time: '09:00', end_time: '09:50' },
    { id: 3, number: 3, start_time: '10:00', end_time: '10:50' },
    { id: 4, number: 4, start_time: '11:00', end_time: '11:50' },
    { id: 5, number: 5, start_time: '12:00', end_time: '12:50' },
    { id: 6, number: 6, start_time: '13:00', end_time: '13:50' },
    { id: 7, number: 7, start_time: '14:00', end_time: '14:50' },
    { id: 8, number: 8, start_time: '15:00', end_time: '15:50' },
  ],
}

type Seed = [number, ScheduleEntry['lesson_type'], number, number, number[], number, number, ScheduleEntry['week_pattern']]

// [course, lesson type, teacher, room, groups, weekday, time slot, week pattern]
const seed: Seed[] = [
  [1, 'lecture', 1, 1, [1, 2], 1, 1, 'every'],
  [1, 'practice', 1, 2, [1], 1, 2, 'every'],
  [2, 'lecture', 2, 1, [1, 2], 1, 3, 'every'],
  [2, 'lab', 2, 3, [1], 2, 1, 'odd'],
  [2, 'lab', 2, 3, [2], 2, 1, 'even'],
  [3, 'lecture', 3, 1, [1, 2, 3], 2, 3, 'every'],
  [3, 'lab', 3, 5, [1], 3, 2, 'every'],
  [4, 'lecture', 4, 1, [3, 4], 1, 2, 'every'],
  [4, 'practice', 4, 4, [3], 3, 1, 'every'],
  [5, 'lecture', 5, 1, [3, 4], 3, 3, 'every'],
  [5, 'practice', 5, 2, [4], 4, 2, 'every'],
  [6, 'practice', 1, 4, [1], 4, 1, 'every'],
  [6, 'practice', 1, 4, [2], 4, 2, 'every'],
  [1, 'practice', 1, 2, [2], 5, 1, 'every'],
  [5, 'lab', 5, 5, [3], 5, 2, 'odd'],
  [3, 'lab', 3, 3, [2], 5, 3, 'every'],
  [4, 'practice', 4, 4, [4], 5, 1, 'even'],
  [2, 'practice', 2, 2, [3], 4, 3, 'every'],
]

export function seedEntries(): ScheduleEntry[] {
  return seed.map(([course_id, lesson_type, teacher_id, room_id, group_ids, weekday, time_slot_id, week_pattern], i) => ({
    id: i + 1,
    term_id: 1,
    course_id,
    lesson_type,
    teacher_id,
    room_id,
    group_ids,
    weekday,
    time_slot_id,
    week_pattern,
  }))
}

export const DEMO_PASSWORD = 'demo123'

export const demoUsers: User[] = [
  { id: 1, email: 'student@demo.kz', full_name: 'Student Demo (SE-2431)', role: 'student', group_id: 1 },
  { id: 2, email: 'teacher@demo.kz', full_name: 'Aliya Bekova', role: 'teacher', teacher_id: 1 },
  { id: 3, email: 'admin@demo.kz', full_name: 'Schedule Admin', role: 'admin' },
]
