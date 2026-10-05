import { useEffect, useState } from 'react';
import { formatearFechaHora, tiempoTranscurrido } from '../../core/fechas.js';
import type { EstadoRespaldo } from '../tipos.js';
import { IconoAviso, IconoCheck } from './ui/iconos.js';

/** Indicador permanente del estado del último respaldo: discreto si todo va bien, visible si no. */
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

  const base = 'flex items-center gap-2 border-b px-6 py-1.5 text-sm';

  if (!estado) {
    return (
      <div className={`${base} border-borde bg-fondo text-tinta-tenue`}>
        Aún no se ha hecho ningún respaldo. Puedes crear uno desde Ajustes.
      </div>
    );
  }

  if (!estado.ok) {
    return (
      <div role="alert" className={`${base} border-aviso-borde bg-aviso-tinte text-aviso`}>
        <IconoAviso className="h-4 w-4 shrink-0" />
        El último respaldo falló hace {tiempoTranscurrido(estado.fecha)}. Se reintentará automáticamente.
      </div>
    );
  }

  if (estado.usoCarpetaLocal) {
    return (
      <div className={`${base} border-aviso-borde bg-aviso-tinte text-aviso`}>
        <IconoAviso className="h-4 w-4 shrink-0" />
        Respaldo guardado el {formatearFechaHora(estado.fecha)} en la carpeta local, porque el NAS no estaba disponible.
      </div>
    );
  }

  return (
    <div className={`${base} border-borde bg-fondo text-tinta-tenue`}>
      <IconoCheck className="h-4 w-4 shrink-0 text-exito" />
      Último respaldo: {formatearFechaHora(estado.fecha)}
    </div>
  );
}
