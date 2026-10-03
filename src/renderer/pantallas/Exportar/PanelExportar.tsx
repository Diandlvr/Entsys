import { useState } from 'react';
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
  const [exportandoCsv, setExportandoCsv] = useState(false);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const mostrarToast = usarToast();

  async function exportarCsv() {
    setExportandoCsv(true);
    try {
      const resultado = await window.api.exportar.csv(filtros);
      if (resultado.guardado) {
        mostrarToast(`CSV guardado: ${resultado.cantidad} registros.`, { tipo: 'exito' });
        onCerrar();
      }
    } catch {
      mostrarToast('No se pudo exportar el CSV.', { tipo: 'error' });
    } finally {
      setExportandoCsv(false);
    }
  }

  async function exportarPdf() {
    setExportandoPdf(true);
    try {
      const resultado = await window.api.exportar.pdf(filtros);
      if (resultado.guardado) {
        mostrarToast(`PDF guardado: ${resultado.cantidad} registros.`, { tipo: 'exito' });
        onCerrar();
      }
    } catch {
      mostrarToast('No se pudo exportar el PDF.', { tipo: 'error' });
    } finally {
      setExportandoPdf(false);
    }
  }

  return (
    <Dialogo abierto titulo="Exportar historial" onCerrar={onCerrar}>
      <p className="text-slate-600 dark:text-slate-300">
        Se exportará el resultado con los filtros actualmente aplicados en el historial.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Boton tamano="grande" className="flex-1" onClick={exportarCsv} disabled={exportandoCsv}>
          {exportandoCsv ? 'Generando CSV…' : 'Exportar a CSV'}
        </Boton>
        <Boton tamano="grande" variante="secundario" className="flex-1" onClick={exportarPdf} disabled={exportandoPdf}>
          {exportandoPdf ? 'Generando PDF…' : 'Exportar a PDF'}
        </Boton>
      </div>
    </Dialogo>
  );
}
