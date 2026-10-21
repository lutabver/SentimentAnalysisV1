/* ==========================================================
   resumenGlobal.js — totales históricos y series para los gráficos (sin DOM)
   ========================================================== */
// `pagos` (opcional): Map(registroId → pago de deudas de ese cierre), ver domain/deudas.js → pagosPorRegistro
export function calcularResumenGlobal(registros, pagos = new Map()) {
    let tVentas = 0, tInsumos = 0, tNomina = 0, tOperativos = 0, tCicloTotal = 0;
    const fechas = [], ciclos = [], ventas = [], insumos = [], nomina = [], operativos = [], utilidad = [], pagoDeudas = [], utilidadReal = [];

    registros.forEach(d => {
        tVentas += d.ventas; tInsumos += d.insumos; tNomina += (d.nomina || 0); tOperativos += (d.operativos || 0);
        tCicloTotal += d.ciclo;
        fechas.push(d.fecha); ciclos.push(d.ciclo); ventas.push(d.ventas);
        insumos.push(d.insumos); nomina.push(d.nomina || 0); operativos.push(d.operativos || 0);
        const neta = d.ventas - d.insumos - (d.nomina || 0) - (d.operativos || 0);
        const pago = pagos.get(d.id) || 0;
        utilidad.push(neta); pagoDeudas.push(pago); utilidadReal.push(Math.round((neta - pago) * 100) / 100);
    });

    return {
        compras: tVentas > 0 ? (tInsumos / tVentas) * 100 : 0,
        labor: tVentas > 0 ? (tNomina / tVentas) * 100 : 0,
        ciclo: tCicloTotal / registros.length,
        utilidad: tVentas - tInsumos - tNomina - tOperativos,
        series: { fechas, ciclos, ventas, insumos, nomina, operativos, utilidad, pagoDeudas, utilidadReal }
    };
}
