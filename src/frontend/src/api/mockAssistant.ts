// Stand-in for the LLM behind POST /assistant/parse-constraint and /assistant/explain.
// The real assistant (docs/07, AD-8) asks a language model to fill the same JSON
// schema; this keyword matcher only lets the screens be tried without an API key.
// Like the real one, it never guesses unknown names.
import type { ConstraintInput, GenerationRun, ParseResult, ReferenceData } from './types'

/** Spellings that admins type for the demo teachers (Cyrillic, stems for case endings). */
export const TEACHER_ALIASES: Record<number, string[]> = {
  1: ['bekov', 'беков'],
  2: ['omarov', 'омаров'],
  3: ['zhakupov', 'жакупов', 'жақыпов'],
  4: ['kassymov', 'касымов', 'қасымов'],
  5: ['tulegenov', 'тулегенов', 'төлегенов'],
}

const WEEKDAYS: [number, string[]][] = [
  [1, ['monday', 'понедельник', 'дүйсенбі']],
  [2, ['tuesday', 'вторник', 'сейсенбі']],
  [3, ['wednesday', 'сред', 'сәрсенбі']],
  [4, ['thursday', 'четверг', 'бейсенбі']],
  [5, ['friday', 'пятниц', 'жұма']],
  [6, ['saturday', 'суббот', 'сенбі']],
]

const MORNING = ['morning', 'утр', 'таңертең', 'таңғы']
const AFTERNOON = ['afternoon', 'после обеда', 'после обед', 'түстен кейін', 'түстен']
const UNAVAILABLE = ['cannot', "can't", 'not available', 'unavailable', 'does not teach', 'не может', 'не сможет', 'не ведет', 'не ведёт', 'занят', 'алмайды', 'бос емес']
const AVOID = ['avoid', 'rather not', 'нежелательно', 'лучше не', 'не хочет', 'не хотел', 'қаламайды']
const PREFER = ['prefer', 'would like', 'wants', 'предпочита', 'хочет', 'хотел бы', 'қалайды', 'ыңғайлы']
const AT_MOST = ['at most', 'no more than', 'max', 'не более', 'не больше', 'максимум', 'артық емес', 'көп емес', 'аспауы']

const MORNING_SLOTS = [1, 2, 3, 4]
const AFTERNOON_SLOTS = [5, 6, 7, 8]

const has = (text: string, words: string[]) => words.some((w) => text.includes(w))

function tokens(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}\p{N}'-]+/u).filter(Boolean)
}

function findWeekday(words: string[]): number | null {
  for (const [day, names] of WEEKDAYS) {
    if (words.some((w) => names.some((n) => w.startsWith(n)))) return day
  }
  return null
}

function findTeacher(words: string[], reference: ReferenceData): number | null {
  for (const t of reference.teachers) {
    const stems = [...(TEACHER_ALIASES[t.id] ?? []), t.full_name.split(' ').pop()!.toLowerCase()]
    if (words.some((w) => stems.some((s) => w.startsWith(s)))) return t.id
  }
  return null
}

const SURNAME_ENDING = /(ов|ова|ев|ева|ин|ина|ұлы|қызы|ov|ova|ev|eva|in|ina|enko)$/u

/** A capitalised word that is not a day — probably a person who is not in the teacher list. */
function unknownName(text: string): string | null {
  const known = WEEKDAYS.flatMap(([, n]) => n)
  const words = text.split(/[^\p{L}-]+/u).filter(Boolean)
  const candidates = words.filter(
    (w, i) =>
      /^\p{Lu}\p{Ll}{2,}/u.test(w) &&
      !known.some((k) => w.toLowerCase().startsWith(k)) &&
      // the first word is capitalised anyway; count it only if it looks like a surname
      (i > 0 || SURNAME_ENDING.test(w.toLowerCase())),
  )
  return candidates[0] ?? null
}

export function parseConstraintText(text: string, reference: ReferenceData): ParseResult {
  const lower = text.toLowerCase()
  const words = tokens(text)
  const weekday = findWeekday(words)
  const slotIds = has(lower, AFTERNOON) ? AFTERNOON_SLOTS : has(lower, MORNING) ? MORNING_SLOTS : [...MORNING_SLOTS, ...AFTERNOON_SLOTS]
  const source_text = text.trim()

  const group = reference.groups.find((g) => lower.includes(g.code.toLowerCase()))
  // the group code itself contains digits, so look for the number elsewhere
  const number = (group ? lower.replace(group.code.toLowerCase(), ' ') : lower).match(/\d+/)
  if (group && number && has(lower, AT_MOST)) {
    const constraint: ConstraintInput = { type: 'group_max_per_day', group_id: group.id, max: Number(number[0]), hard: true, source_text }
    return { status: 'ok', constraint }
  }

  const teacherId = findTeacher(words, reference)
  if (teacherId === null) {
    const name = unknownName(text)
    return name ? { status: 'unknown_name', name } : { status: 'not_understood' }
  }
  if (has(lower, AVOID)) {
    return { status: 'ok', constraint: { type: 'teacher_preference', kind: 'avoid', teacher_id: teacherId, weekday, slot_ids: slotIds, hard: false, source_text } }
  }
  if (has(lower, UNAVAILABLE)) {
    return { status: 'ok', constraint: { type: 'teacher_unavailable', teacher_id: teacherId, weekday, slot_ids: slotIds, hard: true, source_text } }
  }
  if (has(lower, PREFER)) {
    return { status: 'ok', constraint: { type: 'teacher_preference', kind: 'prefer', teacher_id: teacherId, weekday, slot_ids: slotIds, hard: false, source_text } }
  }
  return { status: 'not_understood' }
}

type Lang = 'kk' | 'ru' | 'en'

const TEXT: Record<Lang, Record<string, (p: Record<string, string | number>) => string>> = {
  en: {
    intro: () => 'No timetable can satisfy all hard constraints. Reasons found by the pre-check:',
    teacher_overload: (p) => `• ${p.name} must teach ${p.required} lessons a week but is available in only ${p.available} slots. Remove some unavailability rules for this teacher or move part of the load to a colleague.`,
    group_overload: (p) => `• Group ${p.name} has ${p.required} lessons but only ${p.available} places are allowed by its daily limit. Raise the limit or reduce the load.`,
    no_room: (p) => `• "${p.name}" needs a room for ${p.required} students of type ${p.available}, but there is none. Split the groups or add a room.`,
    unplaced: (p) => `• "${p.name}" could not be placed without a conflict. Check the availability of its teacher and groups.`,
    done: (p) => `The draft places ${p.placed} of ${p.required} lessons with no hard-constraint violations. The weighted penalty is ${p.penalty}: ${p.gaps} gaps in group timetables, ${p.prefs} lessons outside teacher preferences, ${p.days} overloaded days, ${p.last} lessons in the last slot. To reduce gaps, raise their weight and generate again.`,
  },
  ru: {
    intro: () => 'Ни одно расписание не может выполнить все жёсткие ограничения. Причины по результатам проверки:',
    teacher_overload: (p) => `• ${p.name} должен(на) вести ${p.required} пар в неделю, но свободен(на) только в ${p.available} слотах. Снимите часть ограничений недоступности или передайте часть нагрузки коллеге.`,
    group_overload: (p) => `• У группы ${p.name} ${p.required} пар, а дневной лимит допускает только ${p.available}. Увеличьте лимит или уменьшите нагрузку.`,
    no_room: (p) => `• Для «${p.name}» нужна аудитория на ${p.required} студентов типа ${p.available}, но такой нет. Разделите группы или добавьте аудиторию.`,
    unplaced: (p) => `• «${p.name}» не удалось поставить без конфликта. Проверьте доступность преподавателя и групп.`,
    done: (p) => `Черновик размещает ${p.placed} из ${p.required} занятий без нарушений жёстких ограничений. Штраф: ${p.penalty} — окон у групп: ${p.gaps}, занятий вне пожеланий преподавателей: ${p.prefs}, перегруженных дней: ${p.days}, занятий в последнем слоте: ${p.last}. Чтобы уменьшить окна, увеличьте их вес и сгенерируйте снова.`,
  },
  kk: {
    intro: () => 'Барлық қатаң шектеулерді орындайтын кесте жоқ. Тексеру нәтижесіндегі себептер:',
    teacher_overload: (p) => `• ${p.name} аптасына ${p.required} сабақ беруі керек, бірақ тек ${p.available} уақытта бос. Осы оқытушының бос емес уақыттарын азайтыңыз немесе жүктеменің бір бөлігін әріптесіне беріңіз.`,
    group_overload: (p) => `• ${p.name} тобында ${p.required} сабақ бар, ал күндік шек тек ${p.available} орынға рұқсат береді. Шекті көбейтіңіз немесе жүктемені азайтыңыз.`,
    no_room: (p) => `• «${p.name}» үшін ${p.required} студентке арналған ${p.available} түріндегі аудитория керек, бірақ ондай жоқ. Топтарды бөліңіз немесе аудитория қосыңыз.`,
    unplaced: (p) => `• «${p.name}» сабағын қақтығыссыз қою мүмкін болмады. Оқытушы мен топтардың бос уақытын тексеріңіз.`,
    done: (p) => `Жоба ${p.required} сабақтың ${p.placed} сабағын қатаң шектеулерді бұзбай орналастырады. Айыппұл: ${p.penalty} — топтардағы терезелер: ${p.gaps}, оқытушы тілегінен тыс сабақтар: ${p.prefs}, артық жүктелген күндер: ${p.days}, соңғы уақыттағы сабақтар: ${p.last}. Терезелерді азайту үшін олардың салмағын көбейтіп, қайта құрыңыз.`,
  },
}

/** Explanation built only from facts in the run report (FR-32: no invented numbers or names). */
export function explainRunText(run: GenerationRun, reference: ReferenceData, loadTitle: (loadId: number) => string, lang: string): string {
  const t = TEXT[(['kk', 'ru', 'en'].includes(lang) ? lang : 'en') as Lang]
  if (run.status === 'done' && run.report) {
    const r = run.report
    return t.done({ placed: r.placed, required: r.required, penalty: r.penalty, gaps: r.gaps, prefs: r.preference_violations, days: r.overloaded_days, last: r.last_slot_lessons })
  }
  const lines = [t.intro({})]
  for (const reason of run.reasons ?? []) {
    if (reason.type === 'teacher_overload') {
      const name = reference.teachers.find((x) => x.id === reason.teacher_id)?.full_name ?? '?'
      lines.push(t.teacher_overload({ name, required: reason.required, available: reason.available }))
    } else if (reason.type === 'group_overload') {
      const name = reference.groups.find((x) => x.id === reason.group_id)?.code ?? '?'
      lines.push(t.group_overload({ name, required: reason.required, available: reason.available }))
    } else if (reason.type === 'no_room') {
      lines.push(t.no_room({ name: loadTitle(reason.load_id), required: reason.students, available: reason.room_types.join('/') }))
    } else {
      lines.push(t.unplaced({ name: loadTitle(reason.load_id) }))
    }
  }
  return lines.join('\n')
}
