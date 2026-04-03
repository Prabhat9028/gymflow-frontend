import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberApi, subscriptionApi, attendanceApi, planApi, biometricApi } from '../services/api';
import { ArrowLeft, Fingerprint, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function MemberDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [member, setMember] = useState(null);
  const [subs, setSubs] = useState([]);
  const [att, setAtt] = useState([]);
  const [plans, setPlans] = useState([]);
  const [devices, setDevices] = useState([]);
  const [tab, setTab] = useState('overview');
  const [showAssign, setShowAssign] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [enrollModal, setEnrollModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      memberApi.getById(id),
      subscriptionApi.getByMember(id),
      attendanceApi.getAll(0, 20),
      planApi.getAll(),
      biometricApi.getDevices(),
    ]).then(([m, s, a, p, d]) => {
      setMember(m.data);
      setSubs(s.data);
      setAtt((a.data.content || a.data || []).filter(at => at.memberId === id));
      setPlans(p.data);
      setDevices(d.data);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [id]);

  const assignPlan = async () => {
    if (!selectedPlan) return;
    try {
      await subscriptionApi.create({ memberId: id, planId: selectedPlan });
      toast.success('Plan assigned!');
      setShowAssign(false);
      const [m, s] = await Promise.all([memberApi.getById(id), subscriptionApi.getByMember(id)]);
      setMember(m.data); setSubs(s.data);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEnroll = async (serial) => {
    setEnrolling(true);
    try {
      const { data } = await memberApi.enrollBiometric(id, serial);
      if (data.success) { toast.success(data.message || 'Enrolled!'); setEnrollModal(false); const m = await memberApi.getById(id); setMember(m.data); }
      else toast.error(data.message || 'Failed');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setEnrolling(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;
  if (!member) return <p>Member not found</p>;

  const sub = member.activeSubscription;

  return (
    <div className="space-y-6 animate-in">
      <button className="btn-ghost" onClick={() => nav('/members')}><ArrowLeft className="w-4 h-4" /> Back to Members</button>

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
              <span className={member.biometricEnrolled ? 'badge badge-orange' : 'badge badge-gray'}>{member.biometricEnrolled ? 'Biometric Enrolled' : 'Not Enrolled'}</span>
              {sub && <span className="badge badge-yellow">{sub.daysRemaining} days left</span>}
              {member.branchName && <span className="badge badge-blue">{member.branchName}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => setShowAssign(true)}><CreditCard className="w-4 h-4" /> Assign Plan</button>
            {!member.biometricEnrolled && <button className="btn-secondary" onClick={() => setEnrollModal(true)}><Fingerprint className="w-4 h-4" /> Enroll Fingerprint</button>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {['overview', 'subscriptions', 'attendance'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 space-y-3">
            <h3 className="font-display font-semibold">Personal Info</h3>
            {[['Email', member.email], ['Phone', member.phone], ['Gender', member.gender], ['DOB', member.dateOfBirth], ['Address', member.address],
              ['Emergency Contact', member.emergencyContactName], ['Emergency Phone', member.emergencyContactPhone], ['Joined', member.joinDate],
              ['Device User ID', member.deviceUserId]].map(([l, v]) => (
              <div key={l} className="flex justify-between py-1.5 border-b border-surface-100 last:border-0">
                <span className="text-sm text-surface-500">{l}</span>
                <span className="text-sm font-medium text-surface-800">{v || '—'}</span>
              </div>))}
          </div>
          {sub && (
            <div className="card p-6 space-y-3">
              <h3 className="font-display font-semibold">Current Plan</h3>
              {[['Plan', sub.plan?.name], ['Start', sub.startDate], ['End', sub.endDate],
                ['Paid', sub.amountPaid ? `₹${Number(sub.amountPaid).toLocaleString('en-IN')}` : '—'],
                ['Days Left', sub.daysRemaining]].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-surface-100 last:border-0">
                  <span className="text-sm text-surface-500">{l}</span>
                  <span className="text-sm font-medium text-surface-800">{v ?? '—'}</span>
                </div>))}
            </div>
          )}
        </div>
      )}

      {tab === 'subscriptions' && (
        <div className="card overflow-hidden">
          <table className="w-full"><thead><tr className="bg-surface-50 border-b">
            <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Plan</th>
            <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Period</th>
            <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Paid</th>
            <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Status</th>
          </tr></thead><tbody className="divide-y">
            {subs.map(s => (
              <tr key={s.id} className="hover:bg-surface-50">
                <td className="px-6 py-3 text-sm font-medium">{s.plan?.name}</td>
                <td className="px-6 py-3 text-sm text-surface-600">{s.startDate} → {s.endDate}</td>
                <td className="px-6 py-3 text-sm">{s.amountPaid ? `₹${Number(s.amountPaid).toLocaleString('en-IN')}` : '—'}</td>
                <td className="px-6 py-3"><span className={`badge ${s.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span></td>
              </tr>))}
          </tbody></table>
          {!subs.length && <p className="px-6 py-8 text-center text-surface-400 text-sm">No subscriptions</p>}
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card overflow-hidden">
          <table className="w-full"><thead><tr className="bg-surface-50 border-b">
            <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Date</th>
            <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">In</th>
            <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Out</th>
            <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Duration</th>
            <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Method</th>
          </tr></thead><tbody className="divide-y">
            {att.map(a => (
              <tr key={a.id} className="hover:bg-surface-50">
                <td className="px-6 py-3 text-sm">{a.checkInTime ? format(new Date(a.checkInTime), 'dd MMM yyyy') : '—'}</td>
                <td className="px-6 py-3 text-sm">{a.checkInTime ? format(new Date(a.checkInTime), 'hh:mm a') : '—'}</td>
                <td className="px-6 py-3 text-sm">{a.checkOutTime ? format(new Date(a.checkOutTime), 'hh:mm a') : '—'}</td>
                <td className="px-6 py-3 text-sm">{a.duration || '—'}</td>
                <td className="px-6 py-3"><span className={`badge ${a.verificationMethod === 'BIOMETRIC' ? 'badge-orange' : 'badge-gray'}`}>{a.verificationMethod}</span></td>
              </tr>))}
          </tbody></table>
          {!att.length && <p className="px-6 py-8 text-center text-surface-400 text-sm">No attendance records</p>}
        </div>
      )}

      {/* Assign Plan Modal */}
      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="Assign Membership Plan" maxWidth="max-w-md">
        <div className="p-6 space-y-4">
          <select className="input-field" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
            <option value="">Select a plan</option>
            {plans.map(p => (<option key={p.id} value={p.id}>{p.name} — ₹{Number(p.price).toLocaleString('en-IN')} ({p.durationDays}d)</option>))}
          </select>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
            <button className="btn-primary" onClick={assignPlan} disabled={!selectedPlan}>Assign & Pay</button>
          </div>
        </div>
      </Modal>

      {/* Biometric Enrollment Modal */}
      <Modal open={enrollModal} onClose={() => setEnrollModal(false)} title="Enroll Fingerprint" maxWidth="max-w-md">
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-3"><Fingerprint className="w-10 h-10 text-brand-600" /></div>
            <p className="font-semibold">{member.firstName} {member.lastName}</p>
            <p className="text-sm text-surface-500 font-mono">{member.memberCode}</p>
          </div>
          <div className="bg-surface-50 p-4 rounded-xl text-sm space-y-1">
            <p>1. Select device → 2. Click Enroll → 3. Scan finger on device</p>
          </div>
          {devices.length > 0 ? devices.map(d => (
            <button key={d.id} onClick={() => handleEnroll(d.deviceSerial)} disabled={enrolling}
              className="w-full flex items-center justify-between p-3 rounded-xl border hover:bg-surface-50 transition-colors disabled:opacity-50">
              <div><p className="text-sm font-medium">{d.deviceName}</p><p className="text-xs text-surface-500">{d.deviceIp}:{d.devicePort}</p></div>
              <span className="btn-primary !py-1.5 !text-xs">{enrolling ? 'Enrolling...' : 'Enroll'}</span>
            </button>
          )) : <p className="text-center text-surface-400 text-sm">No devices configured for this branch.</p>}
        </div>
      </Modal>
    </div>
  );
}
