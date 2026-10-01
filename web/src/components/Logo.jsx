// Official ArchCanvas logo (docs/design/brand).
// "nav" = house + wordmark, "full" = lockup with tagline, "house" = house mark only.
const RATIO = { lockup: 886 / 761, house: 600 / 406, word: 700 / 82 }

function Part({ part, height, dark, alt = '' }) {
  const width = Math.round(height * RATIO[part])
  return (
    <img
      src={`/brand/${part}-${dark ? 'dark' : 'light'}.png`}
      alt={alt}
      width={width}
      height={height}
      className="block max-w-none shrink-0 object-contain"
      style={{ width, height }}
    />
  )
}

export default function Logo({ variant = 'nav', size = 24, dark = false, className = '' }) {
  if (variant === 'full') {
    return (
      <span className={`inline-flex ${className}`}>
        <Part part="lockup" height={size} dark={dark} alt="ArchCanvas, construction and design" />
      </span>
    )
  }
  if (variant === 'house') {
    return (
      <span className={`inline-flex ${className}`}>
        <Part part="house" height={size} dark={dark} alt="ArchCanvas" />
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: Math.round(size * 0.35) }}>
      <Part part="house" height={Math.round(size * 1.35)} dark={dark} />
      <Part part="word" height={Math.round(size * 0.78)} dark={dark} alt="ArchCanvas" />
    </span>
  )
}

// The house in a navy tile, used as the app icon.
export function Monogram({ size = 32 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center bg-navy"
      style={{ width: size, height: size, borderRadius: Math.max(4, Math.floor(size / 5)) }}
    >
      <Part part="house" height={Math.round(size * 0.5)} dark />
    </span>
  )
}
