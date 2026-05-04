import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/api/auth.api';
import { token } from '@/utils/token';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // On mount: validate stored token by calling /auth/me
  useEffect(() => {
    const access = token.getAccess();
    if (!access) {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    authApi
      .me()
      .then((user) => setState({ user, isAuthenticated: true, isLoading: false }))
      .catch(() => {
        token.clear();
        setState({ user: null, isAuthenticated: false, isLoading: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    token.set(res.accessToken, res.refreshToken);
    const me = await authApi.me();
    setState({ user: me, isAuthenticated: true, isLoading: false });
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const user = await authApi.register(email, password);
    return user;
  }, []);

  const logout = useCallback(async () => {
    const refresh = token.getRefresh();
    if (refresh) {
      await authApi.logout(refresh).catch(() => {});
    }
    token.clear();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
