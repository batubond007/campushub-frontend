import AuthLayout from '@/features/auth/AuthLayout'
import SignupForm from '@/features/auth/SignupForm'

function SignupPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Join CampusHub with your ODTÜ e-mail address.">
      <SignupForm />
    </AuthLayout>
  )
}

export default SignupPage
