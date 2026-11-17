import { useState, type FormEvent } from 'react'
import { login } from '@/features/auth/api'
import { FormField, PasswordField } from '@/features/auth/FormField'
import { saveSession } from '@/features/auth/session'
import { validateLogin, type FieldErrors } from '@/features/auth/validation'
import { HttpError } from '@/lib/http'
import { Link, navigate } from '@/lib/router'

/** US-03: log in with university e-mail and password. */
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    const found = validateLogin(email, password)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      saveSession(await login({ email: email.trim(), password }))
      navigate('/')
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

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {formError && <p className="form-alert" role="alert">{formError}</p>}

      <FormField
        id="email"
        label="University e-mail"
        type="email"
        autoComplete="email"
        placeholder="name@metu.edu.tr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <PasswordField
        id="password"
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      <button type="submit" className="button primary auth-submit" disabled={submitting}>
        {submitting ? 'Logging in…' : 'Log in'}
      </button>

      <p className="auth-switch">
        New to CampusHub? <Link to="/signup">Create an account</Link>
      </p>
    </form>
  )
}

export default LoginForm
