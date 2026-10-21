/* ==========================================================
   resumenDia.js — Motor de "Resumen Real" (sin DOM)
   Traduce los números del día a lo que le pasa al negocio:
   hallazgos ordenados por gravedad, veredicto y reparto de cada $100.
   Para agregar un nuevo hallazgo, añade un bloque `if (...) agregar(...)`.
   ========================================================== */
import { METAS } from '../config/metas.js';
import { calcularKPIs } from './kpis.js';
import { formatoDinero, pct } from '../utils/formato.js';

export function analizarDia(hoy, historico) {
    const h = calcularKPIs([hoy]);
    const p = historico.length > 0 ? calcularKPIs(historico) : null;
    const reportado = texto => (hoy.problemas_marcados || '').includes(texto);
    const causa = texto => (hoy.causa_marcada || '').includes(texto);
    const ventas = hoy.ventas || 0;
    const nomina = hoy.nomina || 0;
    const operativos = hoy.operativos || 0;
    const { laborCost, ciclo } = METAS;

    // Cada hallazgo: gravedad (para ordenar), dinero en juego, qué pasa, por qué y qué hacer.
    // `esCosto` marca los que suman a la "fuga" de dinero por costos fuera de meta.
    const hallazgos = [];
    const agregar = (gravedad, dinero, titulo, quePasa, porQue, accion, esCosto = false) =>
        hallazgos.push({ gravedad, dinero, titulo, quePasa, porQue, accion, esCosto });

    if (ventas <= 0) {
        agregar(3, 0, 'No hay ventas registradas', 'El registro de hoy no tiene ventas, así que ningún porcentaje de costo es confiable.',
            'Sin ventas no se puede medir si el negocio gana o pierde.', 'Verifica que el cierre de caja se haya ingresado correctamente.');
    }

    if (ventas > 0 && h.utilidad < 0) {
        agregar(3, -h.utilidad, 'El día cerró con pérdida',
            `Vendiste ${formatoDinero(ventas)} pero los costos sumaron ${formatoDinero(ventas - h.utilidad)}. Perdiste ${formatoDinero(-h.utilidad)}.`,
            'Cada día así se paga con la ganancia de otros días o con dinero del bolsillo del dueño.',
            'Ataca primero el costo con mayor exceso de la lista; es el que más rápido detiene la pérdida.');
    } else if (ventas > 0 && h.margen < METAS.margenNeto) {
        agregar(2, ventas * 0.10 - h.utilidad, 'Ganancia demasiado delgada',
            `De cada $100 vendidos solo quedaron $${h.margen.toFixed(1)} de ganancia (meta: $10).`,
            'Con un margen así cualquier imprevisto (una avería, una mala semana) te deja en pérdida.',
            'Reduce el costo más alto del día y sube el ticket promedio con venta sugestiva.');
    }

    // Índice de compras: sin meta fija, se vigila contra su propio promedio histórico
    const comprasAltas = ventas > 0 && p && h.compras > p.compras + METAS.desvioCompras;
    if (comprasAltas) {
        const exceso = ventas * (h.compras - p.compras) / 100;
        let porQue = `Normalmente tu índice de compras es ${pct(p.compras)}; hoy subió ${(h.compras - p.compras).toFixed(1)} puntos. Algo cambió hoy: porciones, desperdicio, robo hormiga o precio del proveedor.`;
        if (reportado('Falta Materia Prima')) porQue = 'Reportaste falta de materia prima: es probable que se hayan hecho compras de emergencia más caras o se cambiaran ingredientes.';
        else if (h.ventas < p.ventas * 0.9) porQue = 'Las ventas bajaron pero se compró casi lo mismo en alimentos: se preparó de más y eso termina en merma.';
        agregar(2, exceso, 'Índice de compras por encima de lo normal',
            `De cada $100 vendidos, $${h.compras.toFixed(1)} se fueron en compras de alimentos (índice de compras ${pct(h.compras)}). Son ${formatoDinero(exceso)} más que en un día normal.`,
            porQue,
            'Pesa 5 porciones de los platos más vendidos, compara la factura del proveedor con el precio pactado y revisa el basurero al cierre.', true);
    }

    if (ventas > 0 && h.labor > laborCost.meta) {
        const exceso = ventas * (h.labor - laborCost.meta) / 100;
        let porQue = 'La nómina es un costo fijo: si no vendes lo suficiente para cubrirla, se come la ganancia.';
        if (p && h.ventas < p.ventas) porQue = `Vendiste ${formatoDinero(p.ventas - h.ventas)} menos que tu promedio, pero la planilla no se ajustó. Hubo gente esperando sin clientes que atender.`;
        else if (reportado('Falta Personal')) porQue = 'Reportaste falta de personal y aun así la nómina es alta: revisa horas extra o turnos mal distribuidos.';
        agregar(h.labor > laborCost.tope ? 3 : 2, exceso, 'La nómina pesa más de lo que se vende',
            `De cada $100 vendidos, $${h.labor.toFixed(1)} se fueron en sueldos. Son ${formatoDinero(exceso)} por encima de la meta del 30%.`,
            porQue,
            'Cruza las horas de mayor y menor venta con el horario del personal y recorta o mueve turnos en las horas valle.', true);
    }

    if (ventas > 0 && p && p.operativos > 0 && h.operativos > p.operativos + METAS.desvioOperativos) {
        const exceso = ventas * (h.operativos - p.operativos) / 100;
        agregar(1, exceso, 'Gastos operativos por encima de lo normal',
            `Los gastos operativos fueron ${pct(h.operativos)} de la venta, cuando normalmente son ${pct(p.operativos)}.`,
            reportado('Equipo') ? 'Reportaste fallas en equipo: las reparaciones o compras de emergencia suelen explicar este salto.' : 'Un gasto extraordinario o un gasto fijo cargado en un día de poca venta.',
            'Identifica qué gasto fue extraordinario y si se repetirá; si es fijo, distribúyelo en tu planificación semanal.', true);
    }

    if (p && p.ventas > 0 && h.ventas < p.ventas * METAS.caidaVentas) {
        const caida = p.ventas - h.ventas;
        const porTicket = p.ticket > 0 && h.ticket < p.ticket * METAS.caidaTicket;
        const porClientes = p.clientes > 0 && h.clientes < p.clientes * METAS.caidaTicket;
        const porQue = porTicket && porClientes ? 'Vinieron menos clientes y además cada uno gastó menos.'
            : porClientes ? `Vinieron menos clientes (${Math.round(h.clientes)} vs ${Math.round(p.clientes)} de promedio); cada uno gastó lo normal.`
            : porTicket ? `Vino la gente de siempre pero cada cliente gastó menos (${formatoDinero(h.ticket)} vs ${formatoDinero(p.ticket)}).`
            : 'La caída no se explica solo por clientes o ticket: revisa si hubo cierres, menú incompleto o problemas de cobro.';
        agregar(2, caida, 'Las ventas cayeron',
            `Vendiste ${formatoDinero(caida)} menos que tu promedio (${pct((caida / p.ventas) * 100)} de caída).`,
            porQue,
            porTicket ? 'Entrena al equipo en venta sugestiva (bebida, extra, postre) y revisa combos.' : 'Revisa si fue un día atípico (clima, feriado) o una tendencia; si se repite, activa promoción en horas valle.');
    }

    if (hoy.ciclo > ciclo.meta) {
        const conReclamos = hoy.reclamos > 0;
        let porQue = 'Un servicio lento reduce cuántos clientes puedes atender y aumenta las quejas.';
        if (reportado('Falta Personal')) porQue = 'Reportaste falta de personal: la línea no da abasto.';
        else if (causa('Alta Demanda')) porQue = 'Hubo un pico de demanda que la cocina no tenía preparado.';
        else if (causa('Cocina Saturada')) porQue = 'La cocina estuvo saturada o desordenada: el problema es de organización, no de volumen.';
        else if (causa('Inexperiencia')) porQue = 'La lentitud viene de personal sin experiencia en el puesto.';
        else if (reportado('Equipo')) porQue = 'Las fallas de equipo frenaron la producción.';
        agregar(hoy.ciclo > ciclo.tope ? 3 : 2, 0, 'El cliente está esperando demasiado',
            `El tiempo de ciclo fue ${hoy.ciclo} min (meta: 20 min)${p ? `; tu promedio es ${p.ciclo.toFixed(1)} min` : ''}.${conReclamos ? ' Además hubo reclamos: la espera ya se está notando.' : ''}`,
            porQue,
            'Identifica qué plato frenó la línea y aumenta su preparación previa (mise en place) antes del próximo turno.');
    }

    if (hoy.reclamos > 0) {
        agregar(hoy.reclamos > 1 ? 3 : 2, 0, 'Hay clientes insatisfechos',
            `Se registraron ${hoy.reclamos} reclamo(s)${p ? ` (promedio: ${p.reclamos.toFixed(1)})` : ''}.`,
            'Un cliente que se queja en voz alta representa a varios que no regresan sin decir nada.',
            'Habla hoy con el equipo sobre la causa de cada reclamo y deja anotado qué se corrige.');
    }

    if (reportado('Falta Materia Prima') && !comprasAltas) {
        agregar(1, 0, 'Faltó materia prima', 'Se reportó falta de insumos durante el turno.',
            'Platos agotados significan ventas perdidas que no aparecen en la caja.',
            'Revisa el inventario mínimo y el pedido al proveedor de los insumos que faltaron.');
    }

    hallazgos.sort((a, b) => b.gravedad - a.gravedad || b.dinero - a.dinero);

    const fugaTotal = hallazgos.filter(x => x.esCosto).reduce((t, x) => t + x.dinero, 0);
    const graves = hallazgos.filter(x => x.gravedad === 3).length;

    const veredicto = hallazgos.length === 0
        ? { color: '#6B4A33', titulo: 'Sin desviaciones contra las metas', descripcion: 'Los números de hoy están dentro de las metas. Es un solo día: confírmalo con la tendencia de la semana antes de sacar conclusiones.' }
        : graves > 0 || h.utilidad < 0
        ? { color: '#DC2626', titulo: 'Día en estado crítico', descripcion: `Se detectaron ${hallazgos.length} problema(s), ${graves} grave(s). El negocio está perdiendo dinero o muy cerca de hacerlo.` }
        : { color: '#D97706', titulo: 'Día con fugas de dinero', descripcion: `Se detectaron ${hallazgos.length} problema(s). El día dejó ganancia, pero menos de la que debería.` };

    // Cómo se repartió cada $100 vendidos
    const reparto = ventas > 0 ? [
        { nombre: 'Compras de alimentos', valor: hoy.insumos / ventas * 100, color: '#C2410C' },
        { nombre: 'Nómina', valor: nomina / ventas * 100, color: '#9333EA' },
        { nombre: 'Operativos', valor: operativos / ventas * 100, color: '#6B4A33' },
        { nombre: 'Te quedó', valor: h.margen, color: h.margen < 0 ? '#DC2626' : '#16A34A' }
    ] : [];

    return { h, p, hallazgos, veredicto, reparto, fugaTotal };
}
