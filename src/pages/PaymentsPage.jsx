import React, { useState, useEffect } from 'react';
import { paymentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    paymentApi.getAll(page, 20).then(({ data }) => { setPayments(data.content); setTotalPages(data.totalPages); setTotal(data.totalElements); })
      .catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, [page]);

  const f = n => n != null ? Number(n).toLocaleString('en-IN') : '0';

  return (<div className="space-y-6 animate-in">
    <div><h1 className="font-display text-2xl font-bold">Payments</h1><p className="text-surface-500 text-sm">{total} transactions — {user?.branchName}</p></div>
    <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-surface-50 border-b">
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Member</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Plan</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Amount</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3 hidden md:table-cell">Discount</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Paid</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Balance</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3 hidden lg:table-cell">Balance Due</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Mode</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Date</th>
      <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Status</th>
    </tr></thead><tbody className="divide-y divide-surface-100">
      {payments.map(p => (<tr key={p.id} className="hover:bg-surface-50">
        <td className="px-6 py-3 text-sm font-medium">{p.memberName}</td>
        <td className="px-6 py-3 text-sm text-surface-600">{p.planName || '—'}</td>
        <td className="px-6 py-3 text-sm">₹{f(p.amount)}</td>
        <td className="px-6 py-3 text-sm text-emerald-600 hidden md:table-cell">{p.discountAmount && Number(p.discountAmount) > 0 ? `-₹${f(p.discountAmount)}` : '—'}</td>
        <td className="px-6 py-3 text-sm font-semibold text-blue-600">₹{f(p.amountPaid || p.amount)}</td>
        <td className="px-6 py-3 text-sm">{p.balanceAmount && Number(p.balanceAmount) > 0 ? <span className="font-semibold text-red-600">₹{f(p.balanceAmount)}</span> : <span className="text-emerald-600">Nil</span>}</td>
        <td className="px-6 py-3 text-sm text-surface-600 hidden lg:table-cell">{p.balanceDueDate || '—'}</td>
        <td className="px-6 py-3"><span className={`badge ${{'CASH':'badge-green','UPI':'badge-blue','CARD':'badge-orange','BANK_TRANSFER':'badge-gray','CHEQUE':'badge-yellow'}[p.paymentMethod] || 'badge-gray'}`}>{p.paymentMethod}</span></td>
        <td className="px-6 py-3 text-sm text-surface-600">{p.paymentDate ? format(new Date(p.paymentDate), 'dd MMM, hh:mm a') : '—'}</td>
        <td className="px-6 py-3"><span className={`badge ${p.status==='PAID'?'badge-green':p.status==='PENDING'?'badge-yellow':'badge-red'}`}>{p.status}</span></td>
      </tr>))}
    </tbody></table></div>
    {loading && <div className="py-12 text-center"><div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"/></div>}
    {!loading && !payments.length && <p className="py-12 text-center text-surface-400">No payments yet</p>}
    {totalPages>1 && (<div className="flex items-center justify-between px-6 py-3 border-t bg-surface-50">
      <p className="text-sm text-surface-500">Page {page+1} of {totalPages}</p>
      <div className="flex gap-2"><button className="btn-ghost" disabled={page===0} onClick={()=>setPage(p=>p-1)}><ChevronLeft className="w-4 h-4"/></button><button className="btn-ghost" disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}><ChevronRight className="w-4 h-4"/></button></div>
    </div>)}
    </div>
  </div>);
}
