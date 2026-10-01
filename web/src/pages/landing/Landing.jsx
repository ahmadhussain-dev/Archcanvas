import { useState } from 'react'
import { Link } from 'react-router'
import MarketingNav from '../../layouts/MarketingNav.jsx'
import Footer from '../../layouts/Footer.jsx'
import Button from '../../components/Button.jsx'
import Icon from '../../components/Icon.jsx'
import Art from '../../components/Art.jsx'
import Laptop from '../../components/Laptop.jsx'
import Logo from '../../components/Logo.jsx'
import StepCards from './StepCards.jsx'
import HeroVisual from './HeroVisual.jsx'
import thumbHouse from '../../art/thumb-house.svg?raw'
import iso from '../../art/iso-house.svg?raw'
import aiBefore from '../../art/thumb-ai-before.svg?raw'
import aiAfter from '../../art/thumb-ai-after.svg?raw'
import preset3 from '../../art/preset-3-marla.svg?raw'
import preset5 from '../../art/preset-5-marla.svg?raw'
import preset10 from '../../art/preset-10-marla.svg?raw'
import planCheck from '../../art/plan-check.svg?raw'
import screenHowto from '../../art/screen-howto.html?raw'
import screenSheet from '../../art/screen-sheet.html?raw'
import tpl3 from '../../art/template-3-marla.svg?raw'
import tpl5 from '../../art/template-5-marla.svg?raw'
import tpl7 from '../../art/template-7-marla.svg?raw'
import tpl10 from '../../art/template-10-marla.svg?raw'
import tplCorner from '../../art/template-corner.svg?raw'
import tplNarrow from '../../art/template-narrow.svg?raw'

const START = '/register?next=/projects/new'
const section = 'mx-auto max-w-[1280px] px-4 sm:px-6'
const h2 = 'm-0 font-heading text-[28px] font-bold leading-[1.15] tracking-[-0.8px] sm:text-4xl'
const eyebrow = 'text-sm font-semibold text-blueprint'

function Top() {
  return (
    <section className={`${section} flex flex-col items-center gap-5 pt-14 pb-10 text-center sm:pt-[72px]`}>
      <span className="text-[15px] font-semibold text-blueprint">Made for Pakistani plots · Marla and Kanal</span>
      <h1 className="m-0 font-heading text-[38px] leading-[1.08] font-bold tracking-[-1.2px] sm:text-[60px] sm:tracking-[-1.8px]">
        Design a house that actually fits{' '}
        <span className="relative inline-block">
          your plot.
          <svg width="100%" height="16" viewBox="0 0 250 16" preserveAspectRatio="none" aria-hidden="true" className="absolute -bottom-2.5 left-0">
            <path d="M4 10 C 60 3, 150 2, 246 7" pathLength="100" className="ac-draw" fill="none" stroke="#1E5AA8" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </span>
      </h1>
      <p className="m-0 mt-2 max-w-[720px] text-[17px] leading-[1.55] text-muted sm:text-[19px]">
        Plan in 2D, see it in 3D, check it against real room sizes, and get a grey structure estimate in rupees.
      </p>
      <div className="mt-1 flex flex-wrap justify-center gap-3">
        <Button as={Link} to={START} variant="primary" size="lg" iconRight="arrow_r">Start a free project</Button>
        <Button as="a" href="#how-it-works" size="lg" icon="play">Watch 1 min demo</Button>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {['No credit card needed', 'Made for Pakistan', 'Real room size rules'].map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-[13px] text-muted">
            <Icon name="check_c" size={16} strokeWidth={2} className="text-green" />
            {t}
          </span>
        ))}
      </div>
    </section>
  )
}

function Hero() {
  return (
    <section className="bg-grid border-y border-line">
      <div className={`${section} grid grid-cols-1 items-center gap-14 pt-16 pb-14 lg:grid-cols-[440px_minmax(0,1fr)]`}>
        <div className="flex flex-col gap-5">
          <span className={eyebrow}>One workspace</span>
          <h2 className="m-0 font-heading text-[32px] leading-[1.1] font-bold tracking-[-1px] sm:text-[40px]">2D, 3D and cost, always in step</h2>
          <p className="m-0 text-[17px] leading-relaxed text-muted">
            Move a wall in the plan and the 3D view and the estimate change with it. Ask ArchCanvas for an idea and see the cost before you apply it.
          </p>
          <div>
            <Button as={Link} to={START} variant="primary" size="lg" iconRight="arrow_r">Start a free project</Button>
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  )
}

function Preset({ name, area, svg, on }) {
  return (
    <div className={`flex w-[84px] flex-col items-center gap-1.5 rounded-control bg-white p-2.5 ${on ? 'border-2 border-blueprint' : 'border border-line'}`}>
      <Art svg={svg} className="h-[62px] [&_svg]:h-full [&_svg]:w-auto" />
      <b className="text-xs">{name}</b>
      <span className="font-mono text-[10.5px] text-muted">{area}</span>
    </div>
  )
}

function FeatureCard({ visual, title, text }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-white">
      <div className="flex h-[180px] items-center justify-center gap-3 border-b border-line bg-paper p-3">{visual}</div>
      <div className="flex flex-col gap-2 p-5">
        <b className="font-heading text-lg font-semibold">{title}</b>
        <span className="text-[14.5px] leading-[1.55] text-muted">{text}</span>
      </div>
    </div>
  )
}

function Features() {
  const qty = [['Cement', '800 bags'], ['Bricks', '48,000'], ['Steel', '7.6 tons'], ['Sand', '3,600 cft']]
  return (
    <section id="product" className={`${section} grid grid-cols-1 scroll-mt-4 gap-5 pt-14 pb-6 sm:grid-cols-2 lg:grid-cols-4`}>
      <FeatureCard
        title="Plan for your actual plot"
        text="Pick 3, 5, 7 or 10 Marla, 1 Kanal, or type your own width and depth."
        visual={
          <>
            <Preset name="3 Marla" area="675 sq ft" svg={preset3} />
            <Preset name="5 Marla" area="1,125 sq ft" svg={preset5} on />
            <Preset name="10 Marla" area="2,250 sq ft" svg={preset10} />
          </>
        }
      />
      <FeatureCard
        title="Design visually"
        text="Draw walls, add doors and windows, and place furniture. See it in 2D and 3D at once."
        visual={
          <>
            <Art svg={thumbHouse} className="w-[74px]" />
            <Art svg={iso} className="w-[150px]" />
          </>
        }
      />
      <FeatureCard
        title="Ask ArchCanvas AI"
        text="Describe a change in plain words. Preview it before anything is applied."
        visual={
          <>
            <Art svg={aiBefore} className="w-[64px]" />
            <Icon name="arrow_r" size={22} className="text-violet" />
            <Art svg={aiAfter} className="w-[64px]" />
          </>
        }
      />
      <FeatureCard
        title="Understand build cost"
        text="Material quantities and a grey structure estimate from your design and local rates."
        visual={
          <div className="flex w-[200px] flex-col gap-1.5 rounded-control border border-line bg-white p-3">
            {qty.map(([a, b]) => (
              <div key={a} className="flex justify-between gap-4 text-[12.5px]">
                <span className="text-muted">{a}</span>
                <span className="font-mono">{b}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-1.5 text-[12.5px]">
              <b>Per sq ft</b>
              <span className="font-mono">PKR 2,791</span>
            </div>
          </div>
        }
      />
    </section>
  )
}

function Trust() {
  const items = [
    ['users', 'Made for Pakistani homes', 'Marla, Kanal and local building practice'],
    ['shield', 'Plan with confidence', 'Real sizes and a built-in plan check'],
    ['doc', 'From idea to plan', 'Design, 3D view, cost estimate and PDF export']
  ]
  return (
    <section className={`${section} grid grid-cols-1 gap-8 border-b border-line pt-8 pb-14 md:grid-cols-3`}>
      {items.map(([icon, t, d]) => (
        <div key={t} className="flex items-start gap-3.5">
          <Icon name={icon} size={28} strokeWidth={1.6} />
          <div className="flex flex-col gap-1">
            <b className="text-base">{t}</b>
            <span className="text-sm text-muted">{d}</span>
          </div>
        </div>
      ))}
    </section>
  )
}

const HOW_STEPS = [
  ['Choose your plot size', 'Pick a Marla or Kanal preset, or type your own width and depth in feet.'],
  ['Pick a template or describe your house', 'Start from a Pakistani layout, or tell ArchCanvas how many bedrooms and floors you need.'],
  ['Customise walls, doors and furniture', 'Drag walls, drop in doors and windows, and furnish each room in 2D or 3D.'],
  ['Check the plan and the cost', 'Plan check flags tight rooms and blocked doors. The estimate updates as you edit.'],
  ['Save, share or download a PDF', 'Every version is saved. Share a view-only link or download a sheet for your builder.']
]

function HowItWorks() {
  const [open, setOpen] = useState(0)
  return (
    <section id="how-it-works" className="scroll-mt-4 border-b border-line bg-paper">
      <div className={`${section} grid grid-cols-1 items-center gap-12 py-[72px] xl:grid-cols-[790px_minmax(0,1fr)]`}>
        <Laptop>
          <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: screenHowto }} />
        </Laptop>
        <div className="flex flex-col gap-7">
          <h2 className="m-0 font-heading text-[32px] leading-[1.1] font-bold tracking-[-1px] sm:text-[40px]">How to plan your house in ArchCanvas</h2>
          <div className="flex flex-col gap-[22px]">
            {HOW_STEPS.map(([t, d], i) => (
              <div key={t} className={`border-l-[3px] py-1 pl-6 ${open === i ? 'border-blueprint' : 'border-line'}`}>
                <button
                  type="button"
                  aria-expanded={open === i}
                  onClick={() => setOpen(i)}
                  className="flex cursor-pointer items-baseline gap-3 border-0 bg-transparent p-0 text-left font-heading text-[19px] font-semibold text-navy sm:text-[21px]"
                >
                  <span className="font-mono text-[13px] text-blueprint">0{i + 1}</span>
                  {t}
                </button>
                {open === i && <p className="mt-2.5 mb-1 ml-[34px] text-base leading-relaxed text-muted">{d}</p>}
              </div>
            ))}
          </div>
          <div>
            <Button as={Link} to={START} variant="primary" size="lg">Create a floor plan</Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function PlanCheck() {
  const rows = [
    ['check_c', 'text-green', 'Rooms closed and within real sizes'],
    ['check_c', 'text-green', 'Every room reachable'],
    ['warn', 'text-amber', 'Bath door swings into the basin'],
    ['check_c', 'text-green', 'Stairs and windows checked']
  ]
  return (
    <section className="border-y border-line bg-paper">
      <div className={`${section} grid grid-cols-1 items-center gap-14 py-16 lg:grid-cols-2`}>
        <div className="flex flex-col gap-[18px]">
          <span className={eyebrow}>Plan check</span>
          <h2 className={h2}>Catch problems before your builder does</h2>
          <p className="m-0 text-[17px] leading-relaxed text-muted">
            ArchCanvas checks room sizes, door clearance, circulation, windows and stairs. Click an issue to see it on the plan, or let it fix the problem for you.
          </p>
          <div className="flex flex-col gap-2.5">
            {rows.map(([icon, color, t]) => (
              <div key={t} className="flex items-center gap-2.5 text-sm">
                <Icon name={icon} size={18} strokeWidth={2} className={color} />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center rounded-card border border-line bg-white p-5">
          <Art svg={planCheck} className="w-full max-w-[246px]" label="Plan with a warning on the bathroom door" />
        </div>
      </div>
    </section>
  )
}

function Present() {
  const points = [
    ['doc', 'A sheet for every floor', 'Title, plan, room sizes and covered area, laid out and ready to print.'],
    ['download', 'PDF for your builder', 'Plan, material quantities and the grey structure estimate in one file.'],
    ['users', 'Show your family', 'Share a view-only link, or present it full screen.']
  ]
  return (
    <section className={`${section} grid grid-cols-1 items-center gap-14 py-[72px] lg:grid-cols-[minmax(0,1fr)_420px]`}>
      <div className="relative flex h-[420px] items-end justify-center overflow-hidden rounded-dialog bg-[#ece7e1] sm:h-[560px]">
        <span className="absolute inset-x-0 bottom-0 h-[110px] bg-[#c9a27e]" />
        <span className="absolute top-0 left-12 h-[78%] w-[140px] rounded-b-md bg-[#f6f2ec]" />
        <div className="relative mb-[70px] w-full px-4">
          <Laptop width={560} height={360}>
            <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: screenSheet }} />
          </Laptop>
        </div>
      </div>
      <div className="flex flex-col gap-[22px]">
        <span className={eyebrow}>Documents</span>
        <h2 className={h2}>Turn your plan into a sheet you can present</h2>
        <div className="flex flex-col gap-[18px]">
          {points.map(([icon, t, d]) => (
            <div key={t} className="flex items-start gap-3">
              <Icon name={icon} className="text-blueprint" />
              <div className="flex flex-col gap-1">
                <b className="text-base">{t}</b>
                <span className="text-[14.5px] leading-normal text-muted">{d}</span>
              </div>
            </div>
          ))}
        </div>
        <div>
          <Button as={Link} to={START} size="lg" iconRight="arrow_r">Create a floor plan</Button>
        </div>
      </div>
    </section>
  )
}

const TEMPLATES = [
  ['3 Marla', "22'-6\" × 30'-0\"", tpl3],
  ['5 Marla', "25'-0\" × 45'-0\"", tpl5],
  ['7 Marla', "35'-0\" × 45'-0\"", tpl7],
  ['10 Marla', "30'-0\" × 75'-0\"", tpl10],
  ['Corner plot', "30'-0\" × 50'-0\"", tplCorner],
  ['Narrow plot', "18'-0\" × 50'-0\"", tplNarrow]
]

function Templates() {
  return (
    <section id="templates" className={`${section} flex scroll-mt-4 flex-col gap-6 py-16`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className={h2}>Start from a Pakistani template</h2>
        <Link to={START} className="inline-flex items-center gap-1 font-semibold no-underline">
          All templates <Icon name="arrow_r" size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {TEMPLATES.map(([name, size, svg]) => (
          <Link
            key={name}
            to={START}
            className="flex flex-col items-center gap-2.5 rounded-card border border-line bg-white p-4 text-navy no-underline hover:border-blueprint hover:text-navy"
          >
            <div className="flex h-[120px] items-center">
              <Art svg={svg} className="h-[110px] [&_svg]:h-full [&_svg]:w-auto" />
            </div>
            <b className="text-sm">{name}</b>
            <span className="font-mono text-[11.5px] text-muted">{size}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Strengths() {
  const items = [
    ['grid', 'Marla and Kanal', 'Presets at the government standard of 225 sq ft per Marla.'],
    ['ruler', 'Real dimensions', 'Feet and inches everywhere, with proper dimension lines.'],
    ['shield', 'Plan validation', 'Room sizes, doors, circulation and stairs checked as you work.'],
    ['calc', 'Local cost estimate', 'Grey structure cost from local material rates, per sq ft.'],
    ['sparkle', 'AI layout help', 'Layouts and edits that respect real-world room sizes.'],
    ['download', 'PDF for your builder', 'Plan, quantities and estimate in one report.']
  ]
  return (
    <section id="pricing" className={`${section} flex scroll-mt-4 flex-col gap-6 pb-16`}>
      <h2 className={h2}>Built for planning a home in Pakistan</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([icon, t, d]) => (
          <div key={t} className="flex flex-col gap-2 rounded-card border border-line bg-white p-5">
            <Icon name={icon} size={22} className="text-blueprint" />
            <b className="text-base">{t}</b>
            <span className="text-sm leading-normal text-muted">{d}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section className="bg-navy">
      <div className={`${section} flex flex-col items-start justify-between gap-6 py-14 md:flex-row md:items-center`}>
        <div className="flex items-center gap-7">
          <Logo variant="house" size={72} dark className="hidden sm:inline-flex" />
          <div className="flex flex-col gap-2">
            <h2 className="m-0 font-heading text-[28px] font-bold tracking-[-0.6px] text-white sm:text-[34px]">Start with your plot size</h2>
            <span className="text-base text-[#b8c4cf]">Free to use in your browser. Nothing to install.</span>
          </div>
        </div>
        <Button as={Link} to={START} variant="primary" size="lg">Start designing free</Button>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-navy">
      <MarketingNav />
      <main>
        <Top />
        <StepCards />
        <Hero />
        <Features />
        <Trust />
        <HowItWorks />
        <PlanCheck />
        <Present />
        <Templates />
        <Strengths />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
