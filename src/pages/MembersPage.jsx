import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberApi } from '../services/api';
import { Plus, Search, User, ChevronLeft, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

function MemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState(member || {
    firstName: '', lastName: '', email: '', phone: '', gender: '',
    dateOfBirth: '', address: '', emergencyContactName: '', emergencyContactPhone: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (member?.id) {
        await memberApi.update(member.id, form);
        toast.success('Member updated');
      } else {
        await memberApi.create(form);
        toast.success('Member created');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-display font-bold text-lg">{member?.id ? 'Edit Member' : 'New Member'}</h2>
          <button onClick={onClose} className="btn-ghost"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">First Name *</label>
              <input className="input-field" value={form.firstName} onChange={e => set('firstName', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Last Name *</label>
              <input className="input-field" value={form.lastName} onChange={e => set('lastName', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Phone</label>
              <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Gender</label>
              <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Date of Birth</label>
              <input type="date" className="input-field" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1">Address</label>
              <input className="input-field" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Emergency Contact</label>
              <input className="input-field" value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Emergency Phone</label>
              <input className="input-field" value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : member?.id ? 'Update' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | {} | member
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await memberApi.getAll(page, 15, search);
      setMembers(data.content);
      setTotalPages(data.totalPages);
      setTotal(data.totalElements);
    } catch (err) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900">Members</h1>
          <p className="text-surface-500 text-sm">{total} total members</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({})}>
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input className="input-field pl-10" placeholder="Search by name, code, email, phone..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50 border-b">
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-6 py-3">Member</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-6 py-3">Code</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Phone</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Plan</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-6 py-3">Bio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {members.map(m => (
                <tr key={m.id} className="hover:bg-surface-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/members/${m.id}`)}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                        {m.firstName?.[0]}{m.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-800">{m.firstName} {m.lastName}</p>
                        <p className="text-xs text-surface-400">{m.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm font-mono text-surface-600">{m.memberCode}</td>
                  <td className="px-6 py-3 text-sm text-surface-600 hidden md:table-cell">{m.phone || '—'}</td>
                  <td className="px-6 py-3 text-sm hidden lg:table-cell">
                    {m.activeSubscription?.plan?.name || <span className="text-surface-400">No plan</span>}
                  </td>
                  <td className="px-6 py-3">
                    <span className={m.activeSubscription ? 'badge badge-green' : 'badge badge-gray'}>
                      {m.activeSubscription ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={m.hasBiometric ? 'badge badge-blue' : 'badge badge-gray'}>
                      {m.hasBiometric ? 'Enrolled' : 'None'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="px-6 py-12 text-center"><div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto" /></div>}
        {!loading && members.length === 0 && <p className="px-6 py-12 text-center text-surface-400">No members found</p>}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t bg-surface-50">
            <p className="text-sm text-surface-500">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <button className="btn-ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="btn-ghost" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal !== null && <MemberModal member={modal.id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}
    </div>
  );
}
