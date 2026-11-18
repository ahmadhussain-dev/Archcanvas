import { Link } from 'react-router'
import MarketingNav from '../../layouts/MarketingNav.jsx'
import Footer from '../../layouts/Footer.jsx'
import Icon from '../../components/Icon.jsx'
import TemplateGallery from './TemplateGallery.jsx'

// /templates: every ready-made house, one per plot size.
export default function Templates() {
  return (
    <div className="min-h-screen bg-white text-navy">
      <MarketingNav />
      <main className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 font-heading text-[28px] font-bold tracking-[-0.6px] sm:text-4xl">Pakistani house templates</h1>
          <p className="m-0 max-w-[680px] text-base leading-normal text-muted">
            A furnished double-storey house for every common plot, from 2 Marla to 2 Kanal. Open one to see both floors, then use it as
            the start of your own project. Every wall, door and piece of furniture stays editable.
          </p>
        </div>
        <TemplateGallery quickUse />
        <Link to="/projects/new" className="inline-flex items-center gap-1 self-start font-semibold no-underline">
          Or start from an empty plot of any size <Icon name="arrow_r" size={16} />
        </Link>
      </main>
      <Footer />
    </div>
  )
}
