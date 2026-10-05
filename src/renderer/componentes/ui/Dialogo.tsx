import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { IconoCerrar } from './iconos.js';
import { Tooltip } from './Tooltip.js';

type Propiedades = {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  ancho?: 'normal' | 'amplio';
};

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Diálogo modal accesible: atrapa el foco, lo devuelve al botón que lo abrió al cerrarse,
 * se cierra con Escape o con clic fuera. Para elegir qué recibe el foco al abrir, marca un
 * elemento con `data-autofocus` (útil en confirmaciones: el foco va a "Cancelar").
 */
export function Dialogo({ abierto, titulo, onCerrar, children, ancho = 'normal' }: Propiedades) {
  const refContenido = useRef<HTMLDivElement>(null);
  const idTitulo = useId();
  const onCerrarRef = useRef(onCerrar);
  onCerrarRef.current = onCerrar;

  useEffect(() => {
    if (!abierto) return;
    const elementoPrevio = document.activeElement as HTMLElement | null;

    // Foco inicial: lo marcado con data-autofocus, o el primer control del contenido (no el botón cerrar).
    const contenido = refContenido.current;
    const inicial =
      contenido?.querySelector<HTMLElement>('[data-autofocus]') ??
      contenido?.querySelector<HTMLElement>('[data-cuerpo] :is(input, select, textarea, button):not([disabled])') ??
      contenido;
    inicial?.focus();

    function alPresionarTecla(evento: globalThis.KeyboardEvent) {
      if (evento.key === 'Escape') onCerrarRef.current();
    }
    document.addEventListener('keydown', alPresionarTecla);
    return () => {
      document.removeEventListener('keydown', alPresionarTecla);
      if (elementoPrevio && document.contains(elementoPrevio)) elementoPrevio.focus();
    };
  }, [abierto]);

  if (!abierto) return null;

  function atraparFoco(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key !== 'Tab') return;
    const enfocables = Array.from(refContenido.current?.querySelectorAll<HTMLElement>(ENFOCABLES) ?? []).filter(
      (el) => el.offsetParent !== null,
    );
    if (enfocables.length === 0) {
      evento.preventDefault();
      return;
    }
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    const activo = document.activeElement;
    if (evento.shiftKey && (activo === primero || activo === refContenido.current)) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && activo === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--velo-banner)/0.55)] p-4"
      onMouseDown={(e) => {
        if (!refContenido.current?.contains(e.target as Node)) onCerrar();
      }}
    >
      <div
        ref={refContenido}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        onKeyDown={atraparFoco}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-tarjeta border border-borde bg-tarjeta p-tarjeta shadow-flotante
          focus:outline-none ${ancho === 'amplio' ? 'max-w-3xl' : 'max-w-xl'}`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id={idTitulo} className="font-titulo text-3xl font-medium leading-tight text-tinta">
            {titulo}
          </h2>
          <Tooltip texto="Cerrar (Esc)">
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="flex h-10 w-10 items-center justify-center rounded-control text-tinta-tenue transition-colors hover:bg-tarjeta-suave hover:text-tinta"
            >
              <IconoCerrar className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
        <div data-cuerpo>{children}</div>
      </div>
    </div>
  );
}
