type Seccion = 'registro' | 'historial' | 'ajustes';

const SECCIONES: Array<{ id: Seccion; etiqueta: string; atajo: string }> = [
  { id: 'registro', etiqueta: 'Registro', atajo: 'Ctrl+N' },
  { id: 'historial', etiqueta: 'Historial', atajo: 'Ctrl+F' },
  { id: 'ajustes', etiqueta: 'Ajustes', atajo: '' },
];

type Propiedades = {
  seccionActiva: Seccion;
  onCambiarSeccion: (seccion: Seccion) => void;
};

/** Navegación lateral simple: Registro, Historial, Ajustes. */
export function BarraLateral({ seccionActiva, onCambiarSeccion }: Propiedades) {
  return (
    <nav
      aria-label="Navegación principal"
      className="flex w-56 shrink-0 flex-col gap-1 border-r border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="mb-2 px-2 py-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
        Registro de Visitas
      </div>
      {SECCIONES.map((seccion) => {
        const activa = seccion.id === seccionActiva;
        return (
          <button
            key={seccion.id}
            onClick={() => onCambiarSeccion(seccion.id)}
            aria-current={activa ? 'page' : undefined}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-base font-medium
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-500
              ${
                activa
                  ? 'bg-acento-600 text-white'
                  : 'text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
          >
            <span>{seccion.etiqueta}</span>
            {seccion.atajo && (
              <span className={`text-xs ${activa ? 'text-acento-100' : 'text-slate-400'}`}>{seccion.atajo}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export type { Seccion };
