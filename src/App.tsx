import NavBar from '@/components/NavBar'
import { AuthProvider } from '@/features/auth/AuthContext'
import AccountPage from '@/pages/AccountPage'
import EventsPage from '@/pages/EventsPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import NewEventPage from '@/pages/NewEventPage'
import SignupPage from '@/pages/SignupPage'
import VerifyPage from '@/pages/VerifyPage'
import { usePath } from '@/lib/router'

const ROUTES: Record<string, () => React.ReactNode> = {
  '/': () => <HomePage />,
  '/login': () => <LoginPage />,
  '/signup': () => <SignupPage />,
  '/verify': () => <VerifyPage />,
  '/account': () => <AccountPage />, // protected (US-03)
  '/events': () => <EventsPage />, // protected
  '/events/new': () => <NewEventPage />, // University Admin only (COD-118)
}

function App() {
  const path = usePath()
  const page = ROUTES[path] ?? ROUTES['/']

  return (
    <AuthProvider>
      <NavBar />
      <main>{page()}</main>
    </AuthProvider>
  )
}

export default App
