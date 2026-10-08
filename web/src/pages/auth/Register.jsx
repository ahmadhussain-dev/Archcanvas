import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import Button from '../../components/Button.jsx'
import AuthLayout, { Field, FormError } from './AuthLayout.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'

// 0 to 4: length 8+, a letter and a number, 12+, mixed case or a symbol.
export function passwordStrength(pw) {
  if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return pw ? 1 : 0
  let score = 2
  if (pw.length >= 12) score++
  if ((/[a-z]/.test(pw) && /[A-Z]/.test(pw)) || /[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const STRENGTH = [
  ['Use at least 8 characters with a number.', ''],
  ['Too weak. Use at least 8 characters with a letter and a number.', 'bg-red'],
  ['Good. A longer password is even better.', 'bg-amber'],
  ['Strong.', 'bg-green'],
  ['Very strong.', 'bg-green']
]

export default function Register() {
  const { register } = useAuth()
  const [params] = useSearchParams()
  const next = params.get('next')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const strength = passwordStrength(form.password)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setErrors({})
    setFormError('')
    if (!agreed) {
      setErrors({ agreed: 'Please tick this box to continue.' })
      return
    }
    setBusy(true)
    try {
      await register(form.name, form.email, form.password)
      // GuestOnly sends the now logged-in person on to ?next= or their projects.
    } catch (err) {
      setErrors(err.fieldErrors ?? {})
      if (!err.details?.length) setFormError(err.message)
      setBusy(false)
    }
  }

  const loginLink = next ? `/login?next=${encodeURIComponent(next)}` : '/login'
  const [hint, bar] = STRENGTH[strength]
  return (
    <AuthLayout>
      <form onSubmit={submit} noValidate className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[28px] font-bold">Create your account</h1>
          <span className="text-sm text-muted">
            Already have one? <Link to={loginLink} className="font-semibold no-underline">Log in</Link>
          </span>
        </div>
        <FormError>{formError}</FormError>
        <Field label="Full name" error={errors.name}>
          <input autoComplete="name" className="field-input" value={form.name} onChange={set('name')} aria-invalid={Boolean(errors.name)} required />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="field-input"
            value={form.email}
            onChange={set('email')}
            aria-invalid={Boolean(errors.email)}
            required
          />
        </Field>
        <Field
          label="Password"
          error={errors.password}
          hint={
            <>
              <span className="mt-0.5 flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`h-1 grow rounded-sm ${i < strength ? bar : 'bg-line'}`} />
                ))}
              </span>
              <span className="text-[12.5px] font-normal text-muted">{hint}</span>
            </>
          }
        >
          <input
            type="password"
            autoComplete="new-password"
            className="field-input"
            value={form.password}
            onChange={set('password')}
            aria-invalid={Boolean(errors.password)}
            required
          />
        </Field>
        <div className="flex flex-col gap-1">
          <label className="flex items-start gap-2 text-[13.5px] leading-[1.45] text-muted">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-px size-4 shrink-0 accent-blueprint"
            />
            I understand ArchCanvas is a planning aid, not a structural engineering tool.
          </label>
          {errors.agreed && <span className="text-[12.5px] text-red">{errors.agreed}</span>}
        </div>
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
        <span className="text-[12.5px] leading-normal text-muted">New accounts are regular users. Admin access is given by an existing admin.</span>
      </form>
    </AuthLayout>
  )
}
