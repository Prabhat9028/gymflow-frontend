import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = localStorage.getItem('gf_token'); const u = localStorage.getItem('gf_user'); if (t && u) setUser(JSON.parse(u)); setLoading(false); }, []);
  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('gf_token', data.token); localStorage.setItem('gf_user', JSON.stringify(data));
    if (data.branchId) localStorage.setItem('gf_branch', data.branchId);
    if (data.companyId) localStorage.setItem('gf_company', data.companyId);
    setUser(data); return data;
  };
  const switchBranch = async (branchId) => {
    const { data } = await authApi.switchBranch(branchId);
    localStorage.setItem('gf_token', data.token); localStorage.setItem('gf_user', JSON.stringify(data));
    localStorage.setItem('gf_branch', data.branchId);
    setUser(data); return data;
  };
  const logout = () => { localStorage.clear(); setUser(null); };
  return (<AuthContext.Provider value={{ user, login, logout, switchBranch, loading, isAuthenticated: !!user, isSuperAdmin: user?.role === 'SUPER_ADMIN' }}>{children}</AuthContext.Provider>);
}
export const useAuth = () => useContext(AuthContext);
