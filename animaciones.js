/* ==========================================================
   animaciones.js — efectos visuales reutilizables
   ========================================================== */

// Anima un número desde su valor anterior hasta `valor`
export function animarNumero(el, valor, formato) {
    const desde = parseFloat(el.dataset.valor) || 0;
    el.dataset.valor = valor;
    const inicio = performance.now();
    const duracion = 700;
    function paso(ahora) {
        const t = Math.min((ahora - inicio) / duracion, 1);
        const suave = 1 - Math.pow(1 - t, 3);
        el.innerText = formato(desde + (valor - desde) * suave);
        if (t < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
}

// Llena una barra de progreso; cambia de color si supera `limite`
export function llenarBarra(id, porcentaje, limite, colorOk, colorMal) {
    const barra = document.getElementById(id);
    barra.style.width = Math.max(0, Math.min(porcentaje, 100)) + '%';
    barra.style.background = porcentaje > limite ? colorMal : colorOk;
}
