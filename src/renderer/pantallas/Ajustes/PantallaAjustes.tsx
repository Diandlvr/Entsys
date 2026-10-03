import { useEffect, useState } from 'react';
import { Boton } from '../../componentes/ui/Boton.js';
import { CampoSelect, CampoTexto } from '../../componentes/ui/Campo.js';
import { Dialogo } from '../../componentes/ui/Dialogo.js';
import { usarToast } from '../../componentes/ui/Toast.js';
import type { Ajustes } from '../../tipos.js';

/** Ajustes de la app: edificio, respaldos, separador CSV, tema y tamaño de texto. */
export function PantallaAjustes() {
  const [ajustes, setAjustes] = useState<Ajustes | null>(null);
  const [pruebaCarpeta, setPruebaCarpeta] = useState<'ok' | 'error' | null>(null);
  const [respaldando, setRespaldando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [confirmarRestaurar, setConfirmarRestaurar] = useState<string | null>(null);
  const mostrarToast = usarToast();

  useEffect(() => {
    window.api.ajustes.leer().then(setAjustes);
  }, []);

  if (!ajustes) return null;

  async function guardar(parcial: Partial<Ajustes>) {
    const nuevos = await window.api.ajustes.guardar(parcial);
    setAjustes(nuevos);
  }

  async function elegirCarpeta() {
    const ruta = await window.api.respaldos.elegirCarpeta();
    if (!ruta) return;
    setPruebaCarpeta(null);
    await guardar({ carpetaRespaldo: ruta });
    const prueba = await window.api.respaldos.probarCarpeta(ruta);
    setPruebaCarpeta(prueba.accesible ? 'ok' : 'error');
  }

  async function respaldarAhora() {
    setRespaldando(true);
    try {
      const estado = await window.api.respaldos.respaldarAhora();
      window.dispatchEvent(new Event('respaldo-actualizado'));
      mostrarToast(
        estado.ok
          ? `Respaldo guardado${estado.usoCarpetaLocal ? ' (carpeta local, el NAS no estaba disponible)' : ''}.`
          : 'No se pudo completar el respaldo.',
        { tipo: estado.ok ? 'exito' : 'error' },
      );
    } finally {
      setRespaldando(false);
    }
  }

  async function elegirArchivoParaRestaurar() {
    const ruta = await window.api.respaldos.elegirArchivoParaRestaurar();
    if (ruta) setConfirmarRestaurar(ruta);
  }

  async function confirmarYRestaurar() {
    if (!confirmarRestaurar) return;
    setRestaurando(true);
    try {
      await window.api.respaldos.restaurar(confirmarRestaurar);
      // La app se reinicia sola desde el proceso principal tras restaurar.
    } catch {
      mostrarToast('No se pudo restaurar el respaldo.', { tipo: 'error' });
      setRestaurando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Ajustes</h1>

      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">General</h2>
        <CampoTexto
          etiqueta="Nombre del edificio"
          value={ajustes.nombreEdificio}
          onChange={(e) => setAjustes({ ...ajustes, nombreEdificio: e.target.value })}
          onBlur={() => guardar({ nombreEdificio: ajustes.nombreEdificio })}
          className="max-w-md"
        />
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <CampoSelect
            etiqueta="Separador de CSV"
            value={ajustes.separadorCsv}
            onChange={(e) => guardar({ separadorCsv: e.target.value as ',' | ';' })}
            opciones={[
              { valor: ',', etiqueta: 'Coma (,)' },
              { valor: ';', etiqueta: 'Punto y coma (;)' },
            ]}
          />
          <CampoSelect
            etiqueta="Tema"
            value={ajustes.tema}
            onChange={(e) => guardar({ tema: e.target.value as Ajustes['tema'] })}
            opciones={[
              { valor: 'automatico', etiqueta: 'Automático' },
              { valor: 'claro', etiqueta: 'Claro' },
              { valor: 'oscuro', etiqueta: 'Oscuro' },
            ]}
          />
        </div>
        <CampoSelect
          etiqueta="Tamaño de texto"
          value={ajustes.tamanoTexto}
          onChange={(e) => guardar({ tamanoTexto: e.target.value as Ajustes['tamanoTexto'] })}
          className="max-w-xs"
          opciones={[
            { valor: 'normal', etiqueta: 'Normal' },
            { valor: 'grande', etiqueta: 'Grande' },
            { valor: 'muy-grande', etiqueta: 'Muy grande' },
          ]}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Respaldos</h2>

        <div className="flex items-end gap-3">
          <CampoTexto
            etiqueta="Carpeta de respaldo (puede ser una ruta de red o unidad mapeada)"
            value={ajustes.carpetaRespaldo ?? ''}
            readOnly
            placeholder="No configurada"
            className="flex-1"
          />
          <Boton variante="secundario" onClick={elegirCarpeta}>
            Elegir carpeta
          </Boton>
        </div>
        {pruebaCarpeta === 'ok' && <p className="text-sm text-green-700 dark:text-green-400">Carpeta accesible ✓</p>}
        {pruebaCarpeta === 'error' && (
          <p className="text-sm text-red-700 dark:text-red-400">
            No se pudo escribir en esa carpeta. Se usará una carpeta local hasta que esté disponible.
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <CampoTexto
            etiqueta="Frecuencia (minutos)"
            type="number"
            min={1}
            value={ajustes.frecuenciaRespaldoMinutos}
            onChange={(e) => setAjustes({ ...ajustes, frecuenciaRespaldoMinutos: Number(e.target.value) })}
            onBlur={() => guardar({ frecuenciaRespaldoMinutos: ajustes.frecuenciaRespaldoMinutos })}
          />
          <CampoTexto
            etiqueta="Respaldos a conservar"
            type="number"
            min={1}
            value={ajustes.cantidadRespaldosAConservar}
            onChange={(e) => setAjustes({ ...ajustes, cantidadRespaldosAConservar: Number(e.target.value) })}
            onBlur={() => guardar({ cantidadRespaldosAConservar: ajustes.cantidadRespaldosAConservar })}
          />
        </div>

        <div className="flex gap-3">
          <Boton onClick={respaldarAhora} disabled={respaldando}>
            {respaldando ? 'Respaldando…' : 'Respaldar ahora'}
          </Boton>
          <Boton variante="secundario" onClick={elegirArchivoParaRestaurar}>
            Restaurar desde un respaldo
          </Boton>
        </div>
      </section>

      <Dialogo
        abierto={Boolean(confirmarRestaurar)}
        titulo="Restaurar respaldo"
        onCerrar={() => setConfirmarRestaurar(null)}
      >
        <p className="text-slate-600 dark:text-slate-300">
          Esto reemplazará los datos actuales por los del respaldo elegido. Antes se guardará un respaldo de
          seguridad del estado actual. La aplicación se reiniciará automáticamente.
        </p>
        <p className="mt-2 break-all text-sm text-slate-500 dark:text-slate-400">{confirmarRestaurar}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setConfirmarRestaurar(null)}>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={confirmarYRestaurar} disabled={restaurando}>
            {restaurando ? 'Restaurando…' : 'Restaurar y reiniciar'}
          </Boton>
        </div>
      </Dialogo>
    </div>
  );
}
