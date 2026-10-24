import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import apiClient, { TOKEN_KEY } from '../services/apiClient';
import { authService } from '../services/authService';
import type { TokenResponse, User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  adminLogin: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>; // creates the account only (no auto login)
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On page load: if a token is saved, fetch the user it belongs to
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then(setUserState)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  // If the token expires, the backend returns 401: log the user out locally
  useEffect(() => {
    const id = apiClient.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err?.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
          localStorage.removeItem(TOKEN_KEY);
          setUserState(null);
        }
        return Promise.reject(err);
      },
    );
    return () => apiClient.interceptors.response.eject(id);
  }, []);

  const saveSession = (res: TokenResponse) => {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    setUserState(res.user);
    return res.user;
  };

  const login = useCallback(
    async (email: string, password: string) => saveSession(await authService.login(email, password)),
    [],
  );

  const adminLogin = useCallback(
    async (email: string, password: string) => saveSession(await authService.adminLogin(email, password)),
    [],
  );

  // AUTH-03: registration only creates the account; the user logs in afterwards
  const register = useCallback(
    (name: string, email: string, password: string) => authService.register(name, email, password),
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // token may already be expired; clear the session anyway
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUserState(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, adminLogin, register, logout, setUser: setUserState }),
    [user, loading, login, adminLogin, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
