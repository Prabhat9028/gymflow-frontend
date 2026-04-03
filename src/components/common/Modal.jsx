import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-in`} onClick={e=>e.stopPropagation()}>
        {title && <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-2xl">
          <h2 className="font-display font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5"/></button>
        </div>}
        {children}
      </div>
    </div>, document.body);
}
