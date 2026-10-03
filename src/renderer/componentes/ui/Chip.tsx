type Propiedades = {
  etiqueta: string;
  onQuitar: () => void;
};

/** Chip removible para mostrar un filtro activo en el historial. */
export function Chip({ etiqueta, onQuitar }: Propiedades) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-acento-100 px-3 py-1 text-sm font-medium text-acento-800 dark:bg-acento-900 dark:text-acento-200">
      {etiqueta}
      <button
        onClick={onQuitar}
        aria-label={`Quitar filtro: ${etiqueta}`}
        className="rounded-full text-acento-600 hover:text-acento-900 dark:text-acento-300 dark:hover:text-white"
      >
        ✕
      </button>
    </span>
  );
}
