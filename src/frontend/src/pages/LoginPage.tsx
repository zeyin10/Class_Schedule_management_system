import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { DEMO_PASSWORD, demoUsers } from '../api/mockData'
import { homePath, useAuth } from '../auth/AuthContext'

const showDemo = import.meta.env.VITE_USE_MOCK !== 'false'

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(false)
    try {
      const user = await login(email, password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? homePath(user.role), { replace: true })
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card card--narrow">
      <h1>{t('login.title')}</h1>
      <form onSubmit={submit} className="stack">
        <div className="field">
          <label htmlFor="email">{t('login.email')}</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">{t('login.password')}</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="alert alert--error" role="alert">
            {t('login.error')}
          </p>
        )}
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {t('login.submit')}
        </button>
        <Link to="/schedule" className="link-muted">
          {t('login.guest')}
        </Link>
      </form>

      {showDemo && (
        <div className="demo">
          <p className="demo__title">{t('login.demo')}</p>
          {demoUsers.map((u) => (
            <button
              key={u.id}
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => {
                setEmail(u.email)
                setPassword(DEMO_PASSWORD)
              }}
            >
              {t(`roles.${u.role}`)}: {u.email}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
