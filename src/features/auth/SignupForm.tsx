import { useState, type FormEvent } from 'react'
import { register } from '@/features/auth/api'
import { FormField, PasswordField } from '@/features/auth/FormField'
import { passwordChecks, validateSignup, type FieldErrors } from '@/features/auth/validation'
import { HttpError } from '@/lib/http'
import { Link } from '@/lib/router'

/** US-01: sign up with a university e-mail. The backend then e-mails a verification code (US-02). */
function SignupForm() {
  const [values, setValues] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const update = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((current) => ({ ...current, [field]: e.target.value }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    const found = validateSignup(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      const result = await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      setSentTo(result.email)
    } catch (error) {
      if (error instanceof HttpError) {
        setErrors(error.fieldErrors)
        setFormError(error.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (sentTo) {
    return (
      <div className="auth-success" role="status">
        <p className="auth-success-title">Check your inbox</p>
        <p>
          We sent a 6-digit verification code to <strong>{sentTo}</strong>. It is valid for 10 minutes.
          Verify your e-mail, then log in.
        </p>
        <Link to="/login" className="button primary auth-submit">Go to log in</Link>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {formError && <p className="form-alert" role="alert">{formError}</p>}

      <FormField
        id="fullName"
        label="Full name"
        autoComplete="name"
        placeholder="Ayşe Yılmaz"
        value={values.fullName}
        onChange={update('fullName')}
        error={errors.fullName}
      />
      <FormField
        id="email"
        label="University e-mail"
        type="email"
        autoComplete="email"
        placeholder="name@metu.edu.tr"
        value={values.email}
        onChange={update('email')}
        error={errors.email}
        hint="Only @metu.edu.tr addresses can sign up for now."
      />
      <PasswordField
        id="password"
        label="Password"
        autoComplete="new-password"
        value={values.password}
        onChange={update('password')}
        error={errors.password}
        hint={
          <ul className="password-checks">
            {passwordChecks(values.password).map((check) => (
              <li key={check.label} className={check.ok ? 'ok' : undefined}>
                <span aria-hidden="true">{check.ok ? '✓' : '•'}</span> {check.label}
              </li>
            ))}
          </ul>
        }
      />
      <PasswordField
        id="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={update('confirmPassword')}
        error={errors.confirmPassword}
      />

      <button type="submit" className="button primary auth-submit" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Create account'}
      </button>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  )
}

export default SignupForm
