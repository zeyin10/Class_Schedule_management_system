import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { LANGUAGES } from '../i18n'

function LanguageSwitcher() {
  const { i18n } = useTranslation()
  return (
    <div className="lang" role="group" aria-label="Language">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          className={i18n.language === l.code ? 'lang__btn lang__btn--active' : 'lang__btn'}
          aria-pressed={i18n.language === l.code}
          onClick={() => void i18n.changeLanguage(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

export function Layout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app">
      <header className="header">
        <div className="header__top">
          <Link to="/schedule" className="brand">
            <span className="brand__mark" aria-hidden>
              ▦
            </span>
            {t('app.title')}
          </Link>
          <div className="header__right">
            <LanguageSwitcher />
            {user ? (
              <div className="user">
                <span className="user__name">
                  {user.full_name} · {t(`roles.${user.role}`)}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    logout()
                    navigate('/schedule')
                  }}
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn--primary">
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/schedule">{t('nav.schedule')}</NavLink>
          {(user?.role === 'student' || user?.role === 'teacher') && <NavLink to="/my">{t('nav.my')}</NavLink>}
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <NavLink to="/rooms/free">{t('nav.freeRooms')}</NavLink>
          )}
          {user?.role === 'admin' && <NavLink to="/admin">{t('nav.admin')}</NavLink>}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
