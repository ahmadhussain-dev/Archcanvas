import { useEffect, useRef, useState } from 'react'
import Button from '../../components/Button.jsx'
import Chip from '../../components/Chip.jsx'
import { api } from '../../lib/api.js'
import { timeAgo } from '../../lib/format.js'

const SOURCE = { manual: 'Saved', autosave: 'Autosave', ai: 'AI', template: 'Template', restore: 'Restored' }

// Saved versions of the plan, newest first, with restore.
export default function VersionsMenu({ projectId, disabled, hasUnsaved, onRestored }) {
  const [open, setOpen] = useState(false)
  const [versions, setVersions] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const box = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    setError('')
    api
      .get(`/projects/${projectId}/versions`)
      .then((d) => setVersions(d.versions))
      .catch((err) => setError(err.message))
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open, projectId])

  async function restore(v) {
    const warning = hasUnsaved ? ' Your unsaved changes will be lost.' : ''
    if (!window.confirm(`Go back to version ${v.number}? It is saved as a new version, so nothing is deleted.${warning}`)) return
    setBusy(v.number)
    try {
      const { version } = await api.post(`/projects/${projectId}/versions/${v.number}/restore`)
      await onRestored(version)
      setOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div ref={box} className="relative">
      <Button size="sm" icon="clock" onClick={() => setOpen((v) => !v)} disabled={disabled} aria-expanded={open}>
        <span className="hidden sm:inline">Versions</span>
      </Button>
      {open && (
        <div className="absolute top-10 right-0 z-30 flex max-h-[420px] w-[300px] flex-col overflow-hidden rounded-card border border-line bg-white shadow-[0_10px_28px_rgba(19,32,44,0.12)]">
          <div className="border-b border-line px-4 py-3">
            <b className="text-sm">Versions</b>
            <p className="m-0 text-xs text-muted">Every Save is kept. Autosave keeps one draft since your last Save.</p>
          </div>
          <div className="overflow-auto">
            {error && <p className="m-0 px-4 py-3 text-sm text-red">{error}</p>}
            {!versions && !error && <p className="m-0 px-4 py-3 text-sm text-muted">Loading…</p>}
            {versions?.length === 0 && <p className="m-0 px-4 py-3 text-sm text-muted">No saved versions yet. Press Save to keep one.</p>}
            {versions?.map((v, i) => (
              <div key={v.id} className="flex items-center justify-between gap-2 border-b border-[#eef1f3] px-4 py-2.5 last:border-0">
                <div className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    Version {v.number}
                    {i === 0 && <Chip tone="green">Current</Chip>}
                  </span>
                  <span className="truncate text-xs text-muted">
                    {SOURCE[v.source] ?? v.source} · {timeAgo(v.updatedAt ?? v.createdAt)}
                    {v.note ? ` · ${v.note}` : ''}
                  </span>
                </div>
                {i > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => restore(v)} disabled={busy !== null}>
                    {busy === v.number ? 'Restoring…' : 'Restore'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
