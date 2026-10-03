import { useEffect, useState } from 'react';
import { BarraLateral } from './componentes/BarraLateral.js';
import type { Seccion } from './componentes/BarraLateral.js';
import { BarraEstadoRespaldo } from './componentes/BarraEstadoRespaldo.js';
import { ProveedorToast } from './componentes/ui/Toast.js';
import { PantallaRegistro } from './pantallas/Registro/PantallaRegistro.js';
import { PantallaHistorial } from './pantallas/Historial/PantallaHistorial.js';
import { PantallaAjustes } from './pantallas/Ajustes/PantallaAjustes.js';
import type { Ajustes } from './tipos.js';

const TAMANOS_TEXTO: Record<Ajustes['tamanoTexto'], string> = {
  normal: '16px',
  grande: '18px',
  'muy-grande': '20px',
};

export default function App() {
  const [seccion, setSeccion] = useState<Seccion>('registro');

  // Aplica tema y tamaño de texto guardados en ajustes a toda la app.
  // Tailwind usa la clase "dark" en <html>; para el tema automático seguimos la preferencia del sistema.
  useEffect(() => {
    const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)');
    let temaActual: Ajustes['tema'] = 'automatico';

    function aplicarClaseOscura() {
      const esOscuro = temaActual === 'oscuro' || (temaActual === 'automatico' && prefiereOscuro.matches);
      document.documentElement.classList.toggle('dark', esOscuro);
    }

    function aplicar(ajustes: Ajustes) {
      temaActual = ajustes.tema;
      aplicarClaseOscura();
      document.documentElement.style.fontSize = TAMANOS_TEXTO[ajustes.tamanoTexto];
    }

    prefiereOscuro.addEventListener('change', aplicarClaseOscura);
    window.api.ajustes.leer().then(aplicar);
    const intervalo = setInterval(() => window.api.ajustes.leer().then(aplicar), 2000);
    return () => {
      prefiereOscuro.removeEventListener('change', aplicarClaseOscura);
      clearInterval(intervalo);
    };
  }, []);

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
      <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-slate-900">
        <BarraEstadoRespaldo />
        <div className="flex flex-1 overflow-hidden">
          <BarraLateral seccionActiva={seccion} onCambiarSeccion={setSeccion} />
          <main className="flex-1 overflow-y-auto">
            {seccion === 'registro' && <PantallaRegistro />}
            {seccion === 'historial' && <PantallaHistorial />}
            {seccion === 'ajustes' && <PantallaAjustes />}
          </main>
        </div>
      </div>
    </ProveedorToast>
  );
}
