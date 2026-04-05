import React, { useState, useEffect } from 'react';
import { paymentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [collectModal, setCollectModal] = useState(null);
  const [collectForm, setCollectForm] = useState({ amount: '', paymentMethod: 'CASH' });

  const load = () => {
    setLoading(true);
    paymentApi.getAll(page, 20).then(({ data }) => { setPayments(data.content); setTotalPages(data.totalPages); setTotal(data.totalElements); })
      .catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [page]);

  const handleCollect = async () => {
    if (!collectForm.amount || Number(collectForm.amount) <= 0) return toast.error('Enter amount');
    try {
      await paymentApi.collectBalance({ paymentId: collectModal.id, amount: Number(collectForm.amount), paymentMethod: collectForm.paymentMethod });
      toast.success('Balance collected!'); setCollectModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const f = n => n != null ? Number(n).toLocaleString('en-IN') : '0';
  const modeColor = {'CASH':'badge-green','UPI':'badge-blue','CARD':'badge-orange','BANK_TRANSFER':'badge-purple','CHEQUE':'badge-yellow'};

  return (<div className="space-y-6 animate-in">
    <div><h1 className="font-display text-2xl font-bold">Payments</h1><p className="text-surface-500 text-sm">{total} transactions — {user?.branchName}</p></div>
    <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-surface-50 border-b">
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Member</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Plan</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Amount</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3 hidden md:table-cell">Discount</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Paid</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Balance</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Mode</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Date</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Status</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Action</th>
    </tr></thead><tbody className="divide-y divide-surface-100">
      {payments.map(p => (<tr key={p.id} className="hover:bg-surface-50 hover-row transition-colors">
        <td className="px-6 py-3"><p className="text-sm font-medium">{p.memberName}</p><p className="text-xs text-surface-400">{p.memberPhone||''}</p></td>
        <td className="px-6 py-3 text-sm text-surface-600">{p.planName || '—'}</td>
        <td className="px-6 py-3 text-sm">₹{f(p.amount)}</td>
        <td className="px-6 py-3 text-sm text-emerald-600 hidden md:table-cell">{p.discountAmount && Number(p.discountAmount) > 0 ? `-₹${f(p.discountAmount)}` : '—'}</td>
        <td className="px-6 py-3 text-sm font-semibold text-blue-600">₹{f(p.amountPaid || p.amount)}</td>
        <td className="px-6 py-3 text-sm">{p.balanceAmount && Number(p.balanceAmount) > 0 ? <span className="font-semibold text-red-600">₹{f(p.balanceAmount)}</span> : <span className="text-emerald-600">Nil</span>}</td>
        <td className="px-6 py-3"><span className={`badge ${modeColor[p.paymentMethod] || 'badge-gray'}`}>{p.paymentMethod}</span></td>
        <td className="px-6 py-3 text-sm text-surface-600">{p.paymentDate ? format(new Date(p.paymentDate), 'dd MMM, hh:mm a') : '—'}</td>
        <td className="px-6 py-3"><span className={`badge ${p.status==='PAID'?'badge-green':p.status==='PENDING'?'badge-yellow':'badge-red'}`}>{p.status}</span></td>
        <td className="px-6 py-3">{p.balanceAmount && Number(p.balanceAmount) > 0 &&
          <button onClick={()=>{setCollectModal(p);setCollectForm({amount:p.balanceAmount,paymentMethod:'CASH'});}} className="btn-ghost text-xs text-brand-600 hover:bg-brand-50"><Banknote className="w-3.5 h-3.5"/>Collect</button>}
        </td>
      </tr>))}
    </tbody></table></div>
    {loading && <div className="py-12 text-center"><div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"/></div>}
    {!loading && !payments.length && <p className="py-12 text-center text-surface-400">No payments yet</p>}
    {totalPages>1 && (<div className="flex items-center justify-between px-6 py-3 border-t bg-surface-50">
      <p className="text-sm text-surface-500">Page {page+1} of {totalPages}</p>
      <div className="flex gap-2"><button className="btn-ghost" disabled={page===0} onClick={()=>setPage(p=>p-1)}><ChevronLeft className="w-4 h-4"/></button><button className="btn-ghost" disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}><ChevronRight className="w-4 h-4"/></button></div>
    </div>)}
    </div>

    {/* Collect Balance Modal */}
    <Modal open={!!collectModal} onClose={()=>setCollectModal(null)} title="Collect Balance Payment" maxWidth="max-w-md">
      {collectModal && (<div className="p-6 space-y-4">
        <div className="bg-surface-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-surface-500">Member</span><span className="font-semibold">{collectModal.memberName}</span></div>
          <div className="flex justify-between text-sm"><span className="text-surface-500">Plan</span><span>{collectModal.planName||'—'}</span></div>
          <div className="flex justify-between text-sm"><span className="text-surface-500">Total Amount</span><span>₹{f(collectModal.amount)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-surface-500">Already Paid</span><span className="text-blue-600">₹{f(collectModal.amountPaid)}</span></div>
          <div className="border-t pt-2 flex justify-between text-sm"><span className="text-red-600 font-medium">Outstanding Balance</span><span className="font-bold text-red-600">₹{f(collectModal.balanceAmount)}</span></div>
        </div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Amount to Collect (₹)</label>
          <input type="number" min="1" step="0.01" className="input-field" value={collectForm.amount} onChange={e=>setCollectForm(p=>({...p,amount:e.target.value}))}/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Payment Mode</label>
          <select className="input-field" value={collectForm.paymentMethod} onChange={e=>setCollectForm(p=>({...p,paymentMethod:e.target.value}))}>
            <option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank Transfer</option><option value="CHEQUE">Cheque</option>
          </select></div>
        <div className="flex justify-end gap-3"><button onClick={()=>setCollectModal(null)} className="btn-secondary">Cancel</button><button onClick={handleCollect} className="btn-primary">Collect ₹{f(collectForm.amount)}</button></div>
      </div>)}
    </Modal>
  </div>);
}
