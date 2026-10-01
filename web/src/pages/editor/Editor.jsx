import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import Button from '../../components/Button.jsx'
import Icon from '../../components/Icon.jsx'
import { Monogram } from '../../components/Logo.jsx'
import StatePanel from '../../components/StatePanel.jsx'
import FullPageSpinner from '../../components/FullPageSpinner.jsx'
import VersionsMenu from './VersionsMenu.jsx'
import { api } from '../../lib/api.js'
import { ftin, marla, timeAgo } from '../../lib/format.js'
import { createEditorBridge } from './editorBridge.js'

const AUTOSAVE_MS = 60_000

function SaveStatus({ state, savedAt, error }) {
  if (state === 'saving') return <span className="text-[13px] text-muted">Saving…</span>
  if (state === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-[13px] text-red" title={error}>
        <Icon name="error" size={15} strokeWidth={2} />
        Not saved
      </span>
    )
  }
  if (state === 'dirty') return <span className="text-[13px] text-amber">Unsaved changes</span>
  if (savedAt) {
    return (
      <span className="flex items-center gap-1.5 text-[13px] text-muted">
        <Icon name="check_c" size={15} strokeWidth={2} className="text-green" />
        Saved {timeAgo(savedAt)}
      </span>
    )
  }
  return null
}

export default function Editor() {
  const { id } = useParams()
  const iframe = useRef(null)
  const bridge = useRef(null)
  const [project, setProject] = useState(null)
  const [floorplan, setFloorplan] = useState(undefined)
  const [loadError, setLoadError] = useState(null)
  const [editorState, setEditorState] = useState('starting') // starting | ready | failed
  const [save, setSave] = useState({ state: 'clean', savedAt: null, error: '' })
  const [, tick] = useState(0)
  const saving = useRef(false)
  const dirty = save.state === 'dirty' || save.state === 'error'

  useEffect(() => {
    let alive = true
    api
      .get(`/projects/${id}`)
      .then((d) => {
        if (!alive) return
        setProject(d.project)
        setFloorplan(d.floorplan)
        if (d.version) setSave((s) => ({ ...s, savedAt: d.project.updatedAt }))
      })
      .catch((err) => alive && setLoadError(err))
    return () => {
      alive = false
    }
  }, [id])

  const sendLoad = useCallback(
    (plan) => {
      if (!project) return
      bridge.current?.load({
        building: plan ?? null,
        name: project.name,
        plot: {
          widthFt: project.plot.widthFt,
          depthFt: project.plot.depthFt,
          floors: project.floors,
          roofHeightFt: project.roofHeightFt
        }
      })
    },
    [project]
  )

  // Connect to the editor once both the iframe and the project are ready.
  useEffect(() => {
    if (!project || floorplan === undefined || !iframe.current) return undefined
    const b = createEditorBridge(iframe.current, {
      ready: () => sendLoad(floorplan),
      loaded: () => setEditorState('ready'),
      changed: () => setSave((s) => (saving.current ? s : { ...s, state: 'dirty' })),
      error: (msg) => {
        setEditorState('failed')
        setLoadError(new Error(msg.message))
      }
    })
    bridge.current = b
    // If the editor loaded before we were listening, it won't say "ready" again.
    sendLoad(floorplan)
    return () => b.dispose()
  }, [project, floorplan, sendLoad])

  const saveNow = useCallback(
    async (source = 'manual') => {
      if (!bridge.current || saving.current || editorState !== 'ready') return
      saving.current = true
      setSave((s) => ({ ...s, state: 'saving' }))
      try {
        const text = await bridge.current.snapshot(project?.name)
        await api.post(`/projects/${id}/versions`, { floorplan: JSON.parse(text), source })
        setSave({ state: 'clean', savedAt: new Date().toISOString(), error: '' })
      } catch (err) {
        setSave((s) => ({ ...s, state: 'error', error: err.message }))
      } finally {
        saving.current = false
      }
    },
    [id, project, editorState]
  )

  // Autosave once a minute while there are changes.
  useEffect(() => {
    if (save.state !== 'dirty') return undefined
    const t = setTimeout(() => saveNow('autosave'), AUTOSAVE_MS)
    return () => clearTimeout(t)
  }, [save.state, saveNow])

  // Keep "Saved 2 min ago" fresh, and warn before leaving with unsaved changes.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (!dirty) return undefined
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  async function restored(version) {
    const { version: full } = await api.get(`/projects/${id}/versions/${version.number}`)
    sendLoad(full.floorplan)
    setSave({ state: 'clean', savedAt: new Date().toISOString(), error: '' })
  }

  if (loadError && !project) {
    return loadError.status === 404 ? (
      <StatePanel kind="empty" tag="Not found" title="We couldn't find this project" text="It may have been deleted." actions={[{ label: 'Go to projects', to: '/dashboard' }]} />
    ) : (
      <StatePanel
        kind={loadError.status === 0 ? 'offline' : 'error'}
        title="We couldn't open this project"
        text={loadError.message}
        actions={[{ label: 'Try again', onClick: () => window.location.reload() }, { label: 'Go to projects', to: '/dashboard' }]}
      />
    )
  }
  if (!project) return <FullPageSpinner />

  const { plot } = project
  return (
    <div className="flex h-screen flex-col bg-white text-navy">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/dashboard"
            aria-label="Back to projects"
            className="flex size-8 shrink-0 items-center justify-center rounded-control text-navy hover:bg-paper hover:text-navy"
          >
            <Icon name="chev_l" size={18} />
          </Link>
          <Monogram size={28} />
          <div className="flex min-w-0 flex-col leading-tight">
            <b className="truncate text-sm">{project.name}</b>
            <span className="hidden truncate font-mono text-[11.5px] text-muted sm:block">
              {marla(plot.areaSqft)} Marla · {ftin(plot.widthFt)} × {ftin(plot.depthFt)} · {project.floors} floor{project.floors === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden md:block" aria-live="polite">
            <SaveStatus {...save} />
          </span>
          <VersionsMenu projectId={id} disabled={editorState !== 'ready' || save.state === 'saving'} hasUnsaved={dirty} onRestored={restored} />
          <Button as={Link} to={`/projects/${id}/estimate`} size="sm" icon="calc" className="hidden sm:inline-flex">
            Estimate
          </Button>
          <Button size="sm" variant="navy" onClick={() => saveNow('manual')} disabled={editorState !== 'ready' || save.state === 'saving'}>
            {save.state === 'saving' ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </header>
      <div className="relative grow">
        <iframe
          ref={iframe}
          src="/editor/?embed=1"
          title="2D and 3D editor"
          className="absolute inset-0 size-full border-0"
          allow="fullscreen"
        />
        {editorState === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white">
            <span className="size-8 animate-spin rounded-full border-[3px] border-line border-t-blueprint" />
            <span className="text-sm text-muted">Opening the editor…</span>
          </div>
        )}
        {editorState === 'failed' && (
          <div className="absolute inset-0 bg-white">
            <StatePanel
              kind="error"
              title="The editor couldn't open this plan"
              text={loadError?.message}
              actions={[{ label: 'Try again', onClick: () => window.location.reload() }, { label: 'Go to projects', to: '/dashboard' }]}
            />
          </div>
        )}
      </div>
    </div>
  )
}
