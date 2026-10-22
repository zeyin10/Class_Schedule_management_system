import type { User } from '../api/types'

const KEY = 'csm.session'

export interface Session {
  token: string
  user: User
}

// Storage can be unavailable (private mode, blocked site data) - the app then
// simply forgets the session on reload.
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // ignore
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
