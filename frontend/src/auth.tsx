import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, LoginResponse, Profile } from './api';

const TOKEN_KEY = 'campushub.token';

interface AuthState {
  token: string | null;
  user: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: Profile) => void;
}

const AuthContext = createContext<AuthState | null>(null);

function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session then lasts until the page closes.
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = readToken();
    if (!saved) {
      setLoading(false);
      return;
    }
    api<Profile>('/api/me', { token: saved })
      .then((profile) => {
        setToken(saved);
        setUser(profile);
      })
      .catch(() => writeToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api<LoginResponse>('/api/auth/login', { method: 'POST', body: { email, password } });
    writeToken(result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      await api<void>('/api/auth/logout', { method: 'POST', token }).catch((error: unknown) => {
        if (!(error instanceof ApiError)) throw error;
      });
    }
    writeToken(null);
    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({ token, user, loading, login, logout, setUser }),
    [token, user, loading, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
