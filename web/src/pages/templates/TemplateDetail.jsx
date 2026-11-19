import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import MarketingNav from '../../layouts/MarketingNav.jsx'
import Footer from '../../layouts/Footer.jsx'
import Button from '../../components/Button.jsx'
import Chip from '../../components/Chip.jsx'
import Icon from '../../components/Icon.jsx'
import PlanPreview from '../../components/PlanPreview.jsx'
import StatePanel from '../../components/StatePanel.jsx'
import FullPageSpinner from '../../components/FullPageSpinner.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useApi } from '../../lib/useApi.js'
import { coveredArea, startFromTemplate } from '../../lib/templates.js'
import { ftin } from '../../lib/format.js'

const num = (n) => Math.round(n).toLocaleString('en-PK')

// /templates/:key: both floors of one ready-made house, and a button that
// starts a project from it. After signing up, ?start=1 brings people back
// here and opens the editor straight away.
export default function TemplateDetail() {
  const { key } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { status } = useAuth()
  const { data, error, loading, reload } = useApi(`/templates/${key}`)
  const [floor, setFloor] = useState(0)
  const [furniture, setFurniture] = useState(true)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState('')
  const started = useRef(false)

  async function use() {
    setBusy(true)
    setProblem('')
    try {
      navigate(await startFromTemplate(key, status === 'in'))
    } catch (err) {
      setProblem(err.message)
      setBusy(false)
    }
  }

  useEffect(() => {
    if (params.get('start') === '1' && status === 'in' && data && !started.current) {
      started.current = true
      use()
    }
  })

  if (loading && !data) return <FullPageSpinner />
  if (error) {
    return (
      <StatePanel
        kind={error.status === 404 ? 'empty' : 'error'}
        tag={error.status === 404 ? 'Not found' : 'Error'}
        title={error.status === 404 ? 'There is no template with that name' : "We couldn't load this template"}
        text={error.status === 404 ? 'It may have been renamed. See all the templates instead.' : error.message}
        actions={error.status === 404 ? [{ label: 'All templates', to: '/templates' }] : [{ label: 'Try again', onClick: reload }]}
      />
    )
  }

  const t = data.template
  const { plot, preview } = t
  const facts = [
    ['Plot', `${ftin(plot.widthFt)} × ${ftin(plot.depthFt)}`],
    ['Plot area', `${num(plot.widthFt * plot.depthFt)} sq ft`],
    ['Covered area', `${num(coveredArea(t))} sq ft`],
    ['Floors', t.floors],
    ['Bedrooms', t.bedrooms],
    ['Bathrooms', t.bathrooms]
  ]
  const tab = (on) =>
    `h-8 cursor-pointer rounded-md border-0 px-3 text-[13px] font-semibold ${on ? 'bg-white text-navy shadow-[0_1px_2px_rgba(19,32,44,0.12)]' : 'bg-transparent text-muted hover:text-navy'}`

  return (
    <div className="min-h-screen bg-white text-navy">
      <MarketingNav />
      <main className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
          <Link to="/templates" className="no-underline">Templates</Link>
          <Icon name="arrow_r" size={14} />
          <span>{plot.label}</span>
        </nav>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="tablist" aria-label="Floor" className="inline-flex gap-1 rounded-control bg-paper p-1">
                {preview.floors.map((f, i) => (
                  <button key={f.id} type="button" role="tab" aria-selected={floor === i} className={tab(floor === i)} onClick={() => setFloor(i)}>
                    {f.name} floor
                  </button>
                ))}
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={furniture} onChange={(e) => setFurniture(e.target.checked)} className="accent-blueprint" />
                Furniture on plan
              </label>
            </div>
            <div className="bg-grid flex h-[min(78vh,820px)] min-h-[420px] items-center justify-center rounded-card border border-line p-4 [--grid-size:16px]">
              <PlanPreview preview={preview} floor={floor} labels furniture={furniture} title={`${t.name}, ${preview.floors[floor].name.toLowerCase()} floor plan`} />
            </div>
            <p className="m-0 text-[12.5px] text-muted">The road is at the bottom of the plan. Sizes are in feet, measured on wall centre lines.</p>
          </section>

          <aside className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h1 className="m-0 font-heading text-[26px] font-bold tracking-[-0.5px]">{t.name}</h1>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="blue">{plot.label}</Chip>
                <Chip>Double storey</Chip>
                <Chip tone="green" icon="check">Furnished</Chip>
              </div>
              <p className="m-0 text-[15px] leading-normal text-muted">{t.summary}</p>
            </div>
            <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line">
              {facts.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5 bg-white px-3.5 py-2.5">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="m-0 font-mono text-sm font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col gap-2">
              {problem && <div role="alert" className="rounded-control border border-[#f0b8b2] bg-red-tint px-3 py-2.5 text-sm text-[#8f1c13]">{problem}</div>}
              <Button variant="primary" size="lg" iconRight="arrow_r" onClick={use} disabled={busy}>
                {busy ? 'Opening the editor…' : 'Use this house'}
              </Button>
              <span className="text-[12.5px] leading-normal text-muted">
                {status === 'in'
                  ? 'Makes a new project from this house and opens it in the editor, in 2D and 3D.'
                  : 'Create a free account to open this house in the editor and make it yours.'}
              </span>
              <Button as={Link} to={`/projects/new?preset=${plot.preset}`}>Start an empty {plot.label} plot instead</Button>
            </div>
            <div className="flex flex-col gap-3">
              {t.rooms.map((f) => (
                <div key={f.floor} className="flex flex-col gap-1.5">
                  <b className="text-sm">{f.floor} floor</b>
                  <div className="flex flex-wrap gap-1.5">
                    {f.names.map((n) => (
                      <span key={n} className="rounded-md border border-line px-2 py-0.5 text-[12.5px] text-navy">{n}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
