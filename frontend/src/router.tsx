import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * A small hash-based router. URLs look like /#/events/5, so the static build works on any
 * web server (or straight from a folder) without server-side rewrite rules.
 */
interface Location {
  path: string;
  query: URLSearchParams;
}

interface RouterState extends Location {
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterState | null>(null);

function readLocation(): Location {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, search = ''] = raw.split('?');
  return { path: path || '/', query: new URLSearchParams(search) };
}

export function Router({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location>(readLocation);

  useEffect(() => {
    const onChange = () => {
      setLocation(readLocation());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const target = `#${to}`;
    if (options?.replace) {
      window.location.replace(target);
    } else {
      window.location.hash = to;
    }
  }, []);

  const value = useMemo(() => ({ ...location, navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterState {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouter must be used inside Router');
  return context;
}

/** Matches a pattern such as "/events/:id" against a path. Returns the parameters or null. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const expected = patternParts[i];
    const actual = decodeURIComponent(pathParts[i]);
    if (expected.startsWith(':')) params[expected.slice(1)] = actual;
    else if (expected !== actual) return null;
  }
  return params;
}

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
}

export function Link({ to, ...rest }: LinkProps) {
  return <a href={`#${to}`} {...rest} />;
}
