import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api';
import { Users, CalendarCheck, CreditCard, AlertTriangle, Dumbbell, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'from-brand-500 to-brand-600',
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    teal: 'from-teal-500 to-teal-600',
  };
  return (
    <div className="card p-5 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 mb-1">{label}</p>
          <p className="text-2xl font-display font-bold text-surface-900">{value}</p>
          {sub && <p className="text-xs text-surface-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats().then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!stats) return <p className="text-surface-500">Failed to load dashboard</p>;

  const fmt = (n) => n != null ? Number(n).toLocaleString('en-IN') : '0';

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900">Dashboard</h1>
        <p className="text-surface-500 text-sm mt-1">Overview of your gym operations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total Members" value={fmt(stats.totalMembers)} color="brand" />
        <StatCard icon={CalendarCheck} label="Today Check-ins" value={fmt(stats.todayCheckIns)} color="blue" />
        <StatCard icon={CreditCard} label="Monthly Revenue" value={`₹${fmt(stats.monthlyRevenue)}`} color="purple" />
        <StatCard icon={TrendingUp} label="Today Revenue" value={`₹${fmt(stats.todayRevenue)}`} color="teal" />
        <StatCard icon={AlertTriangle} label="Expiring (7d)" value={fmt(stats.expiringThisWeek)} color="amber" />
        <StatCard icon={Dumbbell} label="Active Trainers" value={fmt(stats.activeTrainers)} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display font-semibold text-surface-900 mb-4">Weekly Attendance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.weeklyAttendance || []}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} name="Check-ins" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-semibold text-surface-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.monthlyRevenueChart || []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} fill="url(#revenueGrad)" name="Revenue (₹)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="font-display font-semibold text-surface-900">Recent Members</h3>
          </div>
          <div className="divide-y divide-surface-100">
            {(stats.recentMembers || []).slice(0, 5).map(m => (
              <div key={m.id} className="px-6 py-3 flex items-center justify-between hover:bg-surface-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                    {m.firstName?.[0]}{m.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-800">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-surface-400">{m.memberCode}</p>
                  </div>
                </div>
                <span className={m.activeSubscription ? 'badge badge-green' : 'badge badge-gray'}>
                  {m.activeSubscription ? 'Active' : 'No Plan'}
                </span>
              </div>
            ))}
            {(!stats.recentMembers || stats.recentMembers.length === 0) && (
              <p className="px-6 py-8 text-center text-surface-400 text-sm">No members yet</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="font-display font-semibold text-surface-900">Recent Check-ins</h3>
          </div>
          <div className="divide-y divide-surface-100">
            {(stats.recentCheckIns || []).slice(0, 5).map(a => (
              <div key={a.id} className="px-6 py-3 flex items-center justify-between hover:bg-surface-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-surface-800">{a.memberName}</p>
                  <p className="text-xs text-surface-400">{a.memberCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-surface-500">
                    {a.checkInTime ? format(new Date(a.checkInTime), 'hh:mm a') : '—'}
                  </p>
                  <span className={`badge ${a.verificationMethod === 'BIOMETRIC' ? 'badge-blue' : 'badge-gray'}`}>
                    {a.verificationMethod}
                  </span>
                </div>
              </div>
            ))}
            {(!stats.recentCheckIns || stats.recentCheckIns.length === 0) && (
              <p className="px-6 py-8 text-center text-surface-400 text-sm">No check-ins today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
