// Client-side checks that mirror the backend rules (US-01), so students see mistakes before submitting.
// The backend checks everything again.

export const ALLOWED_DOMAINS = ['metu.edu.tr']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type FieldErrors = Partial<Record<'fullName' | 'email' | 'password' | 'confirmPassword', string>>

/** Exact domain match only: name@metu.edu.tr is accepted, name@ceng.metu.edu.tr is not. */
export function isUniversityEmail(email: string) {
  const domain = email.trim().toLowerCase().split('@')[1] ?? ''
  return ALLOWED_DOMAINS.includes(domain)
}

export function passwordChecks(password: string) {
  return [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'At least one letter', ok: /[A-Za-z]/.test(password) },
    { label: 'At least one number', ok: /\d/.test(password) },
  ]
}

export function validateLogin(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!email.trim()) errors.email = 'Please enter your e-mail address.'
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid e-mail address.'
  if (!password) errors.password = 'Please enter your password.'
  return errors
}

export function validateSignup(values: {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}): FieldErrors {
  const errors: FieldErrors = {}
  const fullName = values.fullName.trim()
  const email = values.email.trim()

  if (!fullName) errors.fullName = 'Please enter your full name.'
  else if (fullName.length > 100) errors.fullName = 'Full name can be at most 100 characters.'

  if (!email) errors.email = 'Please enter your university e-mail address.'
  else if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid e-mail address.'
  else if (!isUniversityEmail(email)) errors.email = `Please use your university e-mail (@${ALLOWED_DOMAINS.join(', @')}).`

  if (!values.password) errors.password = 'Please choose a password.'
  else if (values.password.length > 72) errors.password = 'Password can be at most 72 characters.'
  else if (passwordChecks(values.password).some((check) => !check.ok)) {
    errors.password = 'Password must be at least 8 characters with a letter and a number.'
  }

  if (!values.confirmPassword) errors.confirmPassword = 'Please repeat your password.'
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match.'

  return errors
}
