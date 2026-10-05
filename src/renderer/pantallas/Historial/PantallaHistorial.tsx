import { useCallback, useEffect, useState } from 'react';
import { Boton } from '../../componentes/ui/Boton.js';
import { Dialogo } from '../../componentes/ui/Dialogo.js';
import { usarToast } from '../../componentes/ui/Toast.js';
import { BarraFiltros } from './BarraFiltros.js';
import { TablaHistorial } from './TablaHistorial.js';
import { DialogoEditarVisita } from './DialogoEditarVisita.js';
import { PanelExportar } from '../Exportar/PanelExportar.js';
import { PanelImportar } from '../Importar/PanelImportar.js';
import type { FiltrosVisitas, Visita } from '../../tipos.js';

const FILTROS_INICIALES: FiltrosVisitas = {
  estado: 'todos',
  orden: 'entrada',
  direccion: 'DESC',
  limite: 50,
  offset: 0,
};

function hayFiltrosActivos(f: FiltrosVisitas): boolean {
  return Boolean(
    f.desde || f.hasta || f.documento || f.nombre || f.empresa || f.destino || f.aQuienVisita || (f.estado && f.estado !== 'todos'),
  );
}

/** Historial: filtros combinables, tabla con orden/paginación, edición y eliminación con deshacer. */
export function PantallaHistorial() {
  const [filtros, setFiltros] = useState<FiltrosVisitas>(FILTROS_INICIALES);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [visitaEditando, setVisitaEditando] = useState<Visita | null>(null);
  const [visitaAEliminar, setVisitaAEliminar] = useState<Visita | null>(null);
  const [mostrarExportar, setMostrarExportar] = useState(false);
  const [mostrarImportar, setMostrarImportar] = useState(false);
  const mostrarToast = usarToast();

  const recargar = useCallback(() => {
    window.api.visitas.buscar(filtros).then(({ visitas, total }) => {
      setVisitas(visitas);
      setTotal(total);
      setCargando(false);
    });
  }, [filtros]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  // Ctrl+E abre el diálogo de exportar; Escape ya cierra los diálogos abiertos (Dialogo lo maneja).
  useEffect(() => {
    function alPresionarTecla(evento: KeyboardEvent) {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'e') {
        evento.preventDefault();
        setMostrarExportar(true);
      }
    }
    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, []);

  async function confirmarEliminar() {
    if (!visitaAEliminar) return;
    const visita = visitaAEliminar;
    setVisitaAEliminar(null);
    await window.api.visitas.eliminar(visita.id);
    recargar();
    mostrarToast(`Visita eliminada: ${visita.nombre_completo}`, {
      tipo: 'exito',
      accion: {
        etiqueta: 'Deshacer',
        alHacerClic: async () => {
          await window.api.visitas.restaurarEliminada(visita);
          recargar();
        },
      },
    });
  }

  function quitarFiltros() {
    setFiltros({ ...FILTROS_INICIALES, orden: filtros.orden, direccion: filtros.direccion });
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo-pantalla text-4xl text-tinta">
            Historial de <em>entradas</em>
          </h1>
          <p className="mt-1 text-tinta-suave">Busca, corrige o exporta cualquier visita ya registrada.</p>
        </div>
        <div className="flex gap-2">
          <Boton variante="secundario" onClick={() => setMostrarImportar(true)}>
            Importar desde CSV
          </Boton>
          <Boton onClick={() => setMostrarExportar(true)}>
            Exportar historial
            <kbd className="font-sans text-xs opacity-75">Ctrl E</kbd>
          </Boton>
        </div>
      </div>

      <BarraFiltros filtros={filtros} onCambiar={setFiltros} />

      <TablaHistorial
        visitas={visitas}
        total={total}
        filtros={filtros}
        cargando={cargando}
        hayFiltros={hayFiltrosActivos(filtros)}
        onCambiarFiltros={setFiltros}
        onQuitarFiltros={quitarFiltros}
        onEditar={setVisitaEditando}
        onEliminar={setVisitaAEliminar}
      />

      <DialogoEditarVisita visita={visitaEditando} onCerrar={() => setVisitaEditando(null)} onGuardado={recargar} />

      <Dialogo abierto={Boolean(visitaAEliminar)} titulo="¿Eliminar esta visita?" onCerrar={() => setVisitaAEliminar(null)}>
        <p className="text-tinta-suave">
          Vas a eliminar la visita de <strong className="font-semibold text-tinta">{visitaAEliminar?.nombre_completo}</strong>. Si
          te equivocas, podrás deshacerlo desde el aviso que aparece justo después.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setVisitaAEliminar(null)} data-autofocus>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={confirmarEliminar}>
            Eliminar visita
          </Boton>
        </div>
      </Dialogo>

      {mostrarExportar && <PanelExportar filtros={filtros} onCerrar={() => setMostrarExportar(false)} />}
      {mostrarImportar && <PanelImportar onCerrar={() => setMostrarImportar(false)} onImportado={recargar} />}
    </div>
  );
}
