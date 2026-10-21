/* ==========================================================
   formato.js — funciones de formato (sin acceso al DOM)
   ========================================================== */
export const formatoDinero = v =>
    (v < 0 && Math.round(v * 100) !== 0 ? '-' : '') + '$' + Math.abs(v).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const pct = v => v.toFixed(1) + '%';

export const minutos = v => v.toFixed(1) + ' min';

export const numero = v => (Number.isInteger(v) ? v : v.toFixed(1)).toString();

// Tipos de formato que usa la capa de dominio (kpis.js) para describir cada KPI
export const FORMATOS = { pct, dinero: formatoDinero, min: minutos, num: numero };

// Escapa texto escrito por el usuario antes de insertarlo con innerHTML
export const escaparHTML = texto => String(texto ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
