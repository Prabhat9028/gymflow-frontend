import React, { useState, useEffect, useCallback } from 'react';
import { staffApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, LogIn, LogOut, Clock, ChevronLeft, ChevronRight, UserCog, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function StaffPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('profiles');
  const [staffList, setStaffList] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayAtt, setTodayAtt] = useState([]);
  const [checkInCode, setCheckInCode] = useState('');

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try { const { data } = await staffApi.getAll(page, 15, search); setStaffList(data.content); setTotalPages(data.totalPages); setTotal(data.totalElements); } catch {} finally { setLoading(false); }
  }, [page, search]);
  const loadTodayAtt = async () => { try { const { data } = await staffApi.getTodayAttendance(); setTodayAtt(data); } catch {} };
  useEffect(() => { loadStaff(); }, [loadStaff]);
  useEffect(() => { if (tab === 'attendance') loadTodayAtt(); }, [tab]);

  const [form, setForm] = useState({ firstName:'',lastName:'',email:'',password:'',phone:'',role:'STAFF',department:'',designation:'',salary:'',shiftStart:'',shiftEnd:'' });
  const set = (k,v) => setForm(p => ({ ...p, [k]: v }));
  const openNew = () => { setForm({ firstName:'',lastName:'',email:'',password:'',phone:'',role:'STAFF',department:'',designation:'',salary:'',shiftStart:'',shiftEnd:'' }); setModal({}); };

  const handleSave = async e => {
    e.preventDefault();
    try { await staffApi.create(form); toast.success('Staff created'); setModal(null); loadStaff(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };
  const handleDelete = async id => { if (!confirm('Deactivate?')) return; try { await staffApi.deactivate(id); toast.success('Done'); loadStaff(); } catch { toast.error('Failed'); } };
  const handleCheckIn = async e => { e.preventDefault(); if (!checkInCode.trim()) return; try { await staffApi.checkIn({ staffCode: checkInCode.trim() }); toast.success('Checked in!'); setCheckInCode(''); loadTodayAtt(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } };
  const handleCheckOut = async sid => { try { await staffApi.checkOut(sid); toast.success('Checked out!'); loadTodayAtt(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } };

  return (<div className="space-y-6 animate-in">
    <div className="flex items-center justify-between">
      <div><h1 className="font-display text-2xl font-bold">Staff Management</h1><p className="text-surface-500 text-sm">{total} staff — {user?.branchName}</p></div>
      <button className="btn-primary" onClick={openNew}><Plus className="w-4 h-4"/>Add Staff</button>
    </div>
    <div className="flex gap-1 border-b">
      {[{id:'profiles',label:'Profiles',icon:UserCog},{id:'attendance',label:'Attendance',icon:Clock}].map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===t.id?'border-brand-500 text-brand-600':'border-transparent text-surface-500 hover:text-surface-700'}`}><t.icon className="w-4 h-4"/>{t.label}</button>))}
    </div>

    {tab === 'profiles' && (<>
      <div className="relative max-w-md"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"/><input className="input-field pl-10" placeholder="Search..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staffList.map(s => (<div key={s.id} className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{s.firstName[0]}{s.lastName[0]}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold">{s.firstName} {s.lastName}</h3><p className="text-xs font-mono text-surface-400">{s.staffCode}</p>
              <div className="flex flex-wrap gap-1.5 mt-2"><span className="badge badge-blue">{s.role}</span>{s.department&&<span className="badge badge-gray">{s.department}</span>}</div>
              {s.shiftStart&&s.shiftEnd&&<p className="text-xs text-surface-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/>{s.shiftStart}–{s.shiftEnd}</p>}
              {s.salary&&<p className="text-sm font-semibold mt-1">₹{Number(s.salary).toLocaleString('en-IN')}/mo</p>}
            </div>
            <button onClick={() => handleDelete(s.id)} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5"/></button>
          </div>
        </div>))}
      </div>
      {loading && <div className="text-center py-12"><div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"/></div>}
      {!loading && !staffList.length && <p className="text-center py-12 text-surface-400">No staff</p>}
    </>)}

    {tab === 'attendance' && (<>
      <div className="card p-6"><h3 className="font-display font-semibold mb-4">Staff Check-in</h3>
        <form onSubmit={handleCheckIn} className="flex gap-3"><div className="relative flex-1 max-w-md"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"/><input className="input-field pl-10" placeholder="Staff code (STF001)" value={checkInCode} onChange={e=>setCheckInCode(e.target.value)}/></div>
        <button type="submit" className="btn-primary"><LogIn className="w-4 h-4"/>Check In</button></form></div>
      <div className="card overflow-hidden"><div className="px-6 py-4 border-b bg-surface-50 flex items-center justify-between"><h3 className="font-display font-semibold">Today</h3><span className="badge badge-blue">{todayAtt.length} present</span></div>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b bg-surface-50/50">
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Staff</th><th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Code</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">In</th><th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Out</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Status</th><th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Action</th>
      </tr></thead><tbody className="divide-y">{todayAtt.map(a=>(<tr key={a.id} className="hover:bg-surface-50">
        <td className="px-6 py-3 text-sm font-medium">{a.staffName}</td><td className="px-6 py-3 text-sm font-mono text-surface-600">{a.staffCode}</td>
        <td className="px-6 py-3 text-sm">{a.checkInTime?format(new Date(a.checkInTime),'hh:mm a'):'—'}</td>
        <td className="px-6 py-3 text-sm">{a.checkOutTime?format(new Date(a.checkOutTime),'hh:mm a'):<span className="text-brand-600 text-xs font-medium">On duty</span>}</td>
        <td className="px-6 py-3"><span className={`badge ${a.status==='PRESENT'?'badge-green':a.status==='LATE'?'badge-yellow':'badge-gray'}`}>{a.status}</span></td>
        <td className="px-6 py-3">{!a.checkOutTime&&<button onClick={()=>handleCheckOut(a.staffId)} className="btn-ghost text-red-600 text-xs"><LogOut className="w-3 h-3"/>Out</button>}</td>
      </tr>))}</tbody></table></div>
      {!todayAtt.length && <p className="py-12 text-center text-surface-400 text-sm">No check-ins today</p>}</div>
    </>)}

    <Modal open={modal!==null} onClose={()=>setModal(null)} title="New Staff Member">
      <form onSubmit={handleSave} className="p-6 space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-surface-700 mb-1">First Name *</label><input className="input-field" value={form.firstName} onChange={e=>set('firstName',e.target.value)} required/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Last Name *</label><input className="input-field" value={form.lastName} onChange={e=>set('lastName',e.target.value)} required/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Email *</label><input type="email" className="input-field" value={form.email} onChange={e=>set('email',e.target.value)} required placeholder="Used for login"/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Password *</label><input type="password" className="input-field" value={form.password} onChange={e=>set('password',e.target.value)} required/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Phone</label><input className="input-field" value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Role</label><select className="input-field" value={form.role} onChange={e=>set('role',e.target.value)}><option value="STAFF">Staff</option><option value="ADMIN">Admin</option><option value="TRAINER">Trainer</option><option value="MANAGER">Manager</option></select></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Department</label><input className="input-field" value={form.department} onChange={e=>set('department',e.target.value)}/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Designation</label><input className="input-field" value={form.designation} onChange={e=>set('designation',e.target.value)}/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Salary (₹)</label><input type="number" className="input-field" value={form.salary} onChange={e=>set('salary',e.target.value)}/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Shift Start</label><input type="time" className="input-field" value={form.shiftStart} onChange={e=>set('shiftStart',e.target.value)}/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Shift End</label><input type="time" className="input-field" value={form.shiftEnd} onChange={e=>set('shiftEnd',e.target.value)}/></div>
      </div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create</button></div></form>
    </Modal>
  </div>);
}
