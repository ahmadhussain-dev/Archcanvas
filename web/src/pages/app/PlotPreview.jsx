import { useRef } from 'react'
import { ftin, num } from '../../lib/format.js'

const BOX_W = 520
const BOX_H = 700
const ML = 70
const MT = 56
const LAWN_FT = 5

// Live drawing of the plot. Drag the blue handles to change width and depth (6 inch steps).
export default function PlotPreview({ widthFt, depthFt, onResize }) {
  const svg = useRef(null)
  const s = Math.min((BOX_W - ML - 90) / widthFt, (BOX_H - MT - 60) / depthFt)
  const pw = widthFt * s
  const ph = depthFt * s
  const lawn = Math.min(LAWN_FT, depthFt * 0.2) * s
  const W = ML + pw + 90
  const H = MT + ph + 60
  const buildable = widthFt * (depthFt - lawn / s)

  function drag(axis) {
    return (e) => {
      e.preventDefault()
      const el = svg.current
      const start = { x: e.clientX, y: e.clientY, w: widthFt, d: depthFt }
      const ratio = el.viewBox.baseVal.width / el.getBoundingClientRect().width
      const move = (ev) => {
        const dx = ((ev.clientX - start.x) * ratio) / s
        const dy = ((ev.clientY - start.y) * ratio) / s
        const snap = (v) => Math.min(500, Math.max(5, Math.round(v * 2) / 2))
        if (axis === 'x') onResize({ widthFt: snap(start.w + dx), depthFt })
        else onResize({ widthFt, depthFt: snap(start.d + dy) })
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    }
  }

  function nudge(axis) {
    return (e) => {
      const step = e.shiftKey ? 5 : 0.5
      const delta = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }[e.key]
      if (!delta) return
      e.preventDefault()
      const clamp = (v) => Math.min(500, Math.max(5, v))
      if (axis === 'x') onResize({ widthFt: clamp(widthFt + delta), depthFt })
      else onResize({ widthFt, depthFt: clamp(depthFt + delta) })
    }
  }

  const tick = { stroke: '#5F6B76', strokeWidth: 1.2 }
  const mono = { fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, fill: '#13202C' }
  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="img"
      aria-label={`Live preview of a ${ftin(widthFt)} by ${ftin(depthFt)} plot`}
      className="block h-auto max-h-full max-w-full touch-none select-none"
    >
      <rect x={ML} y={MT} width={pw} height={lawn} fill="#EEF3EC" />
      <rect x={ML} y={MT + lawn} width={pw} height={ph - lawn} fill="#1E5AA8" fillOpacity="0.05" stroke="#1E5AA8" strokeDasharray="5 4" />
      <rect x={ML} y={MT} width={pw} height={ph} fill="none" stroke="#13202C" strokeWidth="5" />
      {lawn > 14 && (
        <text x={ML + pw / 2} y={MT + lawn / 2 + 4} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="12" fill="#55626E">
          Back lawn {ftin(lawn / s)}
        </text>
      )}
      <text x={ML + pw / 2} y={MT + ph / 2} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="600" fill="#1E5AA8">
        Buildable area
      </text>
      <text x={ML + pw / 2} y={MT + ph / 2 + 18} textAnchor="middle" {...mono} fill="#55626E">
        {num(buildable)} sq ft per floor
      </text>
      <line x1={ML} y1={MT - 26} x2={ML + pw} y2={MT - 26} stroke="#5F6B76" strokeWidth="0.8" />
      <line x1={ML - 5} y1={MT - 21} x2={ML + 5} y2={MT - 31} {...tick} />
      <line x1={ML + pw - 5} y1={MT - 21} x2={ML + pw + 5} y2={MT - 31} {...tick} />
      <text x={ML + pw / 2} y={MT - 32} textAnchor="middle" {...mono}>{ftin(widthFt)}</text>
      <line x1={ML - 28} y1={MT} x2={ML - 28} y2={MT + ph} stroke="#5F6B76" strokeWidth="0.8" />
      <line x1={ML - 33} y1={MT + 5} x2={ML - 23} y2={MT - 5} {...tick} />
      <line x1={ML - 33} y1={MT + ph + 5} x2={ML - 23} y2={MT + ph - 5} {...tick} />
      <text x={ML - 34} y={MT + ph / 2} textAnchor="middle" {...mono} transform={`rotate(-90 ${ML - 34} ${MT + ph / 2})`}>
        {ftin(depthFt)}
      </text>
      {onResize && (
        <>
          <rect
            x={ML + pw - 7}
            y={MT + ph / 2 - 18}
            width="14"
            height="36"
            rx="4"
            fill="#FFFFFF"
            stroke="#1E5AA8"
            strokeWidth="2"
            className="cursor-ew-resize focus:outline-none [&:focus]:fill-[#E6EEF8]"
            tabIndex={0}
            role="slider"
            aria-label="Plot width"
            aria-valuemin={5}
            aria-valuemax={500}
            aria-valuenow={widthFt}
            aria-valuetext={ftin(widthFt)}
            onPointerDown={drag('x')}
            onKeyDown={nudge('x')}
          />
          <rect
            x={ML + pw / 2 - 18}
            y={MT + ph - 7}
            width="36"
            height="14"
            rx="4"
            fill="#FFFFFF"
            stroke="#1E5AA8"
            strokeWidth="2"
            className="cursor-ns-resize focus:outline-none [&:focus]:fill-[#E6EEF8]"
            tabIndex={0}
            role="slider"
            aria-label="Plot depth"
            aria-valuemin={5}
            aria-valuemax={500}
            aria-valuenow={depthFt}
            aria-valuetext={ftin(depthFt)}
            onPointerDown={drag('y')}
            onKeyDown={nudge('y')}
          />
        </>
      )}
      <text x={ML + pw / 2} y={MT + ph + 34} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="12" fill="#55626E">
        Front · road
      </text>
    </svg>
  )
}
