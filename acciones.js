/* ==========================================================
   acciones.js — acciones del usuario que combinan servicios y UI
   ========================================================== */
import { obtenerRegistros, obtenerDeudas } from '../state/store.js';
import { eliminarCierre, eliminarTodosLosCierres } from '../services/cierres.js';
import { guardarAbono, eliminarDeuda } from '../services/deudas.js';
import { descargarExcel as exportarExcel } from '../services/excel.js';
import { evaluarDeuda, validarAbono, pagosPorRegistro } from '../domain/deudas.js';
import { formatoDinero } from '../utils/formato.js';
import { fechaHoyISO } from '../utils/fecha.js';
import { cambiarTab } from './tabs.js';

export function eliminarDato(id) {
    if (confirm("¿Estás seguro de eliminar este registro? Si ese día se pagaron deudas, esos pagos también se borran y las deudas vuelven a quedar pendientes.")) {
        eliminarCierre(id, obtenerDeudas());
    }
}

export function borrarTodo() {
    if (confirm("⚠ ADVERTENCIA: Se borrará TODO el historial en vivo para todos los dispositivos, junto con los pagos de deuda hechos en los cierres. ¿Deseas continuar?")) {
        eliminarTodosLosCierres(obtenerDeudas());
        cambiarTab('ingreso');
    }
}

export function descargarExcel() {
    const registros = obtenerRegistros();
    if (registros.length === 0) {
        alert("No hay datos en el historial para exportar.");
        return;
    }
    exportarExcel(registros, pagosPorRegistro(obtenerDeudas()));
}

/* ---------- Deudas (las nuevas se agregan desde Ingreso Diario: ui/formulario.js) ---------- */

const buscarDeuda = id => {
    const deuda = obtenerDeudas().find(d => d.id === id);
    return deuda ? evaluarDeuda(deuda) : null;
};

function registrarAbono(deuda, monto) {
    const error = validarAbono(monto, deuda);
    if (error) return alert(error);
    guardarAbono(deuda.id, { id: Date.now(), fecha: fechaHoyISO(), monto })
        .catch((e) => alert("Error al guardar el abono: " + e.message));
}

export function abonarDeuda(id) {
    const deuda = buscarDeuda(id);
    if (!deuda) return;
    const input = document.querySelector(`[data-abono-input="${id}"]`);
    registrarAbono(deuda, parseFloat(input && input.value));
}

export function saldarDeuda(id) {
    const deuda = buscarDeuda(id);
    if (!deuda || deuda.saldada) return;
    if (confirm(`¿Registrar el pago del saldo restante (${formatoDinero(deuda.pendiente)}) y saldar esta deuda?`)) {
        registrarAbono(deuda, deuda.pendiente);
    }
}

export function quitarDeuda(id) {
    if (confirm("¿Eliminar esta deuda y todos sus abonos? Lo pagado deja de descontarse del resultado operativo. Esta acción no se puede deshacer.")) {
        eliminarDeuda(id);
    }
}
