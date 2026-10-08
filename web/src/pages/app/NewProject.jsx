import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import Button from '../../components/Button.jsx'
import Chip from '../../components/Chip.jsx'
import Icon from '../../components/Icon.jsx'
import Logo from '../../components/Logo.jsx'
import PlotThumb from '../../components/PlotThumb.jsx'
import PlotPreview from './PlotPreview.jsx'
import { api } from '../../lib/api.js'
import { ftin, marla, num, parseFeet } from '../../lib/format.js'
import { checkFit } from '../../lib/fitCheck.js'

// Same as GET /api/plots/presets; used straight away and replaced by the server list.
const FALLBACK_PRESETS = [
  { key: '1-marla', label: '1 Marla', widthFt: 15, depthFt: 15 },
  { key: '2-marla', label: '2 Marla', widthFt: 15, depthFt: 30 },
  { key: '3-marla', label: '3 Marla', widthFt: 22.5, depthFt: 30 },
  { key: '5-marla', label: '5 Marla', widthFt: 25, depthFt: 45 },
  { key: '7-marla', label: '7 Marla', widthFt: 35, depthFt: 45 },
  { key: '10-marla', label: '10 Marla', widthFt: 30, depthFt: 75 },
  { key: '1-kanal', label: '1 Kanal', widthFt: 50, depthFt: 90 },
  { key: '2-kanal', label: '2 Kanal', widthFt: 100, depthFt: 90 }
]
const MAIN_PRESETS = ['5-marla', '10-marla', '1-kanal']
const CITIES = ['Faisalabad', 'Lahore', 'Islamabad', 'Rawalpindi', 'Karachi', 'Multan', 'Peshawar', 'Gujranwala', 'Sialkot']
const EXTRAS = ['Dining', 'Store', 'Servant room', 'Prayer room', 'Laundry']

const sectionLabel = 'text-xs font-semibold tracking-[0.6px] text-muted uppercase'

function FeetField({ label, value, onChange, error }) {
  const [text, setText] = useState(ftin(value))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setText(ftin(value))
  }, [value, focused])
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      {label}
      <input
        className="field-input h-9 font-mono text-sm"
        value={text}
        aria-invalid={Boolean(error)}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          setText(e.target.value)
          const v = parseFeet(e.target.value)
          onChange(Number.isFinite(v) ? v : NaN)
        }}
        onBlur={() => setFocused(false)}
      />
      {error && <span className="font-normal text-red">{error}</span>}
    </label>
  )
}

function Stepper({ label, value, min, max, onChange }) {
  const btn =
    'flex size-8 cursor-pointer items-center justify-center rounded-control border border-line-strong bg-white p-0 text-navy disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#eef1f3] py-2">
      <span className="text-sm font-medium">{label}</span>
      <span className="flex items-center gap-2.5">
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} className={btn} disabled={value <= min} onClick={() => onChange(value - 1)}>
          <Icon name="minus" size={16} />
        </button>
        <span className="min-w-[18px] text-center font-mono text-[15px]" aria-live="polite">{value}</span>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>
          <Icon name="plus" size={16} />
        </button>
      </span>
    </div>
  )
}

function Toggle({ on, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-[13px] font-medium ${
        on ? 'border-blueprint bg-blueprint-tint text-blueprint-hover' : 'border-line-strong bg-white text-navy'
      }`}
    >
      <Icon name={on ? 'check' : 'plus'} size={14} strokeWidth={on ? 2.4 : 2} className={on ? 'text-blueprint' : 'text-muted'} />
      {children}
    </button>
  )
}

export default function NewProject() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [presets, setPresets] = useState(FALLBACK_PRESETS)
  const startPreset = FALLBACK_PRESETS.find((p) => p.key === params.get('preset')) ?? FALLBACK_PRESETS[3]
  const [preset, setPreset] = useState(startPreset.key)
  const [size, setSize] = useState({ widthFt: startPreset.widthFt, depthFt: startPreset.depthFt })
  const [name, setName] = useState('')
  const [city, setCity] = useState('Faisalabad')
  const [req, setReq] = useState({ bedrooms: 3, bathrooms: 3, kitchens: 1, floors: 2 })
  const [roofHeightFt, setRoof] = useState(10.5)
  const [rooms, setRooms] = useState({ drawingRoom: true, carPorch: true })
  const [extras, setExtras] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/plots/presets').then((d) => setPresets(d.presets)).catch(() => {})
  }, [])

  const valid = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi
  const sizeErrors = {
    widthFt: valid(size.widthFt, 5, 500) ? '' : 'Between 5 and 500 ft',
    depthFt: valid(size.depthFt, 5, 500) ? '' : 'Between 5 and 500 ft',
    roof: valid(roofHeightFt, 7, 20) ? '' : 'Between 7 and 20 ft'
  }
  const sizeOk = !sizeErrors.widthFt && !sizeErrors.depthFt
  const area = sizeOk ? size.widthFt * size.depthFt : 0
  const presetLabel = presets.find((p) => p.key === preset)?.label
  const fit = useMemo(
    () => (sizeOk ? checkFit({ ...size, ...req, ...rooms }) : null),
    [sizeOk, size, req, rooms]
  )

  function pickPreset(p) {
    setPreset(p.key)
    setSize({ widthFt: p.widthFt, depthFt: p.depthFt })
  }

  function resize(next) {
    setSize(next)
    setPreset('custom')
  }

  async function create() {
    if (!sizeOk || sizeErrors.roof) return
    setBusy(true)
    setError('')
    const label = presetLabel ?? `${marla(area)} Marla`
    try {
      const { project } = await api.post('/projects', {
        name: name.trim() || `My ${label} house`,
        city,
        plot: { preset, widthFt: size.widthFt, depthFt: size.depthFt },
        floors: req.floors,
        roofHeightFt,
        requirements: {
          bedrooms: req.bedrooms,
          bathrooms: req.bathrooms,
          kitchens: req.kitchens,
          carPorch: rooms.carPorch,
          drawingRoom: rooms.drawingRoom,
          notes: extras.length ? `Also wants: ${extras.join(', ')}` : undefined
        }
      })
      navigate(`/projects/${project.id}/editor`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const main = presets.filter((p) => MAIN_PRESETS.includes(p.key))
  const other = presets.filter((p) => !MAIN_PRESETS.includes(p.key))
  return (
    <div className="flex min-h-screen flex-col bg-paper text-navy lg:h-screen">
      <nav className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-5">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-navy no-underline">
          <Icon name="chev_l" size={16} />
          Projects
        </Link>
        <Logo size={18} />
        <span className="w-20" />
      </nav>
      <div className="flex min-h-0 grow flex-col lg:flex-row">
        <div className="flex shrink-0 flex-col border-line bg-white lg:w-[460px] lg:border-r">
          <div className="flex grow flex-col gap-5 overflow-auto p-6">
            <div className="flex flex-col gap-1">
              <h1 className="m-0 text-2xl font-bold">New project</h1>
              <span className="text-sm text-muted">Plot first, then what you need. You can change everything later.</span>
            </div>

            <label className="flex flex-col gap-1 text-xs font-medium text-muted">
              Project name
              <input
                className="field-input h-9 text-sm"
                placeholder={`My ${presetLabel ?? 'new'} house`}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <div className="flex flex-col gap-2.5">
              <span className={sectionLabel}>1 · Plot</span>
              <div className="flex flex-col gap-2">
                {main.map((p) => {
                  const on = preset === p.key
                  return (
                    <button
                      key={p.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => pickPreset(p)}
                      className={`flex cursor-pointer items-center gap-3 rounded-[10px] p-3 text-left text-navy ${
                        on ? 'border-2 border-blueprint bg-blueprint-tint' : 'border border-line bg-white'
                      }`}
                    >
                      <span className="flex w-8 justify-center">
                        <PlotThumb widthFt={p.widthFt} depthFt={p.depthFt} maxW={28} maxH={46} />
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <b className="text-[14.5px]">{p.label}</b>
                        <span className="font-mono text-[11.5px] text-muted">
                          {ftin(p.widthFt)} × {ftin(p.depthFt)}
                        </span>
                        <span className="font-mono text-[11.5px] text-muted">{num(p.widthFt * p.depthFt)} sq ft</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              <details className="text-[13.5px]" open={other.some((p) => p.key === preset)}>
                <summary className="cursor-pointer py-1 font-semibold text-blueprint">Other sizes</summary>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {other.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      aria-pressed={preset === p.key}
                      onClick={() => pickPreset(p)}
                      className={`h-[30px] cursor-pointer rounded-md border px-2.5 text-[12.5px] font-medium ${
                        preset === p.key ? 'border-blueprint bg-blueprint-tint text-blueprint-hover' : 'border-line-strong bg-white text-navy'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </details>
              <div className="grid grid-cols-2 gap-2">
                <FeetField label="Width (front)" value={size.widthFt} error={sizeErrors.widthFt} onChange={(v) => resize({ ...size, widthFt: v })} />
                <FeetField label="Depth" value={size.depthFt} error={sizeErrors.depthFt} onChange={(v) => resize({ ...size, depthFt: v })} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={sectionLabel}>2 · Requirements</span>
              <Stepper label="Bedrooms" value={req.bedrooms} min={0} max={12} onChange={(v) => setReq({ ...req, bedrooms: v })} />
              <Stepper label="Bathrooms" value={req.bathrooms} min={0} max={12} onChange={(v) => setReq({ ...req, bathrooms: v })} />
              <Stepper label="Kitchens" value={req.kitchens} min={0} max={4} onChange={(v) => setReq({ ...req, kitchens: v })} />
              <Stepper label="Floors" value={req.floors} min={1} max={5} onChange={(v) => setReq({ ...req, floors: v })} />
              <div className="grid grid-cols-2 gap-2 pt-1.5">
                <FeetField label="Roof height" value={roofHeightFt} error={sizeErrors.roof} onChange={setRoof} />
                <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                  City (for prices)
                  <select className="field-input h-9 text-sm" value={city} onChange={(e) => setCity(e.target.value)}>
                    {CITIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <Toggle on={rooms.drawingRoom} onClick={() => setRooms({ ...rooms, drawingRoom: !rooms.drawingRoom })}>Drawing room</Toggle>
                <Toggle on={rooms.carPorch} onClick={() => setRooms({ ...rooms, carPorch: !rooms.carPorch })}>Car porch</Toggle>
                {EXTRAS.map((x) => (
                  <Toggle key={x} on={extras.includes(x)} onClick={() => setExtras((e) => (e.includes(x) ? e.filter((y) => y !== x) : [...e, x]))}>
                    {x}
                  </Toggle>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-line px-6 py-3.5">
            {error && <span role="alert" className="text-sm text-red">{error}</span>}
            <Button variant="primary" size="lg" className="w-full" disabled={busy || !sizeOk || Boolean(sizeErrors.roof)} onClick={create} iconRight="arrow_r">
              {busy ? 'Creating…' : 'Create project and open editor'}
            </Button>
            <span className="text-[12.5px] text-muted">You start with the plot boundary. AI layouts come in a later update.</span>
          </div>
        </div>

        <section aria-label="Plot preview" className="bg-grid relative flex min-h-[520px] grow items-center justify-center overflow-hidden p-6 pt-20 [--grid-size:13px] lg:pt-6">
          <div className="absolute top-5 left-5 flex gap-2">
            <Chip tone="navy">{presetLabel ?? 'Custom plot'}</Chip>
            {sizeOk && (
              <span className="rounded-md border border-line bg-white px-2 py-0.5 font-mono text-[13px]">
                {num(area)} sq ft · {marla(area)} Marla
              </span>
            )}
          </div>
          {fit && (
            <div className="absolute top-14 right-5 left-5 flex flex-col gap-2 rounded-card border border-line bg-white p-3.5 sm:left-auto sm:w-[290px] lg:top-5">
              <span className={`flex items-center gap-2 text-[13.5px] font-semibold ${fit.fits ? 'text-[#1f5a41]' : 'text-[#7a4500]'}`}>
                <Icon name={fit.fits ? 'check_c' : 'warn'} size={17} strokeWidth={2} className={fit.fits ? 'text-green' : 'text-amber'} />
                {fit.fits ? 'Your requirements fit' : "These rooms won't fit yet"}
              </span>
              <span className="text-[12.5px] leading-normal text-muted">{fit.message}</span>
            </div>
          )}
          {sizeOk ? (
            <PlotPreview widthFt={size.widthFt} depthFt={size.depthFt} onResize={resize} />
          ) : (
            <span className="text-muted">Enter a width and depth to see the plot.</span>
          )}
          <div className="absolute right-5 bottom-5 hidden items-center gap-1.5 text-[12.5px] text-muted sm:flex">
            <Icon name="hand" size={15} />
            Drag the blue handles to resize the plot
          </div>
        </section>
      </div>
    </div>
  )
}
