import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

function AccountMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  async function signOut() {
    await logout().catch(() => {})
    navigate('/', { replace: true })
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="size-8 cursor-pointer rounded-full border-0 bg-blueprint-tint text-[13px] font-semibold text-blueprint-hover"
      >
        {initials(user?.name)}
      </button>
      {open && (
        <div className="absolute top-10 right-0 z-30 w-60 rounded-card border border-line bg-white p-2 shadow-[0_10px_28px_rgba(19,32,44,0.12)]">
          <div className="flex flex-col px-2 py-1.5">
            <b className="truncate text-sm">{user?.name}</b>
            <span className="truncate text-[13px] text-muted">{user?.email}</span>
          </div>
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            onClick={signOut}
            className="w-full cursor-pointer rounded-md border-0 bg-transparent px-2 py-2 text-left text-sm font-medium text-navy hover:bg-paper"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

const linkClass = ({ isActive }) =>
  `inline-flex h-14 items-center border-b-2 px-0.5 text-sm no-underline ${
    isActive ? 'border-blueprint font-semibold text-navy hover:text-navy' : 'border-transparent font-medium text-muted hover:text-navy'
  }`

// Signed-in pages: a slim top bar, then the page.
export default function AppLayout() {
  const { user } = useAuth()
  return (
    <div className="flex min-h-screen flex-col bg-paper text-navy">
      <nav className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4 sm:px-6" aria-label="App">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" aria-label="ArchCanvas projects" className="no-underline">
            <Logo size={20} />
          </Link>
          <div className="flex gap-6">
            <NavLink to="/dashboard" className={linkClass}>Projects</NavLink>
            {user?.role === 'admin' && <NavLink to="/admin/prices" className={linkClass}>Prices</NavLink>}
          </div>
        </div>
        <AccountMenu />
      </nav>
      <div className="flex grow flex-col">
        <Outlet />
      </div>
    </div>
  )
}
