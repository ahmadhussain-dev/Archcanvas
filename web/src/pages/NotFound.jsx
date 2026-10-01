import { Link } from 'react-router'
import MarketingNav from '../layouts/MarketingNav.jsx'
import Button from '../components/Button.jsx'
import Icon from '../components/Icon.jsx'
import Art from '../components/Art.jsx'
import notFound from '../art/not-found.svg?raw'

const LINKS = [
  ['Start a new plot', '/projects/new'],
  ['Browse templates', '/#templates'],
  ['How ArchCanvas works', '/#how-it-works']
]

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-navy">
      <MarketingNav />
      <main className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-4 py-14 sm:px-6 sm:py-[72px] lg:grid-cols-[460px_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <span className="font-mono text-[15px] text-blueprint">Error 404</span>
          <h1 className="m-0 text-[36px] leading-[1.08] font-bold tracking-[-1.4px] sm:text-5xl">This page isn&apos;t on the plan</h1>
          <p className="m-0 text-[17px] leading-relaxed text-muted">The link may be old, or the page has moved. Your projects are safe.</p>
          <div className="flex flex-wrap gap-3">
            <Button as={Link} to="/dashboard" variant="navy" size="lg">Go to my projects</Button>
            <Button as={Link} to="/" size="lg">Back to home</Button>
          </div>
          <div className="mt-3 flex flex-col">
            {LINKS.map(([t, href]) => (
              <Link key={t} to={href} className="flex items-center justify-between border-b border-line py-3 text-[15px] font-medium no-underline">
                {t}
                <Icon name="arrow_r" size={16} />
              </Link>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <Art svg={notFound} className="w-full max-w-[600px]" />
        </div>
      </main>
    </div>
  )
}
