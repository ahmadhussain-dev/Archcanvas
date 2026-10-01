// Shows one of the approved illustrations or plan drawings from src/art.
// The markup is our own static art (docs/design/generators/export_art.py), not user content.
// The drawing scales to the width of its box and keeps its shape.
export default function Art({ svg, className = '', label }) {
  return (
    <div
      className={`ac-art ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
