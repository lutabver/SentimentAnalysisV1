/* ==========================================================
   dashboard.js — pestaña "Dashboard": tarjetas globales, sección de deudas, diagnóstico y gráficos
   ========================================================== */
import { obtenerRegistros, obtenerDeudas } from '../state/store.js';
import { ESCALAS_BARRA } from '../config/metas.js';
import { calcularResumenGlobal } from '../domain/resumenGlobal.js';
import { generarDiagnosticos } from '../domain/diagnosticos.js';
import { resumenDeudas, utilidadReal, pagosPorRegistro } from '../domain/deudas.js';
import { formatoDinero, pct } from '../utils/formato.js';
import { animarNumero, llenarBarra } from '../utils/animaciones.js';
import { tarjetaKPIs } from './components/tarjetaKPIs.js';
import { tarjetaResumenReal } from './components/tarjetaResumen.js';
import { renderDiagnosticos } from './components/alertas.js';
import { renderizarGraficos, SERIES_VACIAS } from './charts.js';
import { actualizarDeudas } from './deudas.js';

// Tarjetas "Deuda pendiente", "Pagado en deudas" y "Utilidad real".
// Utilidad real = Utilidad neta − lo que ya se pagó de deudas (puede quedar negativa).
function pintarDeudas(utilidad) {
    const r = resumenDeudas(obtenerDeudas());
    const real = utilidadReal(utilidad, r.pagado);

    animarNumero(document.getElementById('res-deuda'), r.pendiente, formatoDinero);
    llenarBarra('bar-deuda', r.avance, 100, '#16A34A', '#16A34A');
    document.getElementById('sub-deuda').innerText =
        r.total === 0 ? 'Sin deudas registradas'
        : r.pendiente === 0 ? '✓ Todas saldadas'
        : `${pct(r.avance)} pagado de ${formatoDinero(r.total)}`;

    animarNumero(document.getElementById('res-pagado'), r.pagado, formatoDinero);
    document.getElementById('sub-pagado').innerText =
        utilidad > 0 && r.pagado > 0 ? `${pct(r.pagado / utilidad * 100)} del resultado operativo estimado se fue en deudas`
        : r.pagado > 0 ? 'Se pagó deuda sin resultado operativo positivo acumulado'
        : 'Aún no se ha pagado ninguna deuda';

    const elReal = document.getElementById('res-utilidad-real');
    animarNumero(elReal, real, formatoDinero);
    elReal.style.color = real < 0 ? '#F87171' : '#4ADE80';
    document.getElementById('sub-utilidad-real').innerText = real < 0
        ? 'Negativo: se pagó más deuda de lo que se ganó'
        : 'Lo que realmente le queda después de pagar deudas';
}

export function actualizarDashboard() {
    const baseDatos = obtenerRegistros();
    const contenedorAlertas = document.getElementById('alertas-sistema');
    document.getElementById('dash-registros').innerText = baseDatos.length + (baseDatos.length === 1 ? ' registro' : ' registros');
    actualizarDeudas();   // sección "Deudas": resumen y lista con abonos

    if (baseDatos.length === 0) {
        document.querySelectorAll('#dashboard [id^="res-"]').forEach(el => el.dataset.valor = 0);
        ['bar-compras', 'bar-ciclo', 'bar-labor'].forEach(id => document.getElementById(id).style.width = '0');
        // Deja las tarjetas en cero para que no queden cifras de registros ya borrados
        document.getElementById('res-compras').innerText = '0%';
        document.getElementById('res-labor').innerText = '0%';
        document.getElementById('res-ciclo').innerText = '0 Min';
        document.getElementById('res-utilidad').innerText = formatoDinero(0);
        pintarDeudas(0);
        contenedorAlertas.innerHTML = '<div class="card p-8 text-center md:col-span-2 xl:col-span-3"><img src="assets/logo_sando.png" alt="" class="w-20 mx-auto mb-3 opacity-70"><p class="font-display text-xl font-bold">Aún no hay datos</p><p class="text-cocoa-soft font-semibold mt-1">Ingresa los datos del día para que el motor prescriptivo analice tu operación.</p></div>';
        renderizarGraficos(SERIES_VACIAS);
        return;
    }

    // 1. Resumen global (tarjetas superiores)
    const g = calcularResumenGlobal(baseDatos, pagosPorRegistro(obtenerDeudas()));
    animarNumero(document.getElementById('res-compras'), g.compras, v => v.toFixed(1) + '%');
    animarNumero(document.getElementById('res-ciclo'), g.ciclo, v => v.toFixed(0) + ' Min');
    animarNumero(document.getElementById('res-labor'), g.labor, v => v.toFixed(1) + '%');
    animarNumero(document.getElementById('res-utilidad'), g.utilidad, formatoDinero);

    const { compras, labor, ciclo, limite } = ESCALAS_BARRA;
    llenarBarra('bar-compras', g.compras / compras * 100, 100, '#D97706', '#D97706');   // sin meta: un solo color
    llenarBarra('bar-labor', g.labor / labor * 100, limite, '#9333EA', '#DC2626');
    llenarBarra('bar-ciclo', g.ciclo / ciclo * 100, limite, '#16A34A', '#DC2626');

    // 2. Deudas: utilidad neta acumulada menos lo ya pagado de deudas
    pintarDeudas(g.utilidad);

    // 3. Mejora continua: alertas comparativas y planes de acción (hoy vs historial)
    const hoy = baseDatos[baseDatos.length - 1];      // último registro
    const historico = baseDatos.slice(0, -1);         // todos menos el de hoy

    let html = tarjetaKPIs(hoy, historico);
    html += renderDiagnosticos(generarDiagnosticos(hoy, historico));
    html += tarjetaResumenReal(hoy, historico);
    contenedorAlertas.innerHTML = html;

    // 4. Gráficos
    renderizarGraficos(g.series);
}
