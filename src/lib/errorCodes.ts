// Machine-readable error codes the backend sends in the `code` field of its error body.
// This list is part of the API contract: the frontend decides what to do from `code` (and the
// HTTP status), never from the text in `detail`. The mock in mock/ uses the same list.

export type ErrorCode =
  // Any endpoint
  | 'VALIDATION_FAILED' // 400, with fieldErrors
  | 'UNAUTHENTICATED' // 401: no token, or the token has expired / was logged out
  | 'FORBIDDEN' // 403: signed in, but the role may not do this
  | 'NOT_FOUND' // 404
  | 'INTERNAL_ERROR' // 500
  // Sign up / log in (US-01, US-03)
  | 'EMAIL_DOMAIN_NOT_ALLOWED' // 400, with fieldErrors.email
  | 'EMAIL_TAKEN' // 409: a verified account already uses this e-mail
  | 'BAD_CREDENTIALS' // 401: wrong e-mail or password (same code for both)
  | 'EMAIL_NOT_VERIFIED' // 403: log-in before the e-mail was verified
  | 'ACCOUNT_DISABLED' // 403
  // E-mail verification (US-02)
  | 'SIGNUP_NOT_FOUND' // 400: no sign-up is waiting for this e-mail
  | 'ALREADY_VERIFIED' // 409
  | 'OTP_NOT_FOUND' // 400: no active code, request a new one
  | 'OTP_EXPIRED' // 400
  | 'OTP_INVALID' // 400: wrong code, attempts are left
  | 'OTP_TOO_MANY_ATTEMPTS' // 400
  | 'OTP_COOLDOWN' // 429: a new code was requested too soon
