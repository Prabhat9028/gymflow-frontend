import React, { useState, useEffect } from 'react';
import { biometricApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Fingerprint, Wifi, WifiOff, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function BiometricPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]); const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(null); const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ deviceSerial:'', deviceName:'', deviceIp:'', devicePort:4370, deviceType:'ESSL_ZK' });

  const load = () => { setLoading(true); biometricApi.getDevices().then(r => setDevices(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const pullLogs = async (serial) => { setPulling(serial); try { const { data } = await biometricApi.pullAttendance(serial); toast.success(`Pulled ${data.processed||0} records`); } catch { toast.error('Pull failed'); } finally { setPulling(null); } };
  const handleAdd = async e => { e.preventDefault(); try { await biometricApi.addDevice(form); toast.success('Device added!'); setModal(null); load(); } catch (err) { toast.error(err.response?.data?.error||'Failed'); } };
  const handleDelete = async id => { if (!confirm('Remove device?')) return; try { await biometricApi.deleteDevice(id); toast.success('Removed'); load(); } catch { toast.error('Failed'); } };

  return (<div className="space-y-6 animate-in">
    <div className="flex items-center justify-between">
      <div><h1 className="font-display text-2xl font-bold">Biometric Devices</h1><p className="text-surface-500 text-sm">ESSL/ZKTeco — {user?.branchName}</p></div>
      <button className="btn-primary" onClick={()=>{setForm({deviceSerial:'',deviceName:'',deviceIp:'',devicePort:4370,deviceType:'ESSL_ZK'});setModal({});}}><Plus className="w-4 h-4"/>Add Device</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-in">
      {devices.map(d => (<div key={d.id} className="card p-6 card-hover">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center"><Fingerprint className="w-6 h-6 text-white"/></div>
          <div className="flex items-center gap-2">
            {d.isActive?<span className="badge badge-green flex items-center gap-1"><Wifi className="w-3 h-3"/>Online</span>:<span className="badge badge-red flex items-center gap-1"><WifiOff className="w-3 h-3"/>Offline</span>}
            <button onClick={()=>handleDelete(d.id)} className="btn-ghost p-1 text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
          </div>
        </div>
        <h3 className="font-display font-bold">{d.deviceName}</h3>
        <p className="text-sm text-surface-500 font-mono">{d.deviceSerial}</p>
        <div className="mt-3 space-y-1 text-sm text-surface-600"><p>IP: {d.deviceIp}:{d.devicePort}</p><p>Type: {d.deviceType}</p>
          {d.lastHeartbeat&&<p>Last Seen: {format(new Date(d.lastHeartbeat),'dd MMM, hh:mm a')}</p>}</div>
        <button onClick={()=>pullLogs(d.deviceSerial)} disabled={pulling===d.deviceSerial} className="btn-secondary w-full mt-4 !text-sm"><RefreshCw className={`w-4 h-4 ${pulling===d.deviceSerial?'animate-spin':''}`}/>{pulling===d.deviceSerial?'Pulling...':'Pull Logs'}</button>
      </div>))}
    </div>
    {loading&&<div className="text-center py-12"><div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"/></div>}
    {!loading&&!devices.length&&<div className="card p-12 text-center"><Fingerprint className="w-16 h-16 text-surface-300 mx-auto mb-4"/><p className="text-surface-400 text-lg">No devices</p><button className="btn-primary mt-4" onClick={()=>setModal({})}><Plus className="w-4 h-4"/>Add First Device</button></div>}
    <Modal open={!!modal} onClose={()=>setModal(null)} title="Add Biometric Device" maxWidth="max-w-md">
      <form onSubmit={handleAdd} className="p-6 space-y-4">
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Serial Number *</label><input className="input-field" value={form.deviceSerial} onChange={e=>setForm(p=>({...p,deviceSerial:e.target.value}))} required placeholder="e.g., ESSL001"/></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Device Name *</label><input className="input-field" value={form.deviceName} onChange={e=>setForm(p=>({...p,deviceName:e.target.value}))} required placeholder="e.g., ESSL Biometric - Andheri"/></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-surface-700 mb-1">IP Address</label><input className="input-field" value={form.deviceIp} onChange={e=>setForm(p=>({...p,deviceIp:e.target.value}))} placeholder="192.168.0.100"/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Port</label><input type="number" className="input-field" value={form.devicePort} onChange={e=>setForm(p=>({...p,devicePort:+e.target.value}))}/></div>
        </div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Type</label><select className="input-field" value={form.deviceType} onChange={e=>setForm(p=>({...p,deviceType:e.target.value}))}><option value="ESSL_ZK">ESSL / ZKTeco</option><option value="ZKTECO_K40">ZKTeco K40</option><option value="OTHER">Other</option></select></div>
        <div className="flex justify-end gap-3"><button type="button" onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Add Device</button></div>
      </form>
    </Modal>
  </div>);
}
