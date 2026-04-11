import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ChangePasswordModal({ open }) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPw.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPw !== confirm) return toast.error('Passwords do not match');
    if (newPw === current) return toast.error('New password must be different');

    setLoading(true);
    try {
      await changePassword(current, newPw);
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-in">
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="font-display text-2xl font-bold">Change Your Password</h2>
          <p className="text-white/80 text-sm mt-2">For security, please set a new password on your first login.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input type="password" value={current} onChange={e => setCurrent(e.target.value)}
                className="input-field pl-10" placeholder="Enter current password" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                className="input-field pl-10 pr-10" placeholder="Min 6 characters" required />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                className="input-field pl-10" placeholder="Repeat new password" required />
            </div>
            {confirm && newPw !== confirm && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
            {confirm && newPw === confirm && confirm.length >= 6 && <p className="text-xs text-emerald-500 mt-1">✓ Passwords match</p>}
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full justify-center mt-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
