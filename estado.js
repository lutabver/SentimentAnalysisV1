/* ==========================================================
   estado.js — indicador de conexión del encabezado
   ========================================================== */
const pill = () => document.getElementById('sync-status');

export function mostrarConectado() {
    const el = pill();
    el.innerHTML = '<span class="dot"></span>Conectado';
    el.className = "status-pill status-ok";
}

export function mostrarSinConexion() {
    const el = pill();
    el.innerHTML = '<span class="dot"></span>Sin Conexión Wi-Fi';
    el.className = "status-pill status-err";
}

// Aviso en la pestaña Deudas cuando Firebase no permite leer/escribir esa ruta
export function mostrarErrorDeudas() {
    document.getElementById('deudas-error').classList.remove('hidden');
}

export function ocultarErrorDeudas() {
    document.getElementById('deudas-error').classList.add('hidden');
}
