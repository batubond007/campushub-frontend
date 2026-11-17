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
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(NAVIGATE_EVENT, update)
    }
  }, [])

  return path
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
