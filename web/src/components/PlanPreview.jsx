// A drawn floor plan of one floor of a template (data from GET /api/templates,
// built by api/src/lib/planPreview.js). Everything is in plan feet: x to the
// right, y down towards the road at the bottom.
const OUTDOOR = /terrace|balcony|lawn|garden|porch/i
const PAD = 1.5

export default function PlanPreview({ preview, floor = 0, labels = false, furniture = true, className = '', title }) {
  const f = preview.floors[floor]
  if (!f) return null
  const W = preview.width
  const D = preview.depth
  // A tall house reads at small sizes with thinner room names.
  const label = Math.max(0.9, Math.min(1.5, W / 18))
  return (
    <svg
      viewBox={`${-PAD} ${-PAD} ${W + PAD * 2} ${D + PAD * 2}`}
      role="img"
      aria-label={title ?? `${f.name} floor plan`}
      className={`block h-full w-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* The plot: open ground is a soft green. */}
      <rect x="0" y="0" width={W} height={D} fill="#EEF3EC" stroke="#9DB3A0" strokeWidth="0.15" strokeDasharray="0.6 0.4" />
      {f.rooms.map((r) => (
        <rect key={`r-${r.name}`} x={r.x} y={r.y} width={r.width} height={r.depth} fill={OUTDOOR.test(r.name) ? '#F1F4F0' : '#FBFAF7'} />
      ))}
      {furniture &&
        f.items.map((it, i) => (
          <rect key={`i-${i}`} x={it.x} y={it.y} width={it.width} height={it.depth} rx="0.15" fill="#FFFFFF" stroke="#A9B4BE" strokeWidth="0.08" />
        ))}
      {f.stairs.map((s, i) => {
        const steps = Math.max(6, Math.min(24, s.steps))
        const lines = []
        for (let k = 1; k < steps; k += 1) {
          const t = k / steps
          lines.push(
            s.along === 'y' ? (
              <line key={k} x1={s.x} x2={s.x + s.width} y1={s.y + s.depth * t} y2={s.y + s.depth * t} stroke="#1E5AA8" strokeWidth="0.06" />
            ) : (
              <line key={k} y1={s.y} y2={s.y + s.depth} x1={s.x + s.width * t} x2={s.x + s.width * t} stroke="#1E5AA8" strokeWidth="0.06" />
            )
          )
        }
        return (
          <g key={`s-${i}`}>
            <rect x={s.x} y={s.y} width={s.width} height={s.depth} fill="#E6EEF8" stroke="#1E5AA8" strokeWidth="0.1" />
            {lines}
          </g>
        )
      })}
      {f.walls.map((w, i) => (
        <line
          key={`w-${i}`}
          x1={w.x1}
          y1={w.y1}
          x2={w.x2}
          y2={w.y2}
          stroke="#13202C"
          strokeWidth={Math.max(0.3, w.t)}
          strokeLinecap="square"
        />
      ))}
      {f.openings.map((o, i) => {
        const half = o.width / 2
        const t = o.t + 0.1
        const gap =
          o.along === 'x'
            ? { x: o.x - half, y: o.y - t / 2, width: o.width, height: t }
            : { x: o.x - t / 2, y: o.y - half, width: t, height: o.width }
        if (o.type === 'window') {
          return (
            <g key={`o-${i}`}>
              <rect {...gap} fill="#FFFFFF" />
              <rect {...gap} fill="none" stroke="#1E5AA8" strokeWidth="0.08" />
              {o.along === 'x' ? (
                <line x1={o.x - half} x2={o.x + half} y1={o.y} y2={o.y} stroke="#1E5AA8" strokeWidth="0.08" />
              ) : (
                <line y1={o.y - half} y2={o.y + half} x1={o.x} x2={o.x} stroke="#1E5AA8" strokeWidth="0.08" />
              )}
            </g>
          )
        }
        // A door or archway is a clear gap in the wall.
        return <rect key={`o-${i}`} {...gap} fill="#FBFAF7" />
      })}
      {labels &&
        f.rooms.map((r) => {
          const size = Math.min(label, (r.width - 0.8) / Math.max(4, r.name.length * 0.6), r.depth / 3)
          return (
            <g key={`l-${r.name}`} fontFamily="Inter, sans-serif" textAnchor="middle">
              <text x={r.x + r.width / 2} y={r.y + r.depth / 2} fontSize={size} fontWeight="600" fill="#13202C">
                {r.name}
              </text>
              {r.depth > 5 && r.width > 4.5 && (
                <text x={r.x + r.width / 2} y={r.y + r.depth / 2 + size * 1.3} fontSize={size * 0.8} fontFamily="IBM Plex Mono, monospace" fill="#5F6B76">
                  {Math.round(r.width * 2) / 2}×{Math.round(r.depth * 2) / 2}
                </text>
              )}
            </g>
          )
        })}
    </svg>
  )
}
