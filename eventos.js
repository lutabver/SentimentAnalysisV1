/* ==========================================================
   eventos.js — conecta el HTML con las funciones (sin onclick inline)
   El HTML declara data-action="..."; aquí se decide qué función ejecuta.
   Para un botón nuevo: agrega data-action en index.html y una entrada en ACCIONES.
   ========================================================== */
import { cambiarTab } from './tabs.js';
import { guardarDatos, actualizarVistaPrevia, agregarDeudaDesdeFormulario } from './formulario.js';
import { eliminarDato, borrarTodo, descargarExcel, abonarDeuda, saldarDeuda, quitarDeuda } from './acciones.js';

const ACCIONES = {
    'cambiar-tab': el => cambiarTab(el.dataset.tab),
    'borrar-todo': () => borrarTodo(),
    'descargar-excel': () => descargarExcel(),
    'eliminar-registro': el => eliminarDato(Number(el.dataset.id)),
    'agregar-deuda': () => agregarDeudaDesdeFormulario(),
    'abonar-deuda': el => abonarDeuda(Number(el.dataset.id)),
    'saldar-deuda': el => saldarDeuda(Number(el.dataset.id)),
    'eliminar-deuda': el => quitarDeuda(Number(el.dataset.id))
};

export function vincularEventos() {
    // Un solo listener para todos los botones (también los que se crean dinámicamente)
    document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-action]');
        if (el && ACCIONES[el.dataset.action]) ACCIONES[el.dataset.action](el);
    });

    const form = document.getElementById('form-datos');
    form.addEventListener('submit', guardarDatos);
    form.addEventListener('input', actualizarVistaPrevia);

    // Enter dentro de los campos de deuda agrega la deuda (no envía todo el cierre del día)
    ['deuda-concepto', 'deuda-monto'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); agregarDeudaDesdeFormulario(); }
        });
    });
}
