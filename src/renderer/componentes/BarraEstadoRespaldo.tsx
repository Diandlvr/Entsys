import { useEffect, useState } from 'react';
import { formatearFechaHora, tiempoTranscurrido } from '../../core/fechas.js';
import type { EstadoRespaldo } from '../tipos.js';

/** Indicador permanente del estado del último respaldo, visible en toda la app. */
export function BarraEstadoRespaldo() {
  const [estado, setEstado] = useState<EstadoRespaldo | null>(null);

  useEffect(() => {
    function cargar() {
      window.api.respaldos.estado().then(setEstado);
    }
    cargar();
    const intervalo = setInterval(cargar, 60_000);
    window.addEventListener('respaldo-actualizado', cargar);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener('respaldo-actualizado', cargar);
    };
  }, []);

  if (!estado) {
    return (
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        Último respaldo: aún no se ha hecho ninguno.
      </div>
    );
  }

  if (!estado.ok) {
    return (
      <div className="border-b border-amber-300 bg-amber-50 px-4 py-1.5 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
        ⚠ El último respaldo falló (hace {tiempoTranscurrido(estado.fecha)}). Se reintentará automáticamente.
      </div>
    );
  }

  return (
    <div
      className={`border-b px-4 py-1.5 text-sm ${
        estado.usoCarpetaLocal
          ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200'
          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
      }`}
    >
      {estado.usoCarpetaLocal && '⚠ '}
      Último respaldo: {formatearFechaHora(estado.fecha)} ✓
      {estado.usoCarpetaLocal && ' (carpeta local; el NAS no estaba disponible)'}
    </div>
  );
}
