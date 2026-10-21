/* ==========================================================
   formulario.js — pestaña "Ingreso Diario": captura, vista previa, guardado y deudas nuevas
   Para agregar un campo nuevo: (1) input en index.html,
   (2) línea en leerFormulario(), (3) usarlo en domain/ si aplica.
   ========================================================== */
import { guardarDeuda } from '../services/deudas.js';
import { guardarCierre } from '../services/cierres.js';
import { obtenerDeudas } from '../state/store.js';
import { resumenDeudas, repartirPago, utilidadReal } from '../domain/deudas.js';
import { ESCALAS_BARRA } from '../config/metas.js';
import { formatoDinero } from '../utils/formato.js';
import { llenarBarra } from '../utils/animaciones.js';
import { fechaHoyISO } from '../utils/fecha.js';

const valorDe = id => document.getElementById(id).value;
const marcados = nombre => Array.from(document.querySelectorAll(`input[name="${nombre}"]:checked`)).map(cb => cb.value);

// Lee el formulario y devuelve el registro listo para guardar
function leerFormulario() {
    return {
        id: Date.now(),
        fecha: valorDe('fecha'),
        ventas: parseFloat(valorDe('ventas')) || 0,
        insumos: parseFloat(valorDe('insumos')) || 0,
        nomina: parseFloat(valorDe('nomina')) || 0,
        operativos: parseFloat(valorDe('operativos')) || 0,
        pedidos: parseInt(valorDe('pedidos')) || 0,
        clientes: parseInt(valorDe('clientes')) || 0,
        mesas: parseInt(valorDe('mesas')) || 0,
        horas: parseFloat(valorDe('horas')) || 0,
        ciclo: parseFloat(valorDe('ciclo')) || 0,
        reclamos: parseInt(valorDe('reclamos')) || 0,
        problemas_marcados: marcados('problemas').join(', ') || 'Ninguno',
        causa_marcada: marcados('causas').join(', ') || 'N/A'
    };
}

// Deuda escrita en el bloque "Deudas (Opcional)" del formulario.
// Devuelve null (campos vacíos), { error } (incompleta o inválida) o { deuda } lista para guardar.
function leerDeudaDelFormulario() {
    const concepto = valorDe('deuda-concepto').trim();
    const montoTexto = valorDe('deuda-monto');
    if (!concepto && !montoTexto) return null;

    const monto = parseFloat(montoTexto);
    if (!concepto) return { error: "Escribe a quién o por qué es la deuda." };
    if (!(monto > 0)) return { error: "Ingresa un monto de deuda mayor a 0." };
    return { deuda: { id: Date.now(), concepto, monto, fecha: valorDe('fecha') || fechaHoyISO() } };
}

const limpiarCamposDeuda = () => {
    document.getElementById('deuda-concepto').value = '';
    document.getElementById('deuda-monto').value = '';
};

let temporizadorMensaje = null;
function mostrarMensaje(texto) {
    const msj = document.getElementById('mensaje-exito');
    document.getElementById('mensaje-exito-texto').innerText = texto;
    msj.classList.remove('hidden');
    clearTimeout(temporizadorMensaje);
    temporizadorMensaje = setTimeout(() => msj.classList.add('hidden'), 3000);
}

// Guarda el cierre del día y, si el bloque de deudas está lleno, también la deuda
export function guardarDatos(evento) {
    evento.preventDefault();
    const pedido = leerDeudaDelFormulario();
    if (pedido && pedido.error) return alert(pedido.error);   // no guarda nada hasta corregirlo

    const nuevoDato = leerFormulario();
    const pago = parseFloat(valorDe('pago-deudas')) || 0;
    if (pago < 0) return alert("El pago de deudas no puede ser negativo.");

    // El pago se reparte entre las deudas pendientes (incluida la que se agrega en este mismo cierre)
    const deudasDisponibles = pedido ? [...obtenerDeudas(), pedido.deuda] : obtenerDeudas();
    const { asignaciones, sobrante } = repartirPago(pago, deudasDisponibles);
    if (sobrante > 0) {
        const debe = resumenDeudas(deudasDisponibles).pendiente;
        return alert(`El pago de deudas (${formatoDinero(pago)}) supera lo que se debe (${formatoDinero(debe)}). Registra primero la deuda o baja el monto.`);
    }

    const abonos = asignaciones.map((a, i) => ({
        idDeuda: a.idDeuda,
        abono: { id: nuevoDato.id + i, fecha: nuevoDato.fecha, monto: a.monto, registroId: nuevoDato.id }
    }));

    guardarCierre({ registro: nuevoDato, deuda: pedido && pedido.deuda, abonos }).then(() => {
        mostrarMensaje(pago > 0 ? '¡Cierre y pago de deudas guardados!' : pedido ? '¡Cierre y deuda guardados!' : '¡Cierre guardado y sincronizado!');
        document.getElementById('form-datos').reset();
        establecerFechaHoy();
        actualizarVistaPrevia();
    }).catch((error) => {
        alert("Error al guardar en la nube: " + error.message);
    });
}

// Botón "+ Agregar deuda ahora": guarda solo la deuda, sin cerrar el día
export function agregarDeudaDesdeFormulario() {
    const pedido = leerDeudaDelFormulario();
    if (!pedido) return alert("Escribe el concepto y el monto de la deuda.");
    if (pedido.error) return alert(pedido.error);

    guardarDeuda(pedido.deuda).then(() => {
        limpiarCamposDeuda();
        mostrarMensaje('Deuda registrada. La verás en el Dashboard.');
    }).catch((error) => alert("Error al guardar la deuda: " + error.message));
}

export function establecerFechaHoy() {
    const elFecha = document.getElementById('fecha');
    if (elFecha) elFecha.value = fechaHoyISO();
}

export function actualizarVistaPrevia() {
    const val = id => parseFloat(valorDe(id)) || 0;
    const ventas = val('ventas'), insumos = val('insumos'), nomina = val('nomina'), operativos = val('operativos');
    const utilidad = ventas - insumos - nomina - operativos;
    const pago = val('pago-deudas');
    const real = utilidadReal(utilidad, pago);
    const ic = ventas > 0 ? (insumos / ventas) * 100 : 0;   // índice de compras
    const lc = ventas > 0 ? (nomina / ventas) * 100 : 0;

    const elUtilidad = document.getElementById('prev-utilidad');
    elUtilidad.innerText = formatoDinero(utilidad);
    elUtilidad.style.color = utilidad < 0 ? '#F87171' : '#FFC72C';
    document.getElementById('prev-pago').innerText = '− ' + formatoDinero(pago);
    const elReal = document.getElementById('prev-real');
    elReal.innerText = formatoDinero(real);
    elReal.style.color = real < 0 ? '#F87171' : '#4ADE80';

    // Ayuda bajo el campo: cuánto se debe en total
    const pendiente = resumenDeudas(obtenerDeudas()).pendiente;
    document.getElementById('ayuda-pago-deudas').innerText = pendiente > 0
        ? `Deuda pendiente total: ${formatoDinero(pendiente)}`
        : 'No hay deudas pendientes por pagar.';
    document.getElementById('prev-compras').innerText = ic.toFixed(1) + '%';
    document.getElementById('prev-labor').innerText = lc.toFixed(1) + '%';
    llenarBarra('prev-compras-bar', ic / ESCALAS_BARRA.compras * 100, 100, '#FFC72C', '#FFC72C');   // sin meta: un solo color
    llenarBarra('prev-labor-bar', lc / ESCALAS_BARRA.labor * 100, ESCALAS_BARRA.limite, '#C084FC', '#F87171');
}
