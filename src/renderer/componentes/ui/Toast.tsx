import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type Toast = {
  id: number;
  mensaje: string;
  tipo: 'exito' | 'error' | 'info';
  accion?: { etiqueta: string; alHacerClic: () => void };
};

type MostrarToast = (mensaje: string, opciones?: Omit<Toast, 'id' | 'mensaje'>) => void;

const ContextoToast = createContext<MostrarToast | null>(null);

const DURACION_MS = 5000;

/** Proveedor de notificaciones tipo toast, no intrusivas, con botón de deshacer opcional. */
export function ProveedorToast({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const contadorRef = useRef(0);

  const mostrarToast = useCallback<MostrarToast>((mensaje, opciones) => {
    const id = ++contadorRef.current;
    setToasts((actuales) => [...actuales, { id, mensaje, tipo: opciones?.tipo ?? 'exito', accion: opciones?.accion }]);
    setTimeout(() => {
      setToasts((actuales) => actuales.filter((t) => t.id !== id));
    }, DURACION_MS);
  }, []);

  return (
    <ContextoToast.Provider value={mostrarToast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg
              ${
                toast.tipo === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
                  : 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
              }`}
          >
            <span className="text-sm">{toast.mensaje}</span>
            {toast.accion && (
              <button
                className="text-sm font-semibold text-acento-600 hover:underline dark:text-acento-400"
                onClick={() => {
                  toast.accion!.alHacerClic();
                  setToasts((actuales) => actuales.filter((t) => t.id !== toast.id));
                }}
              >
                {toast.accion.etiqueta}
              </button>
            )}
          </div>
        ))}
      </div>
    </ContextoToast.Provider>
  );
}

export function usarToast(): MostrarToast {
  const contexto = useContext(ContextoToast);
  if (!contexto) throw new Error('usarToast debe usarse dentro de <ProveedorToast>');
  return contexto;
}
