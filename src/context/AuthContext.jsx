import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/services';
import { getToken, setToken } from '../api/client';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!getToken());

  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  useEffect(() => {
    let alive = true;
    if (getToken()) {
      api.me().then((u) => alive && setUser(u)).catch(() => { setToken(null); }).finally(() => alive && setBooting(false));
    }
    const onUnauthorized = () => logout();
    window.addEventListener('vs:unauthorized', onUnauthorized);
    return () => { alive = false; window.removeEventListener('vs:unauthorized', onUnauthorized); };
  }, [logout]);

  const startSession = useCallback((token, u) => { setToken(token); setUser(u); }, []);
  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password);
    startSession(res.token, res.user);
    return res.user;
  }, [startSession]);
  const refresh = useCallback(async () => { const u = await api.me(); setUser(u); return u; }, []);

  const value = useMemo(() => ({ user, booting, login, logout, startSession, refresh }), [user, booting, login, logout, startSession, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
};

export const HOME_BY_ROLE = {
  farmer: '/farmer/dashboard',
  vet: '/vet/dashboard',
  store: '/store/dashboard',
  admin: '/admin/dashboard',
};
