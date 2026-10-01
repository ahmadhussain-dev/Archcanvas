// Line icons from the approved UI preview (24 × 24, stroke = currentColor).
const PATHS = {
  pointer: "<path d=\"M5 3l14 8-6 2-2 6z\"></path>",
  hand: "<path d=\"M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L3 14.5a1.6 1.6 0 0 1 2.4-2L8 15\"></path>",
  wall: "<rect x=\"3\" y=\"9\" width=\"18\" height=\"6\"></rect><path d=\"M9 9v6M15 9v6\"></path>",
  room: "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\"></rect><path d=\"M3 13h8v8\"></path>",
  door: "<path d=\"M4 20h16M6 20V5h0\"></path><path d=\"M6 5a15 15 0 0 1 14 15\"></path>",
  window: "<rect x=\"3\" y=\"8\" width=\"18\" height=\"8\"></rect><path d=\"M3 12h18\"></path>",
  stairs: "<path d=\"M3 20h5v-5h5v-5h5V5h3\"></path>",
  sofa: "<path d=\"M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3\"></path><path d=\"M3 11h18v6H3zM5 17v2M19 17v2\"></path>",
  bed: "<path d=\"M3 18V7M3 13h18v5M21 18v-5a3 3 0 0 0-3-3h-7v3\"></path><circle cx=\"7\" cy=\"10.5\" r=\"1.5\"></circle>",
  ruler: "<path d=\"M3 17 17 3l4 4L7 21z\"></path><path d=\"m7 13 2 2M10 10l2 2M13 7l2 2\"></path>",
  text: "<path d=\"M5 6V4h14v2M12 4v16M9 20h6\"></path>",
  paint: "<rect x=\"4\" y=\"3\" width=\"14\" height=\"6\" rx=\"1\"></rect><path d=\"M18 6h2v5h-8v3\"></path><rect x=\"10\" y=\"14\" width=\"4\" height=\"7\" rx=\"1\"></rect>",
  sparkle: "<path d=\"M12 3l1.9 5.3L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.7z\"></path><path d=\"M19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z\"></path>",
  check: "<path d=\"m5 12.5 4.5 4.5L19 7.5\"></path>",
  check_c: "<circle cx=\"12\" cy=\"12\" r=\"9\"></circle><path d=\"m8 12.3 2.7 2.7L16 9.5\"></path>",
  warn: "<path d=\"M12 3.5 2.5 20h19z\"></path><path d=\"M12 10v4.5M12 17.2v.1\"></path>",
  error: "<circle cx=\"12\" cy=\"12\" r=\"9\"></circle><path d=\"M12 7.5v5.5M12 16.3v.1\"></path>",
  grid: "<path d=\"M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18\"></path>",
  magnet: "<path d=\"M6 3v8a6 6 0 0 0 12 0V3h-4v8a2 2 0 0 1-4 0V3z\"></path><path d=\"M6 7h4M14 7h4\"></path>",
  zoom: "<circle cx=\"11\" cy=\"11\" r=\"7\"></circle><path d=\"m20 20-4-4M8 11h6M11 8v6\"></path>",
  undo: "<path d=\"M9 14 4 9l5-5\"></path><path d=\"M4 9h11a5 5 0 0 1 0 10h-3\"></path>",
  redo: "<path d=\"m15 14 5-5-5-5\"></path><path d=\"M20 9H9a5 5 0 0 0 0 10h3\"></path>",
  chev: "<path d=\"m6 9 6 6 6-6\"></path>",
  chev_r: "<path d=\"m9 6 6 6-6 6\"></path>",
  chev_l: "<path d=\"m15 6-6 6 6 6\"></path>",
  arrow_r: "<path d=\"M5 12h14M13 6l6 6-6 6\"></path>",
  plus: "<path d=\"M12 5v14M5 12h14\"></path>",
  minus: "<path d=\"M5 12h14\"></path>",
  x: "<path d=\"M6 6l12 12M18 6 6 18\"></path>",
  play: "<circle cx=\"12\" cy=\"12\" r=\"9\"></circle><path d=\"M10 8.5v7l6-3.5z\"></path>",
  download: "<path d=\"M12 4v11M7 10l5 5 5-5M5 20h14\"></path>",
  share: "<circle cx=\"6\" cy=\"12\" r=\"2.5\"></circle><circle cx=\"18\" cy=\"6\" r=\"2.5\"></circle><circle cx=\"18\" cy=\"18\" r=\"2.5\"></circle><path d=\"m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6\"></path>",
  layers: "<path d=\"m12 3 9 5-9 5-9-5z\"></path><path d=\"m3 13 9 5 9-5\"></path>",
  copy: "<rect x=\"8\" y=\"8\" width=\"12\" height=\"12\" rx=\"2\"></rect><path d=\"M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3\"></path>",
  dots: "<circle cx=\"5\" cy=\"12\" r=\"1.3\"></circle><circle cx=\"12\" cy=\"12\" r=\"1.3\"></circle><circle cx=\"19\" cy=\"12\" r=\"1.3\"></circle>",
  search: "<circle cx=\"11\" cy=\"11\" r=\"7\"></circle><path d=\"m20 20-4-4\"></path>",
  upload: "<path d=\"M12 20V9M7 14l5-5 5 5M5 4h14\"></path>",
  template: "<rect x=\"3\" y=\"3\" width=\"8\" height=\"8\" rx=\"1\"></rect><rect x=\"13\" y=\"3\" width=\"8\" height=\"8\" rx=\"1\"></rect><rect x=\"3\" y=\"13\" width=\"8\" height=\"8\" rx=\"1\"></rect><rect x=\"13\" y=\"13\" width=\"8\" height=\"8\" rx=\"1\"></rect>",
  pen: "<path d=\"M4 20l4-1L19 8l-3-3L5 16z\"></path><path d=\"m14 7 3 3\"></path>",
  users: "<circle cx=\"9\" cy=\"8\" r=\"3.5\"></circle><path d=\"M2.5 20a6.5 6.5 0 0 1 13 0\"></path><path d=\"M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6\"></path>",
  home: "<path d=\"M3 11 12 3l9 8\"></path><path d=\"M5 9.5V21h14V9.5M10 21v-6h4v6\"></path>",
  doc: "<path d=\"M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z\"></path><path d=\"M14 3v6h6M8 13h8M8 17h5\"></path>",
  calc: "<rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"2\"></rect><path d=\"M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18h2M14 18h2\"></path>",
  folder: "<path d=\"M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z\"></path>",
  user: "<circle cx=\"12\" cy=\"8\" r=\"4\"></circle><path d=\"M4 21a8 8 0 0 1 16 0\"></path>",
  orbit: "<ellipse cx=\"12\" cy=\"12\" rx=\"9\" ry=\"4\"></ellipse><circle cx=\"12\" cy=\"12\" r=\"2\"></circle><path d=\"M12 3v2M12 19v2\"></path>",
  split: "<rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"1\"></rect><path d=\"M12 4v16\"></path>",
  expand: "<path d=\"m13 6 6 6-6 6M5 6l6 6-6 6\"></path>",
  clock: "<circle cx=\"12\" cy=\"12\" r=\"9\"></circle><path d=\"M12 7v5l3 2\"></path>",
  shield: "<path d=\"M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z\"></path><path d=\"m8.5 12 2.5 2.5 4.5-4.5\"></path>",
  compass: "<circle cx=\"12\" cy=\"5\" r=\"2\"></circle><path d=\"M11 7 6 21M13 7l5 14M8 15h8\"></path>",
  car: "<path d=\"M5 16V11l2-5h10l2 5v5\"></path><path d=\"M3 16h18v3H3zM7 11h10\"></path>",
  filter: "<path d=\"M4 5h16l-6 8v6l-4-2v-4z\"></path>",
}

export default function Icon({ name, size = 20, strokeWidth = 1.8, className = '', label }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`block shrink-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  )
}
