import { useEffect, useMemo, useState } from 'react';
import { Boton } from '../../componentes/ui/Boton.js';
import { IconoAviso, IconoSalida } from '../../componentes/ui/iconos.js';
import { Pill } from '../../componentes/ui/Pill.js';
import { Tarjeta } from '../../componentes/ui/Tarjeta.js';
import { usarToast } from '../../componentes/ui/Toast.js';
import { esDeDiaAnterior, formatearHora, tiempoTranscurrido } from '../../../core/fechas.js';
import type { Visita } from '../../tipos.js';

type Propiedades = {
  visitas: Visita[];
  onCambio: () => void;
};

/**
 * Lista de personas dentro ahora (sin salida registrada), con tiempo transcurrido
 * y botón para marcar la salida. Resalta las que quedaron abiertas de días
 * anteriores (probable olvido) y permite cerrarlas todas de una vez, con opción de deshacer.
 */
export function PanelDentroAhora({ visitas, onCambio }: Propiedades) {
  const [, forzarActualizacion] = useState(0);
  const [cerrandoLote, setCerrandoLote] = useState(false);
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
      mostrarToast(`Salida marcada: ${visita.nombre_completo}`, {
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
      mostrarToast(`No se pudo marcar la salida de ${visita.nombre_completo}. Intenta de nuevo.`, { tipo: 'error' });
    }
  }

  async function cerrarAnterioresEnLote() {
    const ids = visitasAnteriores.map((v) => v.id);
    setCerrandoLote(true);
    try {
      await window.api.visitas.marcarSalidaEnLote(ids);
      onCambio();
      mostrarToast(`Salidas marcadas: ${ids.length} ${ids.length === 1 ? 'visita' : 'visitas'} de días anteriores`, {
        tipo: 'exito',
        accion: {
          etiqueta: 'Deshacer',
          alHacerClic: async () => {
            for (const id of ids) await window.api.visitas.deshacerSalida(id);
            onCambio();
          },
        },
      });
    } catch {
      mostrarToast('No se pudieron marcar las salidas. Intenta de nuevo.', { tipo: 'error' });
    } finally {
      setCerrandoLote(false);
    }
  }

  return (
    <Tarjeta className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-titulo text-3xl font-medium text-tinta">Dentro ahora</h2>
        <span
          aria-label={`${visitas.length} ${visitas.length === 1 ? 'persona dentro' : 'personas dentro'}`}
          className="cifras min-w-[2rem] rounded-pill bg-acento-tinte px-3 py-0.5 text-center text-sm font-semibold text-acento-texto"
        >
          {visitas.length}
        </span>
      </div>

      {visitasAnteriores.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-aviso-borde bg-aviso-tinte px-4 py-3">
          <p className="flex flex-1 items-start gap-2 text-sm text-aviso">
            <IconoAviso className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {visitasAnteriores.length === 1
                ? 'Hay 1 visita de un día anterior sin salida.'
                : `Hay ${visitasAnteriores.length} visitas de días anteriores sin salida.`}{' '}
              Seguramente se olvidó marcarla.
            </span>
          </p>
          <Boton variante="secundario" onClick={cerrarAnterioresEnLote} cargando={cerrandoLote} className="shrink-0">
            {visitasAnteriores.length === 1
              ? 'Marcar su salida ahora'
              : `Marcar las ${visitasAnteriores.length} salidas ahora`}
          </Boton>
        </div>
      )}

      {visitas.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-titulo text-2xl text-tinta">Nadie dentro por ahora</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-tinta-suave">
            Cuando registres una entrada, la persona aparecerá aquí para que marques su salida más tarde.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-borde">
          {visitas.map((visita) => {
            const esAnterior = esDeDiaAnterior(visita.entrada);
            return (
              <li key={visita.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2">
                    <span className="truncate font-medium text-tinta">{visita.nombre_completo}</span>
                    {esAnterior && <Pill tono="aviso">De un día anterior</Pill>}
                  </p>
                  <p className="cifras flex flex-wrap gap-x-3 text-sm text-tinta-suave">
                    <span>{visita.destino}</span>
                    <span>{visita.a_quien_visita}</span>
                    <span className="text-tinta-tenue">
                      {formatearHora(visita.entrada)}, hace {tiempoTranscurrido(visita.entrada)}
                    </span>
                  </p>
                </div>
                <Boton
                  variante="fantasma"
                  onClick={() => marcarSalida(visita)}
                  aria-label={`Marcar salida de ${visita.nombre_completo}`}
                  className="shrink-0 border border-borde !min-h-[2.25rem] !px-3 hover:border-borde-fuerte"
                >
                  <IconoSalida className="h-4 w-4" />
                  Marcar salida
                </Boton>
              </li>
            );
          })}
        </ul>
      )}
    </Tarjeta>
  );
}
