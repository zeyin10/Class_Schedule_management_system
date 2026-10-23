import { parseConstraintText } from './mockAssistant'
import { referenceData } from './mockData'

const parse = (text: string) => parseConstraintText(text, referenceData)

// Frontend-level version of T-AI-01 / T-AI-02 (docs/09) for the mock assistant.
describe('mock AI assistant', () => {
  it.each([
    ['Omarov cannot teach on Friday afternoon', { type: 'teacher_unavailable', teacher_id: 2, weekday: 5, slot_ids: [5, 6, 7, 8], hard: true }],
    ['Омаров не может вести в пятницу после обеда', { type: 'teacher_unavailable', teacher_id: 2, weekday: 5, slot_ids: [5, 6, 7, 8], hard: true }],
    ['Омаров жұма күні түстен кейін сабақ бере алмайды', { type: 'teacher_unavailable', teacher_id: 2, weekday: 5, slot_ids: [5, 6, 7, 8], hard: true }],
    ['Бекова предпочитает вести пары утром', { type: 'teacher_preference', kind: 'prefer', teacher_id: 1, weekday: null, slot_ids: [1, 2, 3, 4], hard: false }],
    ['Касымову нежелательно ставить пары в понедельник', { type: 'teacher_preference', kind: 'avoid', teacher_id: 4, weekday: 1, hard: false }],
    ['SE-2431 тобында күніне 3 сабақтан артық емес', { type: 'group_max_per_day', group_id: 1, max: 3, hard: true }],
    ['No more than 4 lessons a day for CS-2401', { type: 'group_max_per_day', group_id: 3, max: 4, hard: true }],
  ])('understands "%s"', (text, expected) => {
    const result = parse(text)
    expect(result.status).toBe('ok')
    if (result.status === 'ok') expect(result.constraint).toMatchObject({ ...expected, source_text: text })
  })

  it('does not guess an unknown teacher', () => {
    expect(parse('Иванов не может вести в пятницу')).toEqual({ status: 'unknown_name', name: 'Иванов' })
  })

  it('reports text it does not understand', () => {
    expect(parse('hello')).toEqual({ status: 'not_understood' })
  })
})
