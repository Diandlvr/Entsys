import { useEffect, useState } from 'react';
import { Dialogo } from './ui/Dialogo.js';
import { Boton } from './ui/Boton.js';
import { IconoTeclado } from './ui/iconos.js';

type Seccion = 'registro' | 'historial' | 'ajustes';

const SECCIONES: Array<{ id: Seccion; etiqueta: string; atajo: string }> = [
  { id: 'registro', etiqueta: 'Registro', atajo: 'Ctrl N' },
  { id: 'historial', etiqueta: 'Historial', atajo: 'Ctrl F' },
  { id: 'ajustes', etiqueta: 'Ajustes', atajo: '' },
];

const ATAJOS: Array<{ teclas: string; accion: string }> = [
  { teclas: 'Ctrl + N', accion: 'Ir a Registro para anotar una entrada' },
  { teclas: 'Ctrl + F', accion: 'Ir al Historial para buscar visitas' },
  { teclas: 'Ctrl + E', accion: 'Exportar el historial (estando en Historial)' },
  { teclas: 'Enter', accion: 'Pasar al siguiente campo del formulario' },
  { teclas: 'Ctrl + Enter', accion: 'Registrar la entrada sin recorrer el resto de campos' },
  { teclas: 'Esc', accion: 'Cerrar la ventana o la lista abierta' },
  { teclas: '?', accion: 'Mostrar esta ayuda' },
];

type Propiedades = {
  seccionActiva: Seccion;
  onCambiarSeccion: (seccion: Seccion) => void;
};

function Logo() {
  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-gradient-to-br from-acento to-acento-2 font-titulo text-xl font-semibold tracking-tight text-white"
    >
      PH
    </div>
  );
}

/** Cabecera delgada: identidad del edificio, navegación entre secciones y ayuda de atajos. */
export function Cabecera({ seccionActiva, onCambiarSeccion }: Propiedades) {
  const [ayudaAbierta, setAyudaAbierta] = useState(false);

  // "?" abre la ayuda de atajos, salvo que la persona esté escribiendo en un campo.
  useEffect(() => {
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key !== '?' || evento.ctrlKey || evento.metaKey) return;
      const destino = evento.target as HTMLElement;
      if (destino.closest('input, textarea, select, [contenteditable="true"]')) return;
      evento.preventDefault();
      setAyudaAbierta(true);
    }
    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, []);

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-borde bg-tarjeta px-6 py-2.5">
      <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
        <Logo />
        <div className="leading-tight">
          <p className="font-titulo text-2xl font-semibold text-tinta">P.H. Twist</p>
          <p className="text-xs text-tinta-suave">Sistema de gestión de entrada</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <nav aria-label="Navegación principal" className="flex items-center gap-1">
          {SECCIONES.map((seccion) => {
            const activa = seccion.id === seccionActiva;
            return (
              <button
                key={seccion.id}
                type="button"
                onClick={() => onCambiarSeccion(seccion.id)}
                aria-current={activa ? 'page' : undefined}
                className={`flex min-h-[2.5rem] items-center gap-2 rounded-control px-4 text-[0.9375rem] font-medium transition-colors
                  ${activa ? 'bg-acento-tinte text-acento-texto' : 'text-tinta-suave hover:bg-tarjeta-suave hover:text-tinta'}`}
              >
                {seccion.etiqueta}
                {seccion.atajo && (
                  <kbd className={`whitespace-nowrap font-sans text-xs ${activa ? 'text-acento-texto/70' : 'text-tinta-tenue'}`}>
                    {seccion.atajo}
                  </kbd>
                )}
              </button>
            );
          })}
        </nav>
        <span aria-hidden="true" className="mx-1 h-6 w-px bg-borde" />
        <button
          type="button"
          onClick={() => setAyudaAbierta(true)}
          className="flex min-h-[2.5rem] items-center gap-2 rounded-control px-3 text-[0.9375rem] text-tinta-suave transition-colors hover:bg-tarjeta-suave hover:text-tinta"
        >
          <IconoTeclado className="h-5 w-5" />
          Atajos
        </button>
      </div>

      <Dialogo abierto={ayudaAbierta} titulo="Atajos de teclado" onCerrar={() => setAyudaAbierta(false)}>
        <p className="mb-4 text-tinta-suave">Con estos atajos puedes trabajar sin soltar el teclado.</p>
        <dl className="flex flex-col divide-y divide-borde">
          {ATAJOS.map((atajo) => (
            <div key={atajo.teclas} className="flex items-center justify-between gap-6 py-2.5">
              <dd className="text-tinta">{atajo.accion}</dd>
              <dt>
                <kbd className="whitespace-nowrap rounded-lg border border-borde-fuerte bg-tarjeta-suave px-2.5 py-1 font-sans text-sm font-medium text-tinta">
                  {atajo.teclas}
                </kbd>
              </dt>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex justify-end">
          <Boton onClick={() => setAyudaAbierta(false)}>Entendido</Boton>
        </div>
      </Dialogo>
    </header>
  );
}

export type { Seccion };
