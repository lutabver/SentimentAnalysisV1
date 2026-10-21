/* ==========================================================
   tabs.js — navegación por pestañas
   Cada pestaña puede registrar una función de render con registrarVista().
   Para agregar una pestaña nueva: sección en index.html + botón con
   data-action="cambiar-tab" data-tab="<id>" + registrarVista('<id>', fn) en main.js
   ========================================================== */
const vistas = {};

export const registrarVista = (idTab, fnRender) => { vistas[idTab] = fnRender; };

export function cambiarTab(idTab) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(idTab).classList.add('active');
    document.getElementById('btn-' + idTab).classList.add('active');

    if (vistas[idTab]) vistas[idTab]();
}

// Vuelve a dibujar las pestañas registradas que estén visibles (se usa cuando llegan datos nuevos)
export function refrescarVistasActivas() {
    Object.entries(vistas).forEach(([idTab, fnRender]) => {
        if (document.getElementById(idTab).classList.contains('active')) fnRender();
    });
}
