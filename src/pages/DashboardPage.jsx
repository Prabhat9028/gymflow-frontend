import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Users,CalendarCheck,CreditCard,AlertTriangle,Dumbbell,TrendingUp } from 'lucide-react';
import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,AreaChart,Area } from 'recharts';
import { format } from 'date-fns';

function Stat({icon:Icon,label,value,color='brand',delay=0}){
  const c={brand:'from-brand-500 to-brand-600',blue:'from-blue-500 to-blue-600',amber:'from-amber-500 to-amber-600',red:'from-red-500 to-red-600',purple:'from-purple-500 to-purple-600',teal:'from-teal-500 to-teal-600'};
  return(<div className="card p-5 card-hover" style={{animationDelay:`${delay}ms`}}><div className="flex items-start justify-between"><div><p className="text-sm text-surface-500 mb-1">{label}</p><p className="text-2xl font-display font-bold text-surface-900">{value}</p></div><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c[color]} flex items-center justify-center shadow-lg`}><Icon className="w-5 h-5 text-white"/></div></div></div>);
}
export default function DashboardPage(){
  const [s,setS]=useState(null);const [l,setL]=useState(true);const nav=useNavigate();
  useEffect(()=>{dashboardApi.getStats().then(r=>setS(r.data)).catch(console.error).finally(()=>setL(false));},[]);
  if(l)return<div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"/></div>;
  if(!s)return<p className="text-surface-500">Failed to load</p>;
  const f=n=>n!=null?Number(n).toLocaleString('en-IN'):'0';
  return(<div className="space-y-6 animate-in">
    <div><h1 className="font-display text-2xl font-bold">Dashboard</h1><p className="text-surface-500 text-sm">Overview of your gym operations</p></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 stagger-in">
      <Stat icon={Users} label="Members" value={f(s.totalMembers)} color="brand" delay={0}/>
      <Stat icon={CalendarCheck} label="Today Check-ins" value={f(s.todayCheckIns)} color="blue" delay={50}/>
      <Stat icon={CreditCard} label="Monthly Revenue" value={`₹${f(s.monthlyRevenue)}`} color="purple" delay={100}/>
      <Stat icon={TrendingUp} label="Today Revenue" value={`₹${f(s.todayRevenue)}`} color="teal" delay={150}/>
      <Stat icon={AlertTriangle} label="Expiring (7d)" value={f(s.expiringThisWeek)} color="amber" delay={200}/>
      <Stat icon={Dumbbell} label="Trainers" value={f(s.activeTrainers)} color="red" delay={250}/>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-6 animate-slide-up" style={{animationDelay:'0.1s'}}><h3 className="font-display font-semibold mb-4">Weekly Attendance</h3>
        <ResponsiveContainer width="100%" height={260}><BarChart data={s.weeklyAttendance||[]}><XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} tick={{fill:'#94a3b8'}}/><YAxis axisLine={false} tickLine={false} fontSize={12}/><Tooltip contentStyle={{borderRadius:12,border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}/><Bar dataKey="value" fill="#E8760A" radius={[6,6,0,0]} name="Check-ins"/></BarChart></ResponsiveContainer>
      </div>
      <div className="card p-6 animate-slide-up" style={{animationDelay:'0.2s'}}><h3 className="font-display font-semibold mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={260}><AreaChart data={s.monthlyRevenueChart||[]}><defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E8760A" stopOpacity={0.15}/><stop offset="95%" stopColor="#E8760A" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12}/><YAxis axisLine={false} tickLine={false} fontSize={12}/><Tooltip contentStyle={{borderRadius:12,border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}/><Area type="monotone" dataKey="value" stroke="#E8760A" strokeWidth={2} fill="url(#rg)" name="Revenue (₹)"/></AreaChart></ResponsiveContainer>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card animate-slide-up" style={{animationDelay:'0.3s'}}><div className="px-6 py-4 border-b"><h3 className="font-display font-semibold">Recent Members</h3></div><div className="divide-y">
        {(s.recentMembers||[]).slice(0,5).map(m=>(<div key={m.id} onClick={()=>nav(`/members/${m.id}`)} className="px-6 py-3 flex items-center justify-between hover:bg-surface-50 cursor-pointer transition-colors"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">{m.firstName?.[0]}{m.lastName?.[0]}</div><div><p className="text-sm font-medium">{m.firstName} {m.lastName}</p><p className="text-xs text-surface-400">{m.memberCode} {m.phone&&`• ${m.phone}`}</p></div></div><span className={m.activeSubscription?'badge badge-green':'badge badge-gray'}>{m.activeSubscription?'Active':'No Plan'}</span></div>))}
        {(!s.recentMembers||!s.recentMembers.length)&&<p className="px-6 py-8 text-center text-surface-400 text-sm">No members yet</p>}
      </div></div>
      <div className="card animate-slide-up" style={{animationDelay:'0.4s'}}><div className="px-6 py-4 border-b"><h3 className="font-display font-semibold">Recent Check-ins</h3></div><div className="divide-y">
        {(s.recentCheckIns||[]).slice(0,5).map(a=>(<div key={a.id} className="px-6 py-3 flex items-center justify-between hover:bg-surface-50 transition-colors"><div><p className="text-sm font-medium">{a.memberName}</p><p className="text-xs text-surface-400">{a.memberCode} {a.memberPhone&&`• ${a.memberPhone}`}</p></div><div className="text-right"><p className="text-xs text-surface-500">{a.checkInTime?format(new Date(a.checkInTime),'hh:mm a'):'—'}</p><span className={`badge ${a.verificationMethod==='BIOMETRIC'?'badge-orange':'badge-gray'}`}>{a.verificationMethod}</span></div></div>))}
        {(!s.recentCheckIns||!s.recentCheckIns.length)&&<p className="px-6 py-8 text-center text-surface-400 text-sm">No check-ins today</p>}
      </div></div>
    </div>
  </div>);
}
