import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../services/api';
import { CalendarCheck, LogIn, LogOut, Search } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const [todayList, setTodayList] = useState([]);
  const [memberCode, setMemberCode] = useState('');
  const [loading, setLoading] = useState(true);

  const loadToday = async () => {
    try {
      const { data } = await attendanceApi.getToday();
      setTodayList(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadToday(); }, []);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!memberCode.trim()) return;
    try {
      await attendanceApi.checkIn({ memberCode: memberCode.trim(), verificationMethod: 'MANUAL' });
      toast.success('Checked in!');
      setMemberCode('');
      loadToday();
    } catch (err) { toast.error(err.response?.data?.error || 'Check-in failed'); }
  };

  const handleCheckOut = async (memberId) => {
    try {
      await attendanceApi.checkOut(memberId);
      toast.success('Checked out!');
      loadToday();
    } catch (err) { toast.error(err.response?.data?.error || 'Check-out failed'); }
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900">Attendance</h1>
        <p className="text-surface-500 text-sm">Today's check-ins and check-outs</p>
      </div>

      {/* Quick Check-in */}
      <div className="card p-6">
        <h3 className="font-display font-semibold mb-4">Manual Check-in</h3>
        <form onSubmit={handleCheckIn} className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input className="input-field pl-10" placeholder="Enter member code (e.g. GF000001)"
              value={memberCode} onChange={e => setMemberCode(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary"><LogIn className="w-4 h-4" /> Check In</button>
        </form>
      </div>

      {/* Today's List */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b bg-surface-50 flex items-center justify-between">
          <h3 className="font-display font-semibold">Today — {format(new Date(), 'dd MMMM yyyy')}</h3>
          <span className="badge badge-blue">{todayList.length} check-ins</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-surface-50/50">
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Member</th>
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Code</th>
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">In</th>
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Out</th>
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Method</th>
              <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {todayList.map(a => (
                <tr key={a.id} className="hover:bg-surface-50">
                  <td className="px-6 py-3 text-sm font-medium">{a.memberName}</td>
                  <td className="px-6 py-3 text-sm font-mono text-surface-600">{a.memberCode}</td>
                  <td className="px-6 py-3 text-sm">{a.checkInTime ? format(new Date(a.checkInTime), 'hh:mm a') : '—'}</td>
                  <td className="px-6 py-3 text-sm">{a.checkOutTime ? format(new Date(a.checkOutTime), 'hh:mm a') : <span className="text-brand-600 text-xs font-medium">In gym</span>}</td>
                  <td className="px-6 py-3"><span className={`badge ${a.verificationMethod === 'BIOMETRIC' ? 'badge-blue' : 'badge-gray'}`}>{a.verificationMethod}</span></td>
                  <td className="px-6 py-3">
                    {!a.checkOutTime && (
                      <button onClick={() => handleCheckOut(a.memberId)} className="btn-ghost text-red-600 hover:bg-red-50 text-xs">
                        <LogOut className="w-3 h-3" /> Check Out
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="py-12 text-center"><div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto" /></div>}
        {!loading && todayList.length === 0 && <p className="py-12 text-center text-surface-400 text-sm">No check-ins today</p>}
      </div>
    </div>
  );
}
