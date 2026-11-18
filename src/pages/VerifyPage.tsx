import AuthLayout from '@/features/auth/AuthLayout'
import RedirectIfSignedIn from '@/features/auth/RedirectIfSignedIn'
import VerifyForm from '@/features/auth/VerifyForm'
import { getQueryParam } from '@/lib/router'

// /verify?email=…&sent=1 — opened right after sign-up, or from Log in for unverified accounts.
function VerifyPage() {
  return (
    <RedirectIfSignedIn>
      <AuthLayout
        title="Verify your e-mail"
        subtitle="Enter the 6-digit code we sent to your university e-mail to activate your account."
      >
        <VerifyForm initialEmail={getQueryParam('email') ?? ''} justSent={getQueryParam('sent') === '1'} />
      </AuthLayout>
    </RedirectIfSignedIn>
  )
}

export default VerifyPage
