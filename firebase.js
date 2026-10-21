/* ==========================================================
   firebase.js — inicialización de Firebase (SDK v8 por CDN)
   Exporta `db`, la referencia a Realtime Database.
   Para cambiar de proyecto Firebase, edita solo este archivo.
   ========================================================== */
const firebaseConfig = {
    apiKey: "AIzaSyB6xuNpwoWxjzABF6TGUKssk44e47-xmYg",
    authDomain: "sando2-f1f4a.firebaseapp.com",
    databaseURL: "https://sando2-f1f4a-default-rtdb.firebaseio.com",
    projectId: "sando2-f1f4a",
    storageBucket: "sando2-f1f4a.firebasestorage.app",
    messagingSenderId: "773351428643",
    appId: "1:773351428643:web:66b08d3887705ac6e6d796"
};

// `firebase` es global: lo define el <script> del CDN en index.html
firebase.initializeApp(firebaseConfig);

export const db = firebase.database();
