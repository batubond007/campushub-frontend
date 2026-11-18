import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react'

// Minimal client-side router on top of the History API (no extra dependency).
// Pages use real paths like /login, so the hosting server must fall back to index.html
// for unknown paths (see README, "Hosting notes"). Vite's dev server already does this.

const NAVIGATE_EVENT = 'campushub:navigate'

export function navigate(to: string, options?: { replace?: boolean }) {
  if (options?.replace) window.history.replaceState(null, '', to)
  else window.history.pushState(null, '', to)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
  window.scrollTo(0, 0)
}

/** The current path, updated on navigate() and on the browser's back/forward buttons. */
export function usePath() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const update = () => setPath(window.location.pathname)
    window.addEventListener('popstate', update)
    window.addEventListener(NAVIGATE_EVENT, update)
    // A child's effect can call navigate() before this listener exists (React runs child
    // effects first), e.g. a redirect on the very first render. Catch up with the URL now.
    update()
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(NAVIGATE_EVENT, update)
    }
  }, [])

  return path
}

/**
 * The current query string (e.g. "?page=2&size=10"), updated like usePath(). Use it when a page must
 * re-render as its query changes, e.g. paging; getQueryParam() only reads the value once.
 */
export function useSearch() {
  const [search, setSearch] = useState(window.location.search)

  useEffect(() => {
    const update = () => setSearch(window.location.search)
    window.addEventListener('popstate', update)
    window.addEventListener(NAVIGATE_EVENT, update)
    update()
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(NAVIGATE_EVENT, update)
    }
  }, [])

  return search
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string }

/** An <a> that changes page without reloading. Ctrl/Cmd-click still opens a new tab. */
export function Link({ to, onClick, ...rest }: LinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }
    event.preventDefault()
    navigate(to)
  }

  return <a href={to} onClick={handleClick} {...rest} />
}

/** Reads one value from the current URL's query string, e.g. getQueryParam('email') for /verify?email=… */
export function getQueryParam(name: string) {
  return new URLSearchParams(window.location.search).get(name)
}

/** Matches a pattern such as "/events/:id" against a path. Returns the parameters, or null when it does not match. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    const expected = patternParts[i]
    const actual = decodeURIComponent(pathParts[i])
    if (expected.startsWith(':')) params[expected.slice(1)] = actual
    else if (expected !== actual) return null
  }
  return params
}
