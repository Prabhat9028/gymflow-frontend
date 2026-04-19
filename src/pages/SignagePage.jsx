import React, { useState, useEffect, useCallback } from 'react';
import { signageApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Monitor, Upload, Play, Plus, Trash2, List, Film, Tv, Wifi, WifiOff, Copy, Clock, ChevronDown, ChevronUp, X, Image, Video, Eye } from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const STATUS_BADGE = { PENDING:'badge-yellow',PAIRED:'badge-blue',ONLINE:'badge-green',OFFLINE:'badge-gray',ERROR:'badge-red' };

export default function SignagePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('screens');
  const [devices, setDevices] = useState([]); const [content, setContent] = useState([]); const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deviceModal, setDeviceModal] = useState(null);
  const [contentModal, setContentModal] = useState(false);
  const [playlistModal, setPlaylistModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [previewModal, setPreviewModal] = useState(null); // {url, type, name}

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [d, c, p] = await Promise.all([signageApi.getDevices(), signageApi.getContent(), signageApi.getPlaylists()]);
      setDevices(d.data); setContent(c.data); setPlaylists(p.data);
    } catch(e) { console.error('Load failed:', e); } finally { setLoading(false); }
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  // Resolve media URL - works for both local (/api/...) and S3 (https://...)
  const resolveUrl = (fileUrl) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    // For local files, proxy through current host
    return fileUrl;
  };

  // Device form
  const [devForm, setDevForm] = useState({ deviceName: '', locationLabel: '' });
  const handleCreateDevice = async e => {
    e.preventDefault();
    try { await signageApi.createDevice(devForm); toast.success('Screen registered!'); setDeviceModal(null); loadAll(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  // Content upload
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('VIDEO');
  const [uploadDuration, setUploadDuration] = useState('');
  const [uploading, setUploading] = useState(false);
  const handleUpload = async e => {
    e.preventDefault();
    if (!uploadFile) return toast.error('Select a file');
    setUploading(true);
    try {
      await signageApi.uploadContent(uploadFile, uploadName || uploadFile.name, uploadType, uploadDuration || null);
      toast.success('Content uploaded!'); setContentModal(false); setUploadFile(null); loadAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); }
  };

  // Playlist form
  const [plForm, setPlForm] = useState({ name: '', description: '', mode: 'SEQUENTIAL', loopPlaylist: true, items: [] });
  const openNewPlaylist = () => { setPlForm({ name: '', description: '', mode: 'SEQUENTIAL', loopPlaylist: true, items: [] }); setPlaylistModal({}); };
  const openEditPlaylist = p => {
    setPlForm({ name: p.name, description: p.description || '', mode: p.mode, loopPlaylist: p.loopPlaylist,
      items: (p.items || []).map(i => ({ contentId: i.contentId, displayDuration: i.displayDuration, transitionType: i.transitionType, _name: i.contentName, _type: i.contentType }))
    }); setPlaylistModal(p);
  };
  const addItemToPlaylist = c => setPlForm(p => ({ ...p, items: [...p.items, { contentId: c.id, displayDuration: c.durationSeconds || 10, transitionType: 'fade', _name: c.name, _type: c.contentType }] }));
  const removeItem = idx => setPlForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  const moveItem = (idx, dir) => setPlForm(p => { const a = [...p.items]; const n = idx + dir; if (n < 0 || n >= a.length) return p; [a[idx], a[n]] = [a[n], a[idx]]; return { ...p, items: a }; });
  const handleSavePlaylist = async () => {
    if (!plForm.name) return toast.error('Name required');
    try {
      const payload = { ...plForm, items: plForm.items.map(i => ({ contentId: i.contentId, displayDuration: i.displayDuration, transitionType: i.transitionType })) };
      if (playlistModal?.id) await signageApi.updatePlaylist(playlistModal.id, payload);
      else await signageApi.createPlaylist(payload);
      toast.success('Playlist saved!'); setPlaylistModal(null); loadAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };
  const handleAssign = async playlistId => {
    try { await signageApi.assignPlaylist(assignModal.id, playlistId); toast.success('Playlist assigned!'); setAssignModal(null); loadAll(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };
  const handleDeleteContent = async c => { if (!confirm(`Delete "${c.name}"?`)) return; try { await signageApi.deleteContent(c.id); toast.success('Deleted'); loadAll(); } catch { toast.error('Failed'); } };
  const handleDeletePlaylist = async (e, p) => { e.stopPropagation(); if (!confirm(`Delete "${p.name}"?`)) return; try { await signageApi.deletePlaylist(p.id); toast.success('Deleted'); loadAll(); } catch { toast.error('Failed'); } };

  const copyCode = code => { navigator.clipboard.writeText(code).then(() => toast.success('Code copied!')); };
  const fSize = bytes => bytes ? (bytes > 1024*1024 ? (bytes/(1024*1024)).toFixed(1)+' MB' : (bytes/1024).toFixed(0)+' KB') : '—';

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"><Tv className="w-5 h-5 text-white" /></div>
          <div><h1 className="font-display text-2xl font-bold">Digital Signage</h1><p className="text-surface-500 text-sm">Manage screens, content & playlists — {user?.branchName}</p></div>
        </div>
      </div>

      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit">
        {[{id:'screens',label:'Screens',icon:Monitor,count:devices.length},{id:'content',label:'Content',icon:Film,count:content.length},{id:'playlists',label:'Playlists',icon:List,count:playlists.length}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===t.id?'bg-white shadow text-brand-600':'text-surface-500'}`}><t.icon className="w-4 h-4"/>{t.label}<span className="badge badge-gray">{t.count}</span></button>))}
      </div>

      {loading && <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"/></div>}

      {/* ===== SCREENS ===== */}
      {!loading && tab === 'screens' && (<>
        <div className="flex justify-end"><button className="btn-primary" onClick={()=>{setDevForm({deviceName:'',locationLabel:''});setDeviceModal({});}}><Plus className="w-4 h-4"/>Add Screen</button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-in">
          {devices.map(d=>(<div key={d.id} className="card p-6 card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center"><Monitor className="w-6 h-6 text-white"/></div>
              <span className={`badge ${STATUS_BADGE[d.status]||'badge-gray'}`}>{d.status==='ONLINE'?<><Wifi className="w-3 h-3"/>Online</>:d.status}</span>
            </div>
            <h3 className="font-display font-bold text-lg">{d.deviceName||'Unnamed'}</h3>
            {d.locationLabel&&<p className="text-sm text-surface-500">{d.locationLabel}</p>}
            <div className="mt-3 space-y-1.5 text-sm text-surface-600">
              {d.status==='PENDING'&&<div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200"><span className="font-mono text-2xl font-bold text-amber-700 tracking-widest">{d.deviceCode}</span><button onClick={()=>copyCode(d.deviceCode)} className="btn-ghost p-1"><Copy className="w-4 h-4 text-amber-600"/></button></div>}
              {d.deviceModel&&<p>Model: {d.deviceModel}</p>}
              {d.playlistName?<p>Playlist: <span className="font-semibold text-brand-600">{d.playlistName}</span></p>:<p className="text-amber-600 text-xs">No playlist assigned</p>}
              {d.lastHeartbeat&&<p className="text-xs text-surface-400">Seen: {formatDistanceToNow(parseISO(d.lastHeartbeat),{addSuffix:true})}</p>}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={()=>setAssignModal(d)} className="btn-secondary flex-1 !text-xs"><Play className="w-3 h-3"/>Assign Playlist</button>
              <button onClick={async()=>{if(confirm('Remove?')){await signageApi.deleteDevice(d.id);loadAll();}}} className="btn-ghost text-red-500 !text-xs"><Trash2 className="w-3 h-3"/></button>
            </div>
          </div>))}
        </div>
        {!devices.length&&<div className="card p-12 text-center"><Monitor className="w-16 h-16 text-surface-300 mx-auto mb-4"/><p className="text-surface-400">No screens</p><button className="btn-primary mt-4" onClick={()=>{setDevForm({deviceName:'',locationLabel:''});setDeviceModal({});}}><Plus className="w-4 h-4"/>Add Screen</button></div>}
      </>)}

      {/* ===== CONTENT ===== */}
      {!loading && tab === 'content' && (<>
        <div className="flex justify-end"><button className="btn-primary" onClick={()=>{setUploadFile(null);setUploadName('');setUploadType('VIDEO');setUploadDuration('');setContentModal(true);}}><Upload className="w-4 h-4"/>Upload Content</button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-in">
          {content.map(c => {
            const url = resolveUrl(c.fileUrl);
            return (<div key={c.id} className="card overflow-hidden card-hover group">
              <div className="aspect-video bg-black flex items-center justify-center relative overflow-hidden cursor-pointer"
                onClick={()=>setPreviewModal({url,type:c.contentType,name:c.name})}>
                {c.contentType === 'VIDEO' ? (
                  <video src={url} className="w-full h-full object-cover" muted preload="metadata" playsInline
                    onMouseEnter={e=>{try{e.target.currentTime=1;e.target.play();}catch{}}} onMouseLeave={e=>{try{e.target.pause();}catch{}}} />
                ) : (
                  <img src={url} alt={c.name} className="w-full h-full object-cover" onError={e=>{e.target.style.display='none';}} />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3"><Eye className="w-6 h-6 text-white"/></div>
                </div>
                {c.durationSeconds&&<span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3"/>{c.durationSeconds}s</span>}
                <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${c.contentType==='VIDEO'?'bg-purple-500 text-white':'bg-blue-500 text-white'}`}>{c.contentType==='VIDEO'?<><Video className="w-3 h-3 inline mr-1"/>VIDEO</>:<><Image className="w-3 h-3 inline mr-1"/>IMAGE</>}</span>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{c.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-surface-400">{fSize(c.fileSize)}</span>
                  <div className="flex gap-1">
                    <button onClick={()=>setPreviewModal({url,type:c.contentType,name:c.name})} className="p-1 rounded hover:bg-surface-100 text-surface-400"><Eye className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>handleDeleteContent(c)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              </div>
            </div>);
          })}
        </div>
        {!content.length&&<div className="card p-12 text-center"><Film className="w-16 h-16 text-surface-300 mx-auto mb-4"/><p className="text-surface-400">No content uploaded</p></div>}
      </>)}

      {/* ===== PLAYLISTS ===== */}
      {!loading && tab === 'playlists' && (<>
        <div className="flex justify-end"><button className="btn-primary" onClick={openNewPlaylist}><Plus className="w-4 h-4"/>Create Playlist</button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-in">
          {playlists.map(p=>(<div key={p.id} className="card p-6 card-hover">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 cursor-pointer" onClick={()=>openEditPlaylist(p)}><List className="w-5 h-5 text-brand-500"/><h3 className="font-display font-bold">{p.name}</h3></div>
              <div className="flex items-center gap-2"><span className="badge badge-blue">{(p.items||[]).length} items</span>
                <button onClick={e=>handleDeletePlaylist(e,p)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5"/></button></div>
            </div>
            {p.description&&<p className="text-sm text-surface-500 mb-2">{p.description}</p>}
            <div className="flex items-center gap-3 text-xs text-surface-400"><span>{p.mode}</span>{p.loopPlaylist&&<span>🔁 Loop</span>}<span className="ml-auto"><Monitor className="w-3 h-3 inline"/> {p.deviceCount} screens</span></div>
            <button onClick={()=>openEditPlaylist(p)} className="btn-secondary w-full mt-3 !text-xs">Edit Playlist</button>
          </div>))}
        </div>
        {!playlists.length&&<div className="card p-12 text-center"><List className="w-16 h-16 text-surface-300 mx-auto mb-4"/><p className="text-surface-400">No playlists</p></div>}
      </>)}

      {/* ===== PREVIEW MODAL (Video/Image Player) ===== */}
      {previewModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={()=>setPreviewModal(null)}>
          <button className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"><X className="w-6 h-6"/></button>
          <p className="absolute top-4 left-4 text-white/70 text-sm">{previewModal.name}</p>
          <div className="max-w-[90vw] max-h-[90vh]" onClick={e=>e.stopPropagation()}>
            {previewModal.type === 'VIDEO' ? (
              <video src={previewModal.url} controls autoPlay className="max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl" />
            ) : (
              <img src={previewModal.url} alt={previewModal.name} className="max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl object-contain" />
            )}
          </div>
        </div>
      )}

      {/* ===== ADD SCREEN MODAL ===== */}
      <Modal open={!!deviceModal} onClose={()=>setDeviceModal(null)} title="Add Screen" maxWidth="max-w-md">
        <form onSubmit={handleCreateDevice} className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-sm text-indigo-800">
            <p className="font-semibold mb-1">📱 Pairing Flow</p>
            <p>1. Create screen → get 6-char code<br/>2. Open GymFlow TV app on Android TV<br/>3. Enter code → auto pairs</p>
          </div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Screen Name *</label><input className="input-field" value={devForm.deviceName} onChange={e=>setDevForm(p=>({...p,deviceName:e.target.value}))} required placeholder="e.g., Reception TV"/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Location</label><input className="input-field" value={devForm.locationLabel} onChange={e=>setDevForm(p=>({...p,locationLabel:e.target.value}))} placeholder="e.g., Cardio Zone"/></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={()=>setDeviceModal(null)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create & Get Code</button></div>
        </form>
      </Modal>

      {/* ===== UPLOAD MODAL ===== */}
      <Modal open={contentModal} onClose={()=>setContentModal(false)} title="Upload Content" maxWidth="max-w-md">
        <form onSubmit={handleUpload} className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Name</label><input className="input-field" value={uploadName} onChange={e=>setUploadName(e.target.value)} placeholder="e.g., Promo Video March"/></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Type</label>
            <select className="input-field" value={uploadType} onChange={e=>setUploadType(e.target.value)}><option value="VIDEO">Video</option><option value="IMAGE">Image</option></select></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">File *</label>
            <label className="block p-8 border-2 border-dashed border-surface-300 rounded-xl text-center cursor-pointer hover:border-brand-500 transition-colors">
              {uploadFile ? <><p className="text-sm font-medium text-brand-600">{uploadFile.name}</p><p className="text-xs text-surface-400 mt-1">{fSize(uploadFile.size)}</p></>
                : <><Upload className="w-10 h-10 text-surface-300 mx-auto mb-2"/><p className="text-sm text-surface-400">Click to select file</p><p className="text-xs text-surface-300 mt-1">MP4, WebM, JPG, PNG up to 500MB</p></>}
              <input type="file" accept="video/*,image/*" className="hidden" onChange={e=>{if(e.target.files[0])setUploadFile(e.target.files[0]);}}/>
            </label></div>
          {uploadType==='IMAGE'&&<div><label className="block text-sm font-medium text-surface-700 mb-1">Display Duration (sec)</label><input type="number" className="input-field" value={uploadDuration} onChange={e=>setUploadDuration(e.target.value)} placeholder="10"/></div>}
          <div className="flex justify-end gap-3"><button type="button" onClick={()=>setContentModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={uploading} className="btn-primary">{uploading?<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Uploading...</>:'Upload'}</button></div>
        </form>
      </Modal>

      {/* ===== PLAYLIST BUILDER ===== */}
      <Modal open={!!playlistModal} onClose={()=>setPlaylistModal(null)} title={playlistModal?.id?'Edit Playlist':'Create Playlist'}>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Name *</label><input className="input-field" value={plForm.name} onChange={e=>setPlForm(p=>({...p,name:e.target.value}))} required/></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Mode</label><select className="input-field" value={plForm.mode} onChange={e=>setPlForm(p=>({...p,mode:e.target.value}))}><option value="SEQUENTIAL">Sequential</option><option value="SHUFFLE">Shuffle</option></select></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={plForm.loopPlaylist} onChange={e=>setPlForm(p=>({...p,loopPlaylist:e.target.checked}))} className="rounded"/>Loop continuously</label>
          <div className="border-t pt-4">
            <h4 className="font-display font-semibold text-sm mb-2">Add Content</h4>
            <div className="flex gap-2 flex-wrap mb-3">
              {content.filter(c=>!plForm.items.some(i=>i.contentId===c.id)).map(c=>(
                <button key={c.id} onClick={()=>addItemToPlaylist(c)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-50 border text-xs hover:border-brand-500 transition-colors">
                  <Plus className="w-3 h-3"/>{c.name}<span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${c.contentType==='VIDEO'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>{c.contentType}</span>
                </button>))}
              {content.length===0&&<p className="text-xs text-surface-400">Upload content first</p>}
            </div>
            <h4 className="font-display font-semibold text-sm mb-2">Playlist Items ({plForm.items.length})</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {plForm.items.map((item,idx)=>(
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={()=>moveItem(idx,-1)} disabled={idx===0} className="text-surface-400 hover:text-surface-600 disabled:opacity-30"><ChevronUp className="w-3 h-3"/></button>
                    <button onClick={()=>moveItem(idx,1)} disabled={idx===plForm.items.length-1} className="text-surface-400 hover:text-surface-600 disabled:opacity-30"><ChevronDown className="w-3 h-3"/></button>
                  </div>
                  <span className="text-xs font-mono text-surface-400 w-5">{idx+1}</span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item._name}</p></div>
                  <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-surface-400"/>
                    <input type="number" min="1" className="w-14 px-2 py-1 text-xs rounded-lg border text-center" value={item.displayDuration}
                      onChange={e=>{const a=[...plForm.items];a[idx]={...a[idx],displayDuration:+e.target.value};setPlForm(p=>({...p,items:a}));}}/><span className="text-xs text-surface-400">s</span></div>
                  <button onClick={()=>removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>))}
              {!plForm.items.length&&<p className="text-center text-surface-400 text-sm py-4">Add content above</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2"><button onClick={()=>setPlaylistModal(null)} className="btn-secondary">Cancel</button><button onClick={handleSavePlaylist} className="btn-primary">{playlistModal?.id?'Update':'Create'} Playlist</button></div>
        </div>
      </Modal>

      {/* ===== ASSIGN MODAL ===== */}
      <Modal open={!!assignModal} onClose={()=>setAssignModal(null)} title="Assign Playlist" maxWidth="max-w-md">
        {assignModal&&<div className="p-6 space-y-3"><p className="text-sm text-surface-500">Assign playlist to <b>{assignModal.deviceName}</b></p>
          {playlists.map(p=>(<button key={p.id} onClick={()=>handleAssign(p.id)} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all hover:border-brand-500 ${assignModal.playlistId===p.id?'border-brand-500 bg-brand-50':''}`}>
            <div><p className="font-semibold text-sm">{p.name}</p><p className="text-xs text-surface-400">{(p.items||[]).length} items • {p.mode}</p></div>
            {assignModal.playlistId===p.id&&<span className="badge badge-green">Current</span>}
          </button>))}
          {!playlists.length&&<p className="text-center text-surface-400 text-sm py-4">Create a playlist first</p>}
        </div>}
      </Modal>
    </div>
  );
}
