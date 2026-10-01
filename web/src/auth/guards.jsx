import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './AuthContext.jsx'
import StatePanel from '../components/StatePanel.jsx'
import FullPageSpinner from '../components/FullPageSpinner.jsx'

// Sends logged-out visitors to /login and brings them back afterwards.
export function RequireAuth() {
  const { status, sessionEnded } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <FullPageSpinner />
  if (status === 'out') {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}${sessionEnded ? '&ended=1' : ''}`} replace />
  }
  return <Outlet />
}

export function RequireAdmin() {
  const { user } = useAuth()
  if (user?.role !== 'admin') {
    return (
      <StatePanel
        kind="denied"
        title="Only admins can change prices"
        text="Ask an admin if a material rate looks wrong. You can still see every rate on the estimate."
        actions={[{ label: 'Back to projects', to: '/dashboard' }]}
      />
    )
  }
  return <Outlet />
}

// Logged-in people skip the login and sign-up pages. This is also how those pages
// move on after a successful login: ?next= if given, else projects (or plot setup
// for a brand new account).
export function GuestOnly() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <FullPageSpinner />
  if (status === 'in') {
    const next = new URLSearchParams(location.search).get('next')
    const fallback = location.pathname === '/register' ? '/projects/new' : '/dashboard'
    return <Navigate to={safeNext(next, fallback)} replace />
  }
  return <Outlet />
}

// Only same-site paths, so ?next= can't send people to another website.
export function safeNext(next, fallback = '/dashboard') {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}
