import Icon from './Icon.jsx'

const variants = {
  // Brick is only for the main action on a screen.
  primary: 'bg-brick text-white border-brick hover:bg-brick-hover hover:text-white',
  secondary: 'bg-white text-navy border-line-strong hover:bg-paper hover:text-navy',
  ghost: 'bg-transparent text-navy border-transparent hover:bg-paper hover:text-navy',
  blue: 'bg-blueprint text-white border-blueprint hover:bg-blueprint-hover hover:text-white',
  ai: 'bg-white text-violet border-[#c9bdf5] hover:bg-violet-tint hover:text-violet',
  navy: 'bg-navy text-white border-navy hover:bg-navy/90 hover:text-white',
  danger: 'bg-white text-red border-[#f0b8b2] hover:bg-red-tint hover:text-red'
}

const sizes = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-[22px] text-base'
}
const iconSize = { sm: 16, md: 17, lg: 19 }

export default function Button({
  as: Tag = 'button',
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  className = '',
  children,
  ...props
}) {
  if (Tag === 'button' && !props.type) props.type = 'button'
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 rounded-control border font-semibold whitespace-nowrap no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} size={iconSize[size]} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize[size]} />}
    </Tag>
  )
}
