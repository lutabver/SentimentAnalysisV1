/* ==========================================================
   registros.js — acceso a datos (Firebase Realtime Database)
   Es la ÚNICA capa que habla con Firebase. Si algún día cambias
   de base de datos, solo se modifica este archivo.
   ========================================================== */
import { db } from '../config/firebase.js';

const RUTA = 'registros';

// Escucha en tiempo real; entrega la lista ya ordenada por fecha
export function escucharRegistros(alRecibir, alFallar) {
    db.ref(RUTA).on('value', (snapshot) => {
        const data = snapshot.val();
        let lista = [];
        if (data) {
            lista = Object.values(data);
            lista.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        }
        alRecibir(lista);
    }, alFallar);
}

export const guardarRegistro = registro => db.ref(`${RUTA}/${registro.id}`).set(registro);

export const eliminarRegistro = id => db.ref(`${RUTA}/${id}`).remove();

export const eliminarTodosLosRegistros = () => db.ref(RUTA).remove();
