import { useState } from 'react'
import { Link } from 'react-router'
import Logo from '../components/Logo.jsx'
import Button from '../components/Button.jsx'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

const LINKS = [
  { label: 'Product', href: '/#product' },
  { label: 'Templates', href: '/#templates' },
  { label: 'Learn', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' }
]

export default function MarketingNav() {
  const { status } = useAuth()
  const [open, setOpen] = useState(false)
  const loggedIn = status === 'in'

  const actions = loggedIn ? (
    <Button as={Link} to="/dashboard" variant="navy">My projects</Button>
  ) : (
    <>
      <Button as={Link} to="/login">Log in</Button>
      <Button as={Link} to="/register?next=/projects/new" variant="primary">Start designing free</Button>
    </>
  )

  return (
    <nav className="border-b border-line bg-white" aria-label="Main">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-12">
          <Link to="/" aria-label="ArchCanvas home" className="no-underline">
            <Logo size={26} />
          </Link>
          <div className="hidden gap-7 lg:flex">
            {LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-[15px] font-medium text-navy no-underline hover:text-blueprint">
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <div className="hidden gap-3 md:flex">{actions}</div>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-control border border-line-strong text-navy md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? 'x' : 'dots'} />
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-3 border-t border-line px-4 py-4 md:hidden">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="py-1 font-medium text-navy no-underline">
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2 [&>*]:w-full">{actions}</div>
        </div>
      )}
    </nav>
  )
}
