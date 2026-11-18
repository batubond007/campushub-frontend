import NavBar from '@/components/NavBar'
import { AuthProvider } from '@/features/auth/AuthContext'
import AccountPage from '@/pages/AccountPage'
import EventDetailPage from '@/pages/EventDetailPage'
import EventsPage from '@/pages/EventsPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import NewEventPage from '@/pages/NewEventPage'
import NotFoundPage from '@/pages/NotFoundPage'
import SignupPage from '@/pages/SignupPage'
import VerifyPage from '@/pages/VerifyPage'
import { matchPath, usePath } from '@/lib/router'

// The first route whose pattern matches the current path is shown; ":id" parts are passed to the page.
// No match shows the 404 page.
const ROUTES: { path: string; render: (params: Record<string, string>) => React.ReactNode }[] = [
  { path: '/', render: () => <HomePage /> },
  { path: '/login', render: () => <LoginPage /> },
  { path: '/signup', render: () => <SignupPage /> },
  { path: '/verify', render: () => <VerifyPage /> },
  { path: '/account', render: () => <AccountPage /> }, // protected (US-03)
  { path: '/events', render: () => <EventsPage /> }, // protected (US-06)
  { path: '/events/new', render: () => <NewEventPage /> }, // University Admin only (COD-118)
  { path: '/events/:id', render: ({ id }) => <EventDetailPage key={id} id={id} /> }, // protected (US-06)
]

function App() {
  const path = usePath()

  let page: React.ReactNode = <NotFoundPage />
  for (const route of ROUTES) {
    const params = matchPath(route.path, path)
    if (params) {
      page = route.render(params)
      break
    }
  }

  return (
    <AuthProvider>
      <NavBar />
      <main>{page}</main>
    </AuthProvider>
  )
}

export default App
