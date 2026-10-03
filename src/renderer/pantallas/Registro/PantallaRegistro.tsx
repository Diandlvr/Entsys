import { useCallback, useEffect, useState } from 'react';
import { FormularioEntrada } from './FormularioEntrada.js';
import { PanelDentroAhora } from './PanelDentroAhora.js';
import type { Visita } from '../../tipos.js';

/**
 * Pantalla principal: formulario de registro a la izquierda y panel
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
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
      <FormularioEntrada onVisitaCreada={recargar} />
      <PanelDentroAhora visitas={visitas} onCambio={recargar} />
    </div>
  );
}
