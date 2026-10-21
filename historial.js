/* ==========================================================
   historial.js — pestaña "Historial y Excel": tabla de registros
   ========================================================== */
import { obtenerRegistros, obtenerDeudas } from '../state/store.js';
import { pagosPorRegistro, utilidadReal } from '../domain/deudas.js';
import { formatoDinero } from '../utils/formato.js';

export function actualizarHistorial() {
    const baseDatos = obtenerRegistros();
    const tbody = document.getElementById('tabla-historial');
    tbody.innerHTML = '';
    document.getElementById('hist-count').innerText = baseDatos.length + (baseDatos.length === 1 ? ' turno registrado' : ' turnos registrados');
    if (baseDatos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="py-12 text-cocoa-light font-bold"><img src="assets/logo_sando.png" alt="" class="w-20 mx-auto mb-3 opacity-60">No hay datos registrados todavía.</td></tr>';
        return;
    }
    const pagos = pagosPorRegistro(obtenerDeudas());
    baseDatos.forEach((d) => {
        const utilidadNeta = d.ventas - d.insumos - (d.nomina || 0) - (d.operativos || 0);
        const pago = pagos.get(d.id) || 0;
        const real = utilidadReal(utilidadNeta, pago);
        const colorReal = real >= 0 ? '#16A34A' : '#DC2626';
        const tr = document.createElement('tr');
        const colorUtilidad = utilidadNeta >= 0 ? '#16A34A' : '#DC2626';
        const colorCiclo = d.ciclo > 20 ? '#DC2626' : '#16A34A';
        tr.className = "border-b border-cocoa/5";
        tr.innerHTML = `
            <td class="py-3 px-3 text-left font-extrabold whitespace-nowrap">${d.fecha}</td>
            <td class="py-3 px-3 text-right">${formatoDinero(d.ventas)}</td>
            <td class="py-3 px-3 text-right"><span class="chip !text-sm" style="--c:${colorUtilidad}">${formatoDinero(utilidadNeta)}</span></td>
            <td class="py-3 px-3 text-right" style="color:${pago > 0 ? '#BE123C' : 'inherit'}">${pago > 0 ? '− ' + formatoDinero(pago) : formatoDinero(0)}</td>
            <td class="py-3 px-3 text-right"><span class="chip !text-sm" style="--c:${colorReal}">${formatoDinero(real)}</span></td>
            <td class="py-3 px-3">${d.pedidos || 0}</td>
            <td class="py-3 px-3">${d.reclamos || 0}</td>
            <td class="py-3 px-3"><span class="chip" style="--c:${colorCiclo}">${d.ciclo} min</span></td>
            <td class="py-3 px-3 text-left text-xs truncate max-w-[120px]" title="${d.problemas_marcados}">${d.problemas_marcados || 'N/A'}</td>
            <td class="py-3 px-3"><button data-action="eliminar-registro" data-id="${d.id}" class="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-full hover:bg-red-600 hover:text-white transition text-xs font-extrabold"><svg class="ico !w-3.5 !h-3.5" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>Borrar</button></td>`;
        tbody.appendChild(tr);
    });
}
