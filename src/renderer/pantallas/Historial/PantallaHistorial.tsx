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

/** Historial: filtros combinables, tabla con orden/paginación, edición y eliminación con deshacer. */
export function PantallaHistorial() {
  const [filtros, setFiltros] = useState<FiltrosVisitas>(FILTROS_INICIALES);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [total, setTotal] = useState(0);
  const [visitaEditando, setVisitaEditando] = useState<Visita | null>(null);
  const [visitaAEliminar, setVisitaAEliminar] = useState<Visita | null>(null);
  const [mostrarExportar, setMostrarExportar] = useState(false);
  const [mostrarImportar, setMostrarImportar] = useState(false);
  const mostrarToast = usarToast();

  const recargar = useCallback(() => {
    window.api.visitas.buscar(filtros).then(({ visitas, total }) => {
      setVisitas(visitas);
      setTotal(total);
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
    mostrarToast(`Visita de ${visita.nombre_completo} eliminada.`, {
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

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Historial</h1>
        <div className="flex gap-2">
          <Boton variante="secundario" onClick={() => setMostrarImportar(true)}>
            Importar CSV
          </Boton>
          <Boton onClick={() => setMostrarExportar(true)}>Exportar (Ctrl+E)</Boton>
        </div>
      </div>

      <BarraFiltros filtros={filtros} onCambiar={setFiltros} />

      <TablaHistorial
        visitas={visitas}
        total={total}
        filtros={filtros}
        onCambiarFiltros={setFiltros}
        onEditar={setVisitaEditando}
        onEliminar={setVisitaAEliminar}
      />

      <DialogoEditarVisita visita={visitaEditando} onCerrar={() => setVisitaEditando(null)} onGuardado={recargar} />

      <Dialogo abierto={Boolean(visitaAEliminar)} titulo="Eliminar visita" onCerrar={() => setVisitaAEliminar(null)}>
        <p className="text-slate-600 dark:text-slate-300">
          ¿Eliminar la visita de <strong>{visitaAEliminar?.nombre_completo}</strong>? Podrás deshacerlo justo
          después desde el mensaje de confirmación.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setVisitaAEliminar(null)}>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={confirmarEliminar}>
            Eliminar
          </Boton>
        </div>
      </Dialogo>

      {mostrarExportar && (
        <PanelExportar filtros={filtros} onCerrar={() => setMostrarExportar(false)} />
      )}
      {mostrarImportar && (
        <PanelImportar onCerrar={() => setMostrarImportar(false)} onImportado={recargar} />
      )}
    </div>
  );
}
