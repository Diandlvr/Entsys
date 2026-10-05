import type { ReactNode } from 'react';
import { IconoAviso, IconoCheck } from './iconos.js';

type Propiedades = {
  tipo?: 'radio' | 'checkbox';
  name: string;
  valor: string;
  marcado: boolean;
  onCambiar: (marcado: boolean) => void;
  titulo: string;
  descripcion?: ReactNode;
  /** Texto de cuidado (por ejemplo, "esto reemplaza datos"). Se muestra con icono de aviso. */
  advertencia?: string;
  disabled?: boolean;
};

/**
 * Opción dentro de una tarjeta entera clicable. La tarjeta se tiñe suavemente al marcarse.
 * Es un radio/checkbox nativo (accesible con teclado y lectores de pantalla), oculto visualmente.
 */
export function OpcionTarjeta({ tipo = 'radio', name, valor, marcado, onCambiar, titulo, descripcion, advertencia, disabled }: Propiedades) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-control border p-4 transition-colors
        has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-acento
        ${marcado ? 'border-acento bg-acento-tinte' : 'border-borde bg-tarjeta hover:bg-tarjeta-suave'}
        ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        type={tipo}
        name={name}
        value={valor}
        checked={marcado}
        disabled={disabled}
        onChange={(e) => onCambiar(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-colors
          ${tipo === 'radio' ? 'rounded-pill' : 'rounded-md'}
          ${marcado ? 'border-acento bg-acento text-acento-sobre' : 'border-borde-fuerte bg-tarjeta'}`}
      >
        {marcado && <IconoCheck className="h-3.5 w-3.5" strokeWidth={2.6} />}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium text-tinta">{titulo}</span>
        {descripcion && <span className="text-sm text-tinta-suave">{descripcion}</span>}
        {advertencia && (
          <span className="mt-1 flex items-start gap-1.5 text-sm font-medium text-aviso">
            <IconoAviso className="mt-0.5 h-4 w-4 shrink-0" />
            {advertencia}
          </span>
        )}
      </span>
    </label>
  );
}
