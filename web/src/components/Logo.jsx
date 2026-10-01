// Official ArchCanvas logo. "nav" = house + wordmark, "full" = lockup with tagline.
export default function Logo({ variant = 'nav', className = '' }) {
  if (variant === 'full') {
    return <img src="/brand/lockup-light.png" alt="ArchCanvas, construction and design" className={className} width="221" height="190" />
  }
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src="/brand/house-light.png" alt="" width="52" height="35" />
      <img src="/brand/word-light.png" alt="ArchCanvas" width="173" height="20" />
    </span>
  )
}
