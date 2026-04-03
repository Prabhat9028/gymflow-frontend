import React, { useState, useEffect } from 'react';
import { reportApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, CreditCard, AlertTriangle, Clock, Download, Calendar, FileText, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#E8760A', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

function Stat({ icon: Icon, label, value, sub, color = 'brand' }) {
  const c = { brand: 'from-brand-500 to-brand-600', blue: 'from-blue-500 to-blue-600', amber: 'from-amber-500 to-amber-600', red: 'from-red-500 to-red-600', purple: 'from-purple-500 to-purple-600', teal: 'from-teal-500 to-teal-600' };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 mb-1">{label}</p>
          <p className="text-2xl font-display font-bold text-surface-900">{value}</p>
          {sub && <p className="text-xs text-surface-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function dl(blob, name) { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u); }

export default function ReportsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('membership');
  const [m, setM] = useState(null);
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadReports = () => {
    setLoading(true);
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    Promise.all([
      reportApi.getMembershipReport(params),
      reportApi.getPendingPayments(),
    ]).then(([mr, pr]) => { setM(mr.data); setPending(pr.data); })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReports(); }, []);

  const handleExport = async (type) => {
    setExporting(true);
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    try {
      let res, filename;
      switch (type) {
        case 'membership': res = await reportApi.exportMembership(params); filename = 'membership_report.xlsx'; break;
        case 'payments': res = await reportApi.exportPendingPayments(); filename = 'pending_payments.xlsx'; break;
        case 'plans': res = await reportApi.exportPlanDistribution(); filename = 'plan_distribution.xlsx'; break;
        default: res = await reportApi.exportMembership(params); filename = 'report.xlsx';
      }
      dl(new Blob([res.data]), filename);
      toast.success('Exported!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;

  const f = n => n != null ? Number(n).toLocaleString('en-IN') : '0';

  const tabs = [
    { id: 'membership', label: 'Active vs Expired', icon: Users },
    { id: 'plans', label: 'Plan Distribution', icon: FileText },
    { id: 'members', label: 'Active vs Inactive', icon: TrendingUp },
    { id: 'expiry', label: 'Renewal & Expiry', icon: AlertTriangle },
    { id: 'payments', label: 'Pending Payments', icon: CreditCard },
  ];

  const statusPie = m ? [
    { name: 'Active', value: m.activeSubscriptions },
    { name: 'Expired', value: m.expiredSubscriptions },
    { name: 'Frozen', value: m.frozenSubscriptions },
    { name: 'Cancelled', value: m.cancelledSubscriptions },
  ].filter(d => d.value > 0) : [];

  const memberPie = m ? [
    { name: 'Active', value: m.activeMembers },
    { name: 'Inactive', value: m.inactiveMembers },
  ].filter(d => d.value > 0) : [];

  const exportType = tab === 'payments' ? 'payments' : tab === 'plans' ? 'plans' : 'membership';

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Reports</h1>
        <p className="text-surface-500 text-sm">Membership analytics — {user?.branchName}</p>
      </div>

      {/* Date Range + Export Bar */}
      <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-surface-400" />
          <span className="text-sm text-surface-600 font-medium">Date Range:</span>
        </div>
        <input type="date" className="input-field w-auto !py-2 !text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <span className="text-surface-400 text-sm">to</span>
        <input type="date" className="input-field w-auto !py-2 !text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <button onClick={loadReports} className="btn-primary !py-2 !text-sm">Apply</button>
        {(startDate || endDate) && (
          <button onClick={() => { setStartDate(''); setEndDate(''); setTimeout(loadReports, 100); }} className="btn-ghost !py-2 !text-sm text-red-500">Clear</button>
        )}
        <div className="sm:ml-auto">
          <button onClick={() => handleExport(exportType)} disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}><t.icon className="w-4 h-4" /> {t.label}</button>
        ))}
      </div>

      {/* 1. Active vs Expired */}
      {tab === 'membership' && m && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={Users} label="Active Subscriptions" value={f(m.activeSubscriptions)} color="brand" />
            <Stat icon={AlertTriangle} label="Expired" value={f(m.expiredSubscriptions)} color="red" />
            <Stat icon={Clock} label="Frozen" value={f(m.frozenSubscriptions)} color="amber" />
            <Stat icon={Users} label="Cancelled" value={f(m.cancelledSubscriptions)} color="purple" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-display font-semibold mb-4">Subscription Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-6">
              <h3 className="font-display font-semibold mb-4">Expiry Alerts</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div><p className="font-semibold text-amber-800">Expiring in 7 days</p><p className="text-sm text-amber-600">Needs immediate renewal</p></div>
                  <span className="text-3xl font-display font-bold text-amber-700">{m.expiringIn7Days}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div><p className="font-semibold text-blue-800">Expiring in 30 days</p><p className="text-sm text-blue-600">Follow up needed</p></div>
                  <span className="text-3xl font-display font-bold text-blue-700">{m.expiringIn30Days}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Plan Distribution */}
      {tab === 'plans' && m && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-display font-semibold mb-4">Plan Distribution (Active Members)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={(m.planDistribution || []).filter(d => d.activeCount > 0)}
                  cx="50%" cy="50%" outerRadius={110} innerRadius={60} dataKey="activeCount"
                  label={({ planName, percentage }) => `${planName} (${percentage}%)`}>
                  {(m.planDistribution || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b"><h3 className="font-display font-semibold">Plan Breakdown</h3></div>
            <table className="w-full">
              <thead><tr className="bg-surface-50 border-b">
                <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Plan</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Active</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Revenue</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Share</th>
              </tr></thead>
              <tbody className="divide-y">
                {(m.planDistribution || []).map((p, i) => (
                  <tr key={i} className="hover:bg-surface-50">
                    <td className="px-6 py-3"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-sm font-medium">{p.planName}</span></div></td>
                    <td className="px-6 py-3 text-sm font-semibold">{p.activeCount}</td>
                    <td className="px-6 py-3 text-sm">₹{f(p.revenue)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-surface-200 rounded-full h-2 max-w-[80px]"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.min(100, p.percentage)}%` }} /></div>
                        <span className="text-xs text-surface-500">{p.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!m.planDistribution || !m.planDistribution.length) && <p className="px-6 py-8 text-center text-surface-400 text-sm">No plan data</p>}
          </div>
        </div>
      )}

      {/* 3. Active vs Inactive Members */}
      {tab === 'members' && m && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat icon={Users} label="Total Members" value={f(m.totalMembers)} color="brand" />
            <Stat icon={Users} label="Active (with plan)" value={f(m.activeMembers)} sub={m.totalMembers > 0 ? `${Math.round(m.activeMembers * 100 / m.totalMembers)}% of total` : ''} color="teal" />
            <Stat icon={Users} label="Inactive (no plan)" value={f(m.inactiveMembers)} sub={m.totalMembers > 0 ? `${Math.round(m.inactiveMembers * 100 / m.totalMembers)}% of total` : ''} color="red" />
          </div>
          <div className="card p-6">
            <h3 className="font-display font-semibold mb-4">Member Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={memberPie} cx="50%" cy="50%" outerRadius={110} innerRadius={60} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill="#22c55e" /><Cell fill="#ef4444" />
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Renewal & Expiry */}
      {tab === 'expiry' && m && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-display font-semibold">Upcoming Expiry (Next 30 days)</h3>
            <span className="badge badge-amber">{(m.upcomingExpiry || []).length} members</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-surface-50 border-b">
                <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Member</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Plan</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">End Date</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Days Left</th>
              </tr></thead>
              <tbody className="divide-y">
                {(m.upcomingExpiry || []).map((e, i) => (
                  <tr key={i} className="hover:bg-surface-50">
                    <td className="px-6 py-3"><p className="text-sm font-medium">{e.memberName}</p><p className="text-xs text-surface-400 font-mono">{e.memberCode}</p></td>
                    <td className="px-6 py-3 text-sm">{e.planName}</td>
                    <td className="px-6 py-3 text-sm">{e.endDate}</td>
                    <td className="px-6 py-3"><span className={`badge ${e.daysUntilExpiry <= 7 ? 'badge-red' : 'badge-yellow'}`}>{e.daysUntilExpiry}d</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!m.upcomingExpiry || !m.upcomingExpiry.length) && <p className="px-6 py-8 text-center text-surface-400 text-sm">No upcoming expiries</p>}
        </div>
      )}

      {/* 5. Pending Payments */}
      {tab === 'payments' && pending && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={CreditCard} label="Total Pending" value={f(pending.totalPending)} color="amber" />
            <Stat icon={CreditCard} label="Pending Amount" value={`₹${f(pending.totalPendingAmount)}`} color="blue" />
            <Stat icon={AlertTriangle} label="Overdue" value={f(pending.overdue)} color="red" />
            <Stat icon={AlertTriangle} label="Overdue Amount" value={`₹${f(pending.overdueAmount)}`} color="red" />
          </div>
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b"><h3 className="font-display font-semibold">Pending Payment Details</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-surface-50 border-b">
                  <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Member</th>
                  <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Plan</th>
                  <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Due</th>
                  <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Paid</th>
                  <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Balance</th>
                  <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Due Date</th>
                  <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Status</th>
                </tr></thead>
                <tbody className="divide-y">
                  {(pending.entries || []).map((e, i) => (
                    <tr key={i} className="hover:bg-surface-50">
                      <td className="px-6 py-3"><p className="text-sm font-medium">{e.memberName}</p><p className="text-xs text-surface-400 font-mono">{e.memberCode}</p></td>
                      <td className="px-6 py-3 text-sm">{e.planName}</td>
                      <td className="px-6 py-3 text-sm">₹{f(e.amountDue)}</td>
                      <td className="px-6 py-3 text-sm">₹{f(e.amountPaid)}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-red-600">₹{f(e.balance)}</td>
                      <td className="px-6 py-3 text-sm">{e.dueDate || '—'}</td>
                      <td className="px-6 py-3"><span className={`badge ${e.status === 'OVERDUE' ? 'badge-red' : 'badge-yellow'}`}>{e.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!pending.entries || !pending.entries.length) && <p className="px-6 py-8 text-center text-surface-400 text-sm">No pending payments</p>}
          </div>
        </div>
      )}
    </div>
  );
}
