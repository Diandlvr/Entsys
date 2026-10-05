import { IconoCheck } from './iconos.js';

type Propiedades = {
  pasos: string[];
  /** Índice (desde 0) del paso actual. */
  actual: number;
};

/** Indicador de pasos para asistentes de varias etapas (aquí sí es una secuencia real). */
export function Pasos({ pasos, actual }: Propiedades) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progreso">
      {pasos.map((paso, indice) => {
        const hecho = indice < actual;
        const activo = indice === actual;
        return (
          <li key={paso} className="flex items-center gap-2" aria-current={activo ? 'step' : undefined}>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-pill text-xs font-semibold transition-colors
                ${hecho || activo ? 'bg-acento text-acento-sobre' : 'bg-tarjeta-suave text-tinta-tenue'}`}
            >
              {hecho ? <IconoCheck className="h-3.5 w-3.5" strokeWidth={2.6} /> : indice + 1}
            </span>
            <span className={`text-sm ${activo ? 'font-semibold text-tinta' : 'text-tinta-tenue'}`}>{paso}</span>
            {indice < pasos.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-6 bg-borde-fuerte" />}
          </li>
        );
      })}
    </ol>
  );
}
