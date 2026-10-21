/* ==========================================================
   store.js — estado compartido de la app (registros diarios y deudas)
   Un único lugar donde viven los datos; el resto de módulos lo lee.
   ========================================================== */
let registros = [];
let deudas = [];
const oyentes = new Set();

export const obtenerRegistros = () => registros;
export const obtenerDeudas = () => deudas;

export function establecerRegistros(lista) {
    registros = lista;
    oyentes.forEach(fn => fn());
}

export function establecerDeudas(lista) {
    deudas = lista;
    oyentes.forEach(fn => fn());
}

// Permite reaccionar a cambios: const baja = suscribir(fn); baja() para cancelar
export function suscribir(fn) {
    oyentes.add(fn);
    return () => oyentes.delete(fn);
}
