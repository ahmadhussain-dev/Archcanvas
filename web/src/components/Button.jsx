const styles = {
  // Brick is only for the main action on a screen.
  primary: 'bg-brick text-white border-brick hover:bg-brick-hover',
  secondary: 'bg-white text-navy border-line-strong hover:bg-paper',
  navy: 'bg-navy text-white border-navy hover:bg-navy/90'
}

export default function Button({ as: Tag = 'button', variant = 'secondary', className = '', ...props }) {
  return (
    <Tag
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-control border px-4 text-sm font-semibold no-underline transition-colors ${styles[variant]} ${className}`}
      {...props}
    />
  )
}
