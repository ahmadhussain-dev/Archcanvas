import { Link } from 'react-router'
import Logo from '../components/Logo.jsx'
import Button from '../components/Button.jsx'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex h-16 items-center border-b border-line px-6">
        <Link to="/" aria-label="ArchCanvas home">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto flex max-w-xl flex-col gap-5 px-6 py-24">
        <span className="font-mono text-blueprint">Error 404</span>
        <h1 className="text-5xl font-bold tracking-tight">This page isn&apos;t on the plan</h1>
        <p className="text-lg text-muted">The link may be old, or the page has moved. Your projects are safe.</p>
        <div className="flex gap-3">
          <Button as={Link} to="/dashboard" variant="navy">Go to my projects</Button>
          <Button as={Link} to="/">Back to home</Button>
        </div>
      </main>
    </div>
  )
}
