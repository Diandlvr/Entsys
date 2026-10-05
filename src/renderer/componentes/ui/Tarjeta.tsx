import type { ElementType, HTMLAttributes } from 'react';

type Propiedades = HTMLAttributes<HTMLElement> & {
  /** La tarjeta principal de la pantalla lleva una barra superior fina con degradado. */
  principal?: boolean;
  /** Quita el relleno interno (para tablas o listas que llegan al borde). */
  sinRelleno?: boolean;
  como?: ElementType;
};

/** Superficie blanca de la app: esquinas amplias, borde fino y casi sin sombra. */
export function Tarjeta({ principal = false, sinRelleno = false, como: Etiqueta = 'section', className = '', children, ...resto }: Propiedades) {
  return (
    <Etiqueta
      className={`relative overflow-hidden rounded-tarjeta border border-borde bg-tarjeta shadow-tarjeta
        ${sinRelleno ? '' : 'p-tarjeta'} ${className}`}
      {...resto}
    >
      {principal && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-acento to-acento-2"
        />
      )}
      {children}
    </Etiqueta>
  );
}
