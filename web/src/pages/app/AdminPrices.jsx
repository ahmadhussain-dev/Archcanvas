import { useMemo, useState } from 'react'
import Button from '../../components/Button.jsx'
import Chip from '../../components/Chip.jsx'
import Icon from '../../components/Icon.jsx'
import StatePanel from '../../components/StatePanel.jsx'
import FullPageSpinner from '../../components/FullPageSpinner.jsx'
import { api } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'
import { formatDate, num } from '../../lib/format.js'

const CITIES = ['Faisalabad', 'Lahore', 'Islamabad', 'Rawalpindi', 'Karachi', 'Multan', 'Peshawar', 'Gujranwala', 'Sialkot']
const STATUS = { verified: ['Verified', 'green'], stale: ['Stale', 'amber'], unverified: ['Unverified', 'grey'] }

function Spark({ values }) {
  if (values.length < 2) return <span className="text-xs text-muted">—</span>
  const mn = Math.min(...values)
  const mx = Math.max(...values)
  const pts = values.map((v, i) => `${((i * 80) / (values.length - 1)).toFixed(1)},${(22 - ((v - mn) / (mx - mn || 1)) * 18).toFixed(1)}`).join(' ')
  return (
    <svg width="80" height="24" viewBox="0 0 80 24" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#13202C" strokeWidth="1.5" />
    </svg>
  )
}

// A big jump is usually a typo (7.5 instead of 75), so it needs a second look.
function check(rate, text) {
  if (text.trim() === '') return 'Enter a price'
  const v = Number(text.replace(/,/g, ''))
  if (!Number.isFinite(v) || v < 0) return 'Enter a number'
  if (rate.ratePkr > 0 && (v < rate.ratePkr * 0.5 || v > rate.ratePkr * 2)) {
    return `${v < rate.ratePkr ? 'Looks too low' : 'Looks too high'}. The last rate was ${num(rate.ratePkr)}.`
  }
  return ''
}

function downloadCsv(city, rates) {
  const rows = [['Material', 'Unit', 'Rate (PKR)', 'Status', 'Verified on']]
  for (const r of rates) rows.push([r.name, r.unit, r.ratePkr, r.displayStatus, r.verifiedAt ? formatDate(r.verifiedAt) : ''])
  const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `archcanvas-prices-${city.toLowerCase()}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminPrices() {
  const [city, setCity] = useState('Faisalabad')
  const { data, error, loading, reload, setData } = useApi(`/admin/rates?city=${encodeURIComponent(city)}`)
  const [edits, setEdits] = useState({})
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const rates = useMemo(() => data?.rates ?? [], [data])
  const changed = rates.filter((r) => edits[r.id] !== undefined && Number(edits[r.id].replace(/,/g, '')) !== r.ratePkr)
  const errors = Object.fromEntries(changed.map((r) => [r.id, check(r, edits[r.id])]).filter(([, e]) => e))
  const hardErrors = Object.values(errors).filter((e) => e.startsWith('Enter'))
  const counts = rates.reduce((c, r) => ({ ...c, [r.displayStatus]: (c[r.displayStatus] ?? 0) + 1 }), {})

  function replace(updated) {
    setData((d) => ({ ...d, rates: d.rates.map((r) => updated.find((u) => u.id === r.id) ?? r) }))
  }

  async function save() {
    if (hardErrors.length) return
    const warnings = Object.values(errors)
    if (warnings.length && !window.confirm(`${warnings.join('\n')}\n\nSave anyway?`)) return
    setBusy(true)
    setMessage(null)
    try {
      const updated = []
      for (const r of changed) {
        const { rate } = await api.patch(`/admin/rates/${r.id}`, { ratePkr: Number(edits[r.id].replace(/,/g, '')) })
        updated.push(rate)
      }
      replace(updated)
      setEdits({})
      setMessage({ tone: 'green', text: `Saved ${updated.length} price${updated.length === 1 ? '' : 's'}. New estimates use them now.` })
    } catch (err) {
      setMessage({ tone: 'red', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function markVerified() {
    setBusy(true)
    setMessage(null)
    try {
      const updated = []
      for (const id of selected) updated.push((await api.patch(`/admin/rates/${id}`, { verified: true })).rate)
      replace(updated)
      setSelected([])
      setMessage({ tone: 'green', text: `Marked ${updated.length} price${updated.length === 1 ? '' : 's'} as checked today.` })
    } catch (err) {
      setMessage({ tone: 'red', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const th = 'px-3 py-2.5 text-left text-xs font-semibold text-muted'
  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-[18px] px-4 py-7 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-2xl font-bold">Material prices</h1>
          <span className="text-[13.5px] text-muted">These rates drive every grey structure estimate. Verify them against the market at least every 30 days.</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="City"
            className="field-input h-10 w-auto text-sm"
            value={city}
            onChange={(e) => (setCity(e.target.value), setEdits({}), setSelected([]), setMessage(null))}
          >
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <Button icon="download" onClick={() => downloadCsv(city, rates)} disabled={!rates.length}>Export CSV</Button>
          <Button variant="primary" onClick={save} disabled={busy || !changed.length || hardErrors.length > 0}>
            {busy ? 'Saving…' : changed.length ? `Save ${changed.length} change${changed.length === 1 ? '' : 's'}` : 'Save changes'}
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <FullPageSpinner />
      ) : error ? (
        <StatePanel compact kind="error" title="We couldn't load the prices" text={error.message} actions={[{ label: 'Try again', onClick: reload }]} />
      ) : rates.length === 0 ? (
        <StatePanel
          compact
          kind="empty"
          title={`No prices for ${city} yet`}
          text={city === 'Faisalabad' ? 'Run the seed script to add the starting prices: npm run seed -w @archcanvas/api' : `Estimates for ${city} use the Faisalabad prices until ${city} has its own.`}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {counts.verified > 0 && <Chip tone="green" icon="check">{counts.verified} verified</Chip>}
            {counts.stale > 0 && <Chip tone="amber" icon="warn">{counts.stale} stale</Chip>}
            {counts.unverified > 0 && <Chip>{counts.unverified} unverified</Chip>}
            {Object.keys(errors).length > 0 && <Chip tone="red" icon="error">{Object.keys(errors).length} to check</Chip>}
          </div>
          {message && (
            <div role="status" className={`rounded-control px-3 py-2.5 text-sm ${message.tone === 'green' ? 'bg-green-tint text-[#1f5a41]' : 'bg-red-tint text-[#8f1c13]'}`}>
              {message.text}
            </div>
          )}
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-control border border-[#bcd0ea] bg-blueprint-tint px-3 py-2 text-[13.5px]">
              <b className="text-blueprint-hover">{selected.length} selected</b>
              <Button size="sm" icon="check" onClick={markVerified} disabled={busy}>Mark verified</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
            </div>
          )}
          <div className="overflow-x-auto rounded-card border border-line bg-white">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="bg-paper">
                  <th scope="col" className={th}>
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      className="size-4 accent-blueprint"
                      checked={selected.length === rates.length}
                      onChange={(e) => setSelected(e.target.checked ? rates.map((r) => r.id) : [])}
                    />
                  </th>
                  <th scope="col" className={th}>Material</th>
                  <th scope="col" className={th}>Unit</th>
                  <th scope="col" className={th}>Rate (PKR)</th>
                  <th scope="col" className={th}>Change</th>
                  <th scope="col" className={th}>Last checked</th>
                  <th scope="col" className={th}>History</th>
                  <th scope="col" className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => {
                  const sel = selected.includes(r.id)
                  const text = edits[r.id] ?? String(r.ratePkr)
                  const value = Number(text.replace(/,/g, ''))
                  const err = errors[r.id]
                  const prev = r.history.length > 1 ? r.history[r.history.length - 2].ratePkr : null
                  const base = edits[r.id] !== undefined ? r.ratePkr : prev
                  const now = edits[r.id] !== undefined ? value : r.ratePkr
                  const change = base ? ((now - base) / base) * 100 : null
                  const [label, tone] = STATUS[r.displayStatus]
                  return (
                    <tr key={r.id} className={`border-t border-[#eef1f3] ${sel ? 'bg-[#f4f8fd]' : 'bg-white'}`}>
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          aria-label={`Select ${r.name}`}
                          className="size-4 accent-blueprint"
                          checked={sel}
                          onChange={() => setSelected((s) => (sel ? s.filter((x) => x !== r.id) : [...s, r.id]))}
                        />
                      </td>
                      <td className="px-3 py-2.5 font-medium">{r.name}</td>
                      <td className="px-3 py-2.5 text-muted">{r.unit}</td>
                      <td className="px-3 py-2">
                        <input
                          inputMode="decimal"
                          aria-label={`${r.name} rate`}
                          aria-invalid={Boolean(err)}
                          className={`h-[34px] w-[120px] rounded-control border px-2.5 font-mono text-[13.5px] text-navy outline-none focus:ring-2 ${
                            err ? 'border-red focus:ring-red/20' : 'border-line-strong focus:border-blueprint focus:ring-blueprint/20'
                          }`}
                          value={text}
                          onChange={(e) => setEdits((x) => ({ ...x, [r.id]: e.target.value }))}
                        />
                        {err && (
                          <span className="flex items-center gap-1 pt-1 text-xs text-red">
                            <Icon name="error" size={13} strokeWidth={2} />
                            {err}
                          </span>
                        )}
                      </td>
                      <td className={`px-3 py-2.5 font-mono text-[13px] ${change === null || Math.abs(change) < 0.05 ? 'text-muted' : Math.abs(change) > 50 ? 'text-red' : ''}`}>
                        {change === null || !Number.isFinite(change) ? 'new' : `${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change).toFixed(1)}%`}
                      </td>
                      <td className="px-3 py-2.5 text-[13px] text-muted">
                        {edits[r.id] !== undefined && value !== r.ratePkr ? 'Not saved' : r.verifiedAt ? formatDate(r.verifiedAt) : 'Starting value'}
                      </td>
                      <td className="px-3 py-2.5">
                        <Spark values={r.history.map((h) => h.ratePkr)} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Chip tone={tone}>{label}</Chip>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <span className="text-[12.5px] text-muted">
            Grey means unverified, green verified, amber older than 30 days, red a price to check before saving. Saving a new price marks it as checked today.
          </span>
        </>
      )}
    </main>
  )
}
