/* ==========================================================
   deudas.js — lógica de deudas y abonos (sin DOM)

   Regla clave: lo que se PAGA de deudas se descuenta de la utilidad neta.
     Utilidad real = Utilidad neta − Pagado en deudas
   El pago se declara en el cierre del día (campo "Pago de deudas hoy") y
   se reparte entre las deudas pendientes, de la más antigua a la más nueva.
   Cada abono creado por un cierre guarda `registroId` (el cierre que lo originó),
   así se sabe cuánto de cada día se fue en deudas. Los abonos hechos a mano
   desde el Dashboard no tienen `registroId`: cuentan en el total, no en un día.
   ========================================================== */

const num = v => Number(v) || 0;
const redondear = v => Math.round(v * 100) / 100;

// Calcula pagado, pendiente y estado de UNA deuda (los abonos vienen como objeto de Firebase)
export function evaluarDeuda(deuda) {
    const abonos = Object.values(deuda.abonos || {}).sort((a, b) => a.id - b.id);
    const monto = redondear(num(deuda.monto));
    const pagado = redondear(abonos.reduce((t, a) => t + num(a.monto), 0));
    const pendiente = Math.max(0, redondear(monto - pagado));   // nunca negativo
    return {
        ...deuda,
        monto,
        abonos,
        pagado,
        pendiente,
        saldada: pendiente === 0,
        avance: monto > 0 ? Math.min(100, (pagado / monto) * 100) : 100
    };
}

// Totales de todas las deudas. Las pendientes van primero, luego las saldadas (más recientes arriba)
export function resumenDeudas(lista) {
    const deudas = lista.map(evaluarDeuda).sort((a, b) =>
        Number(a.saldada) - Number(b.saldada) || b.id - a.id);

    const total = redondear(deudas.reduce((t, d) => t + d.monto, 0));
    const pagado = redondear(deudas.reduce((t, d) => t + Math.min(d.pagado, d.monto), 0));
    const pendiente = redondear(deudas.reduce((t, d) => t + d.pendiente, 0));

    return {
        deudas,
        total,
        pagado,
        pendiente,
        activas: deudas.filter(d => !d.saldada).length,
        saldadas: deudas.filter(d => d.saldada).length,
        avance: total > 0 ? (pagado / total) * 100 : 0
    };
}

// Utilidad real: lo que de verdad le queda al dueño después de pagar deudas.
// Puede ser negativa (se pagó más deuda de lo que se ganó).
export const utilidadReal = (utilidadNeta, pagado) => redondear(utilidadNeta - pagado);

// Cuánto se pagó de deudas por cada cierre diario: Map(registroId → monto)
export function pagosPorRegistro(lista) {
    const mapa = new Map();
    lista.forEach(deuda => Object.values(deuda.abonos || {}).forEach(a => {
        if (a.registroId == null) return;   // abono manual del Dashboard: no pertenece a un día
        mapa.set(a.registroId, redondear((mapa.get(a.registroId) || 0) + num(a.monto)));
    }));
    return mapa;
}

// Reparte un pago entre las deudas pendientes: la más antigua primero.
// Devuelve { asignaciones: [{ idDeuda, concepto, monto }], sobrante }.
// `sobrante` > 0 significa que el pago supera todo lo que se debe.
export function repartirPago(monto, lista) {
    let resto = redondear(num(monto));
    const asignaciones = [];
    lista.map(evaluarDeuda).filter(d => !d.saldada).sort((a, b) => a.id - b.id).forEach(d => {
        if (resto <= 0) return;
        const parte = Math.min(resto, d.pendiente);
        asignaciones.push({ idDeuda: d.id, concepto: d.concepto, monto: redondear(parte) });
        resto = redondear(resto - parte);
    });
    return { asignaciones, sobrante: resto };
}

// Valida un abono contra el saldo de la deuda. Devuelve el mensaje de error o null si es válido.
export function validarAbono(monto, deuda) {
    if (!(monto > 0)) return 'Ingresa un monto de abono mayor a 0.';
    if (deuda.saldada) return 'Esta deuda ya está saldada.';
    if (redondear(monto) > deuda.pendiente) return `El abono supera el saldo pendiente ($${deuda.pendiente.toFixed(2)}).`;
    return null;
}
