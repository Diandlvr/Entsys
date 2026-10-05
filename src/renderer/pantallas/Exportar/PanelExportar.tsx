import { useEffect, useState } from 'react';
import { Boton } from '../../componentes/ui/Boton.js';
import { Dialogo } from '../../componentes/ui/Dialogo.js';
import { usarToast } from '../../componentes/ui/Toast.js';
import type { FiltrosVisitas } from '../../tipos.js';

type Propiedades = {
  filtros: FiltrosVisitas;
  onCerrar: () => void;
};

/** Diálogo de exportación: CSV o PDF del resultado actualmente filtrado en el historial. */
export function PanelExportar({ filtros, onCerrar }: Propiedades) {
  const [cantidad, setCantidad] = useState<number | null>(null);
  const [exportandoCsv, setExportandoCsv] = useState(false);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const mostrarToast = usarToast();

  // Cuenta cuántos registros saldrán, para que nadie exporte "a ciegas".
  useEffect(() => {
    window.api.visitas.buscar({ ...filtros, limite: 1, offset: 0 }).then((r) => setCantidad(r.total));
  }, [filtros]);

  const sinRegistros = cantidad === 0;
  const ocupado = exportandoCsv || exportandoPdf;

  async function exportarCsv() {
    setExportandoCsv(true);
    try {
      const resultado = await window.api.exportar.csv(filtros);
      if (resultado.guardado) {
        mostrarToast(`CSV guardado: ${resultado.cantidad} visitas`, { tipo: 'exito' });
        onCerrar();
      }
    } catch {
      mostrarToast('No se pudo guardar el CSV. Revisa que el archivo no esté abierto en otro programa.', { tipo: 'error' });
    } finally {
      setExportandoCsv(false);
    }
  }

  async function exportarPdf() {
    setExportandoPdf(true);
    try {
      const resultado = await window.api.exportar.pdf(filtros);
      if (resultado.guardado) {
        mostrarToast(`PDF guardado: ${resultado.cantidad} visitas`, { tipo: 'exito' });
        onCerrar();
      }
    } catch {
      mostrarToast('No se pudo guardar el PDF. Revisa que el archivo no esté abierto en otro programa.', { tipo: 'error' });
    } finally {
      setExportandoPdf(false);
    }
  }

  return (
    <Dialogo abierto titulo="Exportar historial" onCerrar={onCerrar}>
      <p className="text-tinta-suave" aria-live="polite">
        {cantidad === null
          ? 'Contando visitas…'
          : sinRegistros
            ? 'Con los filtros actuales no hay visitas para exportar. Quita algún filtro e inténtalo de nuevo.'
            : `Se exportarán ${cantidad} ${cantidad === 1 ? 'visita' : 'visitas'}, las mismas que ves ahora con tus filtros.`}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-control border border-borde p-4">
          <div>
            <p className="font-medium text-tinta">Archivo CSV</p>
            <p className="mt-0.5 text-sm text-tinta-suave">Para abrir en Excel o llevar los datos a otro sistema.</p>
          </div>
          <Boton onClick={exportarCsv} cargando={exportandoCsv} disabled={sinRegistros || ocupado} motivoDeshabilitado={sinRegistros ? 'No hay visitas para exportar' : undefined} className="mt-auto">
            Guardar como CSV
          </Boton>
        </div>
        <div className="flex flex-col gap-3 rounded-control border border-borde p-4">
          <div>
            <p className="font-medium text-tinta">Documento PDF</p>
            <p className="mt-0.5 text-sm text-tinta-suave">Para imprimir o enviar como reporte.</p>
          </div>
          <Boton
            variante="secundario"
            onClick={exportarPdf}
            cargando={exportandoPdf}
            disabled={sinRegistros || ocupado}
            motivoDeshabilitado={sinRegistros ? 'No hay visitas para exportar' : undefined}
            className="mt-auto"
          >
            Guardar como PDF
          </Boton>
        </div>
      </div>
    </Dialogo>
  );
}
