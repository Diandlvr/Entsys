import { useEffect, useState } from 'react';
import { BarraLateral } from './componentes/BarraLateral.js';
import type { Seccion } from './componentes/BarraLateral.js';
import { ProveedorToast } from './componentes/ui/Toast.js';
import { PantallaRegistro } from './pantallas/Registro/PantallaRegistro.js';
import { PantallaHistorial } from './pantallas/Historial/PantallaHistorial.js';
import { PantallaAjustes } from './pantallas/Ajustes/PantallaAjustes.js';

export default function App() {
  const [seccion, setSeccion] = useState<Seccion>('registro');

  // Atajos de teclado globales: Ctrl+N va a Registro, Ctrl+F a Historial.
  useEffect(() => {
    function alPresionarTecla(evento: KeyboardEvent) {
      const conCtrl = evento.ctrlKey || evento.metaKey;
      if (!conCtrl) return;
      if (evento.key.toLowerCase() === 'n') {
        evento.preventDefault();
        setSeccion('registro');
      } else if (evento.key.toLowerCase() === 'f') {
        evento.preventDefault();
        setSeccion('historial');
      }
    }
    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, []);

  return (
    <ProveedorToast>
      <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900">
        <BarraLateral seccionActiva={seccion} onCambiarSeccion={setSeccion} />
        <main className="flex-1 overflow-y-auto">
          {seccion === 'registro' && <PantallaRegistro />}
          {seccion === 'historial' && <PantallaHistorial />}
          {seccion === 'ajustes' && <PantallaAjustes />}
        </main>
      </div>
    </ProveedorToast>
  );
}
