import { useLayoutEffect, useRef, useState } from 'react'

// Lays out children at a fixed design size and shrinks them to fit narrow screens.
export default function Scaled({ width, height, className = '', children }) {
  const outer = useRef(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = outer.current
    if (!el) return undefined
    const update = () => setScale(Math.min(1, el.clientWidth / width))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [width])

  return (
    <div ref={outer} className={`w-full ${scale < 1 ? 'overflow-hidden' : ''} ${className}`} style={{ height: height * scale }}>
      <div
        style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        className={scale < 1 ? '' : 'mx-auto'}
      >
        {children}
      </div>
    </div>
  )
}
