/* ==========================================================
   alertas.js — tarjetas de alerta, alertas comparativas y planes de acción (HTML)
   ========================================================== */
import { escaparHTML, formatoDinero } from '../../utils/formato.js';

export function tarjetaAlerta(tipo, titulo, texto) {
    const estilos = {
        peligro: { c: '#DC2626', bg: 'bg-red-50', icono: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>' },
        ok: { c: '#16A34A', bg: 'bg-green-50', icono: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>' },
        atencion: { c: '#D97706', bg: 'bg-orange-50', icono: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' }
    }[tipo];
    return `<div class="card lift accent p-5 flex gap-4 ${estilos.bg}" style="--c:${estilos.c}">
                <div class="bubble shrink-0 bg-white"><svg class="ico" viewBox="0 0 24 24">${estilos.icono}</svg></div>
                <div><h4 class="font-display font-bold text-lg leading-tight" style="color:${estilos.c}">${titulo}</h4><p class="text-cocoa-soft text-sm font-semibold mt-1">${texto}</p></div>
            </div>`;
}

const COLOR_NIVEL = { peligro: '#DC2626', atencion: '#D97706' };
const ETIQUETA_NIVEL = { peligro: 'Actuar ya', atencion: 'Vigilar' };
const lista = items => `<ul class="list-disc pl-4 space-y-1">${items.map(t => `<li>${escaparHTML(t)}</li>`).join('')}</ul>`;
const dato = (etiqueta, valor, extra = '') => `<div class="bg-white/80 rounded-xl p-3 border border-cocoa/10">
                        <p class="text-[10px] font-extrabold uppercase tracking-wider text-cocoa-light">${etiqueta}</p>
                        <p class="font-display text-lg font-bold leading-tight mt-0.5">${escaparHTML(valor)}</p>
                        ${extra ? `<p class="text-[11px] font-semibold text-cocoa-soft mt-1 leading-snug">${escaparHTML(extra)}</p>` : ''}
                    </div>`;

// Resumen del ciclo de mejora: qué se comparó y contra qué
export function tarjetaContexto({ fecha, base, cierresPrevios, indicadoresRevisados }, alertas, acciones) {
    const estable = alertas.length === 0;
    return `<div class="card p-5 lg:col-span-2 xl:col-span-3 flex flex-wrap items-center justify-between gap-3 ${estable ? 'bg-green-50' : ''}">
                <div>
                    <h4 class="font-display font-bold text-xl text-cocoa">🔁 Ciclo de Mejora Continua (${escaparHTML(fecha)})</h4>
                    <p class="text-sm font-semibold text-cocoa-soft mt-1">${estable
                        ? `Proceso estable: los ${indicadoresRevisados} indicadores están dentro de lo habitual. Mantén el estándar actual.`
                        : 'Detectar la variación → buscar la causa → aplicar la acción → verificar el resultado → estandarizar lo que funcione.'}</p>
                    <p class="text-xs font-bold text-cocoa-light mt-1">Referencia: ${escaparHTML(base)} · ${cierresPrevios} cierres previos en el historial</p>
                </div>
                <div class="flex gap-2">
                    <span class="chip" style="--c:${COLOR_NIVEL.peligro}">${alertas.filter(a => a.nivel === 'peligro').length} actuar ya</span>
                    <span class="chip" style="--c:${COLOR_NIVEL.atencion}">${alertas.filter(a => a.nivel === 'atencion').length} vigilar</span>
                    <span class="chip" style="--c:#9333EA">${acciones.length} planes de acción</span>
                </div>
            </div>`;
}

// Alerta comparativa: dato observado, referencia usada y qué investigar
export function tarjetaComparativa(a) {
    const c = COLOR_NIVEL[a.nivel];
    return `<div class="card lift accent p-5 ${a.nivel === 'peligro' ? 'bg-red-50' : 'bg-orange-50'}" style="--c:${c}">
                <div class="flex items-start justify-between gap-2 mb-3">
                    <h4 class="font-display font-bold text-lg leading-tight" style="color:${c}">${escaparHTML(a.titulo)}</h4>
                    <span class="chip shrink-0" style="--c:${c}">${ETIQUETA_NIVEL[a.nivel]}</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                    ${dato('Observado hoy', a.textoObservado)}
                    ${dato('Referencia', a.textoReferencia, a.baseReferencia)}
                    ${dato('Variación', a.variacion, a.rango || '')}
                </div>
                ${a.notas.length ? `<div class="text-xs font-bold mt-3" style="color:${c}">${lista(a.notas)}</div>` : ''}
                <p class="text-[10px] font-extrabold uppercase tracking-wider text-cocoa-light mt-3 mb-1">Qué investigar</p>
                <div class="text-sm font-semibold text-cocoa-soft">${lista(a.investigar)}</div>
            </div>`;
}

// Plan de acción: problema, evidencia, causa posible, acción y resultado a medir
export function tarjetaPlan(p) {
    const bloque = (paso, etiqueta, contenido, clases = 'bg-cocoa/5 border-cocoa/10', color = 'text-cocoa-light') => `
                    <div class="p-4 rounded-xl border ${clases}">
                        <p class="text-[10px] font-extrabold uppercase tracking-wider ${color} mb-1">${paso} · ${etiqueta}</p>
                        <div class="text-sm font-bold leading-snug text-cocoa-soft">${contenido}</div>
                    </div>`;
    return `<div class="card lift accent p-6 lg:col-span-2 xl:col-span-3 border-l-[6px]" style="border-left-color:#9333EA; --c:#9333EA">
                <div class="flex flex-wrap gap-3 items-center justify-between mb-4">
                    <div class="flex gap-3 items-center">
                        <div class="bubble !w-10 !h-10 shrink-0 font-display font-bold">${p.prioridad}</div>
                        <h4 class="font-display font-bold text-xl text-cocoa">🎯 Plan de Acción: ${escaparHTML(p.titulo)}</h4>
                    </div>
                    <div class="flex gap-2">
                        <span class="chip" style="--c:${COLOR_NIVEL[p.nivel]}">${ETIQUETA_NIVEL[p.nivel]}</span>
                        ${p.impacto > 0 ? `<span class="chip" style="--c:#9333EA">En juego hoy: ${formatoDinero(p.impacto)}</span>` : ''}
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                    ${bloque('Planear', 'Problema detectado', escaparHTML(p.problema))}
                    ${bloque('Planear', 'Evidencia numérica', lista(p.evidencia))}
                    ${bloque('Planear', 'Causa posible', escaparHTML(p.causa))}
                    ${bloque('Hacer', 'Acción sugerida', `<span class="text-purple-900 font-extrabold">${escaparHTML(p.accion)}</span>`, 'bg-purple-100 border-purple-200', 'text-purple-700')}
                    ${bloque('Verificar', 'Resultado a medir', `<p><span class="text-cocoa">${escaparHTML(p.resultado.indicador)}</span> ${escaparHTML(p.resultado.meta)}</p>
                        <p class="text-xs font-semibold mt-1">${escaparHTML(p.resultado.plazo)}. Si se cumple, deja la acción como estándar; si no, vuelve a buscar la causa.</p>`, 'bg-green-50 border-green-200', 'text-green-700')}
                </div>
            </div>`;
}

// Convierte el resultado de domain/diagnosticos.js en tarjetas HTML
export function renderDiagnosticos({ contexto, alertas, acciones }) {
    return tarjetaContexto(contexto, alertas, acciones)
        + alertas.map(tarjetaComparativa).join('')
        + acciones.map(tarjetaPlan).join('');
}
