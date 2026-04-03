import React, { useState, useEffect } from 'react';
import { biometricApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Fingerprint, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function BiometricPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(null);

  const load = () => { setLoading(true); biometricApi.getDevices().then(r => setDevices(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const pullLogs = async (serial) => {
    setPulling(serial);
    try { const { data } = await biometricApi.pullAttendance(serial); toast.success(`Pulled ${data.processed || 0} records from ${serial}`); }
    catch (err) { toast.error(err.response?.data?.error || 'Pull failed'); }
    finally { setPulling(null); }
  };

  return (<div className="space-y-6 animate-in">
    <div><h1 className="font-display text-2xl font-bold">Biometric Devices</h1><p className="text-surface-500 text-sm">ESSL/ZKTeco devices for {user?.branchName}</p></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {devices.map(d => (<div key={d.id} className="card p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center"><Fingerprint className="w-6 h-6 text-white"/></div>
          {d.isActive ? <span className="badge badge-green flex items-center gap-1"><Wifi className="w-3 h-3"/>Online</span> : <span className="badge badge-red flex items-center gap-1"><WifiOff className="w-3 h-3"/>Offline</span>}
        </div>
        <h3 className="font-display font-bold text-surface-900">{d.deviceName}</h3>
        <p className="text-sm text-surface-500 font-mono">{d.deviceSerial}</p>
        <div className="mt-3 space-y-1 text-sm text-surface-600">
          <p>IP: {d.deviceIp}:{d.devicePort}</p>
          <p>Type: {d.deviceType}</p>
          {d.lastHeartbeat && <p>Last Seen: {format(new Date(d.lastHeartbeat), 'dd MMM, hh:mm a')}</p>}
        </div>
        <button onClick={() => pullLogs(d.deviceSerial)} disabled={pulling===d.deviceSerial}
          className="btn-secondary w-full mt-4 !text-sm"><RefreshCw className={`w-4 h-4 ${pulling===d.deviceSerial?'animate-spin':''}`}/>{pulling===d.deviceSerial?'Pulling...':'Pull Attendance Logs'}</button>
      </div>))}
    </div>
    {loading && <div className="text-center py-12"><div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"/></div>}
    {!loading && !devices.length && <div className="card p-12 text-center"><Fingerprint className="w-16 h-16 text-surface-300 mx-auto mb-4"/><p className="text-surface-400 text-lg">No ESSL/ZKTeco devices configured</p><p className="text-surface-400 text-sm mt-2">See README for device setup instructions</p></div>}
  </div>);
}
