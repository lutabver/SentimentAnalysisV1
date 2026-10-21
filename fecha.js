/* ==========================================================
   fecha.js — fechas en formato AAAA-MM-DD (hora local)
   ========================================================== */
export function fechaHoyISO() {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}
