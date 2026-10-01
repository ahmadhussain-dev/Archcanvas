import { useRef } from 'react'
import Art from '../../components/Art.jsx'
import Icon from '../../components/Icon.jsx'
import plot from '../../art/step-plot.svg?raw'
import draw from '../../art/step-draw.svg?raw'
import room3d from '../../art/step-room3d.svg?raw'
import ai from '../../art/step-ai.svg?raw'
import cost from '../../art/step-cost.svg?raw'

const STEPS = [
  ['Choose your plot', plot],
  ['Draw it in 2D', draw],
  ['See it in 3D', room3d],
  ['Ask ArchCanvas', ai],
  ['Know the cost', cost]
]

// "How it works" as a row of animated illustration cards.
export default function StepCards() {
  const row = useRef(null)
  const next = () => row.current?.scrollBy({ left: 312, behavior: 'smooth' })
  return (
    <section className="relative mx-auto max-w-[1280px] px-4 pb-16 sm:px-6" aria-label="How ArchCanvas works">
      <div ref={row} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-1">
        {STEPS.map(([title, svg], i) => (
          <div
            key={title}
            className="flex w-[292px] shrink-0 snap-start flex-col items-center gap-2 rounded-dialog border border-line bg-white px-4 pt-6 pb-4"
          >
            <span className="font-mono text-xs text-blueprint">0{i + 1}</span>
            <b className="font-heading text-[21px] font-semibold">{title}</b>
            <div className="flex h-[250px] w-full items-center justify-center">
              <Art svg={svg} className="w-[250px]" />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={next}
        aria-label="Next step"
        className="absolute top-[140px] right-2 hidden size-[52px] items-center justify-center rounded-full border border-line-strong bg-white text-navy shadow-[0_6px_18px_rgba(19,32,44,0.12)] sm:flex"
      >
        <Icon name="arrow_r" size={22} />
      </button>
    </section>
  )
}
