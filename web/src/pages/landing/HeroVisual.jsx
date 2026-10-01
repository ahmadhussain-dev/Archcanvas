import Art from '../../components/Art.jsx'
import Chip from '../../components/Chip.jsx'
import Icon from '../../components/Icon.jsx'
import Scaled from '../../components/Scaled.jsx'
import planHero from '../../art/plan-hero.svg?raw'
import iso from '../../art/iso-house.svg?raw'

export const COST_BARS = [
  ['Steel', 34, '#13202C'],
  ['Cement', 21, '#1E5AA8'],
  ['Bricks', 15, '#B2441C'],
  ['Labour', 14, '#6E8FB8'],
  ['Sand and crush', 12, '#A9BCD4'],
  ['Pipes', 4, '#C9B48F']
]

const card = 'absolute rounded-card border border-line bg-white shadow-[0_10px_28px_rgba(19,32,44,0.08)]'

function Tab({ on, children }) {
  return (
    <span
      className={`absolute -top-3.5 left-4 inline-flex h-7 items-center rounded-md border px-3 text-[13px] font-semibold ${
        on ? 'border-blueprint bg-blueprint text-white' : 'border-line bg-white text-navy'
      }`}
    >
      {children}
    </span>
  )
}

// 2D plan, 3D view, cost card and an AI suggestion, layered like the approved hero.
export default function HeroVisual() {
  return (
    <Scaled width={736} height={560}>
      <div className="relative h-[560px] w-[736px]">
        <div className={`${card} top-10 left-0 px-3.5 pt-[18px] pb-2.5`}>
          <Tab on>2D plan</Tab>
          <Art svg={planHero} className="w-[198px]" label="2D floor plan of a 5 Marla ground floor" />
        </div>
        <svg width="72" height="40" viewBox="0 0 72 40" aria-hidden="true" className="absolute top-[168px] left-[228px]">
          <path d="M6 32 C 20 6, 52 6, 66 28" fill="none" stroke="#1E5AA8" strokeWidth="2" />
          <path d="m60 26 6 3 1-7" fill="none" stroke="#1E5AA8" strokeWidth="2" />
        </svg>
        <div className={`${card} top-[226px] left-[252px] z-[1] px-2.5 pt-5 pb-2.5`}>
          <Tab>3D view</Tab>
          <Art svg={iso} className="w-[300px]" label="3D view of the same 5 Marla ground floor" />
        </div>
        <div className={`${card} top-0 right-0 z-[2] flex w-[236px] flex-col gap-2.5 p-4 shadow-[0_10px_28px_rgba(19,32,44,0.10)]`}>
          <span className="text-xs text-muted">Estimated grey structure</span>
          <b className="font-mono text-2xl font-medium">PKR 55.8 lakh</b>
          <span className="-mt-1.5 font-mono text-[12.5px] text-muted">PKR 2,791 / sq ft</span>
          <div className="flex h-2 gap-px overflow-hidden rounded">
            {COST_BARS.map(([n, p, c]) => (
              <span key={n} style={{ width: `${p}%`, background: c }} />
            ))}
          </div>
          {COST_BARS.map(([n, p, c]) => (
            <div key={n} className="grid grid-cols-[10px_minmax(0,1fr)_36px] items-center gap-2 text-[12.5px]">
              <span className="size-2.5 rounded-sm" style={{ background: c }} />
              <span>{n}</span>
              <span className="text-right font-mono">{p}%</span>
            </div>
          ))}
        </div>
        <div className="absolute top-[500px] left-[252px] z-[2] flex items-center gap-2.5 rounded-[10px] border border-[#c9bdf5] bg-white py-2 pr-2 pl-3 shadow-[0_10px_28px_rgba(19,32,44,0.10)]">
          <Icon name="sparkle" size={17} className="text-violet" />
          <span className="text-[13.5px]">Make bedroom 1 bigger</span>
          <Chip tone="violet">+35 sq ft</Chip>
          <span className="font-mono text-xs text-muted">+PKR 97,700</span>
        </div>
      </div>
    </Scaled>
  )
}
