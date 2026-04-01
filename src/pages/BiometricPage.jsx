import React, { useState } from 'react';
import { biometricApi, memberApi } from '../services/api';
import { Fingerprint, ScanFace, CheckCircle2, XCircle, Search, ShieldCheck, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BiometricPage() {
  const [tab, setTab] = useState('verify');

  // Enroll state
  const [enrollCode, setEnrollCode] = useState('');
  const [enrollMember, setEnrollMember] = useState(null);
  const [biometricType, setBiometricType] = useState('FINGERPRINT');
  const [enrolling, setEnrolling] = useState(false);
  const [scanPhase, setScanPhase] = useState('idle'); // idle, scanning, complete

  // Verify state
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyScanPhase, setVerifyScanPhase] = useState('idle');

  const lookupMember = async () => {
    if (!enrollCode.trim()) return;
    try {
      const { data } = await memberApi.getByCode(enrollCode.trim());
      setEnrollMember(data);
    } catch { toast.error('Member not found'); setEnrollMember(null); }
  };

  /**
   * Simulate biometric capture.
   * In production, this integrates with biometric hardware SDK:
   * - Fingerprint: SecuGen SDK, ZKTeco SDK, Suprema BioMini
   * - Face: OpenCV, AWS Rekognition, or device-native camera API
   * The SDK returns a template (Base64 string) that gets sent to the backend.
   */
  const simulateCapture = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let template = '';
    for (let i = 0; i < 256; i++) template += chars[Math.floor(Math.random() * chars.length)];
    return btoa(template);
  };

  const handleEnroll = async () => {
    if (!enrollMember) return;
    setEnrolling(true);
    setScanPhase('scanning');

    // Simulate hardware scanning delay
    await new Promise(r => setTimeout(r, 2000));

    const templateData = simulateCapture();
    setScanPhase('complete');

    try {
      await biometricApi.enroll({
        memberId: enrollMember.id,
        biometricType,
        templateData,
        deviceId: 'GYMFLOW-KIOSK-01',
      });
      toast.success(`${biometricType.toLowerCase()} enrolled successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Enrollment failed');
      setScanPhase('idle');
    } finally { setEnrolling(false); }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyScanPhase('scanning');
    setVerifyResult(null);

    await new Promise(r => setTimeout(r, 2000));

    const templateData = simulateCapture();
    setVerifyScanPhase('complete');

    try {
      const { data } = await biometricApi.verify({
        templateData,
        biometricType: 'FINGERPRINT',
        deviceId: 'GYMFLOW-KIOSK-01',
      });
      setVerifyResult(data);
      if (data.matched) {
        toast.success(`Welcome, ${data.memberName}!`);
      } else {
        toast.error('No match found');
      }
    } catch (err) {
      toast.error('Verification failed');
      setVerifyResult({ matched: false });
    } finally { setVerifying(false); }
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900">Biometric System</h1>
        <p className="text-surface-500 text-sm">Enroll members and verify attendance via biometrics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { id: 'verify', label: 'Verify & Check-in', icon: ShieldCheck },
          { id: 'enroll', label: 'Enroll Member', icon: Fingerprint },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Verify Tab */}
      {tab === 'verify' && (
        <div className="max-w-lg mx-auto">
          <div className="card p-8 text-center">
            <div className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center transition-all duration-500 ${
              verifyScanPhase === 'scanning' ? 'bg-blue-100 animate-pulse ring-4 ring-blue-300'
              : verifyResult?.matched ? 'bg-emerald-100 ring-4 ring-emerald-300'
              : verifyResult && !verifyResult.matched ? 'bg-red-100 ring-4 ring-red-300'
              : 'bg-surface-100'
            }`}>
              {verifyScanPhase === 'scanning' ? (
                <Fingerprint className="w-16 h-16 text-blue-500 animate-pulse" />
              ) : verifyResult?.matched ? (
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              ) : verifyResult && !verifyResult.matched ? (
                <XCircle className="w-16 h-16 text-red-500" />
              ) : (
                <Fingerprint className="w-16 h-16 text-surface-400" />
              )}
            </div>

            {verifyResult?.matched ? (
              <div className="space-y-2 mb-6">
                <h3 className="font-display text-xl font-bold text-emerald-700">Welcome!</h3>
                <p className="text-lg font-semibold">{verifyResult.memberName}</p>
                <p className="text-sm text-surface-500 font-mono">{verifyResult.memberCode}</p>
                <div className="flex justify-center gap-2">
                  <span className={`badge ${verifyResult.membershipStatus === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                    {verifyResult.membershipStatus}
                  </span>
                  <span className="badge badge-blue">Score: {Number(verifyResult.matchScore).toFixed(1)}%</span>
                </div>
              </div>
            ) : verifyResult && !verifyResult.matched ? (
              <div className="space-y-2 mb-6">
                <h3 className="font-display text-xl font-bold text-red-700">Not Recognized</h3>
                <p className="text-sm text-surface-500">Biometric not found. Please register at the front desk.</p>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                <h3 className="font-display text-xl font-bold text-surface-700">Place Finger on Scanner</h3>
                <p className="text-sm text-surface-500">Or position face in front of camera for verification</p>
              </div>
            )}

            <button onClick={handleVerify} disabled={verifying}
              className="btn-primary py-3 px-8 text-base w-full max-w-xs mx-auto">
              {verifying ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scanning...</>
              ) : (
                <><Fingerprint className="w-5 h-5" /> Scan & Verify</>
              )}
            </button>

            {verifyResult && (
              <button onClick={() => { setVerifyResult(null); setVerifyScanPhase('idle'); }}
                className="btn-ghost mt-3 mx-auto">Reset</button>
            )}
          </div>

          <div className="card p-4 mt-4">
            <p className="text-xs text-surface-400 text-center">
              <strong>Hardware Integration:</strong> Connect SecuGen, ZKTeco, or Suprema fingerprint scanners.
              Face recognition via USB camera with OpenCV. This demo uses simulated biometric templates.
            </p>
          </div>
        </div>
      )}

      {/* Enroll Tab */}
      {tab === 'enroll' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Lookup */}
          <div className="card p-6">
            <h3 className="font-display font-semibold mb-4">Step 1: Find Member</h3>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input className="input-field pl-10" placeholder="Enter member code"
                  value={enrollCode} onChange={e => setEnrollCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && lookupMember()} />
              </div>
              <button onClick={lookupMember} className="btn-secondary">Lookup</button>
            </div>

            {enrollMember && (
              <div className="mt-4 p-4 rounded-xl bg-brand-50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center text-sm font-bold">
                  {enrollMember.firstName[0]}{enrollMember.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold">{enrollMember.firstName} {enrollMember.lastName}</p>
                  <p className="text-sm text-surface-500">{enrollMember.memberCode} • {enrollMember.email}</p>
                </div>
                <UserCheck className="w-5 h-5 text-brand-600 ml-auto" />
              </div>
            )}
          </div>

          {/* Enroll */}
          {enrollMember && (
            <div className="card p-6">
              <h3 className="font-display font-semibold mb-4">Step 2: Capture Biometric</h3>
              <div className="flex gap-4 mb-6">
                {[
                  { type: 'FINGERPRINT', icon: Fingerprint, label: 'Fingerprint' },
                  { type: 'FACE', icon: ScanFace, label: 'Face Recognition' },
                ].map(({ type, icon: Icon, label }) => (
                  <button key={type} onClick={() => setBiometricType(type)}
                    className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                      biometricType === type
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-surface-200 hover:border-surface-300'
                    }`}>
                    <Icon className="w-8 h-8" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>

              <div className="text-center">
                <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center transition-all ${
                  scanPhase === 'scanning' ? 'bg-blue-100 animate-pulse' : scanPhase === 'complete' ? 'bg-emerald-100' : 'bg-surface-100'
                }`}>
                  {scanPhase === 'complete' ? <CheckCircle2 className="w-10 h-10 text-emerald-500" /> :
                   biometricType === 'FINGERPRINT' ? <Fingerprint className="w-10 h-10 text-surface-400" /> :
                   <ScanFace className="w-10 h-10 text-surface-400" />}
                </div>
                <button onClick={handleEnroll} disabled={enrolling} className="btn-primary py-3 px-8">
                  {enrolling ? 'Capturing...' : scanPhase === 'complete' ? 'Re-enroll' : 'Start Capture'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
