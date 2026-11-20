import { useState } from 'react'
import { Link, useParams } from 'react-router'
import Button from '../../components/Button.jsx'
import Chip from '../../components/Chip.jsx'
import CitySelect from '../../components/CitySelect.jsx'
import StatePanel from '../../components/StatePanel.jsx'
import FullPageSpinner from '../../components/FullPageSpinner.jsx'
import { api } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'
import { ftin, num, num2, pkrShort, timeAgo } from '../../lib/format.js'

const COLORS = { steel: '#13202C', cement: '#1E5AA8', bricks: '#B2441C', labour: '#6E8FB8', crush: '#A9BCD4', sand: '#C9B48F', pipes: '#D8CDB8', other: '#8A96A3' }
const STATUS = { verified: ['Verified', 'green'], estimated: ['Automatic', 'blue'], stale: ['Stale', 'amber'], unverified: ['Unverified', 'grey'] }
const SHORT = { bag: 'bag', 'bag (50 kg)': 'bag', brick: 'brick', ton: 'ton', cft: 'cft', 'sq ft': 'sq ft' }

function qty(line) {
  const unit = line.unit === 'bag (50 kg)' ? 'bags' : line.unit === 'brick' ? '' : line.unit === 'ton' ? 'tons' : line.unit
  return `${line.key === 'steel' ? num2(line.quantity) : num(line.quantity)}${unit ? ` ${unit}` : ''}`
}

// What really moves a grey structure bill, from the Milkiyat 2026 cost guide
// (the link comes with the estimate) and the contractor quotes we checked.
const FACTORS = [
  ['Covered area', 'More rooms, a bigger first floor or a mumty adds sq ft, and every sq ft costs money.'],
  ['Design complexity', 'A simple rectangular plan with few beams lands at the bottom of the range. Double-height lounges, large spans and a heavy elevation land at the top.'],
  ['Steel grade and quantity', 'Grade 60 bars, bigger spans and a structural design with more steel cost more.'],
  ['Brick and material quality', 'A+ awwal bricks, Sargodha crush and branded cement cost more than second-grade material.'],
  ['Soil and foundation', 'Weak or filled ground needs deeper footings or a raft. A soil test decides this.'],
  ['Location', 'Material and labour prices differ by city. The estimate moves the national figure by one percentage for your area.'],
  ['Labour and contractor', 'Theka rates differ a lot between contractors, even in the same city.'],
  ['Timing', 'Cement and steel prices change every week. A house built over a year meets several prices.']
]

// "Online, checked 3 hours ago" under each material.
function sourceText(line) {
  const src = line.rateSource ?? {}
  if (src.origin === 'auto') return `Online, Pakistan average${line.rateCheckedAt ? `, checked ${timeAgo(line.rateCheckedAt)}` : ''}`
  if (src.origin === 'admin') return 'National price set by admin'
  if (src.origin === 'estimate') {
    const nudged = src.market && src.market !== 1 ? ", follows today's cement price" : ''
    return `National reference price${nudged}${line.rateCheckedAt ? `, updated ${timeAgo(line.rateCheckedAt)}` : ''}`
  }
  return 'Starting value'
}

const signed = (pct) => `${pct > 0 ? '+' : pct < 0 ? '−' : '±'}${Math.abs(pct)}%`

export default function Estimate() {
  const { id } = useParams()
  const project = useApi(`/projects/${id}`)
  const estimate = useApi(`/projects/${id}/estimate`)
  const [cityError, setCityError] = useState('')

  async function changeCity(city) {
    setCityError('')
    try {
      const { project: updated } = await api.patch(`/projects/${id}`, { city })
      project.setData((d) => ({ ...d, project: updated }))
      estimate.reload()
    } catch (err) {
      setCityError(err.message)
    }
  }

  if (project.loading || estimate.loading) return <FullPageSpinner />
  const err = project.error ?? estimate.error
  if (err) {
    return err.status === 404 ? (
      <StatePanel kind="empty" tag="Not found" title="We couldn't find this project" text="It may have been deleted." actions={[{ label: 'Go to projects', to: '/dashboard' }]} />
    ) : (
      <StatePanel kind="error" title="We couldn't work out the estimate" text={err.message} actions={[{ label: 'Try again', onClick: () => (project.reload(), estimate.reload()) }]} />
    )
  }

  const p = project.data.project
  const e = estimate.data.estimate
  const lines = [...e.lines].sort((a, b) => b.amountPkr - a.amountPkr)
  const extras = e.extras ?? []
  const otherPkr = extras.reduce((s, x) => s + x.amountPkr, 0)
  const bars = otherPkr > 0 ? [...lines, { key: 'other', name: 'Other costs', amountPkr: otherPkr }] : lines
  const counts = lines.reduce((c, l) => ({ ...c, [l.rateStatus]: (c[l.rateStatus] ?? 0) + 1 }), {})
  const pct = (l) => (e.totalPkr ? (l.amountPkr / e.totalPkr) * 100 : 0)
  const th = 'px-4 py-2.5 text-xs font-semibold text-muted'

  return (
    <>
      <div className="border-b border-line bg-white print:border-0">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-2xl font-bold">Grey structure estimate</h1>
            <span className="text-[13.5px] text-muted">
              {p.name} · <span className="font-mono">{num(e.coveredAreaSqft)} sq ft</span> covered · {e.floors} floor{e.floors === 1 ? '' : 's'} · roof{' '}
              <span className="font-mono">{ftin(e.roofHeightFt)}</span> · location
              <CitySelect
                aria-label="City for prices"
                className="ml-1.5 h-7 rounded-control border border-line-strong bg-white px-1.5 text-[13px] text-navy print:appearance-none print:border-0"
                value={e.city}
                onChange={changeCity}
              />
            </span>
            {cityError && <span className="text-[13px] text-red">{cityError}</span>}
          </div>
          <div className="flex gap-2 print:hidden">
            <Button as={Link} to={`/projects/${id}/editor`}>Back to editor</Button>
            <Button icon="download" onClick={() => window.print()}>Print or save PDF</Button>
          </div>
        </div>
      </div>
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
          <div className="flex flex-col gap-1.5 rounded-card bg-navy p-5 text-white">
            <span className="text-[13px] text-[#b8c4cf]">Grey structure cost, likely range</span>
            <b className="font-mono text-[26px] font-medium leading-tight">
              {pkrShort(e.range.lowPkr)} – {pkrShort(e.range.highPkr)}
            </b>
            <span className="text-[13px] text-[#b8c4cf]">
              Most likely about <span className="font-mono text-white">{pkrShort(e.totalPkr)}</span> ({num(e.totalPkr)})
            </span>
            <span className="text-[12.5px] text-[#b8c4cf]">A planning range, not a quote. Simple designs land near the low end, complex ones near the high end.</span>
          </div>
          <div className="flex flex-col gap-1.5 rounded-card border border-line bg-white p-5">
            <span className="text-[13px] text-muted">Cost per sq ft</span>
            <b className="font-mono text-[26px] font-medium">
              PKR {num(e.range.lowPerSqftPkr)} – {num(e.range.highPerSqftPkr)}
            </b>
            <span className="text-[12.5px] text-muted">
              Likely <span className="font-mono">{num(e.perSqftPkr)}</span> over {num(e.coveredAreaSqft)} sq ft covered area
            </span>
          </div>
          <div className="flex flex-col gap-2 rounded-card border border-line bg-white p-5">
            <span className="text-[13px] text-muted">Rates used</span>
            <div className="flex flex-wrap gap-1.5">
              <Chip tone="blue">National rates</Chip>
              <Chip tone={e.location.pct === 0 ? 'grey' : 'amber'}>
                {e.city} {signed(e.location.pct)}
              </Chip>
              {counts.verified > 0 && <Chip tone="green" icon="check">{counts.verified} checked online</Chip>}
              {counts.stale > 0 && <Chip tone="amber" icon="warn">{counts.stale} stale</Chip>}
            </div>
            <span className="text-[12.5px] leading-[1.45] text-muted">
              One national price list for all of Pakistan, updated daily ({e.checkedSharePct ?? 0}% of the material and labour cost read online today). {e.location.label ?? e.city} is {e.location.pct === 0 ? 'at the national level' : `${Math.abs(e.location.pct)}% ${e.location.pct > 0 ? 'above' : 'below'} it`}.
            </span>
          </div>
        </div>

        <section aria-labelledby="depends" className="flex flex-col gap-3 rounded-card border border-[#e7c9a0] bg-[#fdf7ee] p-5">
          <div className="flex flex-col gap-1">
            <h2 id="depends" className="m-0 text-[15px] font-bold">Your real cost depends on many things</h2>
            <span className="text-[13.5px] leading-normal text-[#5b4a33]">
              No app can give a pinpoint price before a structural design and a contractor's bill of quantities. Published 2026 figures for the same plot size overlap a lot: a 5 Marla grey structure costs about PKR 56–90 lakh and a 10 Marla PKR 95 lakh–1.2 crore, depending on the points below. Use this range to plan and compare, then get quotes.
            </span>
          </div>
          <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-2 p-0 sm:grid-cols-2">
            {FACTORS.map(([title, text]) => (
              <li key={title} className="text-[13px] leading-normal text-[#5b4a33]">
                <b className="text-navy">{title}.</b> {text}
              </li>
            ))}
          </ul>
          <span className="text-[13px] leading-normal text-[#5b4a33]">
            Spend your attention on the drawings, the soil and material quality. Plaster can be redone; a weak slab or an undersized footing cannot be fixed cheaply later.
            {e.source?.url && (
              <>
                {' '}Source:{' '}
                <a href={e.source.url} target="_blank" rel="noreferrer" className="text-blueprint underline">
                  {e.source.name}
                </a>
                .
              </>
            )}
          </span>
        </section>

        <div className="flex flex-col gap-3.5 rounded-card border border-line bg-white p-5">
          <b className="text-[15px]">Where the money goes</b>
          <div className="flex h-3.5 gap-0.5 overflow-hidden rounded">
            {bars.map((l) => (
              <span key={l.key} title={l.name} style={{ width: `${pct(l)}%`, background: COLORS[l.key] }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {bars.map((l) => (
              <div key={l.key} className="flex items-center gap-2 text-[13px]">
                <span className="size-2.5 rounded-sm" style={{ background: COLORS[l.key] }} />
                <span>{l.name.split(' (')[0]}</span>
                <span className="font-mono text-muted">{Math.round(pct(l))}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {['cement', 'bricks', 'steel', 'sand', 'crush'].map((k) => {
            const l = e.lines.find((x) => x.key === k)
            if (!l) return null
            return (
              <div key={k} className="flex flex-col gap-1 rounded-card border border-line bg-white px-4 py-3.5">
                <span className="text-[12.5px] text-muted">{l.name.split(' (')[0]}</span>
                <b className="font-mono text-xl font-medium">{qty(l)}</b>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="overflow-x-auto rounded-card border border-line bg-white">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="bg-paper">
                  <th scope="col" className={`${th} text-left`}>Item</th>
                  <th scope="col" className={`${th} text-right`}>Quantity</th>
                  <th scope="col" className={`${th} text-right`}>Rate (PKR)</th>
                  <th scope="col" className={`${th} text-right`}>Rate status</th>
                  <th scope="col" className={`${th} text-right`}>Amount (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.key} className="border-t border-[#eef1f3]">
                    <td className="px-4 py-3">
                      <span className="flex flex-col">
                        <span className="font-medium">{l.name}</span>
                        <span className="text-xs text-muted">{sourceText(l)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{qty(l)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {num(l.ratePkr)} / {SHORT[l.unit] ?? l.unit}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Chip tone={STATUS[l.rateStatus][1]}>{STATUS[l.rateStatus][0]}</Chip>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{num(l.amountPkr)}</td>
                  </tr>
                ))}
                {extras.length > 0 && (
                  <tr className="border-t border-line bg-paper">
                    <td colSpan={5} className="px-4 py-2 text-xs font-semibold text-muted">Other costs</td>
                  </tr>
                )}
                {extras.map((x) => (
                  <tr key={x.key} className="border-t border-[#eef1f3]">
                    <td className="px-4 py-3 font-medium">{x.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{x.basis}</td>
                    <td />
                    <td className="px-4 py-3 text-right">
                      {x.key === 'location' ? <Chip tone="amber">City %</Chip> : <Chip>Rule of thumb</Chip>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{num(x.amountPkr)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-navy">
                  <td className="px-4 py-3.5 font-bold">Total</td>
                  <td colSpan={3} />
                  <td className="px-4 py-3.5 text-right font-mono font-medium">{num(e.totalPkr)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 rounded-card border border-line bg-white px-5 py-4">
            <b className="text-[15px]">How this is worked out</b>
            <span className="text-[13.5px] leading-normal text-muted">
              Covered area is the plot ({ftin(p.plot.widthFt)} × {ftin(p.plot.depthFt)}) times {e.floors} floor{e.floors === 1 ? '' : 's'}. Quantities use rules of thumb per sq ft for a brick and RCC house, checked against published take-offs and a real contractor's 5 Marla quote. Walls get taller with the roof height, so bricks, cement and sand go up with it. Groundwork, frames, tanks, gate, wastage, transport and a contingency are separate lines.
            </span>
            <span className="text-[13.5px] leading-normal text-muted">
              All rates are one national list. Cement and steel follow the Pakistan average on price websites every day; bricks, sand, crush, labour and pipes are national reference prices that follow the cement price. Then the whole figure moves {signed(e.location.pct)} for {e.city}. The range runs {Math.abs(e.range.lowPct)}% below to {e.range.highPct}% above the likely figure.
            </span>
            {e.missingRates.length > 0 && (
              <span className="text-[13px] text-amber">No price set for: {e.missingRates.join(', ')}.</span>
            )}
            <span className="pt-2 text-[12.5px] leading-normal text-muted">An early planning range, not a quote or a promise. Confirm with a structural engineer and at least two contractors before you build.</span>
          </div>
        </div>
      </main>
    </>
  )
}
