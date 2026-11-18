import { Link } from 'react-router'
import PlanPreview from '../../components/PlanPreview.jsx'
import Button from '../../components/Button.jsx'
import { ftin } from '../../lib/format.js'

/** A ready-made house: the ground floor plan, its size and what it has. */
export default function TemplateCard({ template, onUse, busy = false }) {
  const { plot } = template
  const to = `/templates/${template.key}`
  return (
    <div className="group flex flex-col overflow-hidden rounded-card border border-line bg-white hover:border-blueprint">
      <div className="relative border-b border-line">
        <Link to={to} aria-label={`Preview the ${template.name}`} className="bg-grid flex h-[200px] items-center justify-center p-3 [--grid-size:12px]">
          <PlanPreview preview={template.preview} floor={0} title={`${template.name}, ground floor`} />
        </Link>
        {onUse && (
          <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-navy/55 group-focus-within:flex group-hover:flex">
            <Button as={Link} to={to} size="sm">Preview</Button>
            <Button size="sm" variant="primary" disabled={busy} onClick={() => onUse(template)}>
              {busy ? 'Opening…' : 'Use this house'}
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 px-4 py-3">
        <Link to={to} className="text-[15px] font-bold text-navy no-underline hover:text-blueprint">{plot.label}</Link>
        <span className="font-mono text-xs text-muted">{ftin(plot.widthFt)} × {ftin(plot.depthFt)}</span>
        <span className="text-[12.5px] text-muted">
          {template.bedrooms} bed · {template.bathrooms} bath · {template.floors} floors
        </span>
      </div>
    </div>
  )
}

/** Grey boxes while the templates load. */
export function TemplateCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-white" aria-hidden="true">
      <div className="h-[200px] animate-pulse border-b border-line bg-paper" />
      <div className="flex flex-col gap-2 px-4 py-3.5">
        <div className="h-4 w-20 rounded bg-paper" />
        <div className="h-3 w-28 rounded bg-paper" />
      </div>
    </div>
  )
}
