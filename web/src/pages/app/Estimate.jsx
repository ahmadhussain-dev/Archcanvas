import { Link, useParams } from 'react-router'
import Button from '../../components/Button.jsx'
import Chip from '../../components/Chip.jsx'
import StatePanel from '../../components/StatePanel.jsx'
import FullPageSpinner from '../../components/FullPageSpinner.jsx'
import { useApi } from '../../lib/useApi.js'
import { ftin, num, num2, pkrShort } from '../../lib/format.js'

const COLORS = { steel: '#13202C', cement: '#1E5AA8', bricks: '#B2441C', labour: '#6E8FB8', crush: '#A9BCD4', sand: '#C9B48F', pipes: '#D8CDB8' }
const STATUS = { verified: ['Verified', 'green'], stale: ['Stale', 'amber'], unverified: ['Unverified', 'grey'] }
const SHORT = { bag: 'bag', 'bag (50 kg)': 'bag', brick: 'brick', ton: 'ton', cft: 'cft', 'sq ft': 'sq ft' }

function qty(line) {
  const unit = line.unit === 'bag (50 kg)' ? 'bags' : line.unit === 'brick' ? '' : line.unit === 'ton' ? 'tons' : line.unit
  return `${line.key === 'steel' ? num2(line.quantity) : num(line.quantity)}${unit ? ` ${unit}` : ''}`
}

export default function Estimate() {
  const { id } = useParams()
  const project = useApi(`/projects/${id}`)
  const estimate = useApi(`/projects/${id}/estimate`)

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
              <span className="font-mono">{ftin(e.roofHeightFt)}</span> · {e.city} rates
            </span>
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
            <span className="text-[13px] text-[#b8c4cf]">Total grey structure cost</span>
            <b className="font-mono text-[34px] font-medium">{pkrShort(e.totalPkr)}</b>
            <span className="font-mono text-[13px] text-[#b8c4cf]">{num(e.totalPkr)}</span>
          </div>
          <div className="flex flex-col gap-1.5 rounded-card border border-line bg-white p-5">
            <span className="text-[13px] text-muted">Cost per sq ft</span>
            <b className="font-mono text-[30px] font-medium">PKR {num(e.perSqftPkr)}</b>
            <span className="text-[12.5px] text-muted">Over {num(e.coveredAreaSqft)} sq ft covered area</span>
          </div>
          <div className="flex flex-col gap-2 rounded-card border border-line bg-white p-5">
            <span className="text-[13px] text-muted">Rates used</span>
            <div className="flex flex-wrap gap-1.5">
              {counts.verified > 0 && <Chip tone="green" icon="check">{counts.verified} verified</Chip>}
              {counts.stale > 0 && <Chip tone="amber" icon="warn">{counts.stale} stale</Chip>}
              {counts.unverified > 0 && <Chip>{counts.unverified} unverified</Chip>}
            </div>
            <span className="text-[12.5px] leading-[1.45] text-muted">
              {e.hasUnverifiedRates
                ? 'Some prices are starting values or older than 30 days. An admin can check them against the market.'
                : 'Every price was checked by an admin in the last 30 days.'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 rounded-card border border-line bg-white p-5">
          <b className="text-[15px]">Where the money goes</b>
          <div className="flex h-3.5 gap-0.5 overflow-hidden rounded">
            {lines.map((l) => (
              <span key={l.key} title={l.name} style={{ width: `${pct(l)}%`, background: COLORS[l.key] }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {lines.map((l) => (
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
            <table className="w-full min-w-[620px] border-collapse text-sm">
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
                    <td className="px-4 py-3 font-medium">{l.name}</td>
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
              Covered area is the plot ({ftin(p.plot.widthFt)} × {ftin(p.plot.depthFt)}) times {e.floors} floor{e.floors === 1 ? '' : 's'}. Quantities use rules of thumb per sq ft for a brick and RCC house. Walls get taller with the roof height, so bricks, cement and sand go up with it.
            </span>
            {e.missingRates.length > 0 && (
              <span className="text-[13px] text-amber">No price set for: {e.missingRates.join(', ')}.</span>
            )}
            <span className="pt-2 text-[12.5px] leading-normal text-muted">An early planning figure. Confirm with a contractor before you build.</span>
          </div>
        </div>
      </main>
    </>
  )
}
