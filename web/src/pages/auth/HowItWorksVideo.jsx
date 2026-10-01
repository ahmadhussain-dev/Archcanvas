import Art from '../../components/Art.jsx'
import plot from '../../art/step-plot.svg?raw'
import draw from '../../art/step-draw.svg?raw'
import room3d from '../../art/step-room3d.svg?raw'
import cost from '../../art/step-cost.svg?raw'

const SCENES = [
  ['Choose your plot', 'Pick a Marla size or type your own width and depth.', plot],
  ['Draw it in 2D', 'Walls snap together with real feet and inches.', draw],
  ['See it in 3D', 'Walk around the rooms and place furniture.', room3d],
  ['Know the cost', 'A grey structure estimate in rupees, per sq ft.', cost]
]

// A looping 16 second "video" made of the four step illustrations (CSS animation only).
export default function HowItWorksVideo() {
  return (
    <div className="w-full max-w-[560px] overflow-hidden rounded-dialog border border-line bg-white shadow-[0_10px_28px_rgba(19,32,44,0.06)]">
      <div
        role="img"
        aria-label="Animated video showing how ArchCanvas works in four steps"
        className="bg-grid relative h-[360px] [--grid-line:#f0f2f5] [--grid-size:20px] sm:h-[440px]"
      >
        {SCENES.map(([title, text, svg], i) => (
          <div
            key={title}
            className="ac-scene absolute inset-0 flex flex-col items-center justify-center gap-[18px] px-4"
            style={{ animationDelay: `${i * 4}s` }}
          >
            <div className="flex h-[220px] w-full max-w-[360px] items-center sm:h-[300px]">
              <Art svg={svg} className="w-full" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="font-mono text-xs text-blueprint">Step {i + 1} of 4</span>
              <b className="font-heading text-[22px] font-semibold">{title}</b>
              <span className="text-[14.5px] text-muted">{text}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex h-12 items-center gap-3 border-t border-line px-4">
        <span className="flex size-7 items-center justify-center rounded-full bg-navy" aria-hidden="true">
          <svg width="10" height="12" viewBox="0 0 10 12">
            <path d="M1 1h3v10H1zM6 1h3v10H6z" fill="#FFFFFF" />
          </svg>
        </span>
        <span className="h-1 grow overflow-hidden rounded-sm bg-line">
          <span className="ac-prog block h-full bg-blueprint" />
        </span>
        <span className="font-mono text-xs text-muted">0:16</span>
      </div>
    </div>
  )
}
