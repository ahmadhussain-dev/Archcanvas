import StatePanel from '../components/StatePanel.jsx'

// Shown when a page crashes. The user's saved work is on the server, so it is safe.
export default function RouteError() {
  return (
    <StatePanel
      kind="error"
      tag="Something went wrong"
      title="We couldn't open this page"
      text="Something went wrong on our side. Your last saved version is safe."
      actions={[
        { label: 'Try again', onClick: () => window.location.reload() },
        { label: 'Go to projects', to: '/dashboard' }
      ]}
    />
  )
}
