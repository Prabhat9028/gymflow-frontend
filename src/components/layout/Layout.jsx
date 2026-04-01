import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, CalendarCheck, CreditCard, Dumbbell,
  Fingerprint, ClipboardList, LogOut, Menu, X, ChevronRight, Zap
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/members', icon: Users, label: 'Members' },
  { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/biometric', icon: Fingerprint, label: 'Biometric' },
  { to: '/plans', icon: ClipboardList, label: 'Plans' },
  { to: '/trainers', icon: Dumbbell, label: 'Trainers' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = ({ mobile = false }) => (
    <aside className={`flex flex-col h-full bg-surface-900 text-white transition-all duration-300 ${
      mobile ? 'w-72' : collapsed ? 'w-[72px]' : 'w-64'
    }`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-surface-700/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <span className="font-display font-bold text-lg tracking-tight">GymFlow</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                : 'text-surface-400 hover:text-white hover:bg-surface-800'
              } ${collapsed && !mobile ? 'justify-center' : ''}`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {(!collapsed || mobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-surface-700/50">
        <div className={`flex items-center gap-3 px-3 py-2 ${collapsed && !mobile ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-200 truncate">{user?.email}</p>
              <p className="text-xs text-surface-500">{user?.role}</p>
            </div>
          )}
          <button onClick={handleLogout} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-800 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-surface-200">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden btn-ghost">
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex btn-ghost">
              <ChevronRight className={`w-5 h-5 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
