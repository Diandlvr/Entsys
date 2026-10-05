import { useRef, useState } from 'react';
import { IconoArchivo, IconoSubir } from './iconos.js';

type Propiedades = {
  accept: string;
  archivo: File | null;
  onArchivo: (archivo: File) => void;
};

function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Zona grande para soltar un archivo o elegirlo con clic/teclado. Muestra nombre y tamaño al elegirlo. */
export function ZonaArchivo({ accept, archivo, onArchivo }: Propiedades) {
  const refInput = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastrando(false);
        const soltado = e.dataTransfer.files?.[0];
        if (soltado) onArchivo(soltado);
      }}
    >
      <button
        type="button"
        onClick={() => refInput.current?.click()}
        className={`flex w-full flex-col items-center gap-2 rounded-control border-2 border-dashed px-6 py-8 text-center transition-colors
          ${arrastrando ? 'border-acento bg-acento-tinte' : 'border-borde-fuerte bg-tarjeta hover:bg-tarjeta-suave'}`}
      >
        {archivo ? (
          <>
            <IconoArchivo className="h-8 w-8 text-acento-texto" />
            <span className="font-medium text-tinta">{archivo.name}</span>
            <span className="text-sm text-tinta-suave">{formatearTamano(archivo.size)} · Haz clic para elegir otro</span>
          </>
        ) : (
          <>
            <IconoSubir className="h-8 w-8 text-tinta-tenue" />
            <span className="font-medium text-tinta">Suelta aquí tu archivo CSV</span>
            <span className="text-sm text-tinta-suave">o haz clic para buscarlo en tu computadora</span>
          </>
        )}
      </button>
      <input
        ref={refInput}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const elegido = e.target.files?.[0];
          if (elegido) onArchivo(elegido);
          // Permite volver a elegir el mismo archivo.
          e.target.value = '';
        }}
      />
    </div>
  );
}
