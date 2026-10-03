import { Boton } from '../../componentes/ui/Boton.js';
import { formatearFechaHora } from '../../../core/fechas.js';
import type { FiltrosVisitas, Visita } from '../../tipos.js';

type Columna = { clave: string; etiqueta: string; ordenable: boolean };

const COLUMNAS: Columna[] = [
  { clave: 'entrada', etiqueta: 'Entrada', ordenable: true },
  { clave: 'salida', etiqueta: 'Salida', ordenable: true },
  { clave: 'nombre_completo', etiqueta: 'Nombre', ordenable: true },
  { clave: 'documento', etiqueta: 'Documento', ordenable: true },
  { clave: 'empresa', etiqueta: 'Empresa', ordenable: true },
  { clave: 'destino', etiqueta: 'Destino', ordenable: true },
  { clave: 'a_quien_visita', etiqueta: 'Visita a', ordenable: false },
  { clave: 'acciones', etiqueta: '', ordenable: false },
];

type Propiedades = {
  visitas: Visita[];
  total: number;
  filtros: FiltrosVisitas;
  onCambiarFiltros: (filtros: FiltrosVisitas) => void;
  onEditar: (visita: Visita) => void;
  onEliminar: (visita: Visita) => void;
};

/** Tabla del historial: orden por columna, paginación y contador de resultados. */
export function TablaHistorial({ visitas, total, filtros, onCambiarFiltros, onEditar, onEliminar }: Propiedades) {
  const limite = filtros.limite ?? 50;
  const offset = filtros.offset ?? 0;
  const paginaActual = Math.floor(offset / limite) + 1;
  const totalPaginas = Math.max(1, Math.ceil(total / limite));

  function ordenarPor(clave: string) {
    const mismaColumna = filtros.orden === clave;
    const direccion = mismaColumna && filtros.direccion === 'DESC' ? 'ASC' : 'DESC';
    onCambiarFiltros({ ...filtros, orden: clave, direccion, offset: 0 });
  }

  function irAPagina(pagina: number) {
    onCambiarFiltros({ ...filtros, offset: (pagina - 1) * limite });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>
          {total} {total === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      {visitas.length === 0 ? (
        <p className="py-10 text-center text-slate-500 dark:text-slate-400">
          No hay visitas que coincidan con los filtros.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {COLUMNAS.map((columna) => (
                  <th key={columna.clave} className="px-2 py-2 font-medium">
                    {columna.ordenable ? (
                      <button
                        onClick={() => ordenarPor(columna.clave)}
                        className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        {columna.etiqueta}
                        {filtros.orden === columna.clave && (filtros.direccion === 'ASC' ? '▲' : '▼')}
                      </button>
                    ) : (
                      columna.etiqueta
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visitas.map((visita) => (
                <tr
                  key={visita.id}
                  className="border-b border-slate-100 text-slate-700 dark:border-slate-700/60 dark:text-slate-200"
                >
                  <td className="px-2 py-2 whitespace-nowrap">{formatearFechaHora(visita.entrada)}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {visita.salida ? (
                      formatearFechaHora(visita.salida)
                    ) : (
                      <span className="rounded-full bg-acento-100 px-2 py-0.5 text-xs font-medium text-acento-700 dark:bg-acento-900 dark:text-acento-200">
                        Dentro
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">{visita.nombre_completo}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{visita.documento}</td>
                  <td className="px-2 py-2">{visita.empresa ?? '—'}</td>
                  <td className="px-2 py-2">{visita.destino}</td>
                  <td className="px-2 py-2">{visita.a_quien_visita}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <Boton variante="secundario" onClick={() => onEditar(visita)}>
                        Editar
                      </Boton>
                      <Boton variante="peligro" onClick={() => onEliminar(visita)}>
                        Eliminar
                      </Boton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Boton variante="secundario" disabled={paginaActual <= 1} onClick={() => irAPagina(paginaActual - 1)}>
            Anterior
          </Boton>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Página {paginaActual} de {totalPaginas}
          </span>
          <Boton variante="secundario" disabled={paginaActual >= totalPaginas} onClick={() => irAPagina(paginaActual + 1)}>
            Siguiente
          </Boton>
        </div>
      )}
    </div>
  );
}
