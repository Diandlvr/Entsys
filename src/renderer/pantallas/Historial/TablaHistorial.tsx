import type { KeyboardEvent } from 'react';
import { Boton } from '../../componentes/ui/Boton.js';
import { IconoFlecha, IconoLapiz, IconoPapelera } from '../../componentes/ui/iconos.js';
import { Pill } from '../../componentes/ui/Pill.js';
import { Tarjeta } from '../../componentes/ui/Tarjeta.js';
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
  { clave: 'acciones', etiqueta: 'Acciones', ordenable: false },
];

type Propiedades = {
  visitas: Visita[];
  total: number;
  filtros: FiltrosVisitas;
  cargando: boolean;
  hayFiltros: boolean;
  onCambiarFiltros: (filtros: FiltrosVisitas) => void;
  onQuitarFiltros: () => void;
  onEditar: (visita: Visita) => void;
  onEliminar: (visita: Visita) => void;
};

/** Tabla del historial: orden por columna, edición por doble clic o Enter, y paginación con rango visible. */
export function TablaHistorial({
  visitas,
  total,
  filtros,
  cargando,
  hayFiltros,
  onCambiarFiltros,
  onQuitarFiltros,
  onEditar,
  onEliminar,
}: Propiedades) {
  const limite = filtros.limite ?? 50;
  const offset = filtros.offset ?? 0;
  const paginaActual = Math.floor(offset / limite) + 1;
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  const primero = total === 0 ? 0 : offset + 1;
  const ultimo = Math.min(offset + limite, total);

  function ordenarPor(clave: string) {
    const mismaColumna = filtros.orden === clave;
    const direccion = mismaColumna && filtros.direccion === 'DESC' ? 'ASC' : 'DESC';
    onCambiarFiltros({ ...filtros, orden: clave, direccion, offset: 0 });
  }

  function irAPagina(pagina: number) {
    onCambiarFiltros({ ...filtros, offset: (pagina - 1) * limite });
  }

  function alPresionarTeclaEnFila(evento: KeyboardEvent<HTMLTableRowElement>, visita: Visita) {
    // Enter sobre la fila abre la edición; sobre un botón de la fila, hace lo que el botón dice.
    if (evento.key === 'Enter' && evento.target === evento.currentTarget) {
      evento.preventDefault();
      onEditar(visita);
    }
  }

  return (
    <Tarjeta sinRelleno className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3 pt-4 text-sm text-tinta-suave">
        <span className="cifras" aria-live="polite">
          {total} {total === 1 ? 'visita' : 'visitas'}
        </span>
        {visitas.length > 0 && <span>Haz doble clic en una fila, o pulsa Enter sobre ella, para editarla.</span>}
      </div>

      {cargando ? (
        <p className="px-5 py-14 text-center text-tinta-suave">Cargando visitas…</p>
      ) : visitas.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="font-titulo text-2xl text-tinta">
            {hayFiltros ? 'Ninguna visita coincide con estos filtros' : 'Todavía no hay visitas registradas'}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-tinta-suave">
            {hayFiltros
              ? 'Prueba con otras palabras o amplía el rango de fechas.'
              : 'Las entradas que registres en la pantalla de Registro aparecerán aquí.'}
          </p>
          {hayFiltros && (
            <Boton variante="secundario" className="mt-5" onClick={onQuitarFiltros}>
              Quitar filtros
            </Boton>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-[0.9375rem]">
            <thead>
              <tr className="border-y border-borde bg-tarjeta-suave text-left text-sm text-tinta-suave">
                {COLUMNAS.map((columna) => {
                  const activa = filtros.orden === columna.clave;
                  return (
                    <th
                      key={columna.clave}
                      scope="col"
                      aria-sort={
                        columna.ordenable && activa ? (filtros.direccion === 'ASC' ? 'ascending' : 'descending') : undefined
                      }
                      className="px-4 py-2.5 font-medium"
                    >
                      {columna.ordenable ? (
                        <button
                          type="button"
                          onClick={() => ordenarPor(columna.clave)}
                          title={`Ordenar por ${columna.etiqueta.toLowerCase()}`}
                          className={`-mx-2 flex min-h-[2rem] items-center gap-1 rounded-lg px-2 transition-colors hover:text-tinta ${
                            activa ? 'text-tinta' : ''
                          }`}
                        >
                          {columna.etiqueta}
                          {activa && <IconoFlecha direccion={filtros.direccion === 'ASC' ? 'arriba' : 'abajo'} className="h-4 w-4" />}
                        </button>
                      ) : columna.clave === 'acciones' ? (
                        <span className="sr-only">{columna.etiqueta}</span>
                      ) : (
                        columna.etiqueta
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visitas.map((visita) => (
                <tr
                  key={visita.id}
                  tabIndex={0}
                  onDoubleClick={() => onEditar(visita)}
                  onKeyDown={(e) => alPresionarTeclaEnFila(e, visita)}
                  className="cursor-default border-b border-borde text-tinta transition-colors hover:bg-tarjeta-suave focus-visible:bg-tarjeta-suave"
                >
                  <td className="cifras whitespace-nowrap px-4 py-3">{formatearFechaHora(visita.entrada)}</td>
                  <td className="cifras whitespace-nowrap px-4 py-3">
                    {visita.salida ? formatearFechaHora(visita.salida) : <Pill tono="dentro">Dentro</Pill>}
                  </td>
                  <td className="min-w-[11rem] px-4 py-3 font-medium">{visita.nombre_completo}</td>
                  <td className="cifras whitespace-nowrap px-4 py-3">{visita.documento}</td>
                  <td className="px-4 py-3">{visita.empresa ?? <span className="text-tinta-tenue">Sin empresa</span>}</td>
                  <td className="px-4 py-3">{visita.destino}</td>
                  <td className="px-4 py-3">{visita.a_quien_visita}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEditar(visita)}
                        aria-label={`Editar visita de ${visita.nombre_completo}`}
                        title="Editar visita"
                        className="flex h-10 w-10 items-center justify-center rounded-control text-tinta-suave transition-colors hover:bg-acento-tinte hover:text-acento-texto"
                      >
                        <IconoLapiz className="h-[1.15rem] w-[1.15rem]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEliminar(visita)}
                        aria-label={`Eliminar visita de ${visita.nombre_completo}`}
                        title="Eliminar visita"
                        className="flex h-10 w-10 items-center justify-center rounded-control text-tinta-tenue transition-colors hover:bg-peligro-tinte hover:text-peligro"
                      >
                        <IconoPapelera className="h-[1.15rem] w-[1.15rem]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!cargando && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="cifras text-sm text-tinta-suave">
            Mostrando {primero}–{ultimo} de {total}
          </p>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-3">
              <Boton variante="secundario" disabled={paginaActual <= 1} onClick={() => irAPagina(paginaActual - 1)}>
                Anterior
              </Boton>
              <span className="cifras text-sm text-tinta-suave">
                Página {paginaActual} de {totalPaginas}
              </span>
              <Boton variante="secundario" disabled={paginaActual >= totalPaginas} onClick={() => irAPagina(paginaActual + 1)}>
                Siguiente
              </Boton>
            </div>
          )}
        </div>
      )}
    </Tarjeta>
  );
}
