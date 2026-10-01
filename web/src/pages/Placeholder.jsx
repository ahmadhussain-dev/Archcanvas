// A signed-in screen that is routed but not built yet.
export default function Placeholder({ title }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-6 py-16">
      <h1 className="m-0 text-3xl font-bold">{title}</h1>
      <p className="m-0 text-muted">This screen is coming next. The design is in the approved UI preview.</p>
    </main>
  )
}
