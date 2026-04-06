import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MaxOutLogoFull } from '../common/MaxOutLogo';
import { memberApi } from '../../services/api';
import { LayoutDashboard,Users,CalendarCheck,CreditCard,Dumbbell,Fingerprint,ClipboardList,LogOut,Menu,ChevronRight,UserCog,BarChart3,Building2,ChevronDown,Zap,Store,Search,X,Brain,Target } from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to:'/',icon:LayoutDashboard,label:'Dashboard',end:true },{ to:'/leads',icon:Target,label:'Leads' },{ to:'/members',icon:Users,label:'Members' },
  { to:'/attendance',icon:CalendarCheck,label:'Attendance' },{ to:'/biometric',icon:Fingerprint,label:'Biometric' },
  { to:'/plans',icon:ClipboardList,label:'Plans' },{ to:'/trainers',icon:Dumbbell,label:'Trainers' },
  { to:'/staff',icon:UserCog,label:'Staff' },{ to:'/payments',icon:CreditCard,label:'Payments' },{ to:'/reports',icon:BarChart3,label:'Reports' },
  { to:'/ai-churn',icon:Brain,label:'AI Churn Predictor' },
  { to:'/gyms',icon:Store,label:'Gyms & Branches',superAdminOnly:true },
];

export default function Layout() {
  const { user, logout, switchBranch, isSuperAdmin } = useAuth();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  // Global search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const searchTimer = useRef(null);

  const doSwitch = async (bid) => { try { await switchBranch(bid); setBranchOpen(false); toast.success('Branch switched!'); nav('/'); } catch { toast.error('Failed'); } };

  // Debounced global search
  useEffect(() => {
    if (!searchQ.trim() || searchQ.trim().length < 2) { setSearchResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try { const { data } = await memberApi.searchGlobal(searchQ.trim(), 0, 8); setSearchResults(data.content || []); }
      catch { setSearchResults([]); } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchQ]);

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); } };
    document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler);
  }, []);

  const Sidebar = ({ mobile=false }) => (
    <aside className={`flex flex-col h-full bg-surface-950 text-white transition-all duration-300 ${mobile?'w-72':collapsed?'w-[72px]':'w-64'}`}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-800/50">
        {collapsed && !mobile ? <div className="mx-auto animate-float"><Zap className="w-7 h-7 text-brand-500"/></div>
        : <div className="flex items-center gap-2"><Zap className="w-7 h-7 text-brand-500 animate-glow rounded-lg"/><span className="font-display font-bold text-lg">GymFlow</span></div>}
      </div>
      {user?.companyName && (!collapsed||mobile) && (
        <div className="px-3 pt-2 pb-1"><div className="px-3 py-2 rounded-lg bg-surface-900/80 border border-surface-800">
          <MaxOutLogoFull /><p className="text-[10px] text-surface-500 mt-1 ml-12">{user.branchName}</p>
        </div></div>
      )}
      {isSuperAdmin && (!collapsed||mobile) && (
        <div className="px-3 pb-1"><div className="relative">
          <button onClick={()=>setBranchOpen(!branchOpen)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-800/60 hover:bg-surface-800 text-sm transition-colors">
            <Building2 className="w-4 h-4 text-brand-500 flex-shrink-0"/><span className="flex-1 text-left truncate text-surface-300">{user?.branchName||'Select'}</span>
            <ChevronDown className={`w-4 h-4 text-surface-500 transition-transform duration-200 ${branchOpen?'rotate-180':''}`}/>
          </button>
          {branchOpen && <div className="absolute top-full left-0 right-0 mt-1 bg-surface-800 rounded-lg border border-surface-700 shadow-xl z-50 animate-scale-in">
            {(user?.branches||[]).map(b=>(<button key={b.id} onClick={()=>doSwitch(b.id)}
              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-surface-700 transition-colors ${b.id===user?.branchId?'text-brand-500 bg-surface-700/50':'text-surface-300'}`}>
              {b.name} <span className="text-xs text-surface-500 ml-1">{b.city}</span></button>))}
          </div>}
        </div></div>
      )}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {navItems.filter(n=>!n.superAdminOnly||isSuperAdmin).map(({to,icon:Icon,label,end})=>(<NavLink key={to} to={to} end={end} onClick={()=>{mobile&&setMobileOpen(false);setBranchOpen(false);}}
          className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive?'bg-brand-500 text-white shadow-lg shadow-brand-500/25':'text-surface-400 hover:text-white hover:bg-surface-800'} ${collapsed&&!mobile?'justify-center':''}`}>
          <Icon className="w-5 h-5 flex-shrink-0"/>{(!collapsed||mobile)&&<span>{label}</span>}</NavLink>))}
      </nav>
      <div className="p-3 border-t border-surface-800/50">
        <div className={`flex items-center gap-3 px-3 py-2 ${collapsed&&!mobile?'justify-center':''}`}>
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-2 ring-brand-400/30">{user?.email?.[0]?.toUpperCase()}</div>
          {(!collapsed||mobile)&&<div className="flex-1 min-w-0"><p className="text-sm font-medium text-surface-200 truncate">{user?.email}</p><p className="text-xs text-surface-500">{user?.role?.replace('_',' ')}</p></div>}
          <button onClick={()=>{logout();nav('/login');}} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-800 transition-colors"><LogOut className="w-4 h-4"/></button>
        </div>
      </div>
    </aside>);

  return (<div className="flex h-screen overflow-hidden bg-surface-50" onClick={()=>branchOpen&&setBranchOpen(false)}>
    <div className="hidden lg:flex"><Sidebar/></div>
    {mobileOpen&&<div className="lg:hidden fixed inset-0 z-50 flex"><div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setMobileOpen(false)}/><div className="relative z-50 animate-in-left"><Sidebar mobile/></div></div>}
    <div className="flex-1 flex flex-col min-w-0">
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-surface-200 gap-4">
        <div className="flex items-center gap-3">
          <button onClick={()=>setMobileOpen(true)} className="lg:hidden btn-ghost"><Menu className="w-5 h-5"/></button>
          <button onClick={()=>setCollapsed(!collapsed)} className="hidden lg:flex btn-ghost"><ChevronRight className={`w-5 h-5 transition-transform duration-200 ${collapsed?'':'rotate-180'}`}/></button>
        </div>

        {/* Global Search */}
        <div className="flex-1 max-w-lg mx-auto relative" ref={searchRef}>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${searchOpen ? 'border-brand-500 ring-2 ring-brand-500/20 bg-white shadow-lg' : 'border-surface-200 bg-surface-50 hover:bg-surface-100 cursor-pointer'}`}
            onClick={()=>!searchOpen&&setSearchOpen(true)}>
            <Search className="w-4 h-4 text-surface-400 flex-shrink-0"/>
            {searchOpen ? <input autoFocus className="flex-1 bg-transparent text-sm outline-none" placeholder="Search members by name or phone..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/> :
              <span className="text-sm text-surface-400 flex-1">Search members...</span>}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-surface-100 border text-[10px] text-surface-400 font-mono">⌘K</kbd>
            {searchOpen && searchQ && <button onClick={()=>{setSearchQ('');setSearchResults([]);}} className="p-0.5 hover:bg-surface-100 rounded"><X className="w-3.5 h-3.5 text-surface-400"/></button>}
          </div>
          {searchOpen && (searchResults.length > 0 || searching) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border shadow-xl z-50 max-h-80 overflow-y-auto animate-scale-in">
              {searching && <div className="px-4 py-3 text-sm text-surface-400 flex items-center gap-2"><div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/>Searching...</div>}
              {searchResults.map(m => (
                <button key={m.id} onClick={()=>{nav(`/members/${m.id}`);setSearchOpen(false);setSearchQ('');setSearchResults([]);}}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors text-left border-b last:border-0">
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{m.firstName?.[0]}{m.lastName?.[0]}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{m.firstName} {m.lastName}</p><p className="text-xs text-surface-400">{m.memberCode} • {m.phone||'No phone'}</p></div>
                  <span className={m.activeMembership?'badge badge-green':'badge badge-gray'}>{m.activeMembership?'Active':'Inactive'}</span>
                </button>
              ))}
              {!searching && searchQ.length >= 2 && searchResults.length === 0 && <p className="px-4 py-3 text-sm text-surface-400 text-center">No members found</p>}
            </div>
          )}
        </div>

        {user?.companyName&&<div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-50 border"><Building2 className="w-4 h-4 text-brand-500"/><span className="text-sm font-medium text-surface-700">{user.companyName}</span><span className="text-xs text-surface-400">• {user.branchName}</span></div>}
      </header>
      <main className="flex-1 overflow-y-auto p-6"><Outlet/></main>
    </div>
  </div>);
}
