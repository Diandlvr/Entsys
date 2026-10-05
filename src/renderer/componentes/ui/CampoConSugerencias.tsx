import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import type { InputHTMLAttributes, KeyboardEvent } from 'react';
import { EtiquetaCampo, MensajeCampo, bordeControl, clasesControl } from './Campo.js';

type Propiedades = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
  obtenerSugerencias: (textoParcial: string) => Promise<string[]>;
  requerido?: boolean;
  opcional?: boolean;
  error?: string | null;
  ayuda?: string;
};

/**
 * Campo de texto con autocompletado (combobox) basado en el historial.
 * Flechas ↑/↓ recorren las sugerencias, Enter elige la resaltada, Escape las cierra.
 */
export const CampoConSugerencias = forwardRef<HTMLInputElement, Propiedades>(
  (
    { etiqueta, valor, onCambiar, obtenerSugerencias, requerido, opcional, error, ayuda, id, className = '', onKeyDown, ...resto },
    ref,
  ) => {
    const [sugerencias, setSugerencias] = useState<string[]>([]);
    const [abierto, setAbierto] = useState(false);
    const [resaltado, setResaltado] = useState(-1);
    const idAuto = useId();
    const idCampo = id ?? `campo-${idAuto}`;
    const idLista = `${idCampo}-sugerencias`;
    const contenedorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      let cancelado = false;
      if (valor.trim().length === 0) {
        setSugerencias([]);
        return;
      }
      obtenerSugerencias(valor).then((resultado) => {
        if (cancelado) return;
        setSugerencias(resultado.filter((s) => s.toLowerCase() !== valor.toLowerCase()));
        setResaltado(-1);
      });
      return () => {
        cancelado = true;
      };
    }, [valor, obtenerSugerencias]);

    useEffect(() => {
      function alHacerClicFuera(evento: MouseEvent) {
        if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
          setAbierto(false);
        }
      }
      document.addEventListener('mousedown', alHacerClicFuera);
      return () => document.removeEventListener('mousedown', alHacerClicFuera);
    }, []);

    const listaVisible = abierto && sugerencias.length > 0;

    function elegir(sugerencia: string) {
      onCambiar(sugerencia);
      setAbierto(false);
      setResaltado(-1);
    }

    function alPresionarTecla(evento: KeyboardEvent<HTMLInputElement>) {
      if (listaVisible) {
        if (evento.key === 'ArrowDown') {
          evento.preventDefault();
          setResaltado((i) => (i + 1) % sugerencias.length);
          return;
        }
        if (evento.key === 'ArrowUp') {
          evento.preventDefault();
          setResaltado((i) => (i <= 0 ? sugerencias.length - 1 : i - 1));
          return;
        }
        if (evento.key === 'Enter' && resaltado >= 0) {
          // Elegir una sugerencia no debe avanzar de campo ni enviar el formulario.
          evento.preventDefault();
          evento.stopPropagation();
          elegir(sugerencias[resaltado]);
          return;
        }
        if (evento.key === 'Escape') {
          // Cierra solo la lista, no el diálogo que pueda contener el campo.
          evento.stopPropagation();
          setAbierto(false);
          return;
        }
      }
      onKeyDown?.(evento);
    }

    return (
      <div className={`relative flex flex-col gap-1.5 ${className}`} ref={contenedorRef}>
        <EtiquetaCampo idCampo={idCampo} etiqueta={etiqueta} requerido={requerido} opcional={opcional} />
        <input
          ref={ref}
          id={idCampo}
          value={valor}
          onChange={(e) => {
            onCambiar(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={alPresionarTecla}
          autoComplete="off"
          role="combobox"
          aria-expanded={listaVisible}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={listaVisible && resaltado >= 0 ? `${idLista}-${resaltado}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-required={requerido ? true : undefined}
          aria-describedby={error || ayuda ? `${idCampo}-mensaje` : undefined}
          className={`${clasesControl} ${bordeControl(error)}`}
          {...resto}
        />
        <MensajeCampo idMensaje={`${idCampo}-mensaje`} error={error} ayuda={ayuda} />
        {listaVisible && (
          <ul
            id={idLista}
            role="listbox"
            aria-label={`Sugerencias para ${etiqueta}`}
            className="absolute left-0 right-0 top-[4.25rem] z-10 max-h-56 overflow-y-auto rounded-control border border-borde bg-tarjeta py-1 shadow-flotante"
          >
            {sugerencias.map((sugerencia, indice) => (
              <li
                key={sugerencia}
                id={`${idLista}-${indice}`}
                role="option"
                aria-selected={indice === resaltado}
                className={`cursor-pointer px-3.5 py-2 text-[0.9375rem] transition-colors ${
                  indice === resaltado ? 'bg-acento-tinte text-acento-texto' : 'text-tinta hover:bg-tarjeta-suave'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(sugerencia);
                }}
              >
                {sugerencia}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
CampoConSugerencias.displayName = 'CampoConSugerencias';
