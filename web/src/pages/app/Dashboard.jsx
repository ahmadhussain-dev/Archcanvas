import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Button from '../../components/Button.jsx'
import Chip from '../../components/Chip.jsx'
import Icon from '../../components/Icon.jsx'
import PlotThumb from '../../components/PlotThumb.jsx'
import StatePanel from '../../components/StatePanel.jsx'
import FullPageSpinner from '../../components/FullPageSpinner.jsx'
import { api } from '../../lib/api.js'
import { useApi } from '../../lib/useApi.js'
import { ftin, marla, timeAgo } from '../../lib/format.js'
// Quick starts. Ready-made room layouts come with the AI step.
const SIZES = [
  ['3 Marla', '3-marla', 22.5, 30],
  ['5 Marla', '5-marla', 25, 45],
  ['7 Marla', '7-marla', 35, 45],
  ['10 Marla', '10-marla', 30, 75],
  ['1 Kanal', '1-kanal', 50, 90]
]

function ProjectMenu({ project, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const item = 'w-full cursor-pointer rounded-md border-0 bg-transparent px-2 py-2 text-left text-sm font-medium hover:bg-paper'
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={`More actions for ${project.name}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-muted hover:bg-paper"
      >
        <Icon name="dots" size={16} />
      </button>
      {open && (
        <div className="absolute right-0 bottom-8 z-20 w-44 rounded-card border border-line bg-white p-1.5 shadow-[0_10px_28px_rgba(19,32,44,0.12)]">
          <button type="button" className={`${item} text-navy`} onClick={() => (setOpen(false), onDuplicate(project))}>Duplicate</button>
          <button type="button" className={`${item} text-red`} onClick={() => (setOpen(false), onDelete(project))}>Delete</button>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, onDuplicate, onDelete }) {
  const { plot } = project
  const editor = `/projects/${project.id}/editor`
  return (
    <div className="group flex flex-col overflow-hidden rounded-card border border-line bg-white hover:border-blueprint">
      <div className="bg-grid relative flex h-[190px] items-center justify-center border-b border-line [--grid-size:12px]">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt="" className="max-h-[162px] max-w-[90%] object-contain" />
        ) : (
          <PlotThumb widthFt={plot.widthFt} depthFt={plot.depthFt} maxW={100} maxH={150} />
        )}
        <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-navy/55 group-focus-within:flex group-hover:flex">
          <Button as={Link} to={editor} size="sm">Open</Button>
          <Button size="sm" icon="copy" onClick={() => onDuplicate(project)}>Duplicate</Button>
          <Button as={Link} to={`/projects/${project.id}/estimate`} size="sm">Estimate</Button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <Link to={editor} className="truncate text-[15px] font-bold text-navy no-underline hover:text-blueprint">{project.name}</Link>
          <ProjectMenu project={project} onDuplicate={onDuplicate} onDelete={onDelete} />
        </div>
        <span className="font-mono text-xs text-muted">
          {marla(plot.areaSqft)} Marla · {ftin(plot.widthFt)} × {ftin(plot.depthFt)} · {project.floors} floor{project.floors === 1 ? '' : 's'}
        </span>
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-muted">Edited {timeAgo(project.updatedAt)}</span>
          {project.versionCount > 0 ? <Chip tone="green" icon="check">Saved</Chip> : <Chip>Empty plot</Chip>}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, error, loading, reload, setData } = useApi('/projects?limit=50')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')

  async function duplicate(project) {
    setNotice('')
    try {
      const { floorplan } = await api.get(`/projects/${project.id}`)
      const body = {
        name: `${project.name} (copy)`.slice(0, 100),
        city: project.city,
        plot: { preset: project.plot.preset, widthFt: project.plot.widthFt, depthFt: project.plot.depthFt },
        floors: project.floors,
        roofHeightFt: project.roofHeightFt
      }
      if (project.requirements) body.requirements = project.requirements
      if (floorplan) body.floorplan = floorplan
      const { project: copy } = await api.post('/projects', body)
      setData((d) => ({ ...d, projects: [copy, ...d.projects], total: d.total + 1 }))
    } catch (err) {
      setNotice(err.message)
    }
  }

  async function remove(project) {
    if (!window.confirm(`Delete "${project.name}" and all its saved versions? This can't be undone.`)) return
    setNotice('')
    try {
      await api.delete(`/projects/${project.id}`)
      setData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== project.id), total: d.total - 1 }))
    } catch (err) {
      setNotice(err.message)
    }
  }

  if (loading && !data) return <FullPageSpinner />
  if (error) {
    return (
      <StatePanel
        kind={error.status === 0 ? 'offline' : 'error'}
        tag={error.status === 0 ? 'Offline' : 'Error'}
        title="We couldn't load your projects"
        text={error.message}
        actions={[{ label: 'Try again', onClick: reload }]}
      />
    )
  }

  const projects = data.projects.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 text-[28px] font-bold">Projects</h1>
        <div className="flex w-full gap-2 sm:w-auto">
          <label className="flex h-10 min-w-0 grow items-center gap-2 rounded-control border border-line-strong bg-white px-3 sm:w-[260px] sm:grow-0">
            <Icon name="search" size={16} className="text-muted" />
            <input
              type="search"
              aria-label="Search projects"
              placeholder="Search projects"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 grow border-0 bg-transparent text-sm text-navy outline-none"
            />
          </label>
          <Button as={Link} to="/projects/new" variant="primary" icon="plus">New project</Button>
        </div>
      </div>

      {notice && (
        <div role="alert" className="rounded-control border border-[#f0b8b2] bg-red-tint px-3 py-2.5 text-sm text-[#8f1c13]">{notice}</div>
      )}

      {data.projects.length === 0 ? (
        <div className="rounded-card border border-line bg-white">
          <StatePanel
            compact
            kind="empty"
            title="No projects yet"
            text="Start with your plot size, or pick a Pakistani template."
            actions={[
              { label: 'Start a new plot', to: '/projects/new', variant: 'primary' },
              { label: 'Browse templates', to: '/#templates' }
            ]}
          />
        </div>
      ) : projects.length === 0 ? (
        <p className="m-0 text-muted">No projects match &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onDuplicate={duplicate} onDelete={remove} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        <h2 className="m-0 text-xl font-semibold">Start from a plot size</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SIZES.map(([name, preset, w, d]) => (
            <button
              key={name}
              type="button"
              onClick={() => navigate(`/projects/new?preset=${preset}`)}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-card border border-line bg-white p-3 text-navy hover:border-blueprint"
            >
              <div className="flex h-[100px] items-center">
                <PlotThumb widthFt={w} depthFt={d} maxW={60} maxH={92} />
              </div>
              <b className="text-[13px]">{name}</b>
              <span className="font-mono text-[11px] text-muted">{ftin(w)} × {ftin(d)}</span>
            </button>
          ))}
          <Link
            to="/projects/new"
            className="flex flex-col items-center justify-center gap-2 rounded-card border-[1.5px] border-dashed border-line-strong p-3 text-navy no-underline hover:border-blueprint hover:text-navy"
          >
            <Icon name="plus" size={24} className="text-blueprint" />
            <b className="text-[13px]">Blank plot</b>
            <span className="text-[11.5px] text-muted">Any size</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
