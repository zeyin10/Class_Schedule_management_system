import { useTranslation } from 'react-i18next'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { RequireRole } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { AdminEntriesPage } from './pages/AdminEntriesPage'
import { FreeRoomsPage } from './pages/FreeRoomsPage'
import { GenerationPage } from './pages/GenerationPage'
import { LoadPage } from './pages/LoadPage'
import { LoginPage } from './pages/LoginPage'
import { MySchedulePage } from './pages/MySchedulePage'
import { SchedulePage } from './pages/SchedulePage'

function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="stack">
      <h1>{t('common.notFound')}</h1>
      <Link to="/schedule">{t('common.back')}</Link>
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/schedule" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route
          path="my"
          element={
            <RequireRole roles={['student', 'teacher']}>
              <MySchedulePage />
            </RequireRole>
          }
        />
        <Route
          path="rooms/free"
          element={
            <RequireRole roles={['teacher', 'admin']}>
              <FreeRoomsPage />
            </RequireRole>
          }
        />
        <Route
          path="admin"
          element={
            <RequireRole roles={['admin']}>
              <AdminEntriesPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/load"
          element={
            <RequireRole roles={['admin']}>
              <LoadPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/generate"
          element={
            <RequireRole roles={['admin']}>
              <GenerationPage />
            </RequireRole>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
