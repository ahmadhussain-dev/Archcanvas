import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import Button from '../../components/Button.jsx'
import AuthLayout, { Field, FormError } from './AuthLayout.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { safeNext } from '../../auth/guards.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(params.get('ended') ? 'Your session has ended. Log in to keep working.' : '')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setFormError('')
    try {
      await login(email, password)
      navigate(safeNext(next), { replace: true })
    } catch (err) {
      setErrors(err.fieldErrors ?? {})
      if (!err.details?.length) setFormError(err.message)
      setBusy(false)
    }
  }

  const registerLink = next ? `/register?next=${encodeURIComponent(next)}` : '/register'
  return (
    <AuthLayout>
      <form onSubmit={submit} noValidate className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[28px] font-bold">Log in</h1>
          <span className="text-sm text-muted">
            New to ArchCanvas?{' '}
            <Link to={registerLink} className="font-semibold no-underline">Create an account</Link>
          </span>
        </div>
        <FormError>{formError}</FormError>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            required
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <input
            type="password"
            autoComplete="current-password"
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors.password)}
            required
          />
        </Field>
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </Button>
        <span className="text-[12.5px] leading-normal text-muted">
          You stay logged in for 7 days on this device. After 5 failed tries, the account locks for 15 minutes.
        </span>
      </form>
    </AuthLayout>
  )
}
