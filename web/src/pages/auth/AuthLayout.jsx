import { Link } from 'react-router'
import Icon from '../../components/Icon.jsx'
import Logo from '../../components/Logo.jsx'
import HowItWorksVideo from './HowItWorksVideo.jsx'

// Login and sign-up: the how-it-works video on the left, the form on the right.
export default function AuthLayout({ children }) {
  return (
    <div className="grid grid-cols-1 min-h-screen bg-white text-navy lg:grid-cols-2">
      <div className="hidden flex-col justify-between gap-6 border-r border-line bg-paper px-12 py-10 lg:flex">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy no-underline">
          <Icon name="chev_l" size={16} />
          Back to home
        </Link>
        <div className="flex justify-center">
          <HowItWorksVideo />
        </div>
        <div className="flex max-w-[460px] flex-col gap-1.5">
          <b className="font-heading text-[22px] leading-tight">From plot to estimate in 4 steps.</b>
          <span className="text-[15px] leading-normal text-muted">Your plans are saved with every version, so you can always go back.</span>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 self-start text-sm font-medium text-navy no-underline lg:hidden">
          <Icon name="chev_l" size={16} />
          Back to home
        </Link>
        <div className="flex w-full max-w-[380px] flex-col gap-[18px]">
          <div className="flex justify-center pb-2">
            <Logo variant="full" size={150} />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export function FormError({ children }) {
  if (!children) return null
  return (
    <div role="alert" className="flex gap-2 rounded-control border border-[#f0b8b2] bg-red-tint px-3 py-2.5 text-sm text-[#8f1c13]">
      <Icon name="error" size={18} className="mt-px" />
      <span>{children}</span>
    </div>
  )
}

export function Field({ label, error, hint, children, aside }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-medium">
      <span className="flex justify-between">
        {label}
        {aside}
      </span>
      {children}
      {error && <span className="text-[12.5px] font-normal text-red">{error}</span>}
      {!error && hint}
    </label>
  )
}
