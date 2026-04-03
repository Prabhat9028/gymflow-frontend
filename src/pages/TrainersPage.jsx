import React, { useState, useEffect } from 'react';
import { trainerApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function TrainersPage() {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = () => trainerApi.getAll().then(r => setTrainers(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSave = async form => {
    try { await trainerApi.create(form); toast.success('Created'); setModal(null); load(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };
  const handleDelete = async id => { if (!confirm('Delete?')) return; try { await trainerApi.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); } };

  return (<div className="space-y-6 animate-in">
    <div className="flex items-center justify-between">
      <div><h1 className="font-display text-2xl font-bold">Trainers</h1><p className="text-surface-500 text-sm">{trainers.length} trainers — {user?.branchName}</p></div>
      <button className="btn-primary" onClick={() => setModal({firstName:'',lastName:'',email:'',phone:'',specialization:'',certification:'',hourlyRate:''})}><Plus className="w-4 h-4"/>Add Trainer</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {trainers.map(t => (<div key={t.id} className="card p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">{t.firstName[0]}{t.lastName[0]}</div>
          <div className="flex-1"><h3 className="font-display font-bold">{t.firstName} {t.lastName}</h3><p className="text-sm text-brand-600 font-medium">{t.specialization||'General'}</p>
            {t.email && <p className="text-xs text-surface-500 mt-1">{t.email}</p>}{t.hourlyRate && <p className="text-sm font-semibold mt-2">₹{Number(t.hourlyRate).toLocaleString('en-IN')}/hr</p>}</div>
          <button onClick={() => handleDelete(t.id)} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5"/></button>
        </div>
      </div>))}
    </div>
    {loading && <div className="text-center py-12"><div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"/></div>}
    {!loading && !trainers.length && <p className="text-center py-12 text-surface-400">No trainers</p>}
    <Modal open={!!modal} onClose={() => setModal(null)} title="New Trainer" maxWidth="max-w-lg">
      {modal && (<form onSubmit={e=>{e.preventDefault();handleSave(modal);}} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-surface-700 mb-1">First Name *</label><input className="input-field" value={modal.firstName} onChange={e=>setModal(p=>({...p,firstName:e.target.value}))} required/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Last Name *</label><input className="input-field" value={modal.lastName} onChange={e=>setModal(p=>({...p,lastName:e.target.value}))} required/></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Email</label><input type="email" className="input-field" value={modal.email||''} onChange={e=>setModal(p=>({...p,email:e.target.value}))}/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Phone</label><input className="input-field" value={modal.phone||''} onChange={e=>setModal(p=>({...p,phone:e.target.value}))}/></div>
        </div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Specialization</label><input className="input-field" value={modal.specialization||''} onChange={e=>setModal(p=>({...p,specialization:e.target.value}))} placeholder="CrossFit, Yoga, Strength"/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Hourly Rate (₹)</label><input type="number" className="input-field" value={modal.hourlyRate||''} onChange={e=>setModal(p=>({...p,hourlyRate:e.target.value}))}/></div>
        <div className="flex justify-end gap-3"><button type="button" onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create</button></div>
      </form>)}
    </Modal>
  </div>);
}
