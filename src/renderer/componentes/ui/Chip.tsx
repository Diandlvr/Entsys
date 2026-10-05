import { IconoCerrar } from './iconos.js';
import { Tooltip } from './Tooltip.js';

type Propiedades = {
  etiqueta: string;
  onQuitar: () => void;
};

/** Pill removible para mostrar un filtro activo en el historial. */
export function Chip({ etiqueta, onQuitar }: Propiedades) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-acento-tinte py-1 pl-3.5 pr-1.5 text-sm font-medium text-acento-texto">
      {etiqueta}
      <Tooltip texto="Quitar este filtro">
        <button
          type="button"
          onClick={onQuitar}
          aria-label={`Quitar filtro: ${etiqueta}`}
          className="flex h-7 w-7 items-center justify-center rounded-pill transition-colors hover:bg-acento/15"
        >
          <IconoCerrar className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
    </span>
  );
}
