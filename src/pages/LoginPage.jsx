import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const GFLogo = ({size=80}) => (<svg width={size} height={size} viewBox="0 0 120 120" fill="none"><rect x="4" y="4" width="112" height="112" rx="28" fill="url(#gfl2)"/><path d="M72 28L48 62h18L54 92l30-38H64L72 28z" fill="#fff"/><defs><linearGradient id="gfl2" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse"><stop stopColor="#FF8C42"/><stop offset="1" stopColor="#E8650A"/></linearGradient></defs></svg>);

export default function LoginPage() {
  const [email,setEmail]=useState('admin@maxoutgym.com');
  const [password,setPassword]=useState('admin123');
  const [loading,setLoading]=useState(false);
  const [showPw,setShowPw]=useState(false);
  const [mounted,setMounted]=useState(false);
  const {login}=useAuth();const nav=useNavigate();

  useEffect(()=>{setTimeout(()=>setMounted(true),100);},[]);

  const submit=async e=>{
    e.preventDefault();setLoading(true);
    try{const data=await login(email,password);toast.success('Welcome!');nav('/');}
    catch(err){toast.error(err.response?.data?.error||'Login failed');}
    finally{setLoading(false);}
  };

  return(<div className="min-h-screen flex">
    {/* LEFT — Brand Panel */}
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center" style={{background:'linear-gradient(135deg,#0a0a0f 0%,#1a1020 50%,#0f0f1a 100%)'}}>
      {/* Animated grid */}
      <div className="absolute inset-0" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',backgroundSize:'50px 50px'}}/>
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 animate-pulse" style={{background:'radial-gradient(circle,rgba(232,118,10,0.4),transparent 70%)',filter:'blur(40px)'}}/>
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full opacity-15 animate-pulse" style={{background:'radial-gradient(circle,rgba(96,165,250,0.4),transparent 70%)',filter:'blur(40px)',animationDelay:'1s'}}/>

      <div className="relative z-10 text-center px-12">
        {/* Logo with bounce-in */}
        <div className={`transition-all duration-1000 ${mounted?'opacity-100 scale-100 translate-y-0':'opacity-0 scale-50 translate-y-8'}`} style={{transitionTimingFunction:'cubic-bezier(0.34,1.56,0.64,1)'}}>
          <div className="mx-auto mb-10 relative">
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-3xl bg-brand-500 blur-xl opacity-40 animate-pulse"/>
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <GFLogo size={96}/>
            </div>
          </div>
        </div>

        {/* Title with letter stagger */}
        <h1 className={`font-display text-5xl font-bold text-white mb-4 tracking-tight transition-all duration-700 delay-300 ${mounted?'opacity-100 translate-y-0':'opacity-0 translate-y-6'}`}>
          {'GymFlow'.split('').map((char,i)=>(
            <span key={i} className="inline-block transition-all duration-500" style={{transitionDelay:`${400+i*60}ms`,opacity:mounted?1:0,transform:mounted?'translateY(0) rotate(0)':'translateY(20px) rotate(-10deg)'}}>
              {char}
            </span>
          ))}
        </h1>

        <p className={`text-surface-400 text-lg max-w-md mx-auto transition-all duration-700 delay-700 ${mounted?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}>
          Multi-gym, multi-branch management with ESSL biometric attendance and real-time tracking.
        </p>

        {/* Floating feature pills */}
        <div className={`flex flex-wrap justify-center gap-2 mt-8 transition-all duration-700 delay-1000 ${mounted?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}>
          {['AI Churn Predictor','ESSL Biometric','Lead CRM','Multi-Branch'].map((f,i)=>(
            <span key={f} className="px-3 py-1.5 rounded-full text-xs font-medium border border-surface-700 text-surface-400 bg-surface-900/50" style={{animationDelay:`${1200+i*150}ms`}}>
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>

    {/* RIGHT — Login Form */}
    <div className="flex-1 flex items-center justify-center p-8 bg-white">
      <div className={`w-full max-w-md transition-all duration-700 delay-200 ${mounted?'opacity-100 translate-x-0':'opacity-0 translate-x-8'}`}>
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <GFLogo size={36}/><span className="font-display font-bold text-2xl">GymFlow</span>
        </div>

        <h2 className="font-display text-3xl font-bold text-surface-900 mb-2">Welcome back</h2>
        <p className="text-surface-500 mb-8">Sign in to manage your gym</p>

        <form onSubmit={submit} className="space-y-5">
          <div className={`transition-all duration-500 delay-400 ${mounted?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"/>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input-field pl-10" required/>
            </div>
          </div>
          <div className={`transition-all duration-500 delay-500 ${mounted?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"/>
              <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} className="input-field pl-10 pr-10" required/>
              <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                {showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className={`btn-primary w-full justify-center transition-all duration-500 delay-600 ${mounted?'opacity-100 translate-y-0':'opacity-0 translate-y-4'} ${loading?'opacity-70':''}`}>
            {loading?<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<>Sign In <ArrowRight className="w-4 h-4"/></>}
          </button>
        </form>

        <div className={`mt-6 p-4 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-600 transition-all duration-500 delay-700 ${mounted?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}>
          <p className="font-semibold text-surface-700 mb-1">Demo Credentials</p>
          <p><b>Super Admin:</b> admin@maxoutgym.com / admin123</p>
          <p><b>Staff (Andheri):</b> rahul@maxoutgym.com / admin123</p>
        </div>
      </div>
    </div>
  </div>);
}
