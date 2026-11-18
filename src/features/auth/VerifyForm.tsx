import { useEffect, useState, type FormEvent } from 'react'
import { resendCode, verifyEmail } from '@/features/auth/api'
import { FormField } from '@/components/FormField'
import OtpInput from '@/features/auth/OtpInput'
import { HttpError } from '@/lib/http'
import { Link, navigate } from '@/lib/router'

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

/**
 * US-02: the student types the 6-digit code that was e-mailed after sign-up.
 * A correct code activates the account; the student is then sent to Log in.
 */
function VerifyForm({ initialEmail, justSent }: { initialEmail: string; justSent: boolean }) {
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  // A code was just sent by the sign-up form, so the first resend has to wait the full cooldown.
  const [cooldown, setCooldown] = useState(justSent ? RESEND_COOLDOWN_SECONDS : 0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  async function verify(fullCode: string) {
    setError(null)
    setInfo(null)
    if (!email.trim()) {
      setError('Please enter the e-mail address you signed up with.')
      return
    }
    if (fullCode.length !== CODE_LENGTH) {
      setError(`Please enter all ${CODE_LENGTH} digits of the code.`)
      return
    }

    setVerifying(true)
    try {
      await verifyEmail({ email: email.trim(), code: fullCode })
      navigate(`/login?verified=1&email=${encodeURIComponent(email.trim())}`)
    } catch (e) {
      setError(e instanceof HttpError ? e.message : 'Something went wrong. Please try again.')
      setCode('')
    } finally {
      setVerifying(false)
    }
  }

  function handleCodeChange(next: string) {
    setCode(next)
    // Submit as soon as the last digit is typed or a full code is pasted.
    if (next.length === CODE_LENGTH && !verifying) void verify(next)
  }

  async function handleResend() {
    setError(null)
    setInfo(null)
    if (!email.trim()) {
      setError('Please enter the e-mail address you signed up with.')
      return
    }
    setResending(true)
    try {
      await resendCode(email.trim())
      setInfo('We sent you a new code. The previous code no longer works.')
      setCode('')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (e) {
      setError(e instanceof HttpError ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setResending(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void verify(code)
  }

  const minutes = Math.floor(cooldown / 60)
  const seconds = String(cooldown % 60).padStart(2, '0')

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {initialEmail ? (
        <p className="verify-email">
          Code sent to <strong>{initialEmail}</strong>
        </p>
      ) : (
        <FormField
          id="email"
          label="University e-mail"
          type="email"
          autoComplete="email"
          placeholder="name@metu.edu.tr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      )}

      {error && <p className="form-alert" role="alert">{error}</p>}
      {info && <p className="form-info" role="status">{info}</p>}

      <div className="form-field">
        <span className="form-label" id="code-label">Verification code</span>
        <OtpInput
          value={code}
          onChange={handleCodeChange}
          length={CODE_LENGTH}
          invalid={Boolean(error)}
          disabled={verifying}
          describedBy="code-label code-hint"
        />
        <p id="code-hint" className="form-hint">The code is valid for 10 minutes. Check your spam folder too.</p>
      </div>

      <button type="submit" className="button primary auth-submit" disabled={verifying || code.length !== CODE_LENGTH}>
        {verifying ? 'Verifying…' : 'Verify e-mail'}
      </button>

      <p className="auth-switch">
        Didn’t get the code?{' '}
        {cooldown > 0 ? (
          <span className="resend-wait" aria-live="polite">Send a new one in {minutes}:{seconds}</span>
        ) : (
          <button type="button" className="link-button" onClick={handleResend} disabled={resending}>
            {resending ? 'Sending…' : 'Send a new code'}
          </button>
        )}
      </p>
      <p className="auth-switch">
        Wrong e-mail address? <Link to="/signup">Sign up again</Link>
      </p>
    </form>
  )
}

export default VerifyForm
