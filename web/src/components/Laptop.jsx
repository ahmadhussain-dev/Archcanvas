import Scaled from './Scaled.jsx'

// A plain laptop frame around a screen of width × height px.
export default function Laptop({ width = 640, height = 400, children }) {
  const total = width + 150
  return (
    <Scaled width={total} height={height + 32 + 16}>
      <div className="flex flex-col items-center" style={{ width: total }}>
        <div className="rounded-t-[18px] bg-[#1b2026] px-3.5 pt-3.5 pb-[18px] shadow-[0_18px_40px_rgba(19,32,44,0.18)]">
          <div className="relative overflow-hidden rounded bg-white" style={{ width, height }}>
            {children}
          </div>
        </div>
        <div className="flex h-4 justify-center rounded-b-[14px] border-t border-[#e3e7eb] bg-[#c9cfd6]" style={{ width: total }}>
          <span className="h-1.5 w-[120px] rounded-b-lg bg-[#aeb6bf]" />
        </div>
      </div>
    </Scaled>
  )
}
