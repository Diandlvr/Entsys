import { useEffect, useState } from 'react';

/**
 * Pantalla temporal de la etapa (a): solo confirma que el renderer puede hablar
 * con el proceso principal y leer la base de datos a través del preload.
 * Las pantallas reales (Registro, Historial, Ajustes) se construyen en las
 * siguientes etapas.
 */
export default function App() {
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'error'>('cargando');
  const [cantidadDentro, setCantidadDentro] = useState(0);

  useEffect(() => {
    window.api.visitas
      .dentroAhora()
      .then((visitas: unknown[]) => {
        setCantidadDentro(visitas.length);
        setEstado('ok');
      })
      .catch(() => setEstado('error'));
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="rounded-lg border border-slate-200 p-8 text-center dark:border-slate-700">
        <h1 className="text-2xl font-semibold">Registro de Visitas</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          {estado === 'cargando' && 'Conectando con la base de datos…'}
          {estado === 'ok' && `Conectado. Personas dentro ahora: ${cantidadDentro}.`}
          {estado === 'error' && 'No se pudo conectar con la base de datos.'}
        </p>
      </div>
    </div>
  );
}
