import { useId } from 'react';

type Opcion = { valor: string; etiqueta: string };

type Propiedades = {
  etiqueta: string;
  opciones: Opcion[];
  /** `null` = ninguna seleccionada (por ejemplo, los atajos de fecha cuando no hay rango). */
  valor: string | null;
  onCambiar: (valor: string) => void;
  /** Oculta la etiqueta visualmente, pero la conserva para lectores de pantalla. */
  ocultarEtiqueta?: boolean;
  className?: string;
};

/**
 * Grupo de pocas opciones excluyentes, todas visibles a la vez.
 * Usa radios nativos: se recorre con las flechas y un lector de pantalla anuncia "n de m".
 */
export function GrupoSegmentado({ etiqueta, opciones, valor, onCambiar, ocultarEtiqueta = false, className = '' }: Propiedades) {
  const name = useId();
  return (
    <fieldset className={`flex flex-col gap-1.5 ${className}`}>
      <legend className={ocultarEtiqueta ? 'sr-only' : 'mb-1.5 text-sm font-medium text-tinta'}>{etiqueta}</legend>
      <div className="inline-flex flex-wrap gap-1 rounded-control border border-borde bg-tarjeta-suave p-1">
        {opciones.map((opcion) => {
          const activa = opcion.valor === valor;
          return (
            <label
              key={opcion.valor}
              className={`flex min-h-[2.25rem] cursor-pointer items-center rounded-[9px] px-3.5 text-[0.9375rem] font-medium transition-colors
                has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-acento
                ${activa ? 'bg-acento text-acento-sobre' : 'text-tinta-suave hover:bg-tarjeta hover:text-tinta'}`}
            >
              <input
                type="radio"
                name={name}
                value={opcion.valor}
                checked={activa}
                onChange={() => onCambiar(opcion.valor)}
                className="sr-only"
              />
              {opcion.etiqueta}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
