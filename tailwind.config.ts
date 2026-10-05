import type { Config } from 'tailwindcss';

/** Convierte un token CSS "R G B" en un color de Tailwind que acepta opacidad. */
const token = (nombre: string) => `rgb(var(--${nombre}) / <alpha-value>)`;

export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fondo: token('fondo'),
        tarjeta: { DEFAULT: token('tarjeta'), suave: token('tarjeta-suave') },
        tinta: { DEFAULT: token('tinta'), suave: token('tinta-suave'), tenue: token('tinta-tenue') },
        borde: { DEFAULT: token('borde'), fuerte: token('borde-fuerte') },
        acento: {
          DEFAULT: token('acento'),
          fuerte: token('acento-fuerte'),
          tinte: token('acento-tinte'),
          texto: token('acento-texto'),
          2: token('acento-2'),
          sobre: token('sobre-acento'),
        },
        aviso: { DEFAULT: token('aviso'), tinte: token('aviso-tinte'), borde: token('aviso-borde') },
        peligro: {
          DEFAULT: token('peligro'),
          fuerte: token('peligro-fuerte'),
          tinte: token('peligro-tinte'),
          borde: token('peligro-borde'),
        },
        exito: { DEFAULT: token('exito'), tinte: token('exito-tinte') },
      },
      borderRadius: {
        tarjeta: 'var(--radio-tarjeta)',
        control: 'var(--radio-control)',
        pill: 'var(--radio-pill)',
      },
      boxShadow: {
        tarjeta: 'var(--sombra-tarjeta)',
        flotante: 'var(--sombra-flotante)',
      },
      spacing: {
        pantalla: 'var(--espacio-pantalla)',
        tarjeta: 'var(--espacio-tarjeta)',
        campos: 'var(--espacio-campos)',
      },
      transitionDuration: { DEFAULT: '200ms' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0.2, 0, 0, 1)' },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        titulo: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
