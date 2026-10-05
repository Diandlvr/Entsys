import type { SVGProps } from 'react';

/** Iconos de trazo simple (24×24, heredan el color del texto). Decorativos: llevan aria-hidden. */
function Icono({ children, ...resto }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...resto}
    >
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const IconoCerrar = (p: P) => (
  <Icono {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icono>
);
export const IconoCheck = (p: P) => (
  <Icono {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icono>
);
export const IconoError = (p: P) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5v.01" />
  </Icono>
);
export const IconoAviso = (p: P) => (
  <Icono {...p}>
    <path d="M12 4l9 16H3L12 4z" />
    <path d="M12 10v4.5M12 17.5v.01" />
  </Icono>
);
export const IconoInfo = (p: P) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.5v.01" />
  </Icono>
);
export const IconoLapiz = (p: P) => (
  <Icono {...p}>
    <path d="M4 20l1-4L16.5 4.5a2 2 0 012.8 0l.2.2a2 2 0 010 2.8L8 19l-4 1z" />
    <path d="M14.5 6.5l3 3" />
  </Icono>
);
export const IconoPapelera = (p: P) => (
  <Icono {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1.5 1.5 0 001.5 1.4h7A1.5 1.5 0 0017 19l1-12M9 7V4.5h6V7" />
  </Icono>
);
export const IconoSubir = (p: P) => (
  <Icono {...p}>
    <path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M5 19h14" />
  </Icono>
);
export const IconoArchivo = (p: P) => (
  <Icono {...p}>
    <path d="M7 3h7l4 4v14H7V3z" />
    <path d="M14 3v4h4" />
  </Icono>
);
export const IconoFlecha = ({ direccion = 'abajo', ...p }: P & { direccion?: 'arriba' | 'abajo' }) => (
  <Icono {...p}>{direccion === 'abajo' ? <path d="M7 10l5 5 5-5" /> : <path d="M7 14l5-5 5 5" />}</Icono>
);
export const IconoFiltro = (p: P) => (
  <Icono {...p}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Icono>
);
export const IconoBuscar = (p: P) => (
  <Icono {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Icono>
);
export const IconoTeclado = (p: P) => (
  <Icono {...p}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
  </Icono>
);
export const IconoSalida = (p: P) => (
  <Icono {...p}>
    <path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4M10 8l-4 4 4 4M6 12h10" />
  </Icono>
);
