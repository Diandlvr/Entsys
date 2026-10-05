import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { IconoCerrar, IconoCheck, IconoError, IconoInfo } from './iconos.js';

type Toast = {
  id: number;
  mensaje: string;
  tipo: 'exito' | 'error' | 'info';
  accion?: { etiqueta: string; alHacerClic: () => void };
};

type MostrarToast = (mensaje: string, opciones?: Omit<Toast, 'id' | 'mensaje'>) => void;

const ContextoToast = createContext<MostrarToast | null>(null);

const MAXIMO_VISIBLES = 3;

/** Los avisos con "Deshacer" y los errores necesitan más tiempo para leerse y usarse. */
function duracionMs(toast: Toast): number {
  if (toast.accion) return 10_000;
  if (toast.tipo === 'error') return 8_000;
  return 5_000;
}

const ESTILOS_TIPO: Record<Toast['tipo'], string> = {
  exito: 'border-borde bg-tarjeta text-tinta',
  info: 'border-borde bg-tarjeta text-tinta',
  error: 'border-peligro-borde bg-peligro-tinte text-peligro',
};

function IconoTipo({ tipo }: { tipo: Toast['tipo'] }) {
  if (tipo === 'error') return <IconoError className="mt-0.5 h-5 w-5 shrink-0" />;
  if (tipo === 'info') return <IconoInfo className="mt-0.5 h-5 w-5 shrink-0 text-acento-texto" />;
  return <IconoCheck className="mt-0.5 h-5 w-5 shrink-0 text-exito" />;
}

function ItemToast({ toast, cerrar }: { toast: Toast; cerrar: (id: number) => void }) {
  // El temporizador se pausa mientras el ratón o el foco están sobre el aviso.
  const [pausado, setPausado] = useState(false);
  const restante = useRef(duracionMs(toast));

  useEffect(() => {
    if (pausado) return;
    const inicio = Date.now();
    const temporizador = setTimeout(() => cerrar(toast.id), restante.current);
    return () => {
      clearTimeout(temporizador);
      restante.current = Math.max(1_500, restante.current - (Date.now() - inicio));
    };
  }, [pausado, cerrar, toast.id]);

  return (
    <div
      role={toast.tipo === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-control border py-3 pl-4 pr-2 shadow-flotante ${ESTILOS_TIPO[toast.tipo]}`}
    >
      <IconoTipo tipo={toast.tipo} />
      <span className="flex-1 pt-0.5 text-[0.9375rem]">{toast.mensaje}</span>
      {toast.accion && (
        <button
          type="button"
          className="min-h-[2.25rem] rounded-lg px-3 text-[0.9375rem] font-semibold text-acento-texto transition-colors hover:bg-acento-tinte"
          onClick={() => {
            toast.accion!.alHacerClic();
            cerrar(toast.id);
          }}
        >
          {toast.accion.etiqueta}
        </button>
      )}
      <button
        type="button"
        onClick={() => cerrar(toast.id)}
        aria-label="Cerrar aviso"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg opacity-70 transition-opacity hover:opacity-100"
      >
        <IconoCerrar className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Proveedor de avisos (toasts) no intrusivos, con botón de deshacer opcional. */
export function ProveedorToast({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const contadorRef = useRef(0);

  const cerrar = useCallback((id: number) => {
    setToasts((actuales) => actuales.filter((t) => t.id !== id));
  }, []);

  const mostrarToast = useCallback<MostrarToast>((mensaje, opciones) => {
    const id = ++contadorRef.current;
    const nuevo: Toast = { id, mensaje, tipo: opciones?.tipo ?? 'exito', accion: opciones?.accion };
    setToasts((actuales) => [...actuales, nuevo].slice(-MAXIMO_VISIBLES));
  }, []);

  return (
    <ContextoToast.Provider value={mostrarToast}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2">
        {toasts.map((toast) => (
          <ItemToast key={toast.id} toast={toast} cerrar={cerrar} />
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
