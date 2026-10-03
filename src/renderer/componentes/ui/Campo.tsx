import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type PropiedadesComunes = {
  etiqueta: string;
  error?: string | null;
  advertencia?: string | null;
  ayuda?: string;
  requerido?: boolean;
};

const clasesControl =
  'w-full rounded-lg border px-3 py-2 text-base bg-white text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-acento-500 focus:border-acento-500 ' +
  'disabled:bg-slate-100 disabled:text-slate-400 ' +
  'dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500 dark:border-slate-600';

function Envoltorio({
  etiqueta,
  error,
  advertencia,
  ayuda,
  requerido,
  idCampo,
  children,
}: PropiedadesComunes & { idCampo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={idCampo} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {etiqueta}
        {requerido && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && advertencia && <p className="text-sm text-amber-600 dark:text-amber-400">{advertencia}</p>}
      {!error && !advertencia && ayuda && (
        <p className="text-sm text-slate-500 dark:text-slate-400">{ayuda}</p>
      )}
    </div>
  );
}

type PropiedadesCampoTexto = PropiedadesComunes & InputHTMLAttributes<HTMLInputElement>;

export const CampoTexto = forwardRef<HTMLInputElement, PropiedadesCampoTexto>(
  ({ etiqueta, error, advertencia, ayuda, requerido, id, className = '', ...resto }, ref) => {
    const idCampo = id ?? `campo-${etiqueta.toLowerCase().replace(/\s+/g, '-')}`;
    const borde = error ? 'border-red-400' : advertencia ? 'border-amber-400' : 'border-slate-300';
    return (
      <Envoltorio etiqueta={etiqueta} error={error} advertencia={advertencia} ayuda={ayuda} requerido={requerido} idCampo={idCampo}>
        <input ref={ref} id={idCampo} className={`${clasesControl} ${borde} ${className}`} {...resto} />
      </Envoltorio>
    );
  },
);
CampoTexto.displayName = 'CampoTexto';

type OpcionSelect = { valor: string; etiqueta: string };
type PropiedadesCampoSelect = PropiedadesComunes &
  SelectHTMLAttributes<HTMLSelectElement> & { opciones: OpcionSelect[] };

export const CampoSelect = forwardRef<HTMLSelectElement, PropiedadesCampoSelect>(
  ({ etiqueta, error, advertencia, ayuda, requerido, id, opciones, className = '', ...resto }, ref) => {
    const idCampo = id ?? `campo-${etiqueta.toLowerCase().replace(/\s+/g, '-')}`;
    const borde = error ? 'border-red-400' : 'border-slate-300';
    return (
      <Envoltorio etiqueta={etiqueta} error={error} advertencia={advertencia} ayuda={ayuda} requerido={requerido} idCampo={idCampo}>
        <select ref={ref} id={idCampo} className={`${clasesControl} ${borde} ${className}`} {...resto}>
          {opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      </Envoltorio>
    );
  },
);
CampoSelect.displayName = 'CampoSelect';

type PropiedadesCampoTextArea = PropiedadesComunes & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const CampoTextArea = forwardRef<HTMLTextAreaElement, PropiedadesCampoTextArea>(
  ({ etiqueta, error, advertencia, ayuda, requerido, id, className = '', ...resto }, ref) => {
    const idCampo = id ?? `campo-${etiqueta.toLowerCase().replace(/\s+/g, '-')}`;
    const borde = error ? 'border-red-400' : 'border-slate-300';
    return (
      <Envoltorio etiqueta={etiqueta} error={error} advertencia={advertencia} ayuda={ayuda} requerido={requerido} idCampo={idCampo}>
        <textarea ref={ref} id={idCampo} rows={2} className={`${clasesControl} ${borde} ${className}`} {...resto} />
      </Envoltorio>
    );
  },
);
CampoTextArea.displayName = 'CampoTextArea';
