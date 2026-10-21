/* ==========================================================
   cierres.js — escrituras que tocan registros Y deudas a la vez
   Usan una sola actualización multi-ruta de Firebase: o se guarda todo
   (cierre + deuda nueva + abonos del pago) o no se guarda nada.
   ========================================================== */
import { db } from '../config/firebase.js';

// Guarda el cierre del día, la deuda nueva (si hay) y los abonos que salen del pago del día
export function guardarCierre({ registro, deuda, abonos }) {
    const cambios = { [`registros/${registro.id}`]: registro };
    if (deuda) cambios[`deudas/${deuda.id}`] = deuda;
    abonos.forEach(({ idDeuda, abono }) => { cambios[`deudas/${idDeuda}/abonos/${abono.id}`] = abono; });
    return db.ref().update(cambios);
}

// Rutas de los abonos que nacieron de un cierre (o de todos si no se indica `registroId`)
function rutasDeAbonos(deudas, registroId) {
    const rutas = {};
    deudas.forEach(d => Object.values(d.abonos || {}).forEach(a => {
        if (a.registroId != null && (registroId === undefined || a.registroId === registroId)) {
            rutas[`deudas/${d.id}/abonos/${a.id}`] = null;
        }
    }));
    return rutas;
}

// Borrar un cierre también borra los pagos de deuda que se descontaron en él
export const eliminarCierre = (id, deudas) =>
    db.ref().update({ [`registros/${id}`]: null, ...rutasDeAbonos(deudas, id) });

export const eliminarTodosLosCierres = (deudas) =>
    db.ref().update({ registros: null, ...rutasDeAbonos(deudas) });
