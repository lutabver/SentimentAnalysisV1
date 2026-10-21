/* ==========================================================
   metas.js — umbrales de negocio en UN solo lugar
   Cambia aquí una meta y se actualizan KPIs, diagnósticos y alertas.
   ========================================================== */
export const METAS = {
    laborCost:  { meta: 30, tope: 35 },   // % de ventas en nómina
    primeCost:  { meta: 63, tope: 68 },   // índice de compras + labor
    margenNeto: 10,                       // % mínimo de ganancia
    ciclo:      { meta: 20, tope: 25 },   // minutos de espera
    reclamos:   0,

    // Sensibilidad de las comparaciones contra el histórico
    caidaVentas: 0.9,        // ventas < 90% del promedio = caída
    caidaTicket: 0.95,       // ticket o clientes < 95% del promedio
    colchonEquilibrio: 0.1,  // vender < 10% sobre el punto de equilibrio = margen de seguridad bajo
    desvioOperativos: 5,     // puntos porcentuales sobre lo normal
    desvioCompras: 5,        // índice de compras: puntos sobre su promedio (solo monitoreo, sin meta)
    demoraAnormal: 1.15,     // ciclo > 115% del promedio = demora anormal
    desvioLabor: 3,          // labor cost: puntos sobre su referencia
    desvioMargen: 5,         // margen neto: puntos bajo su referencia

    // Alertas comparativas (mejora continua): cómo se arma la referencia
    referencia: {
        mismoDiaMin: 3,      // con ≥ 3 cierres del mismo día de la semana se compara contra ellos
        mismoDiaMax: 8,      // …usando como máximo los 8 más recientes
        recientes: 14,       // si no, contra los últimos 14 cierres
        minimo: 2,           // con menos de 2 cierres previos se compara contra la meta
        sigmas: 2,           // rango normal = promedio ± 2 desviaciones estándar
        racha: 4,            // N cierres seguidos del lado malo del promedio = tendencia
        ventanaRecurrencia: 7, // cuántos cierres atrás se busca si el problema ya se repitió
        plazoVerificacion: 7   // cierres para verificar el resultado de una acción
    }
};

// Escala de las barras del dashboard (valor que equivale al 100% de la barra)
export const ESCALAS_BARRA = {
    compras: 66,
    labor: 60,
    ciclo: 40,
    limite: 50    // por encima de este % de barra se pinta en rojo
};
