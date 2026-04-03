import React from 'react';
export function MaxOutLogo({ size = 36 }) {
  return (<svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M60 8L108 32V80L60 112L12 80V32L60 8Z" fill="#1a1a1a" stroke="#E8760A" strokeWidth="5"/>
    <path d="M60 16L100 36V76L60 104L20 76V36L60 16Z" fill="#1a1a1a"/>
    <path d="M38 78V46L50 64L60 48L70 64L82 46V78H74V62L64 78H56L46 62V78H38Z" fill="#E8760A"/>
    <path d="M60 28L68 40H52L60 28Z" fill="#E8760A"/><path d="M60 36L64 42H56L60 36Z" fill="#1a1a1a"/>
  </svg>);
}
export function MaxOutLogoFull() {
  return (<div className="flex items-center gap-2.5"><MaxOutLogo size={38}/><div className="flex"><span className="font-display font-extrabold text-xl text-white tracking-tight">Max</span><span className="font-display font-extrabold text-xl text-[#E8760A] tracking-tight">Out</span></div></div>);
}
