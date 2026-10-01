export default function FullPageSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
      <span className="size-8 animate-spin rounded-full border-[3px] border-line border-t-blueprint" />
    </div>
  )
}
