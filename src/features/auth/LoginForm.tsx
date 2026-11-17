import { useState, type FormEvent } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { FormField, PasswordField } from '@/components/FormField'
import { validateLogin, type FieldErrors } from '@/features/auth/validation'
import { HttpError } from '@/lib/http'
import { getQueryParam, Link } from '@/lib/router'

/**
 * US-03: log in with university e-mail and password.
 * Only verified accounts can log in; the backend answers 403 for the others.
 * After a successful login RedirectIfSignedIn moves the student on.
 */
function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState(getQueryParam('email') ?? '')
  const [verified] = useState(getQueryParam('verified') === '1')
  const [loggedOut] = useState(getQueryParam('loggedOut') === '1')
  const [sessionNeeded] = useState(Boolean(getQueryParam('next')))
  // Set when the backend says the account is not verified yet, to offer the way back to /verify.
  const [needsVerification, setNeedsVerification] = useState(false)
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setNeedsVerification(false)
    const found = validateLogin(email, password)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
    } catch (error) {
      if (error instanceof HttpError) {
        setErrors(error.fieldErrors)
        setFormError(error.message)
        setNeedsVerification(error.status === 403 && /verify/i.test(error.message))
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {verified && !formError && (
        <p className="form-success" role="status">Your e-mail is verified. You can log in now.</p>
      )}
      {loggedOut && !formError && (
        <p className="form-success" role="status">You have logged out. See you soon!</p>
      )}
      {sessionNeeded && !loggedOut && !formError && (
        <p className="form-info" role="status">Please log in to see that page.</p>
      )}
      {formError && (
        <p className="form-alert" role="alert">
          {formError}
          {needsVerification && (
            <>
              {' '}
              <Link to={`/verify?email=${encodeURIComponent(email.trim())}`}>Verify your e-mail</Link>
            </>
          )}
        </p>
      )}

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
