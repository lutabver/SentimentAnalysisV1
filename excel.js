/* ==========================================================
   excel.js — exportación del historial a .xlsx (librería SheetJS)
   ========================================================== */

// Convierte los registros en filas con los encabezados del Excel (función pura)
// `pagos`: Map(registroId → pago de deudas de ese cierre) de domain/deudas.js → pagosPorRegistro
export function construirFilasExcel(registros, pagos = new Map()) {
    return registros.map(d => {
        const nom = d.nomina || 0;
        const op = d.operativos || 0;
        const neta = d.ventas - d.insumos - nom - op;
        const pago = pagos.get(d.id) || 0;
        return {
            "Fecha": d.fecha,
            "Ventas Totales ($)": d.ventas,
            "Costo Insumos ($)": d.insumos,
            "Costo Nómina ($)": nom,
            "Gastos Operativos ($)": op,
            "Resultado Operativo Estimado ($)": neta,
            "Pago de Deudas ($)": pago,
            "Resultado tras Deudas ($)": Math.round((neta - pago) * 100) / 100,
            "Índice de Compras (%)": d.ventas > 0 ? Number(((d.insumos / d.ventas) * 100).toFixed(1)) : 0,
            "Labor Cost (%)": d.ventas > 0 ? Number(((nom / d.ventas) * 100).toFixed(1)) : 0,
            "Pedidos Totales": d.pedidos || 0,
            "Clientes Atendidos": d.clientes,
            "Mesas Ocupadas": d.mesas,
            "Horas Trabajadas": d.horas,
            "Productividad ($/hh)": d.horas > 0 ? Number((d.ventas / d.horas).toFixed(2)) : 0,
            "Tiempo de Ciclo (Min)": d.ciclo,
            "Reclamos": d.reclamos || 0,
            "Problemas Reportados": d.problemas_marcados || 'Ninguno',
            "Causas Atribuidas": d.causa_marcada || 'N/A'
        };
    });
}

// `XLSX` es global: lo define el <script> del CDN en index.html
export function descargarExcel(registros, pagos) {
    const worksheet = XLSX.utils.json_to_sheet(construirFilasExcel(registros, pagos));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial V3");
    XLSX.writeFile(workbook, "Historial_Inteligente_Sando.xlsx");
}
