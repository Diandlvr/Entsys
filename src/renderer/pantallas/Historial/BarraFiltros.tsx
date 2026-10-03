import { Boton } from '../../componentes/ui/Boton.js';
import { CampoSelect, CampoTexto } from '../../componentes/ui/Campo.js';
import { Chip } from '../../componentes/ui/Chip.js';
import { rangoAtajo } from '../../../core/fechas.js';
import type { EstadoVisita, FiltrosVisitas } from '../../tipos.js';

type Propiedades = {
  filtros: FiltrosVisitas;
  onCambiar: (filtros: FiltrosVisitas) => void;
};

const OPCIONES_ESTADO: Array<{ valor: EstadoVisita; etiqueta: string }> = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'dentro', etiqueta: 'Dentro' },
  { valor: 'salio', etiqueta: 'Salió' },
];

const ATAJOS_FECHA = [
  { id: 'hoy' as const, etiqueta: 'Hoy' },
  { id: 'ayer' as const, etiqueta: 'Ayer' },
  { id: 'esta_semana' as const, etiqueta: 'Esta semana' },
  { id: 'este_mes' as const, etiqueta: 'Este mes' },
];

/** Barra de filtros combinables del historial, con atajos de fecha y chips removibles. */
export function BarraFiltros({ filtros, onCambiar }: Propiedades) {
  function set<K extends keyof FiltrosVisitas>(campo: K, valor: FiltrosVisitas[K]) {
    onCambiar({ ...filtros, [campo]: valor, offset: 0 });
  }

  function aplicarAtajo(atajo: 'hoy' | 'ayer' | 'esta_semana' | 'este_mes') {
    const { desde, hasta } = rangoAtajo(atajo);
    onCambiar({ ...filtros, desde, hasta, offset: 0 });
  }

  function limpiarFiltros() {
    onCambiar({ estado: 'todos', orden: filtros.orden, direccion: filtros.direccion, limite: filtros.limite, offset: 0 });
  }

  const chips: Array<{ clave: keyof FiltrosVisitas; etiqueta: string }> = [];
  if (filtros.desde || filtros.hasta) {
    chips.push({ clave: 'desde', etiqueta: `Fecha: ${filtros.desde?.slice(0, 10) ?? '…'} a ${filtros.hasta?.slice(0, 10) ?? '…'}` });
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

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-1.5">
          {ATAJOS_FECHA.map((atajo) => (
            <Boton key={atajo.id} variante="secundario" onClick={() => aplicarAtajo(atajo.id)}>
              {atajo.etiqueta}
            </Boton>
          ))}
        </div>

        <CampoTexto
          etiqueta="Documento"
          value={filtros.documento ?? ''}
          onChange={(e) => set('documento', e.target.value || undefined)}
          className="max-w-[10rem]"
        />
        <CampoTexto
          etiqueta="Nombre"
          value={filtros.nombre ?? ''}
          onChange={(e) => set('nombre', e.target.value || undefined)}
          className="max-w-[12rem]"
        />
        <CampoTexto
          etiqueta="Empresa"
          value={filtros.empresa ?? ''}
          onChange={(e) => set('empresa', e.target.value || undefined)}
          className="max-w-[10rem]"
        />
        <CampoTexto
          etiqueta="Destino"
          value={filtros.destino ?? ''}
          onChange={(e) => set('destino', e.target.value || undefined)}
          className="max-w-[10rem]"
        />
        <CampoTexto
          etiqueta="A quién visita"
          value={filtros.aQuienVisita ?? ''}
          onChange={(e) => set('aQuienVisita', e.target.value || undefined)}
          className="max-w-[10rem]"
        />
        <CampoSelect
          etiqueta="Estado"
          opciones={OPCIONES_ESTADO}
          value={filtros.estado ?? 'todos'}
          onChange={(e) => set('estado', e.target.value as EstadoVisita)}
          className="max-w-[8rem]"
        />
        <Boton variante="fantasma" onClick={limpiarFiltros}>
          Limpiar filtros
        </Boton>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Chip key={chip.clave} etiqueta={chip.etiqueta} onQuitar={() => quitarChip(chip.clave)} />
          ))}
        </div>
      )}
    </div>
  );
}
