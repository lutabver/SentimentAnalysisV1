/* ==========================================================
   charts.js — gráficos de tendencia (Chart.js, global por CDN)
   ========================================================== */
let chartCiclo = null;
let chartVentas = null;
let chartDeudas = null;

export function configurarGraficos() {
    Chart.defaults.font.family = "'Nunito', sans-serif";
    Chart.defaults.font.weight = '700';
    Chart.defaults.color = '#6B4A33';
    Chart.defaults.plugins.tooltip.backgroundColor = '#3B2414';
    Chart.defaults.plugins.tooltip.titleColor = '#FFC72C';
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
}

export function renderizarGraficos({ fechas, ciclos, ventas, insumos, nomina, operativos, utilidad, pagoDeudas, utilidadReal }) {
    if (chartCiclo) chartCiclo.destroy();
    const metaLine = Array(fechas.length).fill(20);

    chartCiclo = new Chart(document.getElementById('graficoCiclo').getContext('2d'), {
        type: 'line',
        data: {
            labels: fechas,
            datasets: [
                {
                    label: 'Minutos de Espera Real', data: ciclos, borderColor: '#3B2414', backgroundColor: 'rgba(255, 199, 44, 0.3)', fill: true, tension: 0.4, borderWidth: 3, pointBackgroundColor: '#FFC72C', pointBorderColor: '#3B2414', pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 8
                },
                {
                    label: 'Meta Máxima (20 Min)', data: metaLine, borderColor: '#DC2626', borderWidth: 2, borderDash: [5, 5], fill: false, pointRadius: 0
                }
            ]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, suggestedMax: 30, grid: { color: 'rgba(59, 36, 20, 0.08)' } }, x: { grid: { display: false } } } }
    });

    if (chartVentas) chartVentas.destroy();
    chartVentas = new Chart(document.getElementById('graficoVentas').getContext('2d'), {
        type: 'bar',
        data: {
            labels: fechas,
            datasets: [
                { label: 'Ventas ($)', data: ventas, backgroundColor: '#F2B400', borderRadius: 6 },
                { label: 'Insumos ($)', data: insumos, backgroundColor: '#C2410C', borderRadius: 6 },
                { label: 'Nómina ($)', data: nomina, backgroundColor: '#9333EA', borderRadius: 6 },
                { label: 'Gastos ($)', data: operativos, backgroundColor: '#9C7A60', borderRadius: 6 },
                { label: 'Resultado Operativo Estimado ($)', data: utilidad, backgroundColor: '#16A34A', borderRadius: 6 }
            ]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(59, 36, 20, 0.08)' } }, x: { grid: { display: false } } } }
    });

    // Cuánto se gana (utilidad neta), cuánto se va en deudas y cuánto queda de verdad
    if (chartDeudas) chartDeudas.destroy();
    chartDeudas = new Chart(document.getElementById('graficoDeudas').getContext('2d'), {
        type: 'bar',
        data: {
            labels: fechas,
            datasets: [
                { type: 'bar', label: 'Resultado Operativo Estimado ($)', data: utilidad, backgroundColor: '#16A34A', borderRadius: 6 },
                { type: 'bar', label: 'Pago de Deudas ($)', data: pagoDeudas, backgroundColor: '#BE123C', borderRadius: 6 },
                { type: 'line', label: 'Resultado tras Deudas ($)', data: utilidadReal, borderColor: '#3B2414', backgroundColor: '#FFC72C', borderWidth: 3, tension: 0.3, pointRadius: 5, pointBorderColor: '#3B2414', pointBorderWidth: 2 }
            ]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { grid: { color: 'rgba(59, 36, 20, 0.08)' } }, x: { grid: { display: false } } } }
    });
}

export const SERIES_VACIAS = { fechas: [], ciclos: [], ventas: [], insumos: [], nomina: [], operativos: [], utilidad: [], pagoDeudas: [], utilidadReal: [] };
