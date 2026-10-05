import { useId, useState } from 'react';
import { Boton } from '../../componentes/ui/Boton.js';
import { CampoTexto } from '../../componentes/ui/Campo.js';
import { Chip } from '../../componentes/ui/Chip.js';
import { GrupoSegmentado } from '../../componentes/ui/GrupoSegmentado.js';
import { IconoBuscar, IconoFiltro } from '../../componentes/ui/iconos.js';
import { Tarjeta } from '../../componentes/ui/Tarjeta.js';
import { formatearFecha, rangoAtajo } from '../../../core/fechas.js';
import type { EstadoVisita, FiltrosVisitas } from '../../tipos.js';

type Propiedades = {
  filtros: FiltrosVisitas;
  onCambiar: (filtros: FiltrosVisitas) => void;
};

type AtajoFecha = 'hoy' | 'ayer' | 'esta_semana' | 'este_mes';

const OPCIONES_ESTADO: Array<{ valor: EstadoVisita; etiqueta: string }> = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'dentro', etiqueta: 'Dentro' },
  { valor: 'salio', etiqueta: 'Salió' },
];

const ATAJOS_FECHA: Array<{ valor: AtajoFecha; etiqueta: string }> = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: 'ayer', etiqueta: 'Ayer' },
  { valor: 'esta_semana', etiqueta: 'Esta semana' },
  { valor: 'este_mes', etiqueta: 'Este mes' },
];

// Mismo desfase que usa el resto de la app para guardar fechas (Panamá, sin horario de verano).
const DESFASE_PANAMA = '-05:00';

/** Atajo de fecha cuyo rango coincide exactamente con el filtro actual, si lo hay. */
function atajoActivo(filtros: FiltrosVisitas): AtajoFecha | null {
  if (!filtros.desde || !filtros.hasta) return null;
  for (const atajo of ATAJOS_FECHA) {
    const rango = rangoAtajo(atajo.valor);
    if (rango.desde === filtros.desde && rango.hasta === filtros.hasta) return atajo.valor;
  }
  return null;
}

/** Barra de filtros del historial: búsqueda rápida, estado y fecha a la vista; el resto en "Más filtros". */
export function BarraFiltros({ filtros, onCambiar }: Propiedades) {
  const idPanel = useId();
  const [masAbierto, setMasAbierto] = useState(
    Boolean(filtros.empresa || filtros.destino || filtros.aQuienVisita),
  );

  function set<K extends keyof FiltrosVisitas>(campo: K, valor: FiltrosVisitas[K]) {
    onCambiar({ ...filtros, [campo]: valor, offset: 0 });
  }

  function aplicarAtajo(atajo: AtajoFecha) {
    const { desde, hasta } = rangoAtajo(atajo);
    onCambiar({ ...filtros, desde, hasta, offset: 0 });
  }

  // La búsqueda rápida acepta nombre o documento: si lleva números es un documento.
  function buscar(texto: string) {
    const limpio = texto.trim() ? texto : undefined;
    const esDocumento = limpio ? /\d/.test(limpio) : false;
    onCambiar({
      ...filtros,
      documento: esDocumento ? limpio : undefined,
      nombre: !esDocumento ? limpio : undefined,
      offset: 0,
    });
  }

  function limpiarFiltros() {
    onCambiar({ estado: 'todos', orden: filtros.orden, direccion: filtros.direccion, limite: filtros.limite, offset: 0 });
  }

  const chips: Array<{ clave: keyof FiltrosVisitas; etiqueta: string }> = [];
  if (filtros.desde || filtros.hasta) {
    const desde = filtros.desde ? formatearFecha(filtros.desde) : null;
    const hasta = filtros.hasta ? formatearFecha(filtros.hasta) : null;
    chips.push({
      clave: 'desde',
      etiqueta: desde && hasta ? (desde === hasta ? `Fecha: ${desde}` : `Fecha: ${desde} a ${hasta}`) : `Fecha: ${desde ? `desde ${desde}` : `hasta ${hasta}`}`,
    });
  }
  if (filtros.documento) chips.push({ clave: 'documento', etiqueta: `Documento: ${filtros.documento}` });
  if (filtros.nombre) chips.push({ clave: 'nombre', etiqueta: `Nombre: ${filtros.nombre}` });
  if (filtros.empresa) chips.push({ clave: 'empresa', etiqueta: `Empresa: ${filtros.empresa}` });
  if (filtros.destino) chips.push({ clave: 'destino', etiqueta: `Destino: ${filtros.destino}` });
  if (filtros.aQuienVisita) chips.push({ clave: 'aQuienVisita', etiqueta: `Visita a: ${filtros.aQuienVisita}` });
  if (filtros.estado && filtros.estado !== 'todos') {
    chips.push({ clave: 'estado', etiqueta: `Estado: ${filtros.estado === 'dentro' ? 'Dentro' : 'Salió'}` });
  }

  function quitarChip(clave: keyof FiltrosVisitas) {
    if (clave === 'desde') {
      onCambiar({ ...filtros, desde: undefined, hasta: undefined, offset: 0 });
    } else {
      onCambiar({ ...filtros, [clave]: clave === 'estado' ? 'todos' : undefined, offset: 0 });
    }
  }

  const filtrosOcultosActivos = [filtros.empresa, filtros.destino, filtros.aQuienVisita].filter(Boolean).length;

  return (
    <Tarjeta className="flex flex-col gap-4 !p-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="busqueda-rapida" className="sr-only">
            Buscar por nombre o documento
          </label>
          <div className="relative">
            <IconoBuscar className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-tinta-tenue" />
            <input
              id="busqueda-rapida"
              type="search"
              value={filtros.documento ?? filtros.nombre ?? ''}
              onChange={(e) => buscar(e.target.value)}
              placeholder="Buscar por nombre o documento"
              className="min-h-[2.75rem] w-full rounded-control border border-borde-fuerte bg-tarjeta py-2.5 pl-11 pr-3.5 text-base text-tinta
                placeholder:text-tinta-tenue transition-colors focus:border-acento focus:outline-none focus:ring-2 focus:ring-acento/30"
            />
          </div>
        </div>
        <GrupoSegmentado
          etiqueta="Estado"
          opciones={OPCIONES_ESTADO}
          valor={filtros.estado ?? 'todos'}
          onCambiar={(valor) => set('estado', valor as EstadoVisita)}
        />
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <GrupoSegmentado
          etiqueta="Fecha"
          opciones={ATAJOS_FECHA}
          valor={atajoActivo(filtros)}
          onCambiar={(valor) => aplicarAtajo(valor as AtajoFecha)}
        />
        <div className="ml-auto flex items-center gap-2">
          <Boton
            variante="fantasma"
            aria-expanded={masAbierto}
            aria-controls={idPanel}
            onClick={() => setMasAbierto((abierto) => !abierto)}
          >
            <IconoFiltro className="h-4 w-4" />
            Más filtros
            {filtrosOcultosActivos > 0 && (
              <span className="cifras rounded-pill bg-acento px-1.5 text-xs font-semibold text-acento-sobre">{filtrosOcultosActivos}</span>
            )}
          </Boton>
          {chips.length > 0 && (
            <Boton variante="fantasma" onClick={limpiarFiltros}>
              Quitar todos los filtros
            </Boton>
          )}
        </div>
      </div>

      {masAbierto && (
        <div id={idPanel} className="grid grid-cols-1 gap-4 border-t border-borde pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <CampoTexto etiqueta="Empresa" value={filtros.empresa ?? ''} onChange={(e) => set('empresa', e.target.value || undefined)} />
          <CampoTexto etiqueta="Piso u oficina" value={filtros.destino ?? ''} onChange={(e) => set('destino', e.target.value || undefined)} />
          <CampoTexto
            etiqueta="A quién visitó"
            value={filtros.aQuienVisita ?? ''}
            onChange={(e) => set('aQuienVisita', e.target.value || undefined)}
          />
          <CampoTexto
            etiqueta="Desde"
            type="date"
            value={filtros.desde?.slice(0, 10) ?? ''}
            max={filtros.hasta?.slice(0, 10)}
            onChange={(e) => set('desde', e.target.value ? `${e.target.value}T00:00:00${DESFASE_PANAMA}` : undefined)}
          />
          <CampoTexto
            etiqueta="Hasta"
            type="date"
            value={filtros.hasta?.slice(0, 10) ?? ''}
            min={filtros.desde?.slice(0, 10)}
            onChange={(e) => set('hasta', e.target.value ? `${e.target.value}T23:59:59${DESFASE_PANAMA}` : undefined)}
          />
        </div>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Filtros aplicados" role="group">
          {chips.map((chip) => (
            <Chip key={chip.clave} etiqueta={chip.etiqueta} onQuitar={() => quitarChip(chip.clave)} />
          ))}
        </div>
      )}
    </Tarjeta>
  );
}
