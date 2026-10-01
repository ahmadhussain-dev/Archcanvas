import { Link } from 'react-router'
import Logo from '../components/Logo.jsx'

export default function Placeholder({ title, app = false }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="flex h-16 items-center justify-between border-b border-line bg-white px-6">
        <Link to="/" aria-label="ArchCanvas home">
          <Logo />
        </Link>
        <span className="text-sm text-muted">{app ? 'App' : 'Public'}</span>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-16">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted">This screen is set up but not built yet. The design is in the approved UI preview.</p>
      </main>
    </div>
  )
}
