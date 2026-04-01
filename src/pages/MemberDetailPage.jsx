import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberApi, subscriptionApi, attendanceApi, biometricApi, planApi } from '../services/api';
import { ArrowLeft, Fingerprint, CalendarCheck, CreditCard, Edit, UserX } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [biometrics, setBiometrics] = useState([]);
  const [plans, setPlans] = useState([]);
  const [tab, setTab] = useState('overview');
  const [showAssign, setShowAssign] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      memberApi.getById(id),
      subscriptionApi.getByMember(id),
      attendanceApi.getByMember(id, 0, 20),
      biometricApi.getByMember(id),
      planApi.getAll(),
    ]).then(([m, s, a, b, p]) => {
      setMember(m.data);
      setSubscriptions(s.data);
      setAttendance(a.data.content);
      setBiometrics(b.data);
      setPlans(p.data);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [id]);

  const assignPlan = async () => {
    if (!selectedPlan) return;
    try {
      await subscriptionApi.create({ memberId: id, planId: selectedPlan });
      toast.success('Plan assigned!');
      setShowAssign(false);
      const [m, s] = await Promise.all([memberApi.getById(id), subscriptionApi.getByMember(id)]);
      setMember(m.data);
      setSubscriptions(s.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;
  if (!member) return <p>Member not found</p>;

  const sub = member.activeSubscription;

  return (
    <div className="space-y-6 animate-in">
      <button className="btn-ghost" onClick={() => navigate('/members')}>
        <ArrowLeft className="w-4 h-4" /> Back to Members
      </button>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-bold">
            {member.firstName[0]}{member.lastName[0]}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">{member.firstName} {member.lastName}</h1>
            <p className="text-surface-500 font-mono text-sm">{member.memberCode}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={sub ? 'badge badge-green' : 'badge badge-red'}>{sub ? 'Active Membership' : 'No Membership'}</span>
              {member.hasBiometric && <span className="badge badge-blue">Biometric Enrolled</span>}
              {sub && <span className="badge badge-yellow">{sub.daysRemaining} days left</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => setShowAssign(true)}>
              <CreditCard className="w-4 h-4" /> Assign Plan
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {['overview', 'subscriptions', 'attendance', 'biometric'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 space-y-3">
            <h3 className="font-display font-semibold text-surface-900">Personal Info</h3>
            {[
              ['Email', member.email], ['Phone', member.phone], ['Gender', member.gender],
              ['Date of Birth', member.dateOfBirth], ['Address', member.address],
              ['Emergency Contact', member.emergencyContactName], ['Emergency Phone', member.emergencyContactPhone],
              ['Joined', member.joinDate],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-1.5 border-b border-surface-100 last:border-0">
                <span className="text-sm text-surface-500">{l}</span>
                <span className="text-sm font-medium text-surface-800">{v || '—'}</span>
              </div>
            ))}
          </div>
          {sub && (
            <div className="card p-6 space-y-3">
              <h3 className="font-display font-semibold text-surface-900">Current Plan</h3>
              {[
                ['Plan', sub.plan?.name], ['Start', sub.startDate], ['End', sub.endDate],
                ['Paid', `₹${Number(sub.amountPaid).toLocaleString('en-IN')}`],
                ['Days Left', sub.daysRemaining],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-surface-100 last:border-0">
                  <span className="text-sm text-surface-500">{l}</span>
                  <span className="text-sm font-medium text-surface-800">{v || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'subscriptions' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-surface-50 border-b">
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Plan</th>
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Period</th>
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Paid</th>
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {subscriptions.map(s => (
                <tr key={s.id} className="hover:bg-surface-50">
                  <td className="px-6 py-3 text-sm font-medium">{s.plan?.name}</td>
                  <td className="px-6 py-3 text-sm text-surface-600">{s.startDate} → {s.endDate}</td>
                  <td className="px-6 py-3 text-sm">₹{Number(s.amountPaid).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-3"><span className={`badge ${s.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {subscriptions.length === 0 && <p className="px-6 py-8 text-center text-surface-400 text-sm">No subscriptions</p>}
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-surface-50 border-b">
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Date</th>
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Check In</th>
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Check Out</th>
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Duration</th>
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Method</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {attendance.map(a => (
                <tr key={a.id} className="hover:bg-surface-50">
                  <td className="px-6 py-3 text-sm">{a.checkInTime ? format(new Date(a.checkInTime), 'dd MMM yyyy') : '—'}</td>
                  <td className="px-6 py-3 text-sm">{a.checkInTime ? format(new Date(a.checkInTime), 'hh:mm a') : '—'}</td>
                  <td className="px-6 py-3 text-sm">{a.checkOutTime ? format(new Date(a.checkOutTime), 'hh:mm a') : '—'}</td>
                  <td className="px-6 py-3 text-sm">{a.duration || '—'}</td>
                  <td className="px-6 py-3"><span className={`badge ${a.verificationMethod === 'BIOMETRIC' ? 'badge-blue' : 'badge-gray'}`}>{a.verificationMethod}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {attendance.length === 0 && <p className="px-6 py-8 text-center text-surface-400 text-sm">No attendance records</p>}
        </div>
      )}

      {tab === 'biometric' && (
        <div className="card p-6">
          <h3 className="font-display font-semibold text-surface-900 mb-4">Enrolled Biometrics</h3>
          {biometrics.length > 0 ? biometrics.map(b => (
            <div key={b.id} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-brand-600" />
                <div>
                  <p className="text-sm font-medium">{b.biometricType}</p>
                  <p className="text-xs text-surface-400">Enrolled: {b.enrolledAt ? format(new Date(b.enrolledAt), 'dd MMM yyyy') : '—'}</p>
                </div>
              </div>
              <span className={b.isActive ? 'badge badge-green' : 'badge badge-red'}>{b.isActive ? 'Active' : 'Disabled'}</span>
            </div>
          )) : <p className="text-surface-400 text-sm">No biometrics enrolled. Use the Biometric page to enroll.</p>}
        </div>
      )}

      {/* Assign Plan Modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAssign(false)}>
          <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md animate-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b"><h2 className="font-display font-bold text-lg">Assign Membership Plan</h2></div>
            <div className="p-6 space-y-4">
              <select className="input-field" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
                <option value="">Select a plan</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — ₹{Number(p.price).toLocaleString('en-IN')} ({p.durationDays}d)</option>
                ))}
              </select>
              <div className="flex justify-end gap-3">
                <button className="btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
                <button className="btn-primary" onClick={assignPlan} disabled={!selectedPlan}>Assign & Pay</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
