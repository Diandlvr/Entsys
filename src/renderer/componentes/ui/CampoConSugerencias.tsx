import { forwardRef, useEffect, useRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';

type Propiedades = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
  obtenerSugerencias: (textoParcial: string) => Promise<string[]>;
  requerido?: boolean;
};

/**
 * Campo de texto con autocompletado simple (combobox) basado en el historial.
 * No usa ninguna librería externa: es una lista desplegable controlada a mano.
 */
export const CampoConSugerencias = forwardRef<HTMLInputElement, Propiedades>(
  ({ etiqueta, valor, onCambiar, obtenerSugerencias, requerido, id, className = '', ...resto }, ref) => {
    const [sugerencias, setSugerencias] = useState<string[]>([]);
    const [abierto, setAbierto] = useState(false);
    const idCampo = id ?? `campo-${etiqueta.toLowerCase().replace(/\s+/g, '-')}`;
    const contenedorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      let cancelado = false;
      if (valor.trim().length === 0) {
        setSugerencias([]);
        return;
      }
      obtenerSugerencias(valor).then((resultado) => {
        if (!cancelado) setSugerencias(resultado.filter((s) => s.toLowerCase() !== valor.toLowerCase()));
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

    return (
      <div className="relative flex flex-col gap-1" ref={contenedorRef}>
        <label htmlFor={idCampo} className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {etiqueta}
          {requerido && <span className="ml-0.5 text-red-600">*</span>}
        </label>
        <input
          ref={ref}
          id={idCampo}
          value={valor}
          onChange={(e) => {
            onCambiar(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          autoComplete="off"
          className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-base bg-white text-slate-900
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-acento-500 focus:border-acento-500
            dark:bg-slate-800 dark:text-slate-50 dark:border-slate-600 ${className}`}
          {...resto}
        />
        {abierto && sugerencias.length > 0 && (
          <ul className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
            {sugerencias.map((sugerencia) => (
              <li key={sugerencia}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-acento-50 dark:hover:bg-slate-700"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onCambiar(sugerencia);
                    setAbierto(false);
                  }}
                >
                  {sugerencia}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
CampoConSugerencias.displayName = 'CampoConSugerencias';
