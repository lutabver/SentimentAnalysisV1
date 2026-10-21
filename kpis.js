/* ==========================================================
   kpis.js — cálculo y evaluación de indicadores (sin DOM)
   ========================================================== */
import { METAS } from '../config/metas.js';
import { formatoDinero } from '../utils/formato.js';

// KPIs de un conjunto de registros (porcentajes ponderados por ventas, montos promediados por día)
export function calcularKPIs(arr) {
    const sumar = campo => arr.reduce((t, d) => t + (d[campo] || 0), 0);
    const ratio = (a, b) => b > 0 ? a / b : 0;
    const v = sumar('ventas'), ins = sumar('insumos'), nom = sumar('nomina'), op = sumar('operativos');
    return {
        ventas: v / arr.length,
        compras: ratio(ins, v) * 100,   // Índice de compras = compras de alimentos / ventas netas × 100
        labor: ratio(nom, v) * 100,
        operativos: ratio(op, v) * 100,
        prime: ratio(ins + nom, v) * 100,
        ticket: ratio(v, sumar('clientes')),
        clientes: sumar('clientes') / arr.length,
        ciclo: sumar('ciclo') / arr.length,
        utilidad: (v - ins - nom - op) / arr.length,   // ROE = ventas netas − compras de insumos − nómina − otros gastos operativos
        margen: ratio(v - ins - nom - op, v) * 100,
        reclamos: sumar('reclamos') / arr.length,
        // Punto de equilibrio: ventas mínimas del día para que el ROE no sea negativo.
        // Nómina y operativos se tratan como fijos; las compras crecen con la venta.
        equilibrio: ratio(ins, v) < 1 ? ((nom + op) / arr.length) / (1 - ratio(ins, v)) : 0
    };
}

// Estado de un KPI: 'ok' | 'atencion' | 'peligro'
const porTecho = (v, ok, tope) => v <= ok ? 'ok' : v <= tope ? 'atencion' : 'peligro';

// Radiografía del día: cada indicador contra su meta y contra el promedio histórico.
// Devuelve datos puros; el formato visual lo decide la capa ui (campo `formato`).
export function evaluarKPIsDelDia(hoy, historico) {
    const h = calcularKPIs([hoy]);
    const p = historico.length > 0 ? calcularKPIs(historico) : null;

    const vsHistorico = (v, prom) =>
        !p || prom === 0 ? 'neutro'
        : v >= prom ? 'ok'
        : v >= prom * METAS.caidaVentas ? 'atencion'
        : 'peligro';

    const { laborCost, primeCost, ciclo } = METAS;

    // Punto de equilibrio: cuánto colchón dejaron las ventas sobre el mínimo para no perder
    const sinEquilibrio = h.ventas > 0 && h.equilibrio === 0;   // las compras igualan o superan la venta
    const colchon = h.ventas - h.equilibrio;
    const estadoEquilibrio = sinEquilibrio || colchon < 0 ? 'peligro' : colchon < h.equilibrio * METAS.colchonEquilibrio ? 'atencion' : 'ok';
    const gastosAltos = p && h.operativos > p.operativos + METAS.desvioOperativos;

    // Índice de compras: sin meta, solo se monitorea contra su propio promedio
    const vsPromedioCompras = (v, prom) =>
        !p ? 'neutro' : v > prom + METAS.desvioCompras ? 'atencion' : 'neutro';

    return [
        { clave: 'compras', nombre: 'Índice de Compras', hoy: h.compras, prom: p && p.compras, formato: 'pct', meta: 'Monitoreo', mejorSiSube: false, puntos: true, estado: vsPromedioCompras(h.compras, p && p.compras),
          lectura: { atencion: 'Compras de alimentos por encima de lo habitual.', neutro: 'Compras de alimentos sobre ventas netas del día.' } },
        { clave: 'labor', nombre: 'Labor Cost', hoy: h.labor, prom: p && p.labor, formato: 'pct', meta: `Meta ≤ ${laborCost.meta}%`, mejorSiSube: false, puntos: true, estado: porTecho(h.labor, laborCost.meta, laborCost.tope),
          lectura: { ok: 'Nómina proporcional a las ventas.', atencion: 'Nómina algo pesada para lo vendido.', peligro: 'Nómina desproporcionada a las ventas.' } },
        { clave: 'prime', nombre: 'Prime Cost (Compras + Labor)', hoy: h.prime, prom: p && p.prime, formato: 'pct', meta: `Meta ≤ ${primeCost.meta}%`, mejorSiSube: false, puntos: true, estado: porTecho(h.prime, primeCost.meta, primeCost.tope),
          lectura: { ok: 'Costos principales sanos.', atencion: 'Costos principales al límite.', peligro: 'Los costos principales se comen el margen.' } },
        { clave: 'margen', nombre: 'Margen Neto', hoy: h.margen, prom: p && p.margen, formato: 'pct', meta: `Meta ≥ ${METAS.margenNeto}%`, mejorSiSube: true, puntos: true, estado: h.margen >= METAS.margenNeto ? 'ok' : h.margen > 0 ? 'atencion' : 'peligro',
          lectura: { ok: 'El día deja ganancia saludable.', atencion: 'Ganancia muy ajustada.', peligro: 'El día operó a pérdida.' } },
        { clave: 'utilidad', nombre: 'Resultado Operativo Estimado', hoy: h.utilidad, prom: p && p.utilidad, formato: 'dinero', meta: 'Meta > $0', mejorSiSube: true, estado: h.utilidad > 0 ? 'ok' : 'peligro',
          lectura: { ok: 'Resultado positivo.', peligro: 'Resultado negativo.' } },
        { clave: 'ventas', nombre: 'Ventas', hoy: h.ventas, prom: p && p.ventas, formato: 'dinero', meta: 'Meta ≥ promedio', mejorSiSube: true, estado: vsHistorico(h.ventas, p && p.ventas),
          lectura: { ok: 'Ventas iguales o mejores a lo normal.', atencion: 'Ventas un poco bajo lo normal.', peligro: 'Caída fuerte de ventas.', neutro: 'Sin historial para comparar.' } },
        { clave: 'operativos', nombre: 'Gastos Operativos', hoy: h.operativos, prom: p && p.operativos, formato: 'pct', meta: 'Meta ≤ promedio', mejorSiSube: false, puntos: true, estado: !p ? 'neutro' : gastosAltos ? 'atencion' : 'ok',
          lectura: { ok: 'Gastos operativos dentro de lo habitual.', atencion: 'Gastos operativos por encima de lo normal: identificar el gasto extra.', neutro: 'Sin historial para comparar.' } },
        { clave: 'equilibrio', nombre: 'Punto de Equilibrio', hoy: h.equilibrio, prom: p && p.equilibrio, formato: 'dinero', meta: 'Ventas mínimas para no perder', mejorSiSube: false, estado: estadoEquilibrio,
          lectura: sinEquilibrio
            ? { peligro: 'Las compras igualan o superan la venta: ningún nivel de ventas cubre los gastos así.' }
            : { ok: `Vendiste ${formatoDinero(colchon)} por encima del mínimo.`, atencion: `Solo ${formatoDinero(colchon)} sobre el mínimo: margen de seguridad bajo.`, peligro: `Faltaron ${formatoDinero(-colchon)} de ventas para cubrir los gastos.` } },
        { clave: 'ciclo', nombre: 'Tiempo de Ciclo', hoy: h.ciclo, prom: p && p.ciclo, formato: 'min', meta: `Meta ≤ ${ciclo.meta} min`, mejorSiSube: false, estado: porTecho(h.ciclo, ciclo.meta, ciclo.tope),
          lectura: { ok: 'Servicio ágil.', atencion: 'Servicio algo lento.', peligro: 'Servicio demasiado lento.' } },
        { clave: 'reclamos', nombre: 'Reclamos', hoy: h.reclamos, prom: p && p.reclamos, formato: 'num', meta: `Meta = ${METAS.reclamos}`, mejorSiSube: false, estado: h.reclamos === 0 ? 'ok' : h.reclamos === 1 ? 'atencion' : 'peligro',
          lectura: { ok: 'Sin quejas de clientes.', atencion: 'Un reclamo registrado.', peligro: 'Varios reclamos; revisar calidad.' } }
    ];
}

// Cuenta cuántos KPIs hay en cada estado
export function contarEstados(kpis) {
    const conteo = { ok: 0, atencion: 0, peligro: 0 };
    kpis.forEach(k => { if (conteo[k.estado] !== undefined) conteo[k.estado]++; });
    return conteo;
}
