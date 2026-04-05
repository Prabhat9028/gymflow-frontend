import React, { useState, useEffect } from 'react';
import { gymApi, uploadApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Building2, MapPin, Phone, Mail, Edit2, Trash2, ChevronDown, ChevronRight, Users, GitBranch, Camera } from 'lucide-react';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function GymsPage() {
  const { isSuperAdmin } = useAuth();
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gymModal, setGymModal] = useState(null);
  const [branchModal, setBranchModal] = useState(null);
  const [expandedGym, setExpandedGym] = useState(null);

  const load = () => { setLoading(true); gymApi.getAll().then(r => setGyms(r.data)).catch(() => toast.error('Failed to load gyms')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  // Gym form
  const [gymForm, setGymForm] = useState({ name: '', code: '', email: '', phone: '', address: '', logoUrl: '', adminEmail: '', adminPassword: '' });
  const setG = (k, v) => setGymForm(p => ({ ...p, [k]: v }));

  const openNewGym = () => { setGymForm({ name: '', code: '', email: '', phone: '', address: '', logoUrl: '', adminEmail: '', adminPassword: '' }); setGymModal({}); };
  const openEditGym = g => { setGymForm({ name: g.name, code: g.code, email: g.email || '', phone: g.phone || '', address: g.address || '', logoUrl: g.logoUrl || '', adminEmail: '', adminPassword: '' }); setGymModal(g); };

  const saveGym = async e => {
    e.preventDefault();
    try {
      if (gymModal?.id) { await gymApi.update(gymModal.id, gymForm); toast.success('Gym updated'); }
      else { await gymApi.create(gymForm); toast.success('Gym onboarded!'); }
      setGymModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deleteGym = async id => { if (!confirm('Deactivate this gym?')) return; try { await gymApi.deactivate(id); toast.success('Deactivated'); load(); } catch { toast.error('Failed'); } };

  // Branch form
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', city: '', phone: '', email: '' });
  const setB = (k, v) => setBranchForm(p => ({ ...p, [k]: v }));

  const openNewBranch = companyId => { setBranchForm({ name: '', code: '', address: '', city: '', phone: '', email: '' }); setBranchModal({ companyId }); };
  const openEditBranch = b => { setBranchForm({ name: b.name, code: b.code, address: b.address || '', city: b.city || '', phone: b.phone || '', email: b.email || '' }); setBranchModal(b); };

  const saveBranch = async e => {
    e.preventDefault();
    try {
      if (branchModal?.id) { await gymApi.updateBranch(branchModal.id, branchForm); toast.success('Branch updated'); }
      else { await gymApi.createBranch(branchModal.companyId, branchForm); toast.success('Branch created!'); }
      setBranchModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deleteBranch = async id => { if (!confirm('Deactivate this branch?')) return; try { await gymApi.deactivateBranch(id); toast.success('Deactivated'); load(); } catch { toast.error('Failed'); } };

  if (!isSuperAdmin) return <div className="card p-12 text-center text-surface-400">Only Super Admins can manage gyms and branches.</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Gym Management</h1>
          <p className="text-surface-500 text-sm">Onboard new gyms and manage their branches</p>
        </div>
        <button className="btn-primary" onClick={openNewGym}><Plus className="w-4 h-4" /> Onboard New Gym</button>
      </div>

      {loading && <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>}

      <div className="space-y-4">
        {gyms.map(g => (
          <div key={g.id} className="card overflow-hidden">
            {/* Gym Header */}
            <div className="p-5 flex items-start gap-4 cursor-pointer hover:bg-surface-50 transition-colors" onClick={() => setExpandedGym(expandedGym === g.id ? null : g.id)}>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {g.logoUrl ? <img src={g.logoUrl} alt="" className="w-full h-full rounded-xl object-cover" /> : g.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg text-surface-900">{g.name}</h3>
                  <span className="badge badge-orange">{g.code}</span>
                  {g.isActive ? <span className="badge badge-green">Active</span> : <span className="badge badge-red">Inactive</span>}
                </div>
                <div className="flex flex-wrap gap-4 mt-1.5 text-sm text-surface-500">
                  {g.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{g.address}</span>}
                  {g.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{g.phone}</span>}
                  {g.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{g.email}</span>}
                </div>
                <div className="flex gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-surface-600"><GitBranch className="w-4 h-4 text-brand-500" />{g.branchCount} Branches</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-surface-600"><Users className="w-4 h-4 text-blue-500" />{g.memberCount} Members</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-surface-600"><Users className="w-4 h-4 text-purple-500" />{g.staffCount} Staff</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={e => { e.stopPropagation(); openEditGym(g); }} className="btn-ghost p-2"><Edit2 className="w-4 h-4" /></button>
                <button onClick={e => { e.stopPropagation(); deleteGym(g.id); }} className="btn-ghost p-2 text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                {expandedGym === g.id ? <ChevronDown className="w-5 h-5 text-surface-400" /> : <ChevronRight className="w-5 h-5 text-surface-400" />}
              </div>
            </div>

            {/* Branches (expanded) */}
            {expandedGym === g.id && (
              <div className="border-t bg-surface-50/50">
                <div className="px-5 py-3 flex items-center justify-between border-b bg-surface-50">
                  <h4 className="font-display font-semibold text-sm text-surface-700">Branches</h4>
                  <button onClick={() => openNewBranch(g.id)} className="btn-primary !py-1.5 !text-xs"><Plus className="w-3 h-3" /> Add Branch</button>
                </div>
                {(g.branches || []).length > 0 ? (
                  <div className="divide-y">
                    {g.branches.map(b => (
                      <div key={b.id} className="px-5 py-3 flex items-center justify-between hover:bg-white transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{b.code.split('-').pop()?.substring(0, 3) || 'BR'}</div>
                          <div>
                            <p className="text-sm font-medium text-surface-800">{b.name}</p>
                            <div className="flex gap-3 text-xs text-surface-500">
                              <span className="font-mono">{b.code}</span>
                              {b.city && <span>{b.city}</span>}
                              {b.address && <span>{b.address}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex gap-3 text-xs text-surface-500">
                            <span>{b.memberCount} members</span>
                            <span>{b.staffCount} staff</span>
                          </div>
                          <button onClick={() => openEditBranch(b)} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteBranch(b.id)} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-6 text-center text-surface-400 text-sm">No branches yet. Add one to get started.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!loading && gyms.length === 0 && <div className="card p-12 text-center"><p className="text-surface-400 text-lg">No gyms onboarded yet</p><button className="btn-primary mt-4" onClick={openNewGym}><Plus className="w-4 h-4" /> Onboard First Gym</button></div>}

      {/* Gym Modal */}
      <Modal open={gymModal !== null} onClose={() => setGymModal(null)} title={gymModal?.id ? 'Edit Gym' : 'Onboard New Gym'}>
        <form onSubmit={saveGym} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Gym Name *</label>
              <input className="input-field" value={gymForm.name} onChange={e => setG('name', e.target.value)} required placeholder="e.g., MaxOut Gym" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Code * <span className="text-xs text-surface-400">(unique identifier)</span></label>
              <input className="input-field uppercase" value={gymForm.code} onChange={e => setG('code', e.target.value.toUpperCase())} required placeholder="e.g., MAXOUT" disabled={!!gymModal?.id} /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
              <input type="email" className="input-field" value={gymForm.email} onChange={e => setG('email', e.target.value)} placeholder="info@gym.com" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Phone</label>
              <input className="input-field" value={gymForm.phone} onChange={e => setG('phone', e.target.value)} placeholder="+91 9876543210" /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Address</label>
              <input className="input-field" value={gymForm.address} onChange={e => setG('address', e.target.value)} placeholder="Full address" /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Logo</label>
              <div className="flex items-center gap-4">
                {gymForm.logoUrl ? <img src={gymForm.logoUrl} alt="" className="w-16 h-16 rounded-xl object-cover border"/>
                : <div className="w-16 h-16 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400 border"><Camera className="w-6 h-6"/></div>}
                <div><label className="btn-secondary cursor-pointer !text-xs"><Camera className="w-3.5 h-3.5"/>Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={async e=>{if(e.target.files[0]){try{const{data}=await uploadApi.upload(e.target.files[0],'gym');setG('logoUrl',data.url);toast.success('Logo uploaded');}catch{toast.error('Upload failed');}}}}/>
                </label><p className="text-xs text-surface-400 mt-1">JPG, PNG, max 10MB</p></div>
              </div></div>
          </div>
          {!gymModal?.id && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-display font-semibold text-sm text-surface-900 mb-3">Gym Admin Account</h4>
              <p className="text-xs text-surface-500 mb-3">Create a Super Admin user who will manage this gym</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-surface-700 mb-1">Admin Email</label>
                  <input type="email" className="input-field" value={gymForm.adminEmail} onChange={e => setG('adminEmail', e.target.value)} placeholder="admin@gym.com" /></div>
                <div><label className="block text-sm font-medium text-surface-700 mb-1">Admin Password</label>
                  <input type="password" className="input-field" value={gymForm.adminPassword} onChange={e => setG('adminPassword', e.target.value)} placeholder="min 6 characters" /></div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setGymModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{gymModal?.id ? 'Update Gym' : 'Onboard Gym'}</button>
          </div>
        </form>
      </Modal>

      {/* Branch Modal */}
      <Modal open={branchModal !== null} onClose={() => setBranchModal(null)} title={branchModal?.id ? 'Edit Branch' : 'Add New Branch'} maxWidth="max-w-lg">
        <form onSubmit={saveBranch} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Branch Name *</label>
              <input className="input-field" value={branchForm.name} onChange={e => setB('name', e.target.value)} required placeholder="e.g., MaxOut Andheri" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Code *</label>
              <input className="input-field uppercase" value={branchForm.code} onChange={e => setB('code', e.target.value.toUpperCase())} required placeholder="e.g., MAXOUT-AND" disabled={!!branchModal?.id} /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">City</label>
              <input className="input-field" value={branchForm.city} onChange={e => setB('city', e.target.value)} placeholder="Mumbai" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Phone</label>
              <input className="input-field" value={branchForm.phone} onChange={e => setB('phone', e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Address</label>
              <input className="input-field" value={branchForm.address} onChange={e => setB('address', e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
              <input type="email" className="input-field" value={branchForm.email} onChange={e => setB('email', e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setBranchModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{branchModal?.id ? 'Update Branch' : 'Add Branch'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
