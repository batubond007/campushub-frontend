import NavBar from './components/NavBar';
import AdminUsersPage from './pages/AdminUsersPage';
import EventDetailPage from './pages/EventDetailPage';
import EventsPage from './pages/EventsPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NewEventPage from './pages/NewEventPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import VerifyPage from './pages/VerifyPage';
import { matchPath, useRouter } from './router';

/** Every page of Release 1. The first route that matches the current path is shown. */
const routes: { path: string; render: (params: Record<string, string>) => React.ReactNode }[] = [
  { path: '/', render: () => <HomePage /> },
  { path: '/register', render: () => <RegisterPage /> },          // US-01
  { path: '/verify', render: () => <VerifyPage /> },              // US-02
  { path: '/login', render: () => <LoginPage /> },                // US-03
  { path: '/profile', render: () => <ProfilePage /> },            // US-04
  { path: '/admin/users', render: () => <AdminUsersPage /> },     // US-05
  { path: '/events', render: () => <EventsPage /> },              // US-06
  { path: '/events/new', render: () => <NewEventPage /> },        // basic event creation
  { path: '/events/:id', render: ({ id }) => <EventDetailPage key={id} id={id} /> }, // US-06, US-07
];

export default function App() {
  const { path } = useRouter();

  let page: React.ReactNode = <NotFoundPage />;
  for (const route of routes) {
    const params = matchPath(route.path, path);
    if (params) {
      page = route.render(params);
      break;
    }
  }

  return (
    <>
      <NavBar />
      <main className="container">{page}</main>
    </>
  );
}
