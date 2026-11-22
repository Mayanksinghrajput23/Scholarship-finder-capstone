import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, hasTokens, setTokens } from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasTokens()); // restoring a session?

  // Restore the session from stored tokens on first load.
  useEffect(() => {
    if (!hasTokens()) return;
    api('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => setTokens(null))
      .finally(() => setLoading(false));
  }, []);

  // api.js fires this when the refresh token is no longer valid.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const authenticate = useCallback(async (path, body, expectRole) => {
    const r = await api(path, { method: 'POST', body });
    if (expectRole && r.data.user.role !== expectRole) {
      throw new Error(`This is not ${expectRole === 'admin' ? 'an admin' : 'a student'} account. Use the ${expectRole === 'admin' ? 'Student' : 'Admin'} tab instead.`);
    }
    setTokens({ accessToken: r.data.accessToken, refreshToken: r.data.refreshToken });
    setUser(r.data.user);
    return r.data.user;
  }, []);

  const login = useCallback((email, password, expectRole) => authenticate('/auth/login', { email, password }, expectRole), [authenticate]);
  const register = useCallback((name, email, password) => authenticate('/auth/register', { name, email, password }), [authenticate]);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* already logged out server-side */
    }
    setTokens(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
