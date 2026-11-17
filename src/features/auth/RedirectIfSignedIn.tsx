import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { getQueryParam, navigate, usePath } from '@/lib/router'

const GUEST_PAGES = ['/login', '/signup', '/verify']

/**
 * Only accept in-app paths for ?next=, so a link cannot send students to another site after login,
 * and never a guest page, which would send a signed-in student round in circles.
 */
function safeNext(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/account'
  return GUEST_PAGES.includes(next.split('?')[0]) ? '/account' : next
}

/**
 * For Log in / Sign up / Verify: a student who is signed in goes on to the page they wanted
 * (?next=…) or to their account. This also handles the redirect right after a successful login.
 */
function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const path = usePath()

  useEffect(() => {
    if (user) navigate(safeNext(getQueryParam('next')), { replace: true })
  }, [user, path])

  return user ? null : <>{children}</>
}

export default RedirectIfSignedIn
