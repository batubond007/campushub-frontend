import AuthLayout from '@/features/auth/AuthLayout'
import RedirectIfSignedIn from '@/features/auth/RedirectIfSignedIn'
import LoginForm from '@/features/auth/LoginForm'

function LoginPage() {
  return (
    <RedirectIfSignedIn>
      <AuthLayout title="Welcome back" subtitle="Log in with your university e-mail to continue.">
        <LoginForm />
      </AuthLayout>
    </RedirectIfSignedIn>
  )
}

export default LoginPage
