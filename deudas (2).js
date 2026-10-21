/* ==========================================================
   deudas.js — sección "Deudas" del Dashboard: resumen y lista de deudas con abonos
   (las deudas nuevas se agregan desde Ingreso Diario: ver ui/formulario.js)
   ========================================================== */
import { obtenerDeudas } from '../state/store.js';
import { resumenDeudas } from '../domain/deudas.js';
import { formatoDinero, pct, escaparHTML } from '../utils/formato.js';

const COLOR_PENDIENTE = '#BE123C';
const COLOR_SALDADA = '#16A34A';

function tarjetaDeuda(d) {
    const color = d.saldada ? COLOR_SALDADA : COLOR_PENDIENTE;
    const abonos = d.abonos.length
        ? `<details class="mt-3"><summary class="text-xs font-extrabold text-cocoa-soft cursor-pointer">Ver ${d.abonos.length} abono(s)</summary>
               <ul class="mt-2 space-y-1 text-xs font-bold text-cocoa-soft">${d.abonos.map(a => `<li class="flex justify-between"><span>${a.fecha}${a.registroId != null ? ' · cierre del día' : ' · abono manual'}</span><span>${formatoDinero(a.monto)}</span></li>`).join('')}</ul></details>`
        : '';

    const pagar = d.saldada ? '' : `
            <div class="flex flex-wrap gap-2 mt-4">
                <div class="input-wrap flex-1 min-w-[140px]"><span class="affix">$</span><input type="number" step="0.01" min="0.01" max="${d.pendiente}" data-abono-input="${d.id}" placeholder="Monto del abono"></div>
                <button data-action="abonar-deuda" data-id="${d.id}" class="btn-gold px-4 py-2 rounded-xl text-sm">Abonar</button>
                <button data-action="saldar-deuda" data-id="${d.id}" class="bg-green-600 hover:bg-green-700 text-white font-extrabold px-4 py-2 rounded-xl text-sm transition">Saldar todo</button>
            </div>`;

    return `<div class="card lift accent p-5" style="--c:${color}">
                <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <h4 class="font-display font-bold text-xl">${escaparHTML(d.concepto)}</h4>
                        <p class="text-xs font-bold text-cocoa-soft">Registrada el ${d.fecha}</p>
                    </div>
                    <span class="chip" style="--c:${color}">${d.saldada ? '✓ Saldada' : 'Pendiente'}</span>
                </div>
                <div class="grid grid-cols-3 gap-3 mt-4 text-center">
                    <div><p class="text-[10px] font-extrabold uppercase text-cocoa-soft">Total</p><p class="font-display font-bold">${formatoDinero(d.monto)}</p></div>
                    <div><p class="text-[10px] font-extrabold uppercase text-cocoa-soft">Pagado</p><p class="font-display font-bold" style="color:${COLOR_SALDADA}">${formatoDinero(d.pagado)}</p></div>
                    <div><p class="text-[10px] font-extrabold uppercase text-cocoa-soft">Pendiente</p><p class="font-display font-bold" style="color:${d.saldada ? COLOR_SALDADA : COLOR_PENDIENTE}">${formatoDinero(d.pendiente)}</p></div>
                </div>
                <div class="bar mt-3"><span style="width:${d.avance}%;background:${COLOR_SALDADA}"></span></div>
                ${abonos}
                ${pagar}
                <div class="mt-4 text-right">
                    <button data-action="eliminar-deuda" data-id="${d.id}" class="text-xs font-extrabold text-red-700 hover:underline">Eliminar deuda</button>
                </div>
            </div>`;
}

export function actualizarDeudas() {
    const r = resumenDeudas(obtenerDeudas());
    const lista = document.getElementById('lista-deudas');

    document.getElementById('deudas-count').innerText = `${r.activas} pendiente(s) · ${r.saldadas} saldada(s)`;
    document.getElementById('deu-total').innerText = formatoDinero(r.total);
    document.getElementById('deu-pagado').innerText = formatoDinero(r.pagado);
    document.getElementById('deu-pendiente').innerText = formatoDinero(r.pendiente);
    document.getElementById('deu-avance').innerText = r.total > 0 ? `${pct(r.avance)} pagado` : 'Sin deudas registradas';

    // Conserva lo que el usuario está escribiendo en los campos de abono al redibujar
    const escrito = {};
    lista.querySelectorAll('[data-abono-input]').forEach(i => { if (i.value) escrito[i.dataset.abonoInput] = i.value; });

    lista.innerHTML = r.deudas.length
        ? r.deudas.map(tarjetaDeuda).join('')
        : '<div class="card p-8 text-center lg:col-span-2"><p class="font-display text-xl font-bold">No hay deudas registradas</p><p class="text-cocoa-soft font-semibold mt-1">Agrega una deuda desde Ingreso Diario y aparecerá aquí.</p></div>';

    lista.querySelectorAll('[data-abono-input]').forEach(i => { if (escrito[i.dataset.abonoInput]) i.value = escrito[i.dataset.abonoInput]; });
}
