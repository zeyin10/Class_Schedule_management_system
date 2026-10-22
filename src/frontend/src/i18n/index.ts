import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import kk from './kk.json'
import ru from './ru.json'

export const LANGUAGES = [
  { code: 'kk', label: 'ҚАЗ' },
  { code: 'ru', label: 'РУС' },
  { code: 'en', label: 'ENG' },
] as const

const KEY = 'csm.lang'

function initialLanguage(): string {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved
  } catch {
    // storage unavailable
  }
  const browser = navigator.language.slice(0, 2)
  return LANGUAGES.some((l) => l.code === browser) ? browser : 'ru'
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ru: { translation: ru }, kk: { translation: kk } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

// NFR-10: the chosen language persists for the user.
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(KEY, lng)
  } catch {
    // ignore
  }
})

export default i18n
