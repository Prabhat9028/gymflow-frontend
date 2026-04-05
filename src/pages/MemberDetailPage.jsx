import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberApi, subscriptionApi, attendanceApi, planApi, biometricApi } from '../services/api';
import { ArrowLeft, Fingerprint, CreditCard, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function MemberDetailPage() {
  const { id } = useParams(); const nav = useNavigate();
  const [member, setMember] = useState(null);
  const [subs, setSubs] = useState([]);
  const [att, setAtt] = useState([]);
  const [plans, setPlans] = useState([]);
  const [devices, setDevices] = useState([]);
  const [tab, setTab] = useState('overview');
  const [showRenew, setShowRenew] = useState(false);
  const [renewForm, setRenewForm] = useState({ planId:'', discountAmount:'', amountPaid:'', paymentMethod:'CASH', balanceDueDate:'' });
  const [enrollModal, setEnrollModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = () => Promise.all([
    memberApi.getById(id), subscriptionApi.getByMember(id), attendanceApi.getAll(0, 50), planApi.getAll(), biometricApi.getDevices(),
  ]).then(([m, s, a, p, d]) => {
    setMember(m.data); setSubs(s.data);
    setAtt((a.data.content || a.data || []).filter(at => at.memberId === id)); setPlans(p.data); setDevices(d.data);
  }).catch(() => toast.error('Failed')).finally(() => setLoading(false));

  useEffect(() => { loadAll(); }, [id]);

  // Renew plan calc
  const selPlan = plans.find(p=>p.id===renewForm.planId);
  const rPrice = selPlan ? Number(selPlan.price) : 0;
  const rDiscount = Number(renewForm.discountAmount) || 0;
  const rFinal = Math.max(0, rPrice - rDiscount);
  const rPaid = Number(renewForm.amountPaid) || 0;
  const rBalance = Math.max(0, rFinal - rPaid);

  const handleRenew = async () => {
    if (!renewForm.planId) return toast.error('Select a plan');
    try {
      await subscriptionApi.create({
        memberId: id, planId: renewForm.planId,
        amountPaid: rPaid, paymentMethod: renewForm.paymentMethod,
        discountAmount: rDiscount, balanceAmount: rBalance,
        balanceDueDate: renewForm.balanceDueDate || null,
      });
      toast.success('Subscription renewed!'); setShowRenew(false);
      setLoading(true); loadAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEnroll = async (serial) => {
    setEnrolling(true);
    try { const { data } = await memberApi.enrollBiometric(id, serial);
      if (data.success) { toast.success(data.message||'Enrolled!'); setEnrollModal(false); loadAll(); }
      else toast.error(data.message||'Failed');
    } catch (err) { toast.error(err.response?.data?.error||'Failed'); } finally { setEnrolling(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"/></div>;
  if (!member) return <p>Member not found</p>;
  const sub = member.activeSubscription;

  return (<div className="space-y-6 animate-in">
    <button className="btn-ghost" onClick={()=>nav('/members')}><ArrowLeft className="w-4 h-4"/>Back to Members</button>

    <div className="card p-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-bold animate-float">{member.firstName[0]}{member.lastName[0]}</div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{member.firstName} {member.lastName}</h1>
          <p className="text-surface-500 font-mono text-sm">{member.memberCode} {member.phone && `• ${member.phone}`}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={sub?'badge badge-green':'badge badge-red'}>{sub?'Active':'No Membership'}</span>
            <span className={member.biometricEnrolled?'badge badge-orange':'badge badge-gray'}>{member.biometricEnrolled?'Biometric Enrolled':'Not Enrolled'}</span>
            {sub && <span className="badge badge-yellow">{sub.daysRemaining}d left — expires {sub.endDate}</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-primary" onClick={()=>{setRenewForm({planId:'',discountAmount:'',amountPaid:'',paymentMethod:'CASH',balanceDueDate:''});setShowRenew(true);}}><RefreshCw className="w-4 h-4"/>{sub?'Renew':'Assign Plan'}</button>
          {!member.biometricEnrolled && <button className="btn-secondary" onClick={()=>setEnrollModal(true)}><Fingerprint className="w-4 h-4"/>Enroll</button>}
        </div>
      </div>
    </div>

    <div className="flex gap-1 border-b">
      {['overview','subscriptions','attendance'].map(t=>(<button key={t} onClick={()=>setTab(t)}
        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all capitalize ${tab===t?'border-brand-500 text-brand-600':'border-transparent text-surface-500 hover:text-surface-700'}`}>{t}</button>))}
    </div>

    {tab==='overview'&&(<div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-in">
      <div className="card p-6 space-y-3 card-hover"><h3 className="font-display font-semibold">Personal Info</h3>
        {[['Email',member.email],['Phone',member.phone],['Gender',member.gender],['DOB',member.dateOfBirth],['Address',member.address],['Emergency',member.emergencyContactName],['Emergency Ph',member.emergencyContactPhone],['Joined',member.joinDate],['Device ID',member.deviceUserId]].map(([l,v])=>(
          <div key={l} className="flex justify-between py-1.5 border-b border-surface-100 last:border-0"><span className="text-sm text-surface-500">{l}</span><span className="text-sm font-medium">{v||'—'}</span></div>))}
      </div>
      {sub&&(<div className="card p-6 space-y-3 card-hover"><h3 className="font-display font-semibold">Current Plan</h3>
        {[['Plan',sub.plan?.name],['Price',sub.plan?.price?`₹${Number(sub.plan.price).toLocaleString('en-IN')}`:'—'],['Start',sub.startDate],['End',sub.endDate],['Paid',sub.amountPaid?`₹${Number(sub.amountPaid).toLocaleString('en-IN')}`:'—'],['Days Left',sub.daysRemaining]].map(([l,v])=>(
          <div key={l} className="flex justify-between py-1.5 border-b border-surface-100 last:border-0"><span className="text-sm text-surface-500">{l}</span><span className="text-sm font-medium">{v??'—'}</span></div>))}
      </div>)}
    </div>)}

    {tab==='subscriptions'&&(<div className="card overflow-hidden animate-slide-up">
      <table className="w-full"><thead><tr className="bg-surface-50 border-b">
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Plan</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Period</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Paid</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Status</th>
      </tr></thead><tbody className="divide-y">
        {subs.map(s=>(<tr key={s.id} className="hover:bg-surface-50"><td className="px-6 py-3 text-sm font-medium">{s.plan?.name}</td>
          <td className="px-6 py-3 text-sm text-surface-600">{s.startDate} → {s.endDate}</td>
          <td className="px-6 py-3 text-sm">{s.amountPaid?`₹${Number(s.amountPaid).toLocaleString('en-IN')}`:'—'}</td>
          <td className="px-6 py-3"><span className={`badge ${s.status==='ACTIVE'?'badge-green':'badge-gray'}`}>{s.status}</span></td></tr>))}
      </tbody></table>
      {!subs.length&&<p className="px-6 py-8 text-center text-surface-400 text-sm">No subscriptions</p>}
    </div>)}

    {tab==='attendance'&&(<div className="card overflow-hidden animate-slide-up">
      <table className="w-full"><thead><tr className="bg-surface-50 border-b">
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Date</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">In</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Out</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Duration</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Method</th>
      </tr></thead><tbody className="divide-y">{att.map(a=>(<tr key={a.id} className="hover:bg-surface-50">
        <td className="px-6 py-3 text-sm">{a.checkInTime?format(new Date(a.checkInTime),'dd MMM yyyy'):'—'}</td>
        <td className="px-6 py-3 text-sm">{a.checkInTime?format(new Date(a.checkInTime),'hh:mm a'):'—'}</td>
        <td className="px-6 py-3 text-sm">{a.checkOutTime?format(new Date(a.checkOutTime),'hh:mm a'):'—'}</td>
        <td className="px-6 py-3 text-sm">{a.duration||'—'}</td>
        <td className="px-6 py-3"><span className={`badge ${a.verificationMethod==='BIOMETRIC'?'badge-orange':'badge-gray'}`}>{a.verificationMethod}</span></td>
      </tr>))}</tbody></table>
      {!att.length&&<p className="px-6 py-8 text-center text-surface-400 text-sm">No attendance</p>}
    </div>)}

    {/* Renew/Assign Plan Modal */}
    <Modal open={showRenew} onClose={()=>setShowRenew(false)} title={sub?'Renew Subscription':'Assign Membership Plan'}>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Select Plan *</label>
            <select className="input-field" value={renewForm.planId} onChange={e=>setRenewForm(p=>({...p,planId:e.target.value}))}>
              <option value="">Choose plan</option>
              {plans.map(p=>(<option key={p.id} value={p.id}>{p.name} — ₹{Number(p.price).toLocaleString('en-IN')} ({p.durationDays}d)</option>))}
            </select></div>
          {renewForm.planId && (<>
            <div className="sm:col-span-2 bg-surface-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-surface-500">Plan Price</span><span className="font-semibold">₹{rPrice.toLocaleString('en-IN')}</span></div>
              {rDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-surface-500">Discount</span><span className="text-emerald-600">-₹{rDiscount.toLocaleString('en-IN')}</span></div>}
              <div className="border-t pt-2 flex justify-between text-sm"><span className="font-medium">Final</span><span className="font-bold text-brand-600">₹{rFinal.toLocaleString('en-IN')}</span></div>
              {rPaid > 0 && <div className="flex justify-between text-sm"><span className="text-surface-500">Paid</span><span className="text-blue-600">₹{rPaid.toLocaleString('en-IN')}</span></div>}
              {rBalance > 0 && <div className="flex justify-between text-sm"><span className="text-red-600 font-medium">Balance</span><span className="font-bold text-red-600">₹{rBalance.toLocaleString('en-IN')}</span></div>}
            </div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Discount (₹)</label><input type="number" min="0" className="input-field" value={renewForm.discountAmount} onChange={e=>setRenewForm(p=>({...p,discountAmount:e.target.value}))}/></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Amount Paid (₹)</label><input type="number" min="0" className="input-field" value={renewForm.amountPaid} onChange={e=>setRenewForm(p=>({...p,amountPaid:e.target.value}))} placeholder={String(rFinal)}/></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Payment Mode</label><select className="input-field" value={renewForm.paymentMethod} onChange={e=>setRenewForm(p=>({...p,paymentMethod:e.target.value}))}><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank Transfer</option></select></div>
            {rBalance > 0 && <div><label className="block text-sm font-medium text-surface-700 mb-1">Balance Due Date</label><input type="date" className="input-field" value={renewForm.balanceDueDate} onChange={e=>setRenewForm(p=>({...p,balanceDueDate:e.target.value}))}/></div>}
          </>)}
        </div>
        <div className="flex justify-end gap-3 pt-2"><button onClick={()=>setShowRenew(false)} className="btn-secondary">Cancel</button><button onClick={handleRenew} className="btn-primary" disabled={!renewForm.planId}>{sub?'Renew':'Assign & Pay'}</button></div>
      </div>
    </Modal>

    {/* Enroll Modal */}
    <Modal open={enrollModal} onClose={()=>setEnrollModal(false)} title="Enroll Fingerprint" maxWidth="max-w-md">
      <div className="p-6 space-y-4">
        <div className="text-center"><div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-3 animate-float"><Fingerprint className="w-10 h-10 text-brand-600"/></div>
          <p className="font-semibold">{member.firstName} {member.lastName}</p><p className="text-sm text-surface-500 font-mono">{member.memberCode}</p></div>
        {devices.length>0?devices.map(d=>(<button key={d.id} onClick={()=>handleEnroll(d.deviceSerial)} disabled={enrolling}
          className="w-full flex items-center justify-between p-3 rounded-xl border hover:bg-surface-50 transition-colors disabled:opacity-50">
          <div><p className="text-sm font-medium">{d.deviceName}</p><p className="text-xs text-surface-500">{d.deviceIp}:{d.devicePort}</p></div>
          <span className="btn-primary !py-1.5 !text-xs">{enrolling?'Enrolling...':'Enroll'}</span></button>))
        :<p className="text-center text-surface-400 text-sm">No devices configured.</p>}
      </div>
    </Modal>
  </div>);
}
