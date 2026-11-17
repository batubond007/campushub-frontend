import NavBar from '@/components/NavBar'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import VerifyPage from '@/pages/VerifyPage'
import { usePath } from '@/lib/router'

const ROUTES: Record<string, () => React.ReactNode> = {
  '/': () => <HomePage />,
  '/login': () => <LoginPage />,
  '/signup': () => <SignupPage />,
  '/verify': () => <VerifyPage />,
}

function App() {
  const path = usePath()
  const page = ROUTES[path] ?? ROUTES['/']

  return (
    <>
      <NavBar />
      <main>{page()}</main>
    </>
  )
}

export default App
