import React, { useState, useEffect, useCallback } from 'react';
import { leadApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Phone, MessageCircle, ChevronRight, UserPlus, X as XIcon, Calendar, TrendingUp, Users, Target, PhoneCall } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  NEW: { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'New' },
  CONTACTED: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', label: 'Contacted' },
  FOLLOW_UP: { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Follow Up' },
  TRIAL: { color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500', label: 'Trial' },
  NEGOTIATION: { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'Negotiation' },
  CONVERTED: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Converted' },
  LOST: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Lost' },
};
const SOURCES = ['WALKIN', 'PHONE', 'SOCIAL_MEDIA', 'REFERENCE', 'WEBSITE', 'CAMPAIGN'];
const CALL_RESPONSES = ['INTERESTED', 'NOT_INTERESTED', 'BUSY', 'NO_ANSWER', 'CALLBACK', 'WRONG_NUMBER'];
const PIE_COLORS = ['#3b82f6','#6366f1','#f59e0b','#8b5cf6','#f97316','#22c55e','#ef4444'];

export default function LeadsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('pipeline');
  const [leads, setLeads] = useState([]); const [page, setPage] = useState(0); const [totalPages, setTotalPages] = useState(0); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [statusModal, setStatusModal] = useState(null); // lead object
  const [detailModal, setDetailModal] = useState(null);
  const [activities, setActivities] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [form, setForm] = useState({ firstName:'',lastName:'',phone:'',email:'',gender:'',leadSource:'WALKIN',assignedTo:'',interestedPlan:'',notes:'',nextFollowUp:'' });
  const [statusForm, setStatusForm] = useState({ status:'',notes:'',callResponse:'',nextFollowUp:'',performedBy:user?.email||'',lostReason:'' });

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try { const { data } = await leadApi.getAll(page, 50, search); setLeads(data.content); setTotalPages(data.totalPages); setTotal(data.totalElements); } catch {} finally { setLoading(false); }
  }, [page, search]);
  const loadDashboard = async () => { try { const { data } = await leadApi.getDashboard(); setDashboard(data); } catch {} };

  useEffect(() => { loadLeads(); loadDashboard(); }, [loadLeads]);

  const handleCreate = async e => {
    e.preventDefault();
    try { await leadApi.create(form); toast.success('Lead created!'); setCreateModal(false); loadLeads(); loadDashboard(); setForm({ firstName:'',lastName:'',phone:'',email:'',gender:'',leadSource:'WALKIN',assignedTo:'',interestedPlan:'',notes:'',nextFollowUp:'' }); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleStatusUpdate = async () => {
    if (!statusForm.status) return toast.error('Select status');
    try { await leadApi.updateStatus(statusModal.id, statusForm); toast.success('Status updated!'); setStatusModal(null); loadLeads(); loadDashboard(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleConvert = async (lead) => {
    if (!confirm(`Convert ${lead.firstName} to a member?`)) return;
    try { await leadApi.convert(lead.id); toast.success('Converted to member!'); loadLeads(); loadDashboard(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openDetail = async (lead) => { setDetailModal(lead); try { const { data } = await leadApi.getActivities(lead.id); setActivities(data); } catch {} };

  const openWhatsApp = (phone, name) => {
    const num = phone.replace(/[^0-9]/g, '');
    const full = num.length === 10 ? '91' + num : num;
    const msg = `Hi ${name}! 👋 Thank you for your interest in MaxOut Gym. We'd love to help you start your fitness journey! When would be a good time to visit? 🏋️`;
    window.open(`https://wa.me/${full}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filtered = filterStatus === 'ALL' ? leads : leads.filter(l => l.status === filterStatus);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const f = n => n != null ? Number(n).toLocaleString('en-IN') : '0';

  // Pipeline columns
  const pipelineStatuses = ['NEW','CONTACTED','FOLLOW_UP','TRIAL','NEGOTIATION'];
  const getByStatus = (status) => leads.filter(l => l.status === status);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3"><Target className="w-8 h-8 text-brand-500" /><div><h1 className="font-display text-2xl font-bold">Lead Management</h1><p className="text-surface-500 text-sm">{total} leads — {user?.branchName}</p></div></div>
        <button className="btn-primary" onClick={() => setCreateModal(true)}><Plus className="w-4 h-4" />New Lead</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {[{ id:'pipeline',label:'Pipeline',icon:TrendingUp },{ id:'list',label:'All Leads',icon:Users },{ id:'analytics',label:'Analytics',icon:Target }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${tab === t.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-surface-500'}`}><t.icon className="w-4 h-4" />{t.label}</button>))}
      </div>

      {/* Pipeline View */}
      {tab === 'pipeline' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStatuses.map(status => {
            const items = getByStatus(status);
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="min-w-[280px] flex-shrink-0">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl ${cfg.color} border`}>
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} /><span className="font-medium text-sm">{cfg.label}</span>
                  <span className="ml-auto text-xs font-bold">{items.length}</span>
                </div>
                <div className="bg-surface-50 rounded-b-xl border border-t-0 p-2 space-y-2 min-h-[200px]">
                  {items.map(l => (
                    <div key={l.id} className="bg-white rounded-xl p-3 border shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => openDetail(l)}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{l.firstName} {l.lastName || ''}</p>
                        {l.status !== 'CONVERTED' && l.status !== 'LOST' && (
                          <button onClick={e => { e.stopPropagation(); setStatusModal(l); setStatusForm({ status:'',notes:'',callResponse:'',nextFollowUp:'',performedBy:user?.email||'',lostReason:'' }); }} className="p-1 hover:bg-surface-100 rounded"><ChevronRight className="w-3.5 h-3.5 text-surface-400" /></button>
                        )}
                      </div>
                      <p className="text-xs text-surface-500">{l.phone}</p>
                      {l.leadSource && <span className="text-[10px] text-surface-400">{l.leadSource}</span>}
                      {l.assignedTo && <p className="text-[10px] text-brand-600 mt-1">→ {l.assignedTo}</p>}
                      {l.nextFollowUp && <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{format(new Date(l.nextFollowUp), 'dd MMM, hh:mm a')}</p>}
                      <div className="flex gap-1.5 mt-2">
                        <button onClick={e => { e.stopPropagation(); openWhatsApp(l.phone, l.firstName); }} className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"><MessageCircle className="w-3 h-3" /></button>
                        <button onClick={e => { e.stopPropagation(); window.open(`tel:${l.phone}`); }} className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"><Phone className="w-3 h-3" /></button>
                        {l.status === 'NEGOTIATION' && <button onClick={e => { e.stopPropagation(); handleConvert(l); }} className="p-1 rounded bg-brand-50 text-brand-600 hover:bg-brand-100 text-[10px] font-medium px-2">Convert</button>}
                      </div>
                    </div>
                  ))}
                  {!items.length && <p className="text-xs text-surface-400 text-center py-8">No leads</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {tab === 'list' && (<>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" /><input className="input-field pl-10" placeholder="Search by name or phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /></div>
          <div className="flex gap-1 flex-wrap">{['ALL', ...Object.keys(STATUS_CONFIG)].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>{s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label || s}</button>))}</div>
        </div>
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-surface-50 border-b">
          <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Lead</th>
          <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Phone</th>
          <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Source</th>
          <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Assigned</th>
          <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Status</th>
          <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Follow-ups</th>
          <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Actions</th>
        </tr></thead><tbody className="divide-y">
          {filtered.map(l => (<tr key={l.id} className="hover:bg-surface-50 hover-row cursor-pointer" onClick={() => openDetail(l)}>
            <td className="px-6 py-3"><p className="text-sm font-medium">{l.firstName} {l.lastName || ''}</p><p className="text-xs text-surface-400">{l.createdAt ? format(new Date(l.createdAt), 'dd MMM yyyy') : ''}</p></td>
            <td className="px-6 py-3 text-sm">{l.phone}</td>
            <td className="px-6 py-3"><span className="badge badge-gray">{l.leadSource || '—'}</span></td>
            <td className="px-6 py-3 text-sm text-surface-600">{l.assignedTo || '—'}</td>
            <td className="px-6 py-3"><span className={`badge ${STATUS_CONFIG[l.status]?.color || 'badge-gray'} border`}>{STATUS_CONFIG[l.status]?.label || l.status}</span></td>
            <td className="px-6 py-3 text-sm">{l.followUpCount || 0}</td>
            <td className="px-6 py-3"><div className="flex gap-1" onClick={e => e.stopPropagation()}>
              <button onClick={() => openWhatsApp(l.phone, l.firstName)} className="btn-ghost p-1 text-emerald-600"><MessageCircle className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setStatusModal(l); setStatusForm({ status:'',notes:'',callResponse:'',nextFollowUp:'',performedBy:user?.email||'',lostReason:'' }); }} className="btn-ghost p-1 text-brand-600"><PhoneCall className="w-3.5 h-3.5" /></button>
              {l.status === 'NEGOTIATION' && <button onClick={() => handleConvert(l)} className="btn-ghost p-1 text-emerald-600"><UserPlus className="w-3.5 h-3.5" /></button>}
            </div></td>
          </tr>))}
        </tbody></table></div>
        {loading && <div className="py-12 text-center"><div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto" /></div>}
        {!loading && !filtered.length && <p className="py-12 text-center text-surface-400">No leads found</p>}
        </div>
      </>)}

      {/* Analytics */}
      {tab === 'analytics' && dashboard && (
        <div className="space-y-6 stagger-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[['New',dashboard.newCount,'blue'],['Contacted',dashboard.contacted,'indigo'],['Follow Up',dashboard.followUp,'amber'],['Trial',dashboard.trial,'purple'],['Negotiation',dashboard.negotiation,'orange'],['Converted',dashboard.converted,'emerald'],['Lost',dashboard.lost,'red'],['Conv. Rate',dashboard.conversionRate+'%','brand']].map(([l,v,c]) => (
              <div key={l} className="card p-3 card-hover text-center"><p className="text-xs text-surface-500">{l}</p><p className={`text-xl font-display font-bold text-${c}-600`}>{v}</p></div>))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6"><h3 className="font-display font-semibold mb-4">Lead Sources</h3>
              <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={dashboard.sourceDistribution||[]} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                {(dashboard.sourceDistribution||[]).map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
              </Pie><Tooltip /></PieChart></ResponsiveContainer>
            </div>
            <div className="card p-6"><h3 className="font-display font-semibold mb-4">Counsellor Performance</h3>
              <div className="space-y-3">{(dashboard.counsellorStats||[]).map((c,i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">{c.name?.[0]}</div>
                  <div className="flex-1"><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-surface-500">{c.totalLeads} leads • {c.converted} converted</p></div>
                  <div className="text-right"><p className={`text-lg font-bold ${c.conversionRate>=30?'text-emerald-600':c.conversionRate>=15?'text-amber-600':'text-red-600'}`}>{c.conversionRate}%</p><p className="text-[10px] text-surface-400">conversion</p></div>
                </div>))}</div>
              {(!dashboard.counsellorStats||!dashboard.counsellorStats.length)&&<p className="text-center text-surface-400 text-sm py-8">No data yet</p>}
            </div>
          </div>
          {dashboard.overdueFollowUps?.length > 0 && (
            <div className="card overflow-hidden"><div className="px-6 py-4 border-b bg-red-50"><h3 className="font-display font-semibold text-red-700">⚠️ Overdue Follow-ups ({dashboard.overdueFollowUps.length})</h3></div>
              <div className="divide-y">{dashboard.overdueFollowUps.map(l => (
                <div key={l.id} className="px-6 py-3 flex items-center justify-between hover:bg-surface-50">
                  <div><p className="text-sm font-medium">{l.firstName} {l.lastName||''}</p><p className="text-xs text-surface-400">{l.phone} • Due: {l.nextFollowUp?format(new Date(l.nextFollowUp),'dd MMM, hh:mm a'):'—'}</p></div>
                  <button onClick={() => openWhatsApp(l.phone, l.firstName)} className="btn-ghost text-xs text-emerald-600"><MessageCircle className="w-3.5 h-3.5" />Follow Up</button>
                </div>))}</div></div>
          )}
        </div>
      )}

      {/* Create Lead Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="New Lead">
        <form onSubmit={handleCreate} className="p-6 space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-surface-700 mb-1">First Name *</label><input className="input-field" value={form.firstName} onChange={e => set('firstName', e.target.value)} required /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Last Name</label><input className="input-field" value={form.lastName} onChange={e => set('lastName', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Phone *</label><input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} required /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Email</label><input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Gender</label><select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}><option value="">Select</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Source *</label><select className="input-field" value={form.leadSource} onChange={e => set('leadSource', e.target.value)}>{SOURCES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Assigned To</label><input className="input-field" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} placeholder="Counsellor name" /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Interested In</label><input className="input-field" value={form.interestedPlan} onChange={e => set('interestedPlan', e.target.value)} placeholder="Annual, Monthly, PT..." /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Next Follow-up</label><input type="datetime-local" className="input-field" value={form.nextFollowUp} onChange={e => set('nextFollowUp', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Notes</label><textarea className="input-field h-20" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        </div><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create Lead</button></div></form>
      </Modal>

      {/* Update Status Modal */}
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title={`Update: ${statusModal?.firstName || ''}`} maxWidth="max-w-md">
        {statusModal && (<div className="p-6 space-y-4">
          <p className="text-sm text-surface-500">Current: <span className={`badge ${STATUS_CONFIG[statusModal.status]?.color} border`}>{statusModal.status}</span></p>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">New Status *</label><select className="input-field" value={statusForm.status} onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}>
            <option value="">Select</option>{Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Call Response</label><select className="input-field" value={statusForm.callResponse} onChange={e => setStatusForm(p => ({ ...p, callResponse: e.target.value }))}>
            <option value="">Select</option>{CALL_RESPONSES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Notes</label><textarea className="input-field h-20" value={statusForm.notes} onChange={e => setStatusForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Next Follow-up</label><input type="datetime-local" className="input-field" value={statusForm.nextFollowUp} onChange={e => setStatusForm(p => ({ ...p, nextFollowUp: e.target.value }))} /></div>
          {statusForm.status === 'LOST' && <div><label className="block text-sm font-medium text-surface-700 mb-1">Lost Reason</label><input className="input-field" value={statusForm.lostReason} onChange={e => setStatusForm(p => ({ ...p, lostReason: e.target.value }))} placeholder="Price, location, not interested..." /></div>}
          <div className="flex justify-end gap-3"><button onClick={() => setStatusModal(null)} className="btn-secondary">Cancel</button><button onClick={handleStatusUpdate} className="btn-primary">Update</button></div>
        </div>)}
      </Modal>

      {/* Lead Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal ? `${detailModal.firstName} ${detailModal.lastName || ''}` : ''} maxWidth="max-w-2xl">
        {detailModal && (<div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[['Phone',detailModal.phone],['Email',detailModal.email],['Source',detailModal.leadSource],['Assigned',detailModal.assignedTo],['Interest',detailModal.interestedPlan],['Follow-ups',detailModal.followUpCount],['Created',detailModal.createdAt?format(new Date(detailModal.createdAt),'dd MMM yyyy'):'']].map(([l,v]) => (
              <div key={l} className="flex justify-between"><span className="text-surface-500">{l}</span><span className="font-medium">{v || '—'}</span></div>))}
          </div>
          {detailModal.notes && <div className="p-3 rounded-lg bg-surface-50 text-sm">{detailModal.notes}</div>}
          <h4 className="font-display font-semibold text-sm mt-4">Activity Timeline</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {activities.map(a => (
              <div key={a.id} className="flex gap-3 text-sm"><div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                <div><p className="text-surface-600">{a.notes || `${a.type}: ${a.oldStatus||''} → ${a.newStatus||''}`}</p>
                  <p className="text-xs text-surface-400">{a.performedBy && `by ${a.performedBy} • `}{a.createdAt ? format(new Date(a.createdAt), 'dd MMM, hh:mm a') : ''}{a.callResponse && ` • ${a.callResponse}`}</p></div></div>))}
            {!activities.length && <p className="text-surface-400 text-sm">No activities yet</p>}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => openWhatsApp(detailModal.phone, detailModal.firstName)} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700"><MessageCircle className="w-4 h-4" />WhatsApp</button>
            {detailModal.status === 'NEGOTIATION' && <button onClick={() => { handleConvert(detailModal); setDetailModal(null); }} className="btn-primary"><UserPlus className="w-4 h-4" />Convert to Member</button>}
          </div>
        </div>)}
      </Modal>
    </div>
  );
}
