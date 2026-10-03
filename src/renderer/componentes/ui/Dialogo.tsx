import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

type Propiedades = {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
};

/** Diálogo modal simple, con cierre por Escape y clic fuera. Usado para editar/confirmar. */
export function Dialogo({ abierto, titulo, onCerrar, children }: Propiedades) {
  const refContenido = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', alPresionarTecla);
    return () => document.removeEventListener('keydown', alPresionarTecla);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (!refContenido.current?.contains(e.target as Node)) onCerrar();
      }}
    >
      <div
        ref={refContenido}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{titulo}</h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
