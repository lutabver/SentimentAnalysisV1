/* ==========================================================
   diagnosticos.js — Motor de mejora continua: HOY vs HISTORIAL (sin DOM)
   1. Alertas comparativas: cada indicador del día contra una referencia
      del propio negocio (mismo día de la semana o últimos cierres),
      con rango normal (promedio ± 2σ), tendencia y recurrencia.
   2. Planes de acción (PDCA): cada alerta se convierte en
      problema → evidencia numérica → causa posible → acción → resultado a medir,
      ordenados por dinero en juego (Pareto).
   Devuelve { contexto, alertas, acciones }; la capa ui lo convierte en tarjetas.
   Para agregar un indicador: entrada en INDICADORES.
   Para agregar un plan: función en PLANES (recibe la alerta y el contexto).
   ========================================================== */
import { METAS } from '../config/metas.js';
import { formatoDinero, pct, minutos, numero } from '../utils/formato.js';

const R = METAS.referencia;
const DIAS = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
const diaSemana = fecha => new Date(`${fecha}T12:00:00`).getDay();
const ratio = (a, b) => b > 0 ? (a / b) * 100 : null;
const pts = v => `${v > 0 ? '+' : ''}${v.toFixed(1)} pts`;

// Indicadores que se comparan. `umbral` es la variación mínima que importa en la práctica:
// en puntos ('pts'), relativa al promedio ('rel') o en unidades ('abs').
const INDICADORES = [
    { clave: 'ventas', nombre: 'Ventas', fmt: formatoDinero, valor: r => r.ventas || 0,
      mejorSiSube: true, umbral: 1 - METAS.caidaVentas, tipo: 'rel',
      investigar: ['¿Llegaron menos clientes o cada cliente gastó menos? Compara clientes atendidos con días similares.',
                   '¿Hubo factores externos: clima, feriado, evento, obra en la calle, promoción de la competencia?',
                   '¿Faltó algún producto o hubo fallas que obligaron a rechazar pedidos?',
                   'Cuadra el cierre de caja con las comandas: ¿quedaron ventas sin registrar?'] },
    { clave: 'compras', nombre: 'Índice de Compras', fmt: pct, valor: r => ratio(r.insumos || 0, r.ventas),
      mejorSiSube: false, umbral: METAS.desvioCompras, tipo: 'pts',
      investigar: ['¿Se compró stock para varios días? Una compra adelantada sube el índice sin que haya pérdida.',
                   'Compara las facturas del día con el precio pactado con cada proveedor.',
                   'Pesa las porciones de los platos más vendidos contra la receta estándar.',
                   'Revisa merma y desperdicio al cierre (basurero, producto vencido, devoluciones).'] },
    { clave: 'labor', nombre: 'Labor Cost', fmt: pct, valor: r => ratio(r.nomina || 0, r.ventas),
      mejorSiSube: false, umbral: METAS.desvioLabor, tipo: 'pts', meta: METAS.laborCost.meta,
      investigar: ['Compara las horas trabajadas con el flujo de clientes por franja horaria: ¿hubo horas sin clientes?',
                   '¿Hubo horas extra, personal adicional o pagos fuera de lo normal (bonos, liquidaciones)?',
                   '¿La nómina subió o fueron las ventas las que bajaron? Revisa la alerta de ventas.'] },
    { clave: 'operativos', nombre: 'Gastos Operativos', fmt: pct, valor: r => ratio(r.operativos || 0, r.ventas),
      mejorSiSube: false, umbral: METAS.desvioOperativos, tipo: 'pts',
      investigar: ['Lista los gastos del día y marca cuál no aparece en un día normal.',
                   '¿Es un gasto único (reparación, compra de equipo) o uno que se repetirá (alza de servicio, arriendo)?',
                   '¿Se pagó por adelantado un gasto de varios días o del mes?'] },
    { clave: 'margen', nombre: 'Margen Neto', fmt: pct,
      valor: r => ratio((r.ventas || 0) - (r.insumos || 0) - (r.nomina || 0) - (r.operativos || 0), r.ventas),
      mejorSiSube: true, umbral: METAS.desvioMargen, tipo: 'pts', meta: METAS.margenNeto,
      investigar: ['¿Qué línea explica la caída: ventas, compras, nómina u otros gastos? Revisa el plan de acción de margen.',
                   '¿Es un día aislado o el margen viene bajando varios cierres seguidos?'] },
    { clave: 'ciclo', nombre: 'Tiempo de Ciclo', fmt: minutos, valor: r => r.ciclo || 0,
      mejorSiSube: false, umbral: METAS.demoraAnormal - 1, tipo: 'rel', meta: METAS.ciclo.meta,
      investigar: ['¿En qué franja horaria se acumuló la espera y en qué puesto se formó la cola (cocina, despacho, caja)?',
                   '¿Faltó preparación previa (mise en place) de algún ingrediente?',
                   '¿Hubo fallas de equipo, personal ausente o personal nuevo en la línea?'] },
    { clave: 'reclamos', nombre: 'Reclamos', fmt: numero, valor: r => r.reclamos || 0,
      mejorSiSube: false, umbral: 1, tipo: 'abs', meta: METAS.reclamos,
      investigar: ['Clasifica cada reclamo: demora, temperatura, sabor, error en el pedido, atención.',
                   '¿En qué turno y con qué plato ocurrió? ¿Se repite con días anteriores?'] }
];

// Promedio, desviación estándar, mínimo y máximo de una lista de números
function estadisticas(valores) {
    const n = valores.length;
    const media = valores.reduce((t, v) => t + v, 0) / n;
    const sigma = n > 1 ? Math.sqrt(valores.reduce((t, v) => t + (v - media) ** 2, 0) / (n - 1)) : 0;
    return { n, media, sigma, min: Math.min(...valores), max: Math.max(...valores) };
}

// Cierres contra los que se compara hoy: mismo día de la semana si hay suficientes, si no los más recientes
function elegirBase(hoy, historico) {
    const dia = diaSemana(hoy.fecha);
    const mismoDia = historico.filter(r => diaSemana(r.fecha) === dia).slice(-R.mismoDiaMax);
    if (mismoDia.length >= R.mismoDiaMin) {
        return { registros: mismoDia, descripcion: `Promedio de los últimos ${mismoDia.length} ${DIAS[dia]}` };
    }
    const recientes = historico.slice(-R.recientes);
    return { registros: recientes, descripcion: `Promedio de los últimos ${recientes.length} cierres` };
}

// Variación "desfavorable": positiva cuando el indicador empeoró
const desfavorable = (ind, valor, ref) => ind.mejorSiSube ? ref - valor : valor - ref;
const umbralAbsoluto = (ind, ref) => ind.tipo === 'rel' ? Math.abs(ref) * ind.umbral : ind.umbral;

// Compara un indicador del día contra su referencia. Devuelve la alerta o null si está dentro de lo normal.
function compararIndicador(ind, hoy, base, historico) {
    const observado = ind.valor(hoy);
    if (observado === null) return null;

    const valores = base.registros.map(ind.valor).filter(v => v !== null);
    const conHistorial = valores.length >= R.minimo;
    if (!conHistorial && ind.meta === undefined) return null;   // sin historia ni meta no hay con qué comparar

    const est = conHistorial ? estadisticas(valores) : null;
    const ref = conHistorial ? est.media : ind.meta;
    const umbral = umbralAbsoluto(ind, ref);
    const peor = desfavorable(ind, observado, ref);

    // Tendencia: cierres seguidos (terminando hoy) del lado malo de la referencia
    const serie = [...historico.map(ind.valor).filter(v => v !== null), observado];
    let racha = 0;
    for (let i = serie.length - 1; i >= 0 && desfavorable(ind, serie[i], ref) > 0; i--) racha++;

    // Todo reclamo cuenta (la meta es 0); el resto alerta solo si supera la variación práctica
    const fueraDeUmbral = ind.clave === 'reclamos' ? observado > 0 : peor > umbral;
    const tendencia = conHistorial && racha >= R.racha;
    if (!fueraDeUmbral && !tendencia) return null;

    // Recurrencia: en cuántos de los cierres anteriores ya se había pasado el umbral
    const ventana = historico.slice(-R.ventanaRecurrencia).map(ind.valor).filter(v => v !== null);
    const recurrencia = ventana.filter(v => desfavorable(ind, v, ref) > umbral).length;

    const fueraDeRango = est && est.n >= 5 && est.sigma > 0 && peor > R.sigmas * est.sigma;
    const grave = ind.clave === 'reclamos' ? observado >= 2 : peor > umbral * 2;
    const nivel = fueraDeUmbral && (fueraDeRango || grave || recurrencia >= 2) ? 'peligro' : 'atencion';

    const dif = observado - ref;
    const variacion = ind.tipo === 'pts' ? pts(dif)
        : ref !== 0 ? `${dif > 0 ? '+' : ''}${((dif / Math.abs(ref)) * 100).toFixed(1)}% (${dif > 0 ? '+' : ''}${ind.fmt(dif)})`
        : `${dif > 0 ? '+' : ''}${ind.fmt(dif)}`;

    const rango = !est ? null
        : est.n >= 5 && est.sigma > 0
            ? `Rango normal (±${R.sigmas}σ): ${ind.fmt(ind.clave === 'margen' ? est.media - R.sigmas * est.sigma : Math.max(0, est.media - R.sigmas * est.sigma))} – ${ind.fmt(est.media + R.sigmas * est.sigma)}`
            : `Rango observado: ${ind.fmt(est.min)} – ${ind.fmt(est.max)}`;

    const notas = [];
    if (fueraDeRango) notas.push('Fuera del rango normal: variación por causa especial, no es ruido del día a día.');
    if (tendencia) notas.push(`Tendencia: ${racha} cierres seguidos peor que la referencia.`);
    if (recurrencia > 0) notas.push(`Recurrente: ya ocurrió en ${recurrencia} de los últimos ${ventana.length} cierres.`);

    return {
        clave: ind.clave, nombre: ind.nombre, nivel, fmt: ind.fmt, fueraDeUmbral,
        observado, referencia: ref, dif, peor, umbral, racha, recurrencia,
        textoObservado: ind.fmt(observado),
        textoReferencia: ind.fmt(ref),
        baseReferencia: conHistorial ? `${base.descripcion}${ind.tipo === 'pts' ? ' (promedio de % diarios)' : ''}` : 'Meta del negocio (aún no hay historial suficiente)',
        rango, variacion,
        titulo: !fueraDeUmbral ? `${ind.nombre}: tendencia desfavorable`
            : `${ind.nombre} ${ind.mejorSiSube ? 'por debajo' : 'por encima'} ${conHistorial ? 'de lo habitual' : 'de la meta'}`,
        notas, investigar: ind.investigar
    };
}

/* ---------- Planes de acción (PDCA) ----------
   Cada plan recibe la alerta (a) y el contexto (c) y devuelve:
   { impacto ($ en juego hoy), titulo, problema, evidencia[], causa, accion, resultado{indicador, meta, plazo} } */
const plazo = `Promedio de los próximos ${R.plazoVerificacion} cierres`;
const evidenciaBase = a => [
    `Observado hoy: ${a.textoObservado}`,
    `Referencia: ${a.textoReferencia} (${a.baseReferencia.toLowerCase()})`,
    `Variación: ${a.variacion}`
];
// Si el problema se repite, la acción anterior no eliminó la causa raíz
const notaRecurrencia = a => a.recurrencia >= 2
    ? ` Como se repite (${a.recurrencia} veces en los últimos cierres), aplica los 5 porqués hasta llegar a la causa raíz y deja el ajuste como estándar escrito.`
    : '';
// Lo que cuesta en dinero una variación de puntos sobre las ventas del día
const dineroPorPuntos = (a, ventas) => Math.max(0, ventas * a.peor / 100);

const PLANES = {
    compras: (a, c) => ({
        impacto: dineroPorPuntos(a, c.hoy.ventas),
        titulo: 'Compras de alimentos fuera de lo normal',
        problema: `Por cada $100 vendidos se compraron $${a.observado.toFixed(1)} en alimentos, frente a $${a.referencia.toFixed(1)} de un día habitual.`,
        evidencia: [...evidenciaBase(a), `Dinero en juego hoy: ${formatoDinero(dineroPorPuntos(a, c.hoy.ventas))}`],
        causa: c.reportado('Falta Materia Prima')
            ? 'Se reportó falta de materia prima: probables compras de emergencia a mayor precio o sustitución de ingredientes.'
            : c.alerta('ventas')
                ? 'Las ventas bajaron pero se compró como un día normal: sobreproducción que termina en merma.'
                : 'Compra adelantada de stock, porciones fuera del estándar, merma o alza de precio del proveedor.',
        accion: `Durante ${R.plazoVerificacion} cierres: anota qué parte de la compra es stock para otros días, pesa 5 porciones de los 3 platos más vendidos contra la receta y compara cada factura con el precio pactado.${notaRecurrencia(a)}`,
        resultado: { indicador: 'Índice de Compras', meta: `≤ ${pct(a.referencia + METAS.desvioCompras / 2)}`, plazo }
    }),

    labor: (a, c) => {
        const ventasBajas = c.alerta('ventas') || (c.refVentas && c.hoy.ventas < c.refVentas);
        return {
            impacto: dineroPorPuntos(a, c.hoy.ventas),
            titulo: ventasBajas ? 'Horas de personal sin demanda que atender' : 'Nómina más alta de lo habitual',
            problema: ventasBajas
                ? `La nómina se mantuvo mientras las ventas bajaron: el ${pct(a.observado)} de lo vendido se fue en personal.`
                : `Con ventas normales, la nómina pesó ${pct(a.observado)} de lo vendido (habitual ${pct(a.referencia)}).`,
            evidencia: [...evidenciaBase(a),
                ...(c.refVentas ? [`Ventas hoy ${formatoDinero(c.hoy.ventas)} vs referencia ${formatoDinero(c.refVentas)}`] : []),
                `Dinero en juego hoy: ${formatoDinero(dineroPorPuntos(a, c.hoy.ventas))}`],
            causa: ventasBajas
                ? 'La planilla es fija y no se ajusta a la curva de demanda: hay horas valle con personal completo.'
                : 'Horas extra, personal adicional o un pago extraordinario registrado en la nómina del día.',
            accion: ventasBajas
                ? `Registra clientes por franja horaria durante ${R.plazoVerificacion} cierres y ajusta los turnos a esa curva (turnos partidos en horas valle). No recortes en horas pico para no subir el tiempo de ciclo.${notaRecurrencia(a)}`
                : `Separa en la planilla del día los pagos extraordinarios de los habituales y autoriza las horas extra con anticipación.${notaRecurrencia(a)}`,
            resultado: { indicador: 'Labor Cost', meta: `≤ ${pct(Math.min(a.referencia, METAS.laborCost.meta))} sin que el Tiempo de Ciclo supere ${METAS.ciclo.meta} min`, plazo }
        };
    },

    operativos: (a, c) => ({
        impacto: dineroPorPuntos(a, c.hoy.ventas),
        titulo: 'Gasto operativo extraordinario',
        problema: `Los otros gastos operativos pesaron ${pct(a.observado)} de las ventas, cuando lo habitual es ${pct(a.referencia)}.`,
        evidencia: [...evidenciaBase(a), `Gasto del día: ${formatoDinero(c.hoy.operativos || 0)}`,
            `Dinero en juego hoy: ${formatoDinero(dineroPorPuntos(a, c.hoy.ventas))}`],
        causa: 'Un gasto único (reparación, equipo, pago adelantado) o un gasto recurrente que subió de precio.',
        accion: `Identifica el gasto que no es habitual y clasifícalo: si es único, regístralo como extraordinario; si se repetirá, asígnale un presupuesto mensual y busca una segunda cotización.${notaRecurrencia(a)}`,
        resultado: { indicador: 'Gastos Operativos', meta: `≤ ${pct(a.referencia)}`, plazo }
    }),

    ventas: (a, c) => {
        const fallas = ['Demoras', 'Falta Personal', 'Falta Materia Prima', 'Equipo'].filter(c.reportado);
        return {
            impacto: Math.max(0, a.referencia - a.observado),
            titulo: 'Caída de ventas frente a días comparables',
            problema: `Se vendieron ${formatoDinero(a.referencia - a.observado)} menos que un día comparable.`,
            evidencia: evidenciaBase(a),
            causa: fallas.length
                ? `Venta perdida por capacidad: se reportó ${fallas.join(', ').toLowerCase()}, lo que limita cuántos pedidos se pueden atender.`
                : c.alerta('ciclo')
                    ? 'El servicio fue más lento de lo normal: la espera hace que clientes desistan o no regresen.'
                    : 'Menor demanda (clima, feriado, competencia) o ventas que no quedaron registradas en caja.',
            accion: fallas.length || c.alerta('ciclo')
                ? `Resuelve primero la falla operativa (ver su plan) y cuenta los pedidos rechazados o abandonados durante ${R.plazoVerificacion} cierres.${notaRecurrencia(a)}`
                : `Cuadra caja contra comandas del día. Si cuadra, anota el factor externo y prueba una acción comercial para este día de la semana (combo, promoción en redes) durante ${R.plazoVerificacion} cierres.${notaRecurrencia(a)}`,
            resultado: { indicador: 'Ventas', meta: `≥ ${formatoDinero(a.referencia)} por cierre`, plazo }
        };
    },

    ciclo: (a, c) => {
        const causas = [
            [c.reportado('Falta Personal'), 'Capacidad insuficiente: faltó personal en la línea.',
                'Refuerza el puesto de despacho con un ayudante en la franja de mayor demanda.'],
            [c.reportado('Equipo'), 'Falla de equipo que frenó la producción.',
                'Crea una lista de mantenimiento preventivo semanal para los equipos críticos (plancha, freidora, refrigeración).'],
            [c.causa('Cocina Saturada'), 'Desorden y saturación en cocina: tiempo perdido buscando y moviendo insumos.',
                'Aplica 5S en la estación más lenta: cada insumo con lugar fijo y rotulado, lo de uso frecuente al alcance.'],
            [c.causa('Inexperiencia'), 'Personal sin método estándar: cada uno prepara a su ritmo.',
                'Escribe el paso a paso (trabajo estandarizado) de los 3 platos más vendidos y entrena al personal nuevo con él.'],
            [c.causa('Alta Demanda') || c.hoy.ventas > (c.refVentas || Infinity), 'Cuello de botella por volumen: la demanda superó la capacidad de la línea.',
                'Aumenta la preparación previa (mise en place) de los ingredientes que más frenaron la línea antes del próximo turno similar.']
        ].find(([aplica]) => aplica);
        return {
            impacto: 0,
            titulo: 'Tiempo de servicio fuera de lo habitual',
            problema: `Los clientes esperaron ${minutos(a.observado)}, frente a ${minutos(a.referencia)} de un día habitual.`,
            evidencia: [...evidenciaBase(a), `Problemas reportados: ${c.hoy.problemas_marcados || 'Ninguno'} · Causas marcadas: ${c.hoy.causa_marcada || 'N/A'}`],
            causa: causas ? causas[1] : 'No se marcó ninguna causa: no hay evidencia suficiente para saber dónde se formó la cola.',
            accion: (causas ? causas[2] : `Mide durante ${R.plazoVerificacion} cierres el tiempo de cada etapa (toma de pedido, cocina, despacho) en la hora pico para ubicar el cuello de botella.`) + notaRecurrencia(a),
            resultado: { indicador: 'Tiempo de Ciclo', meta: `≤ ${minutos(Math.min(a.referencia, METAS.ciclo.meta))}`, plazo }
        };
    },

    reclamos: (a, c) => ({
        impacto: 0,
        titulo: 'Reclamos de clientes',
        problema: `Se registraron ${numero(a.observado)} reclamo(s) hoy (referencia ${a.textoReferencia}).`,
        evidencia: evidenciaBase(a),
        causa: c.alerta('ciclo')
            ? 'Coinciden con un tiempo de servicio más alto de lo normal: la demora es la causa probable.'
            : 'Sin causa registrada: puede ser calidad del plato, error en el pedido o atención.',
        accion: `Registra cada reclamo con tipo, plato y turno. Aplica los 5 porqués al de hoy y comparte la causa con el equipo en la reunión previa al turno.${notaRecurrencia(a)}`,
        resultado: { indicador: 'Reclamos', meta: `0 en los próximos ${R.plazoVerificacion} cierres`, plazo: `Suma de los próximos ${R.plazoVerificacion} cierres` }
    }),

    // Margen: Pareto de qué línea explica la diferencia contra la referencia
    margen: (a, c) => {
        const ventas = c.hoy.ventas || 0;
        const contribuciones = ['compras', 'labor', 'operativos']
            .map(clave => {
                const ind = INDICADORES.find(i => i.clave === clave);
                const ref = c.referencias[clave];
                return ref === undefined ? null : { nombre: ind.nombre, dinero: ventas * (ind.valor(c.hoy) - ref) / 100 };
            })
            .filter(x => x && x.dinero > 0)
            .sort((x, y) => y.dinero - x.dinero);
        if (c.refVentas && c.hoy.ventas < c.refVentas) {
            contribuciones.push({ nombre: 'Ventas bajas (costos fijos repartidos en menos venta)', dinero: 0 });
        }
        const principal = contribuciones[0];
        return {
            impacto: dineroPorPuntos(a, ventas),
            titulo: 'Margen del día por debajo de lo habitual',
            problema: `De cada $100 vendidos quedaron $${a.observado.toFixed(1)}, frente a $${a.referencia.toFixed(1)} de un día habitual.`,
            evidencia: [...evidenciaBase(a),
                ...contribuciones.map(x => x.dinero > 0 ? `${x.nombre}: ${formatoDinero(x.dinero)} sobre lo habitual` : x.nombre)],
            causa: principal
                ? `La mayor parte de la diferencia viene de ${principal.nombre}${principal.dinero > 0 ? ` (${formatoDinero(principal.dinero)})` : ''}.`
                : 'Ninguna línea de costo sobresale por sí sola: la caída se reparte entre varias.',
            accion: principal
                ? `Ataca primero ${principal.nombre} siguiendo su plan de acción; es la que más rápido recupera el margen.${notaRecurrencia(a)}`
                : `Revisa las tres líneas de costo en el próximo cierre y prioriza la que más subió.${notaRecurrencia(a)}`,
            resultado: { indicador: 'Margen Neto', meta: `≥ ${pct(Math.max(a.referencia, METAS.margenNeto))}`, plazo }
        };
    }
};

export function generarDiagnosticos(hoy, historico) {
    const base = elegirBase(hoy, historico);
    const alertas = INDICADORES.map(ind => compararIndicador(ind, hoy, base, historico)).filter(Boolean);

    // Referencias de cada indicador (las usa el Pareto del margen)
    const referencias = {};
    INDICADORES.forEach(ind => {
        const vals = base.registros.map(ind.valor).filter(v => v !== null);
        if (vals.length >= R.minimo) referencias[ind.clave] = estadisticas(vals).media;
    });

    const contexto = {
        hoy, referencias,
        refVentas: referencias.ventas,
        alerta: clave => alertas.some(a => a.clave === clave && a.fueraDeUmbral),
        reportado: texto => (hoy.problemas_marcados || '').includes(texto),
        causa: texto => (hoy.causa_marcada || '').includes(texto)
    };

    // Solo se convierten en plan las variaciones reales del día (no las tendencias leves)
    const ordenNivel = { peligro: 0, atencion: 1 };
    const acciones = alertas
        .filter(a => a.fueraDeUmbral)
        .map(a => ({ ...PLANES[a.clave](a, contexto), nivel: a.nivel, clave: a.clave }))
        .sort((x, y) => ordenNivel[x.nivel] - ordenNivel[y.nivel] || y.impacto - x.impacto)
        .map((p, i) => ({ ...p, prioridad: i + 1 }));

    alertas.sort((x, y) => ordenNivel[x.nivel] - ordenNivel[y.nivel]);

    return {
        contexto: {
            fecha: hoy.fecha,
            base: historico.length >= R.minimo ? base.descripcion : 'Metas del negocio (menos de 2 cierres previos)',
            cierresPrevios: historico.length,
            indicadoresRevisados: INDICADORES.length
        },
        alertas,
        acciones
    };
}
