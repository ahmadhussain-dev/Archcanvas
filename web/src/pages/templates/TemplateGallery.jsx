import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useApi } from '../../lib/useApi.js'
import { startFromTemplate } from '../../lib/templates.js'
import TemplateCard, { TemplateCardSkeleton } from './TemplateCard.jsx'

/**
 * The ready-made houses as a grid of cards. With `quickUse`, hovering a card
 * also offers "Use this house", which opens it in the editor straight away.
 */
export default function TemplateGallery({ quickUse = false, className = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4' }) {
  const { data, error, loading, reload } = useApi('/templates')
  const { status } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(null)
  const [problem, setProblem] = useState('')

  async function use(template) {
    setBusy(template.key)
    setProblem('')
    try {
      navigate(await startFromTemplate(template.key, status === 'in'))
    } catch (err) {
      setProblem(err.message)
      setBusy(null)
    }
  }

  if (error) {
    return (
      <p className="m-0 text-sm text-muted">
        Templates could not be loaded. {error.message}{' '}
        <button type="button" onClick={reload} className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-blueprint">
          Try again
        </button>
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {problem && <div role="alert" className="rounded-control border border-[#f0b8b2] bg-red-tint px-3 py-2.5 text-sm text-[#8f1c13]">{problem}</div>}
      <div className={className}>
        {loading && !data
          ? Array.from({ length: 4 }, (_, i) => <TemplateCardSkeleton key={i} />)
          : data.templates.map((t) => <TemplateCard key={t.key} template={t} onUse={quickUse ? use : undefined} busy={busy === t.key} />)}
      </div>
    </div>
  )
}
