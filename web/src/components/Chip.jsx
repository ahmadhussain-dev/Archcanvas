import Icon from './Icon.jsx'

const tones = {
  grey: 'bg-[#eef0f2] text-[#3e4a55]',
  green: 'bg-green-tint text-[#1f5a41]',
  amber: 'bg-amber-tint text-[#7a4500]',
  red: 'bg-red-tint text-[#8f1c13]',
  blue: 'bg-blueprint-tint text-blueprint-hover',
  violet: 'bg-violet-tint text-[#4a33a8]',
  navy: 'bg-navy text-white'
}

export default function Chip({ tone = 'grey', icon, children, className = '' }) {
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold whitespace-nowrap ${tones[tone]} ${className}`}>
      {icon && <Icon name={icon} size={13} strokeWidth={2.2} />}
      <span>{children}</span>
    </span>
  )
}
