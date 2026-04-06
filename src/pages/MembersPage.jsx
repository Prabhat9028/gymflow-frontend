import React,{useState,useEffect,useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {memberApi,biometricApi,planApi,uploadApi} from '../services/api';
import {Plus,Search,ChevronLeft,ChevronRight,Upload} from 'lucide-react';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function MembersPage(){
  const [members,setMembers]=useState([]);const [page,setPage]=useState(0);const [totalPages,setTotalPages]=useState(0);const [total,setTotal]=useState(0);
  const [search,setSearch]=useState('');const [modal,setModal]=useState(null);const [loading,setLoading]=useState(true);
  const [plans,setPlans]=useState([]);
  const nav=useNavigate();

  const load=useCallback(async()=>{setLoading(true);try{const{data}=await memberApi.getAll(page,15,search);setMembers(data.content);setTotalPages(data.totalPages);setTotal(data.totalElements);}catch{}finally{setLoading(false);};},[page,search]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{planApi.getAll().then(r=>setPlans(r.data.filter(p=>p.planType==='MEMBERSHIP'||!p.planType))).catch(()=>{});},[]);

  const emptyForm={firstName:'',lastName:'',phone:'',gender:'',dateOfBirth:'',address:'',emergencyContactName:'',emergencyContactPhone:'',planId:'',discountAmount:'',amountPaid:'',balanceAmount:'',balanceDueDate:'',paymentMode:'CASH',source:'',counsellor:''};
  const [form,setForm]=useState(emptyForm);
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));

  const selectedPlan=plans.find(p=>p.id===form.planId);
  const planPrice=selectedPlan?Number(selectedPlan.price):0;
  const discount=Number(form.discountAmount)||0;
  const finalAmount=Math.max(0,planPrice-discount);
  const paid=Number(form.amountPaid)||0;
  const balance=Math.max(0,finalAmount-paid);

  const handleSave=async e=>{
    e.preventDefault();
    if(!form.phone?.trim()){return toast.error('Phone number is required (unique identifier)');}
    const payload={...form};
    if(form.planId){payload.discountAmount=discount;payload.amountPaid=paid;payload.balanceAmount=balance;}
    else{delete payload.planId;delete payload.discountAmount;delete payload.amountPaid;delete payload.balanceAmount;delete payload.balanceDueDate;delete payload.paymentMode;}
    try{
      if(modal?.id){await memberApi.update(modal.id,payload);toast.success('Updated');}
      else{await memberApi.create(payload);toast.success('Member created');}
      setModal(null);load();
    }catch(err){toast.error(err.response?.data?.error||'Failed');}
  };
  const openNew=()=>{setForm(emptyForm);setModal({});};
  const openEdit=m=>{setForm({firstName:m.firstName,lastName:m.lastName,phone:m.phone||'',gender:m.gender||'',dateOfBirth:m.dateOfBirth||'',address:m.address||'',emergencyContactName:m.emergencyContactName||'',emergencyContactPhone:m.emergencyContactPhone||'',planId:'',discountAmount:'',amountPaid:'',balanceAmount:'',balanceDueDate:'',paymentMode:'CASH',source:m.source||'',counsellor:m.counsellor||''});setModal(m);};

  return(<div className="space-y-6 animate-in">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div><h1 className="font-display text-2xl font-bold">Members</h1><p className="text-surface-500 text-sm">{total} members (phone = unique ID)</p></div>
      <div className="flex gap-2">
        <label className="btn-secondary cursor-pointer"><Upload className="w-4 h-4"/>Import Excel
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async e=>{if(e.target.files[0]){toast.loading('Importing...',{id:'imp'});try{const{data}=await uploadApi.importMembers(e.target.files[0],localStorage.getItem('gf_branch'));toast.success(`Imported ${data.imported}, skipped ${data.skipped} duplicates`,{id:'imp'});load();}catch(err){toast.error(err.response?.data?.error||'Import failed',{id:'imp'});}}}}/>
        </label>
        <button className="btn-primary" onClick={openNew}><Plus className="w-4 h-4"/>Add Member</button>
      </div>
    </div>
    <div className="relative max-w-md"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"/><input className="input-field pl-10" placeholder="Search by name, phone, code..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/></div>
    <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-surface-50 border-b">
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Member</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Code</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Phone</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3 hidden lg:table-cell">Plan</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Status</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Actions</th>
    </tr></thead><tbody className="divide-y divide-surface-100">
      {members.map(m=>(<tr key={m.id} className="hover:bg-surface-50 hover-row transition-colors">
        <td className="px-6 py-3 cursor-pointer" onClick={()=>nav(`/members/${m.id}`)}><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">{m.firstName?.[0]}{m.lastName?.[0]}</div><p className="text-sm font-medium text-brand-700 hover:underline">{m.firstName} {m.lastName}</p></div></td>
        <td className="px-6 py-3 text-sm font-mono text-surface-600">{m.memberCode}</td>
        <td className="px-6 py-3 text-sm text-surface-600">{m.phone||'—'}</td>
        <td className="px-6 py-3 text-sm hidden lg:table-cell">{m.activeMembership?.plan?.name||<span className="text-surface-400">—</span>}</td>
        <td className="px-6 py-3"><span className={m.activeMembership?'badge badge-green':'badge badge-gray'}>{m.activeMembership?'Active':'Inactive'}</span></td>
        <td className="px-6 py-3"><button onClick={e=>{e.stopPropagation();openEdit(m);}} className="btn-ghost text-xs">Edit</button></td>
      </tr>))}
    </tbody></table></div>
    {loading&&<div className="py-12 text-center"><div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"/></div>}
    {!loading&&!members.length&&<p className="py-12 text-center text-surface-400">No members found</p>}
    {totalPages>1&&<div className="flex items-center justify-between px-6 py-3 border-t bg-surface-50"><p className="text-sm text-surface-500">Page {page+1} of {totalPages}</p><div className="flex gap-2"><button className="btn-ghost" disabled={page===0} onClick={()=>setPage(p=>p-1)}><ChevronLeft className="w-4 h-4"/></button><button className="btn-ghost" disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}><ChevronRight className="w-4 h-4"/></button></div></div>}
    </div>

    <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal?.id?'Edit Member':'New Member'}>
      <form onSubmit={handleSave} className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-surface-700 mb-1">First Name *</label><input className="input-field" value={form.firstName} onChange={e=>set('firstName',e.target.value)} required/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Last Name *</label><input className="input-field" value={form.lastName} onChange={e=>set('lastName',e.target.value)} required/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Phone * <span className="text-xs text-surface-400">(unique ID)</span></label><input className="input-field" value={form.phone} onChange={e=>set('phone',e.target.value)} required placeholder="10-digit mobile"/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Gender</label><select className="input-field" value={form.gender} onChange={e=>set('gender',e.target.value)}><option value="">Select</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Source</label><select className="input-field" value={form.source} onChange={e=>set('source',e.target.value)}><option value="">Select</option><option value="WALKIN">Walk-in</option><option value="REFERENCE">Reference</option><option value="ONLINE">Online</option><option value="SOCIAL_MEDIA">Social Media</option></select></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Counsellor</label><input className="input-field" value={form.counsellor} onChange={e=>set('counsellor',e.target.value)}/></div>
          <div className="sm:col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Address</label><input className="input-field" value={form.address} onChange={e=>set('address',e.target.value)}/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Emergency Contact</label><input className="input-field" value={form.emergencyContactName} onChange={e=>set('emergencyContactName',e.target.value)}/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Emergency Phone</label><input className="input-field" value={form.emergencyContactPhone} onChange={e=>set('emergencyContactPhone',e.target.value)}/></div>
        </div>
        {!modal?.id&&(<div className="border-t pt-4 mt-2"><h4 className="font-display font-semibold text-sm text-surface-900 mb-3">Membership Plan & Payment</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Select Plan</label><select className="input-field" value={form.planId} onChange={e=>set('planId',e.target.value)}><option value="">No plan</option>{plans.map(p=>(<option key={p.id} value={p.id}>{p.name} — ₹{Number(p.price).toLocaleString('en-IN')} ({p.durationDays}d)</option>))}</select></div>
            {form.planId&&(<>
              <div className="sm:col-span-2 bg-surface-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-surface-500">Plan Price</span><span className="font-semibold">₹{planPrice.toLocaleString('en-IN')}</span></div>
                {discount>0&&<div className="flex justify-between text-sm"><span className="text-surface-500">Discount</span><span className="text-emerald-600">-₹{discount.toLocaleString('en-IN')}</span></div>}
                <div className="border-t pt-2 flex justify-between text-sm"><span className="font-medium">Final</span><span className="font-bold text-brand-600">₹{finalAmount.toLocaleString('en-IN')}</span></div>
                {paid>0&&<div className="flex justify-between text-sm"><span className="text-surface-500">Paid</span><span className="text-blue-600">₹{paid.toLocaleString('en-IN')}</span></div>}
                {balance>0&&<div className="flex justify-between text-sm"><span className="text-red-600 font-medium">Balance</span><span className="font-bold text-red-600">₹{balance.toLocaleString('en-IN')}</span></div>}
              </div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Discount (₹)</label><input type="number" min="0" className="input-field" value={form.discountAmount} onChange={e=>set('discountAmount',e.target.value)}/></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Amount Paid (₹) *</label><input type="number" min="0" className="input-field" value={form.amountPaid} onChange={e=>set('amountPaid',e.target.value)} placeholder={String(finalAmount)} required/></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Payment Mode</label><select className="input-field" value={form.paymentMode} onChange={e=>set('paymentMode',e.target.value)}><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank Transfer</option></select></div>
              {balance>0&&<div><label className="block text-sm font-medium text-surface-700 mb-1">Balance Due Date</label><input type="date" className="input-field" value={form.balanceDueDate} onChange={e=>set('balanceDueDate',e.target.value)}/></div>}
            </>)}
          </div>
        </div>)}
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{modal?.id?'Update':'Create Member'}</button></div>
      </form>
    </Modal>
  </div>);
}
