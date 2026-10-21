/* ==========================================================
   tarjetaResumen.js — "Resumen Real del Día" (HTML)
   La lógica vive en domain/resumenDia.js; aquí solo se dibuja.
   ========================================================== */
import { analizarDia } from '../../domain/resumenDia.js';
import { formatoDinero } from '../../utils/formato.js';

export function tarjetaResumenReal(hoy, historico) {
    const { h, p, hallazgos, veredicto, reparto, fugaTotal } = analizarDia(hoy, historico);

    const barraReparto = reparto.length ? `
                <div class="mt-4">
                    <p class="text-[11px] font-extrabold uppercase tracking-wider text-cocoa-soft mb-2">De cada $100 que vendiste hoy</p>
                    <div class="flex h-4 rounded-full overflow-hidden bg-cocoa/10">${reparto.filter(r => r.valor > 0).map(r => `<span style="width:${Math.min(r.valor, 100)}%;background:${r.color}"></span>`).join('')}</div>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-bold text-cocoa-soft">${reparto.map(r => `<span><span class="inline-block w-2 h-2 rounded-full mr-1" style="background:${r.color}"></span>${r.valor < 0 ? 'Perdiste' : r.nombre}: ${r.valor < 0 ? '-' : ''}$${Math.abs(r.valor).toFixed(1)}</span>`).join('')}</div>
                </div>` : '';

    const resultado = v => v < 0 ? `pierdes ${formatoDinero(-v)}` : `ganas ${formatoDinero(v)}`;
    const comparacion = p ? `<p class="text-sm font-bold text-cocoa-soft mt-3">Frente a tu día promedio: hoy ${h.utilidad < 0 ? `perdiste ${formatoDinero(-h.utilidad)}` : `ganaste ${formatoDinero(h.utilidad)}`} cuando normalmente ${resultado(p.utilidad)}. Diferencia: ${h.utilidad >= p.utilidad ? '+' : '-'}${formatoDinero(Math.abs(h.utilidad - p.utilidad))}.</p>` : '<p class="text-sm font-bold text-cocoa-soft mt-3">Aún no hay historial: las comparaciones se activan desde el segundo registro.</p>';

    const cifras = fugaTotal > 0 ? `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div class="bg-red-50 rounded-xl p-4 border border-red-200">
                        <p class="text-[11px] font-extrabold uppercase tracking-wider text-red-700">Dinero perdido hoy por costos fuera de meta</p>
                        <p class="font-display text-2xl font-bold text-red-700 mt-1">${formatoDinero(fugaTotal)}</p>
                    </div>
                    <div class="bg-red-50 rounded-xl p-4 border border-red-200">
                        <p class="text-[11px] font-extrabold uppercase tracking-wider text-red-700">Si se repite 30 días</p>
                        <p class="font-display text-2xl font-bold text-red-700 mt-1">${formatoDinero(fugaTotal * 30)}</p>
                    </div>
                </div>` : '';

    const lista = hallazgos.map((x, i) => `
                <div class="bg-white/80 rounded-xl p-4 border-l-4" style="border-left-color:${x.gravedad === 3 ? '#DC2626' : x.gravedad === 2 ? '#D97706' : '#6B4A33'}">
                    <p class="font-display font-bold text-base text-cocoa">${i + 1}. ${x.titulo}${x.dinero > 0 ? ` <span class="chip" style="--c:#DC2626">${formatoDinero(x.dinero)} en juego</span>` : ''}</p>
                    <p class="text-sm font-semibold text-cocoa-soft mt-1"><b>Qué pasa:</b> ${x.quePasa}</p>
                    <p class="text-sm font-semibold text-cocoa-soft mt-1"><b>Por qué:</b> ${x.porQue}</p>
                    <p class="text-sm font-bold text-purple-900 mt-1"><b>Qué hacer:</b> ${x.accion}</p>
                </div>`).join('');

    const prioridad = hallazgos.length ? `
                <div class="bg-cocoa text-white rounded-xl p-4 mt-4">
                    <p class="text-[11px] font-extrabold uppercase tracking-wider text-gold">Prioridad #1 para el próximo turno</p>
                    <p class="font-bold mt-1">${hallazgos[0].accion}</p>
                </div>` : '';

    return `<div class="card p-6 lg:col-span-2 xl:col-span-3 border-l-[6px]" style="border-left-color:${veredicto.color}">
                <h4 class="font-display font-bold text-xl text-cocoa">🧾 Resumen Real del Día: lo que está pasando</h4>
                <p class="font-display font-bold text-lg mt-2" style="color:${veredicto.color}">${veredicto.titulo}</p>
                <p class="text-sm font-semibold text-cocoa-soft mt-1">${veredicto.descripcion}</p>
                ${barraReparto}
                ${comparacion}
                ${cifras}
                ${hallazgos.length ? `<div class="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">${lista}</div>` : ''}
                ${prioridad}
            </div>`;
}
