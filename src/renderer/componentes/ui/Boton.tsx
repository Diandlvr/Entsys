import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

/**
 * Jerarquía de botones (una sola regla para toda la app):
 *  - primario: la acción principal de la pantalla. Solo uno por pantalla o diálogo.
 *  - secundario: acciones de apoyo importantes.
 *  - fantasma: acciones discretas o de poco peso (Limpiar, Volver).
 *  - peligro: solo para acciones que destruyen datos, y siempre con confirmación o deshacer.
 */
type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';
type Tamano = 'normal' | 'grande';

type PropiedadesBoton = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamano?: Tamano;
  /** Muestra un indicador de carga sin cambiar el ancho del botón y lo bloquea. */
  cargando?: boolean;
  /** Si el botón está deshabilitado, explica por qué (aparece como tooltip). */
  motivoDeshabilitado?: string;
};

const CLASES_VARIANTE: Record<Variante, string> = {
  primario: 'bg-acento text-acento-sobre hover:bg-acento-fuerte',
  secundario: 'border border-borde-fuerte bg-tarjeta text-tinta hover:bg-tarjeta-suave',
  peligro: 'bg-peligro text-acento-sobre hover:bg-peligro-fuerte',
  fantasma: 'text-tinta-suave hover:bg-tarjeta-suave hover:text-tinta',
};

const CLASES_TAMANO: Record<Tamano, string> = {
  normal: 'min-h-[2.5rem] px-4 py-2 text-[0.9375rem]',
  grande: 'min-h-[3rem] px-6 py-3 text-base',
};

function Cargando() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Botón base de la app: objetivo de clic amplio, foco visible y transiciones suaves. */
export const Boton = forwardRef<HTMLButtonElement, PropiedadesBoton>(
  (
    { variante = 'primario', tamano = 'normal', cargando = false, motivoDeshabilitado, className = '', children, disabled, title, ...resto },
    ref,
  ) => {
    const bloqueado = Boolean(disabled) || cargando;
    return (
      <button
        ref={ref}
        disabled={bloqueado}
        aria-busy={cargando || undefined}
        title={bloqueado && motivoDeshabilitado ? motivoDeshabilitado : title}
        className={`relative inline-flex items-center justify-center gap-2 rounded-control font-medium
          transition-colors disabled:cursor-not-allowed disabled:opacity-55
          ${CLASES_VARIANTE[variante]} ${CLASES_TAMANO[tamano]} ${className}`}
        {...resto}
      >
        <span className={`inline-flex items-center justify-center gap-2 ${cargando ? 'invisible' : ''}`}>{children}</span>
        {cargando && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Cargando />
          </span>
        )}
      </button>
    );
  },
);
Boton.displayName = 'Boton';
