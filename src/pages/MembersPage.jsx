import React,{useState,useEffect,useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {memberApi,biometricApi} from '../services/api';
import {Plus,Search,ChevronLeft,ChevronRight,Fingerprint} from 'lucide-react';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function MembersPage(){
  const [members,setMembers]=useState([]);const [page,setPage]=useState(0);const [totalPages,setTotalPages]=useState(0);const [total,setTotal]=useState(0);
  const [search,setSearch]=useState('');const [modal,setModal]=useState(null);const [loading,setLoading]=useState(true);
  const [devices,setDevices]=useState([]);const [enrollModal,setEnrollModal]=useState(null);const [enrolling,setEnrolling]=useState(false);
  const nav=useNavigate();

  const load=useCallback(async()=>{setLoading(true);try{const{data}=await memberApi.getAll(page,15,search);setMembers(data.content);setTotalPages(data.totalPages);setTotal(data.totalElements);}catch{}finally{setLoading(false);};},[page,search]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{biometricApi.getDevices().then(r=>setDevices(r.data)).catch(()=>{});},[]);

  const [form,setForm]=useState({firstName:'',lastName:'',email:'',phone:'',gender:'',dateOfBirth:'',address:'',emergencyContactName:'',emergencyContactPhone:''});
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const handleSave=async e=>{e.preventDefault();try{if(modal?.id){await memberApi.update(modal.id,form);toast.success('Updated');}else{await memberApi.create(form);toast.success('Created');}setModal(null);load();}catch(err){toast.error(err.response?.data?.error||'Failed');}};
  const openNew=()=>{setForm({firstName:'',lastName:'',email:'',phone:'',gender:'',dateOfBirth:'',address:'',emergencyContactName:'',emergencyContactPhone:''});setModal({});};
  const openEdit=m=>{setForm({firstName:m.firstName,lastName:m.lastName,email:m.email||'',phone:m.phone||'',gender:m.gender||'',dateOfBirth:m.dateOfBirth||'',address:m.address||'',emergencyContactName:m.emergencyContactName||'',emergencyContactPhone:m.emergencyContactPhone||''});setModal(m);};

  const handleEnroll=async(memberId,serial)=>{setEnrolling(true);try{const{data}=await memberApi.enrollBiometric(memberId,serial);if(data.success){toast.success(data.message||'Enrolled!');load();setEnrollModal(null);}else{toast.error(data.message||'Failed');}}catch(err){toast.error(err.response?.data?.error||'Enrollment failed');}finally{setEnrolling(false);}};

  return(<div className="space-y-6 animate-in">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div><h1 className="font-display text-2xl font-bold">Members</h1><p className="text-surface-500 text-sm">{total} total members (branch-specific)</p></div>
      <button className="btn-primary" onClick={openNew}><Plus className="w-4 h-4"/>Add Member</button>
    </div>
    <div className="relative max-w-md"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"/><input className="input-field pl-10" placeholder="Search..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/></div>
    <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-surface-50 border-b">
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Member</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Code</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3 hidden md:table-cell">Phone</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Status</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Biometric</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Actions</th>
    </tr></thead><tbody className="divide-y divide-surface-100">
      {members.map(m=>(<tr key={m.id} className="hover:bg-surface-50">
        <td className="px-6 py-3 cursor-pointer" onClick={()=>nav(`/members/${m.id}`)}><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">{m.firstName?.[0]}{m.lastName?.[0]}</div><div><p className="text-sm font-medium text-brand-700 hover:underline">{m.firstName} {m.lastName}</p><p className="text-xs text-surface-400">{m.email||'—'}</p></div></div></td>
        <td className="px-6 py-3 text-sm font-mono text-surface-600">{m.memberCode}</td>
        <td className="px-6 py-3 text-sm text-surface-600 hidden md:table-cell">{m.phone||'—'}</td>
        <td className="px-6 py-3"><span className={m.activeSubscription?'badge badge-green':'badge badge-gray'}>{m.activeSubscription?'Active':'Inactive'}</span></td>
        <td className="px-6 py-3"><span className={m.biometricEnrolled?'badge badge-orange':'badge badge-gray'}>{m.biometricEnrolled?'Enrolled':'Not Enrolled'}</span></td>
        <td className="px-6 py-3"><div className="flex gap-1">
          {!m.biometricEnrolled&&<button onClick={()=>setEnrollModal(m)} className="btn-ghost text-xs text-brand-600 hover:bg-brand-50"><Fingerprint className="w-3.5 h-3.5"/>Enroll</button>}
          <button onClick={()=>openEdit(m)} className="btn-ghost text-xs">Edit</button>
        </div></td>
      </tr>))}
    </tbody></table></div>
    {loading&&<div className="py-12 text-center"><div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"/></div>}
    {!loading&&!members.length&&<p className="py-12 text-center text-surface-400">No members found</p>}
    {totalPages>1&&<div className="flex items-center justify-between px-6 py-3 border-t bg-surface-50"><p className="text-sm text-surface-500">Page {page+1} of {totalPages}</p><div className="flex gap-2"><button className="btn-ghost" disabled={page===0} onClick={()=>setPage(p=>p-1)}><ChevronLeft className="w-4 h-4"/></button><button className="btn-ghost" disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}><ChevronRight className="w-4 h-4"/></button></div></div>}
    </div>

    {/* Create/Edit Modal */}
    <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal?.id?'Edit Member':'New Member'}>
      <form onSubmit={handleSave} className="p-6 space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-surface-700 mb-1">First Name *</label><input className="input-field" value={form.firstName} onChange={e=>set('firstName',e.target.value)} required/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Last Name *</label><input className="input-field" value={form.lastName} onChange={e=>set('lastName',e.target.value)} required/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Email</label><input type="email" className="input-field" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Phone</label><input className="input-field" value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Gender</label><select className="input-field" value={form.gender} onChange={e=>set('gender',e.target.value)}><option value="">Select</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Date of Birth</label><input type="date" className="input-field" value={form.dateOfBirth} onChange={e=>set('dateOfBirth',e.target.value)}/></div>
        <div className="sm:col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Address</label><input className="input-field" value={form.address} onChange={e=>set('address',e.target.value)}/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Emergency Contact</label><input className="input-field" value={form.emergencyContactName} onChange={e=>set('emergencyContactName',e.target.value)}/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Emergency Phone</label><input className="input-field" value={form.emergencyContactPhone} onChange={e=>set('emergencyContactPhone',e.target.value)}/></div>
      </div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{modal?.id?'Update':'Create'}</button></div></form>
    </Modal>

    {/* Biometric Enrollment Modal */}
    <Modal open={!!enrollModal} onClose={()=>setEnrollModal(null)} title="Enroll Fingerprint" maxWidth="max-w-md">
      {enrollModal&&<div className="p-6 space-y-4">
        <div className="text-center"><div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-3"><Fingerprint className="w-10 h-10 text-brand-600"/></div>
          <p className="font-semibold">{enrollModal.firstName} {enrollModal.lastName}</p><p className="text-sm text-surface-500 font-mono">{enrollModal.memberCode}</p></div>
        <div className="bg-surface-50 p-4 rounded-xl text-sm space-y-2">
          <p className="font-medium">Enrollment Steps:</p>
          <p>1. Select the ESSL/ZKTeco device below</p>
          <p>2. Click "Start Enrollment"</p>
          <p>3. Device screen will show "Place Finger"</p>
          <p>4. Member scans finger on device (3 times)</p>
          <p>5. Fingerprint is saved & mapped to member</p>
        </div>
        {devices.length>0?<div className="space-y-2">{devices.map(d=>(
          <button key={d.id} onClick={()=>handleEnroll(enrollModal.id,d.deviceSerial)} disabled={enrolling}
            className="w-full flex items-center justify-between p-3 rounded-xl border hover:bg-surface-50 transition-colors disabled:opacity-50">
            <div><p className="text-sm font-medium">{d.deviceName}</p><p className="text-xs text-surface-500">{d.deviceIp}:{d.devicePort} — {d.deviceSerial}</p></div>
            <span className="btn-primary !py-1.5 !text-xs">{enrolling?'Enrolling...':'Enroll'}</span>
          </button>))}</div>
        :<p className="text-center text-surface-400 text-sm">No devices configured for this branch. Add a device in Settings.</p>}
      </div>}
    </Modal>
  </div>);
}
