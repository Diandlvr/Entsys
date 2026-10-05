import type { ReactNode } from 'react';

/** Separador de sección: texto serif centrado con líneas finas a los lados. */
export function Separador({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span aria-hidden="true" className="h-px flex-1 bg-borde" />
      <h3 className="font-titulo text-xl font-semibold text-tinta-suave">{children}</h3>
      <span aria-hidden="true" className="h-px flex-1 bg-borde" />
    </div>
  );
}
