import type { ReactNode } from 'react';

type Tono = 'dentro' | 'salio' | 'aviso' | 'neutro';

const CLASES: Record<Tono, string> = {
  dentro: 'bg-acento-tinte text-acento-texto',
  salio: 'bg-tarjeta-suave text-tinta-suave',
  aviso: 'bg-aviso-tinte text-aviso',
  neutro: 'bg-tarjeta-suave text-tinta-suave',
};

/** Etiqueta redondeada para estados (Dentro, Salió, De ayer). Siempre lleva texto, no solo color. */
export function Pill({ tono = 'neutro', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-semibold ${CLASES[tono]}`}>
      {tono === 'dentro' && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-pill bg-current" />}
      {children}
    </span>
  );
}
