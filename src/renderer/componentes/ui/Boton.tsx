import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';
type Tamano = 'normal' | 'grande';

type PropiedadesBoton = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamano?: Tamano;
};

const CLASES_VARIANTE: Record<Variante, string> = {
  primario:
    'bg-acento-600 text-white hover:bg-acento-700 focus-visible:ring-acento-500 disabled:bg-slate-300',
  secundario:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-acento-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-700',
  peligro: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-300',
  fantasma:
    'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-acento-500 dark:text-slate-300 dark:hover:bg-slate-800',
};

const CLASES_TAMANO: Record<Tamano, string> = {
  normal: 'px-4 py-2 text-sm',
  grande: 'px-6 py-3 text-base',
};

/** Botón base de la app: grande, buen contraste, foco visible — pensado para uso rápido en recepción. */
export const Boton = forwardRef<HTMLButtonElement, PropiedadesBoton>(
  ({ variante = 'primario', tamano = 'normal', className = '', ...resto }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-60
        ${CLASES_VARIANTE[variante]} ${CLASES_TAMANO[tamano]} ${className}`}
      {...resto}
    />
  ),
);
Boton.displayName = 'Boton';
