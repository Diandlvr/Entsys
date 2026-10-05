import type { ReactNode } from 'react';

type Propiedades = {
  texto: string;
  /** Hacia dónde se abre la pista. */
  lado?: 'abajo' | 'arriba';
  children: ReactNode;
  className?: string;
};

/**
 * Pista breve al pasar el ratón o enfocar con el teclado.
 * El control hijo debe llevar su propio aria-label: esto es un refuerzo visual.
 */
export function Tooltip({ texto, lado = 'abajo', children, className = '' }: Propiedades) {
  return (
    <span className={`group/tip relative inline-flex ${className}`}>
      {children}
      <span
        role="presentation"
        className={`pointer-events-none absolute left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded-lg bg-tinta px-2.5 py-1
          text-xs font-medium text-fondo opacity-0 transition-opacity delay-300
          group-hover/tip:opacity-100 group-focus-within/tip:opacity-100
          ${lado === 'abajo' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'}`}
      >
        {texto}
      </span>
    </span>
  );
}
