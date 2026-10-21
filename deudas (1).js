/* ==========================================================
   deudas.js — acceso a datos de deudas y abonos (Firebase)
   Estructura en la base:  deudas/{id} = { id, concepto, monto, fecha, abonos: { {id}: {id, fecha, monto} } }
   ========================================================== */
import { db } from '../config/firebase.js';

const RUTA = 'deudas';

export function escucharDeudas(alRecibir, alFallar) {
    db.ref(RUTA).on('value', (snapshot) => {
        const data = snapshot.val();
        alRecibir(data ? Object.values(data) : []);
    }, alFallar);
}

export const guardarDeuda = deuda => db.ref(`${RUTA}/${deuda.id}`).set(deuda);

export const guardarAbono = (idDeuda, abono) => db.ref(`${RUTA}/${idDeuda}/abonos/${abono.id}`).set(abono);

export const eliminarDeuda = id => db.ref(`${RUTA}/${id}`).remove();
