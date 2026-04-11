export default { content: ['./index.html','./src/**/*.{js,jsx}'], theme: { extend: {
  colors: {
    brand: {
      50:'rgb(var(--brand-50) / <alpha-value>)',
      100:'rgb(var(--brand-100) / <alpha-value>)',
      200:'rgb(var(--brand-200) / <alpha-value>)',
      300:'rgb(var(--brand-300) / <alpha-value>)',
      400:'rgb(var(--brand-400) / <alpha-value>)',
      500:'rgb(var(--brand-500) / <alpha-value>)',
      600:'rgb(var(--brand-600) / <alpha-value>)',
      700:'rgb(var(--brand-700) / <alpha-value>)',
      800:'rgb(var(--brand-800) / <alpha-value>)',
      900:'rgb(var(--brand-900) / <alpha-value>)',
    },
    surface: { 0:'#ffffff',50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a',950:'#020617' }
  },
  fontFamily: { sans: ['DM Sans','system-ui','sans-serif'], display: ['Outfit','system-ui','sans-serif'] }
}}, plugins: [] };
