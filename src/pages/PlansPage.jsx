import React, { useState, useEffect } from 'react';
import { planApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Check } from 'lucide-react';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = () => planApi.getAll().then(r => setPlans(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    try {
      const payload = { ...form, features: form.featuresStr ? form.featuresStr.split('\n').filter(Boolean) : [] };
      delete payload.featuresStr;
      await planApi.create(payload); toast.success('Plan created'); setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (<div className="space-y-6 animate-in">
    <div className="flex items-center justify-between">
      <div><h1 className="font-display text-2xl font-bold">Membership Plans</h1><p className="text-surface-500 text-sm">{plans.length} plans — {user?.branchName}</p></div>
      <button className="btn-primary" onClick={() => setModal({ name:'',description:'',durationDays:30,price:'',featuresStr:'',maxFreezeDays:0 })}><Plus className="w-4 h-4"/>Add Plan</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {plans.map(p => (<div key={p.id} className="card p-6 hover:shadow-md transition-shadow">
        <h3 className="font-display font-bold text-lg">{p.name}</h3>
        <p className="text-3xl font-display font-bold text-brand-600 mb-1">₹{Number(p.price).toLocaleString('en-IN')}</p>
        <p className="text-sm text-surface-500 mb-4">{p.durationDays} days</p>
        {p.description && <p className="text-sm text-surface-600 mb-3">{p.description}</p>}
        <ul className="space-y-1.5">{(p.features||[]).map((f,i) => (<li key={i} className="flex items-center gap-2 text-sm text-surface-600"><Check className="w-3.5 h-3.5 text-brand-500 flex-shrink-0"/>{f}</li>))}</ul>
      </div>))}
    </div>
    {loading && <div className="text-center py-12"><div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"/></div>}
    {!loading && !plans.length && <p className="text-center py-12 text-surface-400">No plans for this branch</p>}
    <Modal open={!!modal} onClose={() => setModal(null)} title="New Plan" maxWidth="max-w-lg">
      {modal && (<form onSubmit={e=>{e.preventDefault();handleSave(modal);}} className="p-6 space-y-4">
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Name *</label><input className="input-field" value={modal.name} onChange={e=>setModal(p=>({...p,name:e.target.value}))} required/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Description</label><input className="input-field" value={modal.description||''} onChange={e=>setModal(p=>({...p,description:e.target.value}))}/></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Duration (days) *</label><input type="number" className="input-field" value={modal.durationDays} onChange={e=>setModal(p=>({...p,durationDays:+e.target.value}))} required/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Price (₹) *</label><input type="number" step="0.01" className="input-field" value={modal.price} onChange={e=>setModal(p=>({...p,price:e.target.value}))} required/></div>
        </div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Features (one per line)</label><textarea className="input-field h-24" value={modal.featuresStr||''} onChange={e=>setModal(p=>({...p,featuresStr:e.target.value}))}/></div>
        <div className="flex justify-end gap-3"><button type="button" onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create</button></div>
      </form>)}
    </Modal>
  </div>);
}
