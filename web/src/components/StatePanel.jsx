import { Link } from 'react-router'
import Art from './Art.jsx'
import Button from './Button.jsx'
import Chip from './Chip.jsx'
import error from '../art/state-error.svg?raw'
import offline from '../art/state-offline.svg?raw'
import ai from '../art/state-ai.svg?raw'
import lock from '../art/state-lock.svg?raw'
import empty from '../art/state-empty.svg?raw'
import denied from '../art/state-denied.svg?raw'

const KINDS = {
  error: { art: error, tone: 'grey', tag: 'Error' },
  offline: { art: offline, tone: 'amber', tag: 'Offline' },
  ai: { art: ai, tone: 'violet', tag: 'AI' },
  lock: { art: lock, tone: 'grey', tag: 'Session' },
  empty: { art: empty, tone: 'blue', tag: 'Empty' },
  denied: { art: denied, tone: 'red', tag: 'Admin only' }
}

// An error or empty state: illustration, what happened, and one clear next step.
export default function StatePanel({ kind = 'error', tag, title, text, actions = [], compact = false }) {
  const k = KINDS[kind]
  return (
    <div className={`flex flex-col items-center gap-4 text-center ${compact ? 'py-10' : 'min-h-[60vh] justify-center px-4 py-16'}`}>
      <div className="relative">
        <Art svg={k.art} className="w-[230px]" />
      </div>
      <Chip tone={k.tone}>{tag ?? k.tag}</Chip>
      <h1 className="m-0 text-2xl font-semibold">{title}</h1>
      {text && <p className="m-0 max-w-md text-[15px] leading-relaxed text-muted">{text}</p>}
      {actions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {actions.map((a, i) =>
            a.to ? (
              <Button key={a.label} as={Link} to={a.to} variant={a.variant ?? (i === 0 ? 'navy' : 'secondary')}>
                {a.label}
              </Button>
            ) : (
              <Button key={a.label} onClick={a.onClick} variant={a.variant ?? (i === 0 ? 'navy' : 'secondary')}>
                {a.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}
