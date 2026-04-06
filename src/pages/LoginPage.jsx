import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
export default function LoginPage() {
  const [email,setEmail]=useState('admin@maxoutgym.com');const [password,setPassword]=useState('admin123');const [loading,setLoading]=useState(false);
  const {login}=useAuth();const nav=useNavigate();
  const submit=async e=>{e.preventDefault();setLoading(true);try{await login(email,password);toast.success('Welcome!');nav('/');}catch(err){toast.error(err.response?.data?.error||'Login failed');}finally{setLoading(false);}};
  return(<div className="min-h-screen flex">
    <div className="hidden lg:flex lg:w-1/2 bg-surface-950 relative overflow-hidden items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/15 via-transparent to-brand-400/5"/>
      <div className="relative z-10 text-center px-12">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto mb-8 shadow-2xl"><Zap className="w-10 h-10 text-white"/></div>
        <h1 className="font-display text-5xl font-bold text-white mb-4 tracking-tight">GymFlow</h1>
        <p className="text-surface-400 text-lg max-w-md mx-auto">Multi-gym, multi-branch management with ESSL biometric attendance and real-time tracking.</p>
      </div>
    </div>
    <div className="flex-1 flex items-center justify-center p-8 bg-white">
      <div className="w-full max-w-md">
        <div className="lg:hidden flex items-center gap-2 mb-10"><Zap className="w-8 h-8 text-brand-500"/><span className="font-display font-bold text-2xl">GymFlow</span></div>
        <h2 className="font-display text-3xl font-bold text-surface-900 mb-2">Welcome back</h2>
        <p className="text-surface-500 mb-8">Sign in to manage your gym</p>
        <form onSubmit={submit} className="space-y-5">
          <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input-field pl-10" required/></div></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label><div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input-field pl-10" required/></div></div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">{loading?<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<>Sign In<ArrowRight className="w-4 h-4"/></>}</button>
        </form>
        <div className="mt-8 p-4 rounded-xl bg-surface-50 border">
          <p className="text-xs text-surface-500 font-medium mb-2">Demo Credentials</p>
          <p className="text-xs text-surface-600"><b>Super Admin:</b> admin@maxoutgym.com / admin123</p>
          <p className="text-xs text-surface-600"><b>Staff (Andheri):</b> rahul@maxoutgym.com / admin123</p>
        </div>
      </div>
    </div>
  </div>);
}
