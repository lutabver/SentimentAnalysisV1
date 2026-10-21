/* ==========================================================
   indicadores.js — dashboard de cada indicador (sin DOM)
   Para cada indicador: serie diaria, carta de control (promedio ± 2σ),
   patrón por día de la semana, tendencia y lectura de estabilidad del proceso.
   Para agregar un indicador: entrada en CATALOGO (la clave debe coincidir con kpis.js).
   ========================================================== */
import { METAS } from '../config/metas.js';

const ratio = (a, b) => b > 0 ? (a / b) * 100 : null;
const resultado = r => (r.ventas || 0) - (r.insumos || 0) - (r.nomina || 0) - (r.operativos || 0);

export const CATALOGO = [
    { clave: 'ventas', nombre: 'Ventas', formato: 'dinero', color: '#F2B400', mejorSiSube: true,
      formula: 'Ventas netas del cierre.',
      valor: r => r.ventas || 0 },
    { clave: 'compras', nombre: 'Índice de Compras', formato: 'pct', color: '#D97706', mejorSiSube: false,
      formula: 'Compras de alimentos del día ÷ ventas netas del día × 100. Sin meta fija: se vigila contra su propio promedio.',
      valor: r => ratio(r.insumos || 0, r.ventas) },
    { clave: 'labor', nombre: 'Labor Cost', formato: 'pct', color: '#9333EA', mejorSiSube: false, meta: METAS.laborCost.meta,
      formula: 'Nómina del día ÷ ventas netas × 100.',
      valor: r => ratio(r.nomina || 0, r.ventas) },
    { clave: 'prime', nombre: 'Prime Cost (Compras + Labor)', formato: 'pct', color: '#C2410C', mejorSiSube: false, meta: METAS.primeCost.meta,
      formula: '(Compras de alimentos + nómina) ÷ ventas netas × 100.',
      valor: r => ratio((r.insumos || 0) + (r.nomina || 0), r.ventas) },
    { clave: 'operativos', nombre: 'Gastos Operativos', formato: 'pct', color: '#9C7A60', mejorSiSube: false,
      formula: 'Otros gastos operativos ÷ ventas netas × 100.',
      valor: r => ratio(r.operativos || 0, r.ventas) },
    { clave: 'margen', nombre: 'Margen Neto', formato: 'pct', color: '#16A34A', mejorSiSube: true, meta: METAS.margenNeto,
      formula: 'Resultado operativo estimado ÷ ventas netas × 100.',
      valor: r => ratio(resultado(r), r.ventas) },
    { clave: 'utilidad', nombre: 'Resultado Operativo Estimado', formato: 'dinero', color: '#15803D', mejorSiSube: true, meta: 0,
      formula: 'Ventas netas − compras de insumos − nómina − otros gastos operativos.',
      valor: resultado },
    { clave: 'equilibrio', nombre: 'Punto de Equilibrio', formato: 'dinero', color: '#0E7490', mejorSiSube: false,
      formula: '(Nómina + gastos operativos) ÷ (1 − compras/ventas): ventas mínimas del día para no perder.',
      valor: r => {
          const c = r.ventas > 0 ? (r.insumos || 0) / r.ventas : null;
          return c !== null && c < 1 ? ((r.nomina || 0) + (r.operativos || 0)) / (1 - c) : null;
      } },
    { clave: 'ciclo', nombre: 'Tiempo de Ciclo', formato: 'min', color: '#DC2626', mejorSiSube: false, meta: METAS.ciclo.meta,
      formula: 'Minutos promedio de espera del cliente en el cierre.',
      valor: r => r.ciclo || 0 },
    { clave: 'reclamos', nombre: 'Reclamos', formato: 'num', color: '#BE123C', mejorSiSube: false, meta: METAS.reclamos,
      formula: 'Cantidad de reclamos de clientes registrados en el cierre.',
      valor: r => r.reclamos || 0 }
];

export const buscarIndicador = clave => CATALOGO.find(i => i.clave === clave);

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const media = v => v.reduce((t, x) => t + x, 0) / v.length;

export function analizarIndicador(clave, registros) {
    const ind = buscarIndicador(clave);
    const puntos = registros.map(r => ({ fecha: r.fecha, valor: ind.valor(r) })).filter(p => p.valor !== null);
    if (puntos.length === 0) return { ind, puntos, vacio: true };

    const valores = puntos.map(p => p.valor);
    const n = valores.length;
    const prom = media(valores);
    const sigma = n > 1 ? Math.sqrt(valores.reduce((t, v) => t + (v - prom) ** 2, 0) / (n - 1)) : 0;
    const conLimites = n >= 5 && sigma > 0;
    const k = METAS.referencia.sigmas;
    const puedeSerNegativo = ind.clave === 'margen' || ind.clave === 'utilidad';
    const limites = conLimites
        ? { superior: prom + k * sigma, inferior: puedeSerNegativo ? prom - k * sigma : Math.max(0, prom - k * sigma) }
        : null;

    // "Peor" depende de la dirección del indicador
    const peor = (a, b) => ind.mejorSiSube ? a < b : a > b;
    const mejorPunto = puntos.reduce((m, p) => peor(m.valor, p.valor) ? p : m);
    const peorPunto = puntos.reduce((m, p) => peor(p.valor, m.valor) ? p : m);

    const cumpleMeta = v => ind.meta === undefined ? null
        : ind.clave === 'utilidad' ? v > ind.meta
        : ind.mejorSiSube ? v >= ind.meta : v <= ind.meta;
    const fueraMeta = ind.meta === undefined ? null : valores.filter(v => cumpleMeta(v) === false).length;
    const fueraControl = limites ? puntos.filter(p => p.valor > limites.superior || p.valor < limites.inferior) : [];

    // Tendencia: últimos 7 cierres contra los 7 anteriores
    const ult = valores.slice(-7), ant = valores.slice(-14, -7);
    const tendencia = ant.length >= 3 ? { actual: media(ult), anterior: media(ant), n: ult.length, nAnt: ant.length } : null;

    // Racha: cierres seguidos (terminando en el último) del lado malo del promedio
    let racha = 0;
    for (let i = n - 1; i >= 0 && peor(valores[i], prom); i--) racha++;

    // Patrón por día de la semana
    const porDia = DIAS.map((dia, d) => {
        const v = puntos.filter(p => new Date(`${p.fecha}T12:00:00`).getDay() === d).map(p => p.valor);
        return { dia, n: v.length, prom: v.length ? media(v) : null };
    });

    // Lectura de estabilidad (reglas básicas de control estadístico)
    const lectura = [];
    if (!conLimites) lectura.push('Se necesitan al menos 5 cierres con variación para calcular los límites de control.');
    else if (fueraControl.length === 0 && racha < 7) lectura.push('Proceso estable: todas las variaciones están dentro de los límites de control. Para mejorar hay que cambiar el método, no reaccionar a días sueltos.');
    if (fueraControl.length) lectura.push(`${fueraControl.length} cierre(s) fuera de los límites de control (${fueraControl.map(p => p.fecha).join(', ')}): causa especial que conviene investigar día por día.`);
    if (racha >= 7) lectura.push(`${racha} cierres seguidos peor que el promedio: el proceso cambió de nivel, no es casualidad.`);
    else if (racha >= METAS.referencia.racha) lectura.push(`${racha} cierres seguidos peor que el promedio: posible tendencia, vigílalo.`);
    if (conLimites && Math.abs(prom) > 0 && sigma / Math.abs(prom) > 0.25) lectura.push(`Variabilidad alta (coeficiente de variación ${(sigma / Math.abs(prom) * 100).toFixed(0)}%): antes de bajar el promedio conviene estandarizar para que los días se parezcan.`);
    if (ind.meta !== undefined && fueraMeta > 0) lectura.push(`No cumplió la meta en ${fueraMeta} de ${n} cierres (${(fueraMeta / n * 100).toFixed(0)}%).`);

    return {
        ind, puntos, vacio: false, n, prom, sigma, limites, mejorPunto, peorPunto,
        ultimo: puntos[n - 1], fueraMeta, fueraControl, tendencia, racha, porDia, lectura, cumpleMeta
    };
}
