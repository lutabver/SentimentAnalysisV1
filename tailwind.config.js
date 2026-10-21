/* ==========================================================
   tailwind.config.js — tema de Tailwind (script clásico)
   Debe cargarse DESPUÉS de https://cdn.tailwindcss.com
   ========================================================== */
tailwind.config = {
    theme: {
        extend: {
            fontFamily: { display: ['Fredoka', 'sans-serif'], sans: ['Nunito', 'sans-serif'] },
            colors: {
                cocoa: { DEFAULT: '#3B2414', soft: '#6B4A33', light: '#9C7A60' },
                gold: { DEFAULT: '#FFC72C', deep: '#F2B400' },
                crema: { DEFAULT: '#F7ECDF', dark: '#EEDDC9' },
                fondo: '#E9D6C0'
            }
        }
    }
};
