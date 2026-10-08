// A small drawing of the plot outline, used until a project has a saved plan picture.
export default function PlotThumb({ widthFt, depthFt, maxW = 100, maxH = 150 }) {
  const s = Math.min(maxW / widthFt, maxH / depthFt)
  const w = widthFt * s
  const d = depthFt * s
  const lawn = Math.min(5, depthFt * 0.15) * s
  return (
    <svg width={w + 4} height={d + 4} viewBox={`-2 -2 ${w + 4} ${d + 4}`} aria-hidden="true" className="block">
      <rect x="0" y="0" width={w} height={lawn} fill="#EEF3EC" />
      <rect x="0" y={lawn} width={w} height={d - lawn} fill="#1E5AA8" fillOpacity="0.05" stroke="#1E5AA8" strokeWidth="1" strokeDasharray="4 3" />
      <rect x="0" y="0" width={w} height={d} fill="none" stroke="#13202C" strokeWidth="2.2" />
    </svg>
  )
}
