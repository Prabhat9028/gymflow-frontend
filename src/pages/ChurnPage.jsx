import React, { useState, useEffect } from 'react';
import { churnApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Brain, AlertTriangle, TrendingDown, MessageCircle, Phone, ChevronDown, ChevronUp, Users, DollarSign, Activity, Zap, ExternalLink, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const RISK_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' };
const RISK_BG = { HIGH: 'bg-red-50 border-red-200', MEDIUM: 'bg-amber-50 border-amber-200', LOW: 'bg-emerald-50 border-emerald-200' };
const RISK_TEXT = { HIGH: 'text-red-700', MEDIUM: 'text-amber-700', LOW: 'text-emerald-700' };
const RISK_BADGE = { HIGH: 'badge-red', MEDIUM: 'badge-yellow', LOW: 'badge-green' };

function RiskMeter({ score }) {
  const color = score >= 60 ? '#ef4444' : score >= 35 ? '#f59e0b' : '#22c55e';
  return (
    <div className="relative w-14 h-14">
      <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${score}, 100`} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function ChurnPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    setLoading(true);
    churnApi.getPredictions().then(r => setData(r.data)).catch(() => toast.error('Failed to load predictions')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;
  if (!data) return <p className="text-surface-400">Failed to load</p>;

  const filtered = (data.predictions || []).filter(p => filter === 'ALL' || p.riskLevel === filter);
  const f = n => n != null ? Number(n).toLocaleString('en-IN') : '0';

  const pieData = (data.riskDistribution || []).filter(d => d.value > 0);

  const openWhatsApp = (phone, message) => {
    if (!phone) return toast.error('No phone number');
    const cleaned = phone.replace(/[^0-9]/g, '');
    const num = cleaned.length === 10 ? '91' + cleaned : cleaned;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const copyMessage = (msg) => {
    navigator.clipboard.writeText(msg).then(() => toast.success('Message copied!')).catch(() => toast.error('Copy failed'));
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg animate-glow">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">AI Churn Predictor</h1>
          <p className="text-surface-500 text-sm">Win-back engine — {user?.branchName}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-in">
        <div className="card p-5 card-hover border-l-4 border-l-red-500">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-surface-500">High Risk</p><p className="text-3xl font-display font-bold text-red-600">{data.highRisk}</p></div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <div className="card p-5 card-hover border-l-4 border-l-amber-500">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-surface-500">Medium Risk</p><p className="text-3xl font-display font-bold text-amber-600">{data.mediumRisk}</p></div>
            <TrendingDown className="w-8 h-8 text-amber-400" />
          </div>
        </div>
        <div className="card p-5 card-hover border-l-4 border-l-brand-500">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-surface-500">Revenue at Risk</p><p className="text-2xl font-display font-bold text-brand-600">₹{f(data.revenueAtRisk)}</p></div>
            <DollarSign className="w-8 h-8 text-brand-400" />
          </div>
        </div>
        <div className="card p-5 card-hover border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-surface-500">Low Risk (Safe)</p><p className="text-3xl font-display font-bold text-emerald-600">{data.lowRisk}</p></div>
            <Users className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Chart + Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 animate-slide-up">
          <h3 className="font-display font-semibold mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((d, i) => <Cell key={i} fill={d.label.includes('High') ? '#ef4444' : d.label.includes('Medium') ? '#f59e0b' : '#22c55e'} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-display font-semibold mb-2">How It Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-surface-600">
            <div className="flex items-start gap-2"><Activity className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" /><span><b>Attendance Pattern</b> — Visit frequency, days since last visit, declining trends</span></div>
            <div className="flex items-start gap-2"><Zap className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" /><span><b>Engagement Score</b> — Compares recent vs historical visits</span></div>
            <div className="flex items-start gap-2"><DollarSign className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span><b>Payment History</b> — Renewal count, lifetime value</span></div>
            <div className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" /><span><b>Expiry Proximity</b> — Days to membership expiry</span></div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-purple-50 border border-purple-200 text-sm text-purple-800">
            <b>💡 Tip:</b> Click on any HIGH risk member → send them a personalized WhatsApp message in one tap. Recovering just 20% of high-risk members can save ₹{f(data.highRiskRevenue ? Number(data.highRiskRevenue) * 0.2 : 0)} in revenue.
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-brand-500 text-white shadow-md' : 'bg-white border text-surface-600 hover:bg-surface-50'}`}>
            {f === 'ALL' ? `All (${(data.predictions || []).length})` : `${f} (${(data.predictions || []).filter(p => p.riskLevel === f).length})`}
          </button>
        ))}
      </div>

      {/* Member Risk Cards */}
      <div className="space-y-3">
        {filtered.map(p => {
          const expanded = expandedId === p.memberId;
          return (
            <div key={p.memberId} className={`card overflow-hidden transition-all duration-300 border ${RISK_BG[p.riskLevel]}`}>
              {/* Header Row */}
              <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/50 transition-colors" onClick={() => setExpandedId(expanded ? null : p.memberId)}>
                <RiskMeter score={p.riskScore} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-surface-900 cursor-pointer hover:text-brand-600" onClick={e => { e.stopPropagation(); nav(`/members/${p.memberId}`); }}>{p.memberName}</span>
                    <span className={`badge ${RISK_BADGE[p.riskLevel]}`}>{p.riskLevel} RISK</span>
                    {p.daysToExpiry <= 0 && <span className="badge badge-red">EXPIRED</span>}
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">{p.memberCode} • {p.phone || 'No phone'} • {p.planName} • Expires {p.expiryDate} ({p.daysToExpiry > 0 ? p.daysToExpiry + 'd left' : 'expired'})</p>
                </div>
                <div className="hidden md:flex items-center gap-6 text-center">
                  <div><p className="text-xs text-surface-400">Visits/wk</p><p className="font-bold text-surface-800">{p.visitFrequency}</p></div>
                  <div><p className="text-xs text-surface-400">Last Visit</p><p className="font-bold text-surface-800">{p.daysSinceLastVisit >= 0 ? p.daysSinceLastVisit + 'd' : 'Never'}</p></div>
                  <div><p className="text-xs text-surface-400">30d Visits</p><p className="font-bold text-surface-800">{p.lastMonthVisits}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  {p.phone && <button onClick={e => { e.stopPropagation(); openWhatsApp(p.phone, p.whatsappMessage); }}
                    className="btn-primary !py-2 !px-3 !text-xs !bg-emerald-600 hover:!bg-emerald-700"><MessageCircle className="w-3.5 h-3.5" />WhatsApp</button>}
                  {expanded ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
                </div>
              </div>

              {/* Expanded Details */}
              {expanded && (
                <div className="border-t bg-white/80 p-4 space-y-4 animate-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* AI Insight */}
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                      <p className="text-xs font-medium text-purple-700 mb-1 flex items-center gap-1"><Brain className="w-3 h-3" /> AI Insight</p>
                      <p className="text-sm text-purple-900">{p.aiInsight}</p>
                    </div>
                    {/* Suggested Action */}
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Suggested Action</p>
                      <p className="text-sm text-blue-900">{p.suggestedAction}</p>
                    </div>
                    {/* Stats */}
                    <div className="p-3 rounded-xl bg-surface-50 border">
                      <p className="text-xs font-medium text-surface-500 mb-2">Member Stats</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span>Total Visits</span><span className="font-semibold">{p.totalVisits}</span></div>
                        <div className="flex justify-between"><span>Last 30d Visits</span><span className="font-semibold">{p.lastMonthVisits}</span></div>
                        <div className="flex justify-between"><span>Renewals</span><span className="font-semibold">{p.renewalCount}</span></div>
                        <div className="flex justify-between"><span>Plan Value</span><span className="font-semibold">₹{f(p.lifetimeValue)}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Message Preview */}
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-emerald-700 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Pre-written WhatsApp Message</p>
                      <div className="flex gap-2">
                        <button onClick={() => copyMessage(p.whatsappMessage)} className="btn-ghost !text-xs text-emerald-700"><Copy className="w-3 h-3" />Copy</button>
                        {p.phone && <button onClick={() => openWhatsApp(p.phone, p.whatsappMessage)} className="btn-ghost !text-xs text-emerald-700"><ExternalLink className="w-3 h-3" />Send</button>}
                      </div>
                    </div>
                    <p className="text-sm text-emerald-900 whitespace-pre-wrap">{p.whatsappMessage}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!filtered.length && <div className="card p-12 text-center"><Brain className="w-16 h-16 text-surface-300 mx-auto mb-4" /><p className="text-surface-400">No {filter !== 'ALL' ? filter.toLowerCase() + ' risk' : ''} members found</p></div>}
    </div>
  );
}
