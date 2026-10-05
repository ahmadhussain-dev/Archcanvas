import { useEffect, useRef, useState } from 'react'
import Button from '../../components/Button.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../lib/api.js'

const IDEAS = [
  'Add a 12 x 14 ft bedroom with an attached bath',
  'Furnish every room with proper furniture',
  'Paint the lounge walls a light warm grey',
  'Put white marble tiles in the drawing room'
]

// "✦ Ask ArchCanvas": the person describes a change, the AI proposes it, the
// editor shows it on the plan, and the person applies or rejects it.
//
// step: ask | thinking | preview | done
export default function AskPanel({ projectId, bridge, onClose, onPreviewChange, onApplied }) {
  const [prompt, setPrompt] = useState('')
  const [step, setStep] = useState('ask')
  const [error, setError] = useState('')
  const [answer, setAnswer] = useState(null) // { message, applied, skipped }
  const [showing, setShowing] = useState('after')
  const input = useRef(null)

  useEffect(() => {
    input.current?.focus()
  }, [])

  const previewing = step === 'preview' && answer?.applied.length > 0
  useEffect(() => {
    onPreviewChange(previewing)
  }, [previewing, onPreviewChange])

  async function ask(e) {
    e?.preventDefault()
    const text = prompt.trim()
    if (text.length < 3 || !bridge) return
    setStep('thinking')
    setError('')
    try {
      const floorplan = await bridge.snapshot()
      const res = await api.post(`/projects/${projectId}/ai`, { prompt: text, floorplan })
      let applied = []
      let skipped = res.skipped
      if (res.operations.length) {
        const result = await bridge.aiPreview(res.operations)
        applied = result.applied
        skipped = [...res.skipped, ...result.skipped]
      }
      setAnswer({ message: res.message, applied, skipped })
      setShowing('after')
      setStep(applied.length ? 'preview' : 'done')
    } catch (err) {
      setError(err.message)
      setStep('ask')
    }
  }

  function show(which) {
    setShowing(which)
    bridge?.aiShow(which)
  }

  function reject() {
    bridge?.aiReject()
    setAnswer(null)
    setStep('ask')
  }

  function apply() {
    bridge?.aiAccept()
    onApplied()
    setStep('done')
  }

  function close() {
    if (previewing) bridge?.aiReject()
    onClose()
  }

  function again() {
    setAnswer(null)
    setStep('ask')
    setTimeout(() => input.current?.focus(), 0)
  }

  return (
    <section
      aria-label="Ask ArchCanvas"
      className="absolute top-3 right-3 z-20 flex max-h-[calc(100%-24px)] w-[min(380px,calc(100%-24px))] flex-col overflow-hidden rounded-card border border-[#c9bdf5] bg-white shadow-[0_10px_28px_rgba(19,32,44,0.12)]"
    >
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-line px-3.5">
        <b className="flex items-center gap-1.5 text-sm text-violet">
          <Icon name="sparkle" size={16} />
          Ask ArchCanvas
        </b>
        <button type="button" onClick={close} aria-label="Close" className="flex size-7 items-center justify-center rounded-control text-muted hover:bg-paper">
          <Icon name="x" size={16} />
        </button>
      </header>

      <div className="flex grow flex-col gap-3 overflow-y-auto p-3.5">
        {(step === 'ask' || step === 'thinking') && (
          <form onSubmit={ask} className="flex flex-col gap-2.5">
            <label htmlFor="ask-prompt" className="text-[13px] text-muted">
              Describe a change to this floor. The AI keeps rooms inside the plot and at real minimum sizes.
            </label>
            <textarea
              id="ask-prompt"
              ref={input}
              rows={3}
              maxLength={1000}
              value={prompt}
              disabled={step === 'thinking'}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) ask(e)
              }}
              placeholder="e.g. Add a bedroom with attached bath at the back"
              className="w-full resize-none rounded-control border border-line-strong px-3 py-2 text-sm text-navy outline-none focus:border-violet disabled:bg-paper"
            />
            {error && (
              <p role="alert" className="flex gap-1.5 text-[13px] text-red">
                <Icon name="error" size={15} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
            {step === 'thinking' ? (
              <p className="flex items-center gap-2 text-[13px] text-violet" aria-live="polite">
                <span className="size-4 animate-spin rounded-full border-2 border-violet-tint border-t-violet" />
                Working out the changes…
              </p>
            ) : (
              <Button type="submit" variant="ai" icon="sparkle" disabled={prompt.trim().length < 3} className="self-end">
                Ask
              </Button>
            )}
            {step === 'ask' && !prompt && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">Try</span>
                {IDEAS.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => setPrompt(idea)}
                    className="rounded-control bg-violet-tint px-2.5 py-1.5 text-left text-[13px] text-[#4a33a8] hover:bg-[#e2d9fb]"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            )}
          </form>
        )}

        {(step === 'preview' || step === 'done') && answer && (
          <>
            <p className="rounded-control bg-violet-tint px-3 py-2 text-sm text-[#2f2273]">{answer.message}</p>
            {answer.applied.length > 0 && (
              <div>
                <h3 className="mb-1.5 text-xs font-semibold text-muted">
                  {step === 'done' ? 'Applied' : 'Changes'} ({answer.applied.length})
                </h3>
                <ul className="flex flex-col gap-1">
                  {answer.applied.map((change, i) => (
                    <li key={i} className="flex gap-2 text-[13px]">
                      <Icon name={step === 'done' ? 'check_c' : 'sparkle'} size={15} className={`mt-0.5 shrink-0 ${step === 'done' ? 'text-green' : 'text-violet'}`} />
                      <span>{change.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {answer.skipped.length > 0 && (
              <div>
                <h3 className="mb-1.5 text-xs font-semibold text-muted">Left out ({answer.skipped.length})</h3>
                <ul className="flex flex-col gap-1.5">
                  {answer.skipped.map((change, i) => (
                    <li key={i} className="flex gap-2 text-[13px]">
                      <Icon name="warn" size={15} className="mt-0.5 shrink-0 text-amber" />
                      <span>
                        <span className="font-semibold">{change.label}.</span> {change.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {step === 'preview' && answer && (
        <footer className="flex shrink-0 flex-col gap-2.5 border-t border-line p-3.5">
          <div role="group" aria-label="Compare" className="flex rounded-control bg-paper p-0.5">
            {['before', 'after'].map((which) => (
              <button
                key={which}
                type="button"
                aria-pressed={showing === which}
                onClick={() => show(which)}
                className={`h-7 grow rounded-[6px] text-[13px] font-semibold capitalize ${showing === which ? 'bg-white text-violet shadow-sm' : 'text-muted hover:text-navy'}`}
              >
                {which}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={reject} className="grow">
              Reject
            </Button>
            <Button variant="primary" icon="check" onClick={apply} className="grow">
              Apply
            </Button>
          </div>
        </footer>
      )}
      {step === 'done' && (
        <footer className="flex shrink-0 justify-end border-t border-line p-3.5">
          <Button variant="ai" icon="sparkle" onClick={again}>
            Ask something else
          </Button>
        </footer>
      )}
    </section>
  )
}
