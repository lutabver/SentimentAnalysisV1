/* ==========================================================
   tarjetaKPIs.js — "Radiografía de KPIs del Día" (HTML)
   ========================================================== */
import { evaluarKPIsDelDia, contarEstados } from '../../domain/kpis.js';
import { FORMATOS } from '../../utils/formato.js';

const COLORES = { ok: '#16A34A', atencion: '#D97706', peligro: '#DC2626', neutro: '#6B4A33' };
const ETIQUETAS = { ok: 'En meta', atencion: 'Vigilar', peligro: 'Fuera de meta', neutro: 'Referencia' };

export function tarjetaKPIs(hoy, historico) {
    const kpis = evaluarKPIsDelDia(hoy, historico);

    const comparar = k => {
        const fmt = FORMATOS[k.formato];
        if (k.prom === null || k.prom === undefined) return 'Sin historial previo';
        const dif = k.hoy - k.prom;
        if (Math.abs(dif) < 0.05) return `Igual al histórico (${fmt(k.prom)})`;
        const mejor = (dif > 0) === k.mejorSiSube;
        const flecha = dif > 0 ? '▲' : '▼';
        const cambio = k.puntos
            ? `${dif > 0 ? '+' : ''}${dif.toFixed(1)} pts`
            : k.prom !== 0 ? `${dif > 0 ? '+' : ''}${((dif / Math.abs(k.prom)) * 100).toFixed(1)}%` : `${dif > 0 ? '+' : ''}${fmt(dif)}`;
        return `<span style="color:${mejor ? COLORES.ok : COLORES.peligro}">${flecha} ${cambio}</span> vs histórico (${fmt(k.prom)}) · ${mejor ? 'mejor' : 'peor'}`;
    };

    const conteo = contarEstados(kpis);

    const celdas = kpis.map(k => `
                <div class="bg-white/70 rounded-xl p-3 border-l-4" style="border-left-color:${COLORES[k.estado]}">
                    <div class="flex items-center justify-between gap-2">
                        <p class="text-[11px] font-extrabold uppercase tracking-wider text-cocoa-soft">${k.nombre}</p>
                        <span class="chip" style="--c:${COLORES[k.estado]}">${ETIQUETAS[k.estado]}</span>
                    </div>
                    <p class="font-display text-xl font-bold mt-1">${FORMATOS[k.formato](k.hoy)} <span class="text-xs font-semibold text-cocoa-soft">${k.meta}</span></p>
                    <p class="text-xs font-bold text-cocoa-soft mt-1">${comparar(k)}</p>
                    <p class="text-xs font-semibold text-cocoa-soft mt-1">${k.lectura[k.estado] || ''}</p>
                </div>`).join('');

    return `<div class="card p-6 lg:col-span-2 xl:col-span-3">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h4 class="font-display font-bold text-xl text-cocoa">📊 Radiografía de KPIs del Día (${hoy.fecha})</h4>
                    <div class="flex gap-2">
                        <span class="chip" style="--c:${COLORES.ok}">${conteo.ok} en meta</span>
                        <span class="chip" style="--c:${COLORES.atencion}">${conteo.atencion} vigilar</span>
                        <span class="chip" style="--c:${COLORES.peligro}">${conteo.peligro} fuera de meta</span>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">${celdas}</div>
            </div>`;
}
