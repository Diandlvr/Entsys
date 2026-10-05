import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { IconoAviso, IconoError } from './iconos.js';

export type PropiedadesComunes = {
  etiqueta: string;
  error?: string | null;
  advertencia?: string | null;
  ayuda?: string;
  /** Campo obligatorio: lleva un asterisco; el formulario debe explicarlo una vez ("* obligatorio"). */
  requerido?: boolean;
  /** Campo opcional: se anota en la etiqueta con "(opcional)". */
  opcional?: boolean;
};

export const clasesControl =
  'w-full min-h-[2.75rem] rounded-control border bg-tarjeta px-3.5 py-2.5 text-base text-tinta ' +
  'placeholder:text-tinta-tenue transition-colors ' +
  'focus:border-acento focus:outline-none focus:ring-2 focus:ring-acento/30 ' +
  'disabled:bg-tarjeta-suave disabled:text-tinta-tenue read-only:bg-tarjeta-suave';

export function bordeControl(error?: string | null, advertencia?: string | null) {
  return error ? 'border-peligro' : advertencia ? 'border-aviso-borde' : 'border-borde-fuerte';
}

export function EtiquetaCampo({
  idCampo,
  etiqueta,
  requerido,
  opcional,
}: Pick<PropiedadesComunes, 'etiqueta' | 'requerido' | 'opcional'> & { idCampo: string }) {
  return (
    <label htmlFor={idCampo} className="text-sm font-medium text-tinta">
      {etiqueta}
      {requerido && (
        <span aria-hidden="true" className="ml-0.5 text-acento-texto">
          *
        </span>
      )}
      {opcional && <span className="ml-1.5 font-normal text-tinta-tenue">(opcional)</span>}
    </label>
  );
}

/** Mensaje bajo un campo: error (con icono, no solo color), advertencia o ayuda. */
export function MensajeCampo({
  idMensaje,
  error,
  advertencia,
  ayuda,
}: Pick<PropiedadesComunes, 'error' | 'advertencia' | 'ayuda'> & { idMensaje: string }) {
  if (error) {
    return (
      <p id={idMensaje} role="alert" className="flex items-start gap-1.5 text-sm text-peligro">
        <IconoError className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{error}</span>
      </p>
    );
  }
  if (advertencia) {
    return (
      <p id={idMensaje} className="flex items-start gap-1.5 text-sm text-aviso">
        <IconoAviso className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{advertencia}</span>
      </p>
    );
  }
  if (ayuda) {
    return (
      <p id={idMensaje} className="text-sm text-tinta-tenue">
        {ayuda}
      </p>
    );
  }
  return null;
}

function Envoltorio({
  idCampo,
  children,
  className = '',
  ...mensajes
}: PropiedadesComunes & { idCampo: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <EtiquetaCampo idCampo={idCampo} etiqueta={mensajes.etiqueta} requerido={mensajes.requerido} opcional={mensajes.opcional} />
      {children}
      <MensajeCampo idMensaje={`${idCampo}-mensaje`} error={mensajes.error} advertencia={mensajes.advertencia} ayuda={mensajes.ayuda} />
    </div>
  );
}

function propsAccesibles(idCampo: string, p: PropiedadesComunes) {
  const hayMensaje = Boolean(p.error || p.advertencia || p.ayuda);
  return {
    'aria-invalid': p.error ? true : undefined,
    'aria-required': p.requerido ? true : undefined,
    'aria-describedby': hayMensaje ? `${idCampo}-mensaje` : undefined,
  } as const;
}

type PropiedadesCampoTexto = PropiedadesComunes & InputHTMLAttributes<HTMLInputElement>;

/** Nota: `className` se aplica al contenedor del campo (para fijar ancho máximo, por ejemplo). */
export const CampoTexto = forwardRef<HTMLInputElement, PropiedadesCampoTexto>(
  ({ etiqueta, error, advertencia, ayuda, requerido, opcional, id, className = '', ...resto }, ref) => {
    const idAuto = useId();
    const idCampo = id ?? `campo-${idAuto}`;
    return (
      <Envoltorio
        etiqueta={etiqueta}
        error={error}
        advertencia={advertencia}
        ayuda={ayuda}
        requerido={requerido}
        opcional={opcional}
        idCampo={idCampo}
        className={className}
      >
        <input
          ref={ref}
          id={idCampo}
          className={`${clasesControl} ${bordeControl(error, advertencia)}`}
          {...propsAccesibles(idCampo, { etiqueta, error, advertencia, ayuda, requerido })}
          {...resto}
        />
      </Envoltorio>
    );
  },
);
CampoTexto.displayName = 'CampoTexto';

type OpcionSelect = { valor: string; etiqueta: string };
type PropiedadesCampoSelect = PropiedadesComunes &
  SelectHTMLAttributes<HTMLSelectElement> & { opciones: OpcionSelect[] };

export const CampoSelect = forwardRef<HTMLSelectElement, PropiedadesCampoSelect>(
  ({ etiqueta, error, advertencia, ayuda, requerido, opcional, id, opciones, className = '', ...resto }, ref) => {
    const idAuto = useId();
    const idCampo = id ?? `campo-${idAuto}`;
    return (
      <Envoltorio
        etiqueta={etiqueta}
        error={error}
        advertencia={advertencia}
        ayuda={ayuda}
        requerido={requerido}
        opcional={opcional}
        idCampo={idCampo}
        className={className}
      >
        <select
          ref={ref}
          id={idCampo}
          className={`${clasesControl} ${bordeControl(error)}`}
          {...propsAccesibles(idCampo, { etiqueta, error, advertencia, ayuda, requerido })}
          {...resto}
        >
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
  ({ etiqueta, error, advertencia, ayuda, requerido, opcional, id, className = '', ...resto }, ref) => {
    const idAuto = useId();
    const idCampo = id ?? `campo-${idAuto}`;
    return (
      <Envoltorio
        etiqueta={etiqueta}
        error={error}
        advertencia={advertencia}
        ayuda={ayuda}
        requerido={requerido}
        opcional={opcional}
        idCampo={idCampo}
        className={className}
      >
        <textarea
          ref={ref}
          id={idCampo}
          rows={2}
          className={`${clasesControl} ${bordeControl(error)} resize-y`}
          {...propsAccesibles(idCampo, { etiqueta, error, advertencia, ayuda, requerido })}
          {...resto}
        />
      </Envoltorio>
    );
  },
);
CampoTextArea.displayName = 'CampoTextArea';
