import AuthLayout from '@/features/auth/AuthLayout'
import RedirectIfSignedIn from '@/features/auth/RedirectIfSignedIn'
import SignupForm from '@/features/auth/SignupForm'

function SignupPage() {
  return (
    <RedirectIfSignedIn>
      <AuthLayout title="Create your account" subtitle="Join CampusHub with your university e-mail address.">
        <SignupForm />
      </AuthLayout>
    </RedirectIfSignedIn>
  )
}

export default SignupPage
