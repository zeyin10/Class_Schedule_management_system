import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api } from '../api'
import type { Role, User } from '../api/types'
import { clearSession, loadSession, saveSession } from './session'

interface AuthContextValue {
  user: User | null
  login(email: string, password: string): Promise<User>
  logout(): void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadSession()?.user ?? null)

  const login = useCallback(async (email: string, password: string) => {
    const session = await api.login(email, password)
    saveSession(session)
    setUser(session.user)
    return session.user
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export function homePath(role: Role): string {
  return role === 'admin' ? '/admin' : '/my'
}

/** FR-02 on the client side: hides pages the role cannot use (the API enforces it too). */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!roles.includes(user.role)) return <Navigate to={homePath(user.role)} replace />
  return <>{children}</>
}
