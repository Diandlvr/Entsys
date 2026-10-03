import { useEffect, useMemo, useState } from 'react';
import { Boton } from '../../componentes/ui/Boton.js';
import { usarToast } from '../../componentes/ui/Toast.js';
import { esDeDiaAnterior, formatearHora, tiempoTranscurrido } from '../../../core/fechas.js';
import type { Visita } from '../../tipos.js';

type Propiedades = {
  visitas: Visita[];
  onCambio: () => void;
};

/**
 * Lista de personas dentro ahora (sin salida registrada), con tiempo transcurrido
 * y botón grande para marcar la salida. Resalta las que quedaron abiertas de días
 * anteriores (probable olvido) y permite cerrarlas todas de una vez.
 */
export function PanelDentroAhora({ visitas, onCambio }: Propiedades) {
  const [, forzarActualizacion] = useState(0);
  const mostrarToast = usarToast();

  // Refresca el texto de "tiempo transcurrido" cada 30 segundos sin volver a pedir datos.
  useEffect(() => {
    const intervalo = setInterval(() => forzarActualizacion((n) => n + 1), 30_000);
    return () => clearInterval(intervalo);
  }, []);

  const visitasAnteriores = useMemo(() => visitas.filter((v) => esDeDiaAnterior(v.entrada)), [visitas]);

  async function marcarSalida(visita: Visita) {
    try {
      await window.api.visitas.marcarSalida(visita.id);
      onCambio();
      mostrarToast(`Salida registrada: ${visita.nombre_completo}`, {
        tipo: 'exito',
        accion: {
          etiqueta: 'Deshacer',
          alHacerClic: async () => {
            await window.api.visitas.deshacerSalida(visita.id);
            onCambio();
          },
        },
      });
    } catch {
      mostrarToast('No se pudo registrar la salida.', { tipo: 'error' });
    }
  }

  async function cerrarAnterioresEnLote() {
    try {
      await window.api.visitas.marcarSalidaEnLote(visitasAnteriores.map((v) => v.id));
      onCambio();
      mostrarToast(`Se cerraron ${visitasAnteriores.length} visitas abiertas de días anteriores.`, {
        tipo: 'exito',
      });
    } catch {
      mostrarToast('No se pudo cerrar las visitas en lote.', { tipo: 'error' });
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Dentro ahora</h2>
        <span className="rounded-full bg-acento-100 px-3 py-1 text-sm font-semibold text-acento-700 dark:bg-acento-900 dark:text-acento-200">
          {visitas.length}
        </span>
      </div>

      {visitasAnteriores.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 dark:border-amber-700 dark:bg-amber-950">
          <span className="text-sm text-amber-800 dark:text-amber-200">
            {visitasAnteriores.length} {visitasAnteriores.length === 1 ? 'visita' : 'visitas'} sin salida de días
            anteriores (probable olvido).
          </span>
          <Boton variante="secundario" onClick={cerrarAnterioresEnLote} className="shrink-0">
            Cerrar todas
          </Boton>
        </div>
      )}

      {visitas.length === 0 ? (
        <p className="py-8 text-center text-slate-500 dark:text-slate-400">Aún no hay visitas dentro.</p>
      ) : (
        <ul className="flex flex-col gap-2 overflow-y-auto">
          {visitas.map((visita) => {
            const esAnterior = esDeDiaAnterior(visita.entrada);
            return (
              <li
                key={visita.id}
                className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
                  esAnterior
                    ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                    {visita.nombre_completo}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {visita.destino} · {visita.a_quien_visita} · entró {formatearHora(visita.entrada)} · hace{' '}
                    {tiempoTranscurrido(visita.entrada)}
                  </p>
                </div>
                <Boton onClick={() => marcarSalida(visita)} className="shrink-0">
                  Marcar salida
                </Boton>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
