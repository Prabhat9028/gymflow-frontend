import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberApi, subscriptionApi, attendanceApi, planApi, biometricApi, trainerApi } from '../services/api';
import { ArrowLeft, Fingerprint, CreditCard, RefreshCw, Dumbbell, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function MemberDetailPage() {
  const { id } = useParams(); const nav = useNavigate();
  const [member, setMember] = useState(null); const [subs, setSubs] = useState([]);
  const [att, setAtt] = useState([]); const [plans, setPlans] = useState([]); const [ptPlans, setPtPlans] = useState([]);
  const [devices, setDevices] = useState([]); const [trainers, setTrainers] = useState([]);
  const [tab, setTab] = useState('overview');
  const [showRenew, setShowRenew] = useState(null); // null=closed, 'MEMBERSHIP' or 'PT'
  const [renewForm, setRenewForm] = useState({ planId:'', discountAmount:'', amountPaid:'', paymentMethod:'CASH', balanceDueDate:'', trainerId:'' });
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ startDate:'', endDate:'', status:'', trainerId:'' });
  const [enrollModal, setEnrollModal] = useState(false); const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = () => Promise.all([
    memberApi.getById(id), subscriptionApi.getByMember(id), attendanceApi.getAll(0,50),
    planApi.getAll(), biometricApi.getDevices(), trainerApi.getAll(),
  ]).then(([m,s,a,p,d,t]) => {
    setMember(m.data); setSubs(s.data);
    setAtt((a.data.content||a.data||[]).filter(at=>at.memberId===id));
    const allPlans = p.data;
    setPlans(allPlans.filter(x=>x.planType!=='PT'));
    setPtPlans(allPlans.filter(x=>x.planType==='PT'));
    setDevices(d.data); setTrainers(t.data);
  }).catch(()=>toast.error('Failed')).finally(()=>setLoading(false));
  useEffect(()=>{loadAll();},[id]);

  const activeMembership = subs.find(s=>s.subType==='MEMBERSHIP'&&s.status==='ACTIVE');
  const activePT = subs.find(s=>s.subType==='PT'&&s.status==='ACTIVE');

  // Renew calc
  const renewPlans = showRenew==='PT'?ptPlans:plans;
  const selPlan = renewPlans.find(p=>p.id===renewForm.planId);
  const rPrice=selPlan?Number(selPlan.price):0; const rDisc=Number(renewForm.discountAmount)||0;
  const rFinal=Math.max(0,rPrice-rDisc); const rPaid=Number(renewForm.amountPaid)||0; const rBal=Math.max(0,rFinal-rPaid);

  const handleRenew = async () => {
    if(!renewForm.planId) return toast.error('Select a plan');
    try {
      await subscriptionApi.create({ memberId:id, planId:renewForm.planId, amountPaid:rPaid, paymentMethod:renewForm.paymentMethod,
        discountAmount:rDisc, balanceAmount:rBal, balanceDueDate:renewForm.balanceDueDate||null,
        trainerId:renewForm.trainerId||null, subType:showRenew });
      toast.success(showRenew==='PT'?'PT assigned!':'Membership renewed!'); setShowRenew(null); setLoading(true); loadAll();
    } catch(err){toast.error(err.response?.data?.error||'Failed');}
  };

  const handleEdit = async () => {
    try {
      await subscriptionApi.edit(editModal.id, editForm);
      toast.success('Updated!'); setEditModal(null); setLoading(true); loadAll();
    } catch(err){toast.error(err.response?.data?.error||'Failed');}
  };

  const openRenew=(type)=>{setRenewForm({planId:'',discountAmount:'',amountPaid:'',paymentMethod:'CASH',balanceDueDate:'',trainerId:''});setShowRenew(type);};
  const openEdit=(sub)=>{setEditForm({startDate:sub.startDate||'',endDate:sub.endDate||'',status:sub.status||'',trainerId:sub.trainerId||''});setEditModal(sub);};

  const handleEnroll=async(serial)=>{setEnrolling(true);try{const{data}=await memberApi.enrollBiometric(id,serial);if(data.success){toast.success(data.message||'Enrolled!');setEnrollModal(false);loadAll();}else toast.error(data.message||'Failed');}catch(err){toast.error(err.response?.data?.error||'Failed');}finally{setEnrolling(false);}};

  if(loading)return<div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"/></div>;
  if(!member)return<p>Member not found</p>;

  return(<div className="space-y-6 animate-in">
    <button className="btn-ghost" onClick={()=>nav('/members')}><ArrowLeft className="w-4 h-4"/>Back</button>
    <div className="card p-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-bold">{member.firstName[0]}{member.lastName?.[0]||''}</div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{member.firstName} {member.lastName}</h1>
          <p className="text-surface-500 text-sm">{member.memberCode} • {member.phone||'No phone'}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={activeMembership?'badge badge-green':'badge badge-red'}>{activeMembership?`Gym: ${activeMembership.plan?.name}`:'No Membership'}</span>
            {activePT&&<span className="badge badge-purple">PT: {activePT.plan?.name} {activePT.trainerName&&`(${activePT.trainerName})`}</span>}
            {activeMembership&&<span className="badge badge-yellow">{activeMembership.daysRemaining}d left</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-primary" onClick={()=>openRenew('MEMBERSHIP')}><RefreshCw className="w-4 h-4"/>{activeMembership?'Renew':'Assign Plan'}</button>
          <button className="btn-secondary" onClick={()=>openRenew('PT')}><Dumbbell className="w-4 h-4"/>{activePT?'Renew PT':'Assign PT'}</button>
          {!member.biometricEnrolled&&<button className="btn-ghost" onClick={()=>setEnrollModal(true)}><Fingerprint className="w-4 h-4"/>Enroll</button>}
        </div>
      </div>
    </div>

    <div className="flex gap-1 border-b">
      {['overview','subscriptions','attendance'].map(t=>(<button key={t} onClick={()=>setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all capitalize ${tab===t?'border-brand-500 text-brand-600':'border-transparent text-surface-500'}`}>{t}</button>))}
    </div>

    {tab==='overview'&&(<div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-in">
      <div className="card p-6 space-y-3 card-hover"><h3 className="font-display font-semibold">Personal Info</h3>
        {[['Phone',member.phone],['Gender',member.gender],['Source',member.source],['Counsellor',member.counsellor],['DOB',member.dateOfBirth],['Address',member.address],['Emergency',member.emergencyContactName],['Joined',member.joinDate]].map(([l,v])=>(
          <div key={l} className="flex justify-between py-1.5 border-b border-surface-100 last:border-0"><span className="text-sm text-surface-500">{l}</span><span className="text-sm font-medium">{v||'—'}</span></div>))}
      </div>
      <div className="space-y-4">
        {activeMembership&&(<div className="card p-6 space-y-3 card-hover"><div className="flex items-center justify-between"><h3 className="font-display font-semibold">Membership</h3><button onClick={()=>openEdit(activeMembership)} className="btn-ghost text-xs"><Edit2 className="w-3 h-3"/>Edit</button></div>
          {[['Plan',activeMembership.plan?.name],['Start',activeMembership.startDate],['End',activeMembership.endDate],['Days Left',activeMembership.daysRemaining],['Paid',activeMembership.amountPaid?`₹${Number(activeMembership.amountPaid).toLocaleString('en-IN')}`:'—']].map(([l,v])=>(
            <div key={l} className="flex justify-between py-1.5 border-b border-surface-100 last:border-0"><span className="text-sm text-surface-500">{l}</span><span className="text-sm font-medium">{v??'—'}</span></div>))}
        </div>)}
        {activePT&&(<div className="card p-6 space-y-3 card-hover"><div className="flex items-center justify-between"><h3 className="font-display font-semibold">Personal Training</h3><button onClick={()=>openEdit(activePT)} className="btn-ghost text-xs"><Edit2 className="w-3 h-3"/>Edit</button></div>
          {[['Plan',activePT.plan?.name],['Trainer',activePT.trainerName],['Start',activePT.startDate],['End',activePT.endDate],['Days Left',activePT.daysRemaining]].map(([l,v])=>(
            <div key={l} className="flex justify-between py-1.5 border-b border-surface-100 last:border-0"><span className="text-sm text-surface-500">{l}</span><span className="text-sm font-medium">{v??'—'}</span></div>))}
        </div>)}
      </div>
    </div>)}

    {tab==='subscriptions'&&(<div className="card overflow-hidden animate-slide-up"><table className="w-full"><thead><tr className="bg-surface-50 border-b">
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Type</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Plan</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Trainer</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Period</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Paid</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Status</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Edit</th>
    </tr></thead><tbody className="divide-y">{subs.map(s=>(<tr key={s.id} className="hover:bg-surface-50">
      <td className="px-6 py-3"><span className={`badge ${s.subType==='PT'?'badge-purple':'badge-blue'}`}>{s.subType}</span></td>
      <td className="px-6 py-3 text-sm font-medium">{s.plan?.name}</td>
      <td className="px-6 py-3 text-sm">{s.trainerName||'—'}</td>
      <td className="px-6 py-3 text-sm text-surface-600">{s.startDate} → {s.endDate}</td>
      <td className="px-6 py-3 text-sm">{s.amountPaid?`₹${Number(s.amountPaid).toLocaleString('en-IN')}`:'—'}</td>
      <td className="px-6 py-3"><span className={`badge ${s.status==='ACTIVE'?'badge-green':'badge-gray'}`}>{s.status}</span></td>
      <td className="px-6 py-3"><button onClick={()=>openEdit(s)} className="btn-ghost text-xs"><Edit2 className="w-3 h-3"/></button></td>
    </tr>))}</tbody></table>
    {!subs.length&&<p className="px-6 py-8 text-center text-surface-400 text-sm">No subscriptions</p>}</div>)}

    {tab==='attendance'&&(<div className="card overflow-hidden animate-slide-up"><table className="w-full"><thead><tr className="bg-surface-50 border-b">
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Date</th><th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">In</th><th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Out</th><th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Duration</th><th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Method</th>
    </tr></thead><tbody className="divide-y">{att.map(a=>(<tr key={a.id} className="hover:bg-surface-50">
      <td className="px-6 py-3 text-sm">{a.checkInTime?format(new Date(a.checkInTime),'dd MMM yyyy'):'—'}</td>
      <td className="px-6 py-3 text-sm">{a.checkInTime?format(new Date(a.checkInTime),'hh:mm a'):'—'}</td>
      <td className="px-6 py-3 text-sm">{a.checkOutTime?format(new Date(a.checkOutTime),'hh:mm a'):'—'}</td>
      <td className="px-6 py-3 text-sm">{a.duration||'—'}</td>
      <td className="px-6 py-3"><span className={`badge ${a.verificationMethod==='BIOMETRIC'?'badge-orange':'badge-gray'}`}>{a.verificationMethod}</span></td>
    </tr>))}</tbody></table>{!att.length&&<p className="px-6 py-8 text-center text-surface-400 text-sm">No attendance</p>}</div>)}

    {/* Renew/Assign Modal (both Membership & PT) */}
    <Modal open={!!showRenew} onClose={()=>setShowRenew(null)} title={showRenew==='PT'?(activePT?'Renew Personal Training':'Assign Personal Training'):(activeMembership?'Renew Membership':'Assign Membership')}>
      <div className="p-6 space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Select {showRenew==='PT'?'PT':'Membership'} Plan *</label>
          <select className="input-field" value={renewForm.planId} onChange={e=>setRenewForm(p=>({...p,planId:e.target.value}))}><option value="">Choose</option>
            {renewPlans.map(p=>(<option key={p.id} value={p.id}>{p.name} — ₹{Number(p.price).toLocaleString('en-IN')} ({p.durationDays}d)</option>))}</select></div>
        {showRenew==='PT'&&<div className="sm:col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Assign Trainer</label>
          <select className="input-field" value={renewForm.trainerId} onChange={e=>setRenewForm(p=>({...p,trainerId:e.target.value}))}><option value="">Select trainer</option>
            {trainers.map(t=>(<option key={t.id} value={t.id}>{t.firstName} {t.lastName} — {t.specialization||'General'}</option>))}</select></div>}
        {renewForm.planId&&(<>
          <div className="sm:col-span-2 bg-surface-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span>Price</span><span className="font-semibold">₹{rPrice.toLocaleString('en-IN')}</span></div>
            {rDisc>0&&<div className="flex justify-between text-sm"><span>Discount</span><span className="text-emerald-600">-₹{rDisc.toLocaleString('en-IN')}</span></div>}
            <div className="border-t pt-2 flex justify-between text-sm"><span className="font-medium">Final</span><span className="font-bold text-brand-600">₹{rFinal.toLocaleString('en-IN')}</span></div>
            {rBal>0&&<div className="flex justify-between text-sm"><span className="text-red-600">Balance</span><span className="font-bold text-red-600">₹{rBal.toLocaleString('en-IN')}</span></div>}
          </div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Discount</label><input type="number" min="0" className="input-field" value={renewForm.discountAmount} onChange={e=>setRenewForm(p=>({...p,discountAmount:e.target.value}))}/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Amount Paid</label><input type="number" min="0" className="input-field" value={renewForm.amountPaid} onChange={e=>setRenewForm(p=>({...p,amountPaid:e.target.value}))} placeholder={String(rFinal)}/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Payment Mode</label><select className="input-field" value={renewForm.paymentMethod} onChange={e=>setRenewForm(p=>({...p,paymentMethod:e.target.value}))}><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank Transfer</option></select></div>
          {rBal>0&&<div><label className="block text-sm font-medium text-surface-700 mb-1">Balance Due Date</label><input type="date" className="input-field" value={renewForm.balanceDueDate} onChange={e=>setRenewForm(p=>({...p,balanceDueDate:e.target.value}))}/></div>}
        </>)}
      </div>
      <div className="flex justify-end gap-3 pt-2"><button onClick={()=>setShowRenew(null)} className="btn-secondary">Cancel</button><button onClick={handleRenew} className="btn-primary" disabled={!renewForm.planId}>{showRenew==='PT'?'Assign PT':'Renew'}</button></div></div>
    </Modal>

    {/* Edit Subscription Modal */}
    <Modal open={!!editModal} onClose={()=>setEditModal(null)} title="Edit Subscription" maxWidth="max-w-md">
      {editModal&&<div className="p-6 space-y-4">
        <p className="text-sm text-surface-500">{editModal.subType} — {editModal.plan?.name}</p>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Start Date</label><input type="date" className="input-field" value={editForm.startDate} onChange={e=>setEditForm(p=>({...p,startDate:e.target.value}))}/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">End Date</label><input type="date" className="input-field" value={editForm.endDate} onChange={e=>setEditForm(p=>({...p,endDate:e.target.value}))}/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Status</label><select className="input-field" value={editForm.status} onChange={e=>setEditForm(p=>({...p,status:e.target.value}))}><option value="ACTIVE">Active</option><option value="EXPIRED">Expired</option><option value="FROZEN">Frozen</option><option value="CANCELLED">Cancelled</option></select></div>
        {editModal.subType==='PT'&&<div><label className="block text-sm font-medium text-surface-700 mb-1">Trainer</label><select className="input-field" value={editForm.trainerId} onChange={e=>setEditForm(p=>({...p,trainerId:e.target.value}))}><option value="">None</option>{trainers.map(t=>(<option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>))}</select></div>}
        <div className="flex justify-end gap-3"><button onClick={()=>setEditModal(null)} className="btn-secondary">Cancel</button><button onClick={handleEdit} className="btn-primary">Save</button></div>
      </div>}
    </Modal>

    {/* Enroll Modal */}
    <Modal open={enrollModal} onClose={()=>setEnrollModal(false)} title="Enroll Fingerprint" maxWidth="max-w-md">
      <div className="p-6 space-y-4">
        <div className="text-center"><div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-3"><Fingerprint className="w-8 h-8 text-brand-600"/></div>
          <p className="font-semibold">{member.firstName} {member.lastName}</p></div>
        {devices.length>0?devices.map(d=>(<button key={d.id} onClick={()=>handleEnroll(d.deviceSerial)} disabled={enrolling}
          className="w-full flex items-center justify-between p-3 rounded-xl border hover:bg-surface-50 disabled:opacity-50">
          <div><p className="text-sm font-medium">{d.deviceName}</p><p className="text-xs text-surface-500">{d.deviceIp}:{d.devicePort}</p></div>
          <span className="btn-primary !py-1.5 !text-xs">{enrolling?'...':'Enroll'}</span></button>))
        :<p className="text-center text-surface-400 text-sm">No devices configured.</p>}
      </div>
    </Modal>
  </div>);
}
