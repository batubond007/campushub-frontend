import AuthLayout from '@/features/auth/AuthLayout'
import LoginForm from '@/features/auth/LoginForm'

function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Log in with your ODTÜ e-mail to continue.">
      <LoginForm />
    </AuthLayout>
  )
}

export default LoginPage
