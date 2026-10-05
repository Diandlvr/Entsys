import { useCallback, useEffect, useState } from 'react';
import { FormularioEntrada } from './FormularioEntrada.js';
import { PanelDentroAhora } from './PanelDentroAhora.js';
import type { Visita } from '../../tipos.js';

function saludoSegunHora(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function fechaLarga(): string {
  const texto = new Date().toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function textoPersonasDentro(cantidad: number): string {
  if (cantidad === 0) return 'Nadie dentro por ahora';
  if (cantidad === 1) return '1 persona dentro ahora';
  return `${cantidad} personas dentro ahora`;
}

/**
 * Pantalla principal: banner de bienvenida, formulario de registro a la izquierda y panel
 * "Dentro ahora" a la derecha. En ventanas angostas el panel pasa debajo.
 */
export function PantallaRegistro() {
  const [visitas, setVisitas] = useState<Visita[]>([]);

  const recargar = useCallback(() => {
    window.api.visitas.dentroAhora().then(setVisitas);
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return (
    <div>
      <div className="banner-recepcion">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-8 gap-y-2 px-6 py-4 text-white">
          <div>
            <p className="text-sm text-white/75">{saludoSegunHora()}</p>
            <h1 className="titulo-pantalla text-4xl">
              Registro de <em>visitas</em>
            </h1>
          </div>
          <div className="text-right text-sm text-white/80">
            <p>{fechaLarga()}</p>
            <p className="font-medium text-white">{textoPersonasDentro(visitas.length)}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-6 px-6 py-6 min-[1100px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <FormularioEntrada onVisitaCreada={recargar} />
        <PanelDentroAhora visitas={visitas} onCambio={recargar} />
      </div>
    </div>
  );
}
