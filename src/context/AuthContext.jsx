import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = localStorage.getItem('gf_token'); const u = localStorage.getItem('gf_user'); if (t && u) setUser(JSON.parse(u)); setLoading(false); }, []);

  // Apply theme on user change
  useEffect(() => {
    if (user?.theme) {
      document.documentElement.setAttribute('data-theme', user.theme);
    }
  }, [user?.theme]);

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
  const changePassword = async (currentPassword, newPassword) => {
    const { data } = await authApi.changePassword({ currentPassword, newPassword });
    localStorage.setItem('gf_token', data.token); localStorage.setItem('gf_user', JSON.stringify(data));
    setUser(data); return data;
  };
  const logout = () => { localStorage.clear(); setUser(null); document.documentElement.removeAttribute('data-theme'); };
  const role = user?.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN';
  const isStaffOrBelow = role === 'STAFF' || role === 'TRAINER' || role === 'MEMBER';
  return (<AuthContext.Provider value={{ user, login, logout, switchBranch, changePassword, loading, isAuthenticated: !!user, isSuperAdmin, isAdmin, isStaffOrBelow, role }}>{children}</AuthContext.Provider>);
}
export const useAuth = () => useContext(AuthContext);
