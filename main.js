/* ==========================================================
   main.js — punto de entrada: arma y arranca la aplicación
   ========================================================== */
import { escucharRegistros } from './services/registros.js';
import { escucharDeudas } from './services/deudas.js';
import { establecerRegistros, establecerDeudas } from './state/store.js';
import { registrarVista, refrescarVistasActivas } from './ui/tabs.js';
import { configurarGraficos } from './ui/charts.js';
import { actualizarDashboard } from './ui/dashboard.js';
import { actualizarHistorial } from './ui/historial.js';
import { establecerFechaHoy, actualizarVistaPrevia } from './ui/formulario.js';
import { mostrarConectado, mostrarSinConexion, mostrarErrorDeudas, ocultarErrorDeudas } from './ui/estado.js';
import { vincularEventos } from './ui/eventos.js';

configurarGraficos();
registrarVista('dashboard', actualizarDashboard);
registrarVista('historial', actualizarHistorial);
vincularEventos();
establecerFechaHoy();
actualizarVistaPrevia();

// Tiempo real: cada cambio en Firebase actualiza el estado y redibuja la pestaña visible
escucharRegistros(
    (lista) => {
        establecerRegistros(lista);
        mostrarConectado();
        refrescarVistasActivas();
    },
    () => mostrarSinConexion()
);

escucharDeudas(
    (lista) => {
        establecerDeudas(lista);
        actualizarVistaPrevia();
        ocultarErrorDeudas();
        refrescarVistasActivas();
    },
    (error) => { console.error('No se pudieron leer las deudas:', error); mostrarErrorDeudas(); }
);
