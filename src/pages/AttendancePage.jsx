import React,{useState,useEffect} from 'react';
import {attendanceApi} from '../services/api';
import {LogIn,LogOut,Search,AlertTriangle,Calendar} from 'lucide-react';
import {format,differenceInDays,parseISO} from 'date-fns';
import toast from 'react-hot-toast';

export default function AttendancePage(){
  const [list,setList]=useState([]);const [code,setCode]=useState('');const [l,setL]=useState(true);
  const [selDate,setSelDate]=useState(format(new Date(),'yyyy-MM-dd'));
  const isToday=selDate===format(new Date(),'yyyy-MM-dd');

  const load=async()=>{setL(true);try{
    const{data}=isToday?await attendanceApi.getToday():await attendanceApi.getByDate(selDate);
    setList(data);
  }catch{}finally{setL(false);}};
  useEffect(()=>{load();let iv;if(isToday)iv=setInterval(load,10000);return()=>iv&&clearInterval(iv);},[selDate]);

  const doCheckIn=async e=>{e.preventDefault();if(!code.trim())return;try{await attendanceApi.checkIn({memberCode:code.trim(),verificationMethod:'MANUAL'});toast.success('Checked in!');setCode('');load();}catch(err){toast.error(err.response?.data?.error||'Failed');}};
  const doCheckOut=async mid=>{try{await attendanceApi.checkOut(mid);toast.success('Checked out!');load();}catch(err){toast.error(err.response?.data?.error||'Failed');}};

  const expiryBadge=(endDate)=>{
    if(!endDate)return<span className="badge badge-red">No Plan</span>;
    const days=differenceInDays(parseISO(endDate),new Date());
    if(days<0)return<span className="badge badge-red">Expired</span>;
    if(days<=7)return<span className="badge badge-yellow flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>{days}d</span>;
    return<span className="badge badge-green">{format(parseISO(endDate),'dd MMM')}</span>;
  };

  return(<div className="space-y-6 animate-in">
    <div><h1 className="font-display text-2xl font-bold">Attendance</h1><p className="text-surface-500 text-sm">{isToday?'Real-time — auto-refreshes':'Historical data'}</p></div>
    {isToday&&<div className="card p-6 animate-slide-up"><h3 className="font-display font-semibold mb-4">Manual Check-in</h3><form onSubmit={doCheckIn} className="flex gap-3"><div className="relative flex-1 max-w-md"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"/><input className="input-field pl-10" placeholder="Member code" value={code} onChange={e=>setCode(e.target.value)}/></div><button type="submit" className="btn-primary"><LogIn className="w-4 h-4"/>Check In</button></form></div>}
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b bg-surface-50 flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-display font-semibold">{isToday?'Today':'Date'} — {format(parseISO(selDate),'dd MMMM yyyy')}</h3>
        <div className="flex items-center gap-3">
          <span className="badge badge-blue">{list.length} records</span>
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-surface-400"/><input type="date" className="input-field w-auto !py-1.5 !text-sm" value={selDate} onChange={e=>setSelDate(e.target.value)}/></div>
          {!isToday&&<button onClick={()=>setSelDate(format(new Date(),'yyyy-MM-dd'))} className="btn-ghost text-xs text-brand-600">Today</button>}
        </div>
      </div>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b bg-surface-50/50">
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Member</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Phone</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">In</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Out</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Expiry</th>
        <th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Method</th>
        {isToday&&<th className="text-left text-xs font-medium text-surface-500 uppercase px-6 py-3">Action</th>}
      </tr></thead><tbody className="divide-y">{list.map(a=>(<tr key={a.id} className="hover:bg-surface-50 hover-row transition-colors">
        <td className="px-6 py-3"><p className="text-sm font-medium">{a.memberName}</p><p className="text-xs text-surface-400 font-mono">{a.memberCode}</p></td>
        <td className="px-6 py-3 text-sm text-surface-600">{a.memberPhone||'—'}</td>
        <td className="px-6 py-3 text-sm">{a.checkInTime?format(new Date(a.checkInTime),'hh:mm a'):'—'}</td>
        <td className="px-6 py-3 text-sm">{a.checkOutTime?format(new Date(a.checkOutTime),'hh:mm a'):<span className="text-brand-600 text-xs font-medium animate-pulse">In gym</span>}</td>
        <td className="px-6 py-3">{expiryBadge(a.subscriptionEndDate)}</td>
        <td className="px-6 py-3"><span className={`badge ${a.verificationMethod==='BIOMETRIC'?'badge-orange':'badge-gray'}`}>{a.verificationMethod}</span></td>
        {isToday&&<td className="px-6 py-3">{!a.checkOutTime&&<button onClick={()=>doCheckOut(a.memberId)} className="btn-ghost text-red-600 text-xs"><LogOut className="w-3 h-3"/>Out</button>}</td>}
      </tr>))}</tbody></table></div>
      {l&&<div className="py-12 text-center"><div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"/></div>}
      {!l&&!list.length&&<p className="py-12 text-center text-surface-400 text-sm">No check-ins</p>}
    </div>
  </div>);
}
