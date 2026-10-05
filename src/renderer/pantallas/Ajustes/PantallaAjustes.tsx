import { useEffect, useRef, useState } from 'react';
import { Boton } from '../../componentes/ui/Boton.js';
import { CampoTexto } from '../../componentes/ui/Campo.js';
import { Dialogo } from '../../componentes/ui/Dialogo.js';
import { GrupoSegmentado } from '../../componentes/ui/GrupoSegmentado.js';
import { IconoAviso, IconoCheck } from '../../componentes/ui/iconos.js';
import { OpcionTarjeta } from '../../componentes/ui/OpcionTarjeta.js';
import { Separador } from '../../componentes/ui/Separador.js';
import { Tarjeta } from '../../componentes/ui/Tarjeta.js';
import { usarToast } from '../../componentes/ui/Toast.js';
import type { Ajustes } from '../../tipos.js';

const OPCIONES_TEMA: Array<{ valor: Ajustes['tema']; titulo: string; descripcion: string }> = [
  { valor: 'automatico', titulo: 'Automático', descripcion: 'Sigue el tema de Windows' },
  { valor: 'claro', titulo: 'Claro', descripcion: 'Fondo claro, ideal con mucha luz' },
  { valor: 'oscuro', titulo: 'Oscuro', descripcion: 'Fondo oscuro, más suave de noche' },
];

const OPCIONES_TAMANO: Array<{ valor: Ajustes['tamanoTexto']; titulo: string; descripcion: string }> = [
  { valor: 'normal', titulo: 'Normal', descripcion: 'El tamaño estándar' },
  { valor: 'grande', titulo: 'Grande', descripcion: 'Más cómodo de leer' },
  { valor: 'muy-grande', titulo: 'Muy grande', descripcion: 'Para leer desde más lejos' },
];

const TAMANOS_TEXTO: Record<Ajustes['tamanoTexto'], string> = {
  normal: '16px',
  grande: '18px',
  'muy-grande': '20px',
};

/** Aplica el tema al instante para que la persona vea el resultado sin esperar. */
function previsualizarTema(tema: Ajustes['tema']) {
  const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', tema === 'oscuro' || (tema === 'automatico' && prefiereOscuro));
}

const esEnteroValido = (n: number) => Number.isInteger(n) && n >= 1;

/** Ajustes de la app: edificio, apariencia, separador CSV y respaldos. Todo se guarda al cambiarlo. */
export function PantallaAjustes() {
  const [ajustes, setAjustes] = useState<Ajustes | null>(null);
  const [pruebaCarpeta, setPruebaCarpeta] = useState<'ok' | 'error' | null>(null);
  const [respaldando, setRespaldando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [confirmarRestaurar, setConfirmarRestaurar] = useState<string | null>(null);
  const [guardadoVisible, setGuardadoVisible] = useState(false);
  const temporizadorGuardado = useRef<ReturnType<typeof setTimeout>>();
  const mostrarToast = usarToast();

  useEffect(() => {
    window.api.ajustes.leer().then(setAjustes);
    return () => clearTimeout(temporizadorGuardado.current);
  }, []);

  if (!ajustes) return null;

  async function guardar(parcial: Partial<Ajustes>) {
    try {
      const nuevos = await window.api.ajustes.guardar(parcial);
      setAjustes(nuevos);
      setGuardadoVisible(true);
      clearTimeout(temporizadorGuardado.current);
      temporizadorGuardado.current = setTimeout(() => setGuardadoVisible(false), 2500);
    } catch {
      mostrarToast('No se pudo guardar el cambio. Intenta de nuevo.', { tipo: 'error' });
    }
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
          ? `Respaldo guardado${estado.usoCarpetaLocal ? ' en la carpeta local, porque el NAS no estaba disponible' : ''}.`
          : 'No se pudo completar el respaldo. Revisa la carpeta de respaldo e intenta de nuevo.',
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
      mostrarToast('No se pudo restaurar ese respaldo. Tus datos actuales siguen intactos.', { tipo: 'error' });
      setRestaurando(false);
    }
  }

  const frecuenciaInvalida = !esEnteroValido(ajustes.frecuenciaRespaldoMinutos);
  const cantidadInvalida = !esEnteroValido(ajustes.cantidadRespaldosAConservar);

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="titulo-pantalla text-4xl text-tinta">
            Ajustes del <em>edificio</em>
          </h1>
          <p className="mt-1 text-tinta-suave">Cada cambio se guarda solo, no hace falta pulsar nada.</p>
        </div>
        <p
          aria-live="polite"
          className={`flex items-center gap-1.5 text-sm font-medium text-exito transition-opacity ${guardadoVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <IconoCheck className="h-4 w-4" />
          Cambios guardados
        </p>
      </div>

      <Separador className="mt-2">General</Separador>

      <Tarjeta className="flex flex-col gap-7">
        <CampoTexto
          etiqueta="Nombre del edificio"
          value={ajustes.nombreEdificio}
          onChange={(e) => setAjustes({ ...ajustes, nombreEdificio: e.target.value })}
          onBlur={() => guardar({ nombreEdificio: ajustes.nombreEdificio })}
          ayuda="Aparece como título en los reportes en PDF."
          className="max-w-md"
        />

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-tinta">Tema</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {OPCIONES_TEMA.map((opcion) => (
              <OpcionTarjeta
                key={opcion.valor}
                name="tema"
                valor={opcion.valor}
                marcado={ajustes.tema === opcion.valor}
                titulo={opcion.titulo}
                descripcion={opcion.descripcion}
                onCambiar={() => {
                  previsualizarTema(opcion.valor);
                  guardar({ tema: opcion.valor });
                }}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-tinta">Tamaño de texto</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {OPCIONES_TAMANO.map((opcion) => (
              <OpcionTarjeta
                key={opcion.valor}
                name="tamano-texto"
                valor={opcion.valor}
                marcado={ajustes.tamanoTexto === opcion.valor}
                titulo={opcion.titulo}
                descripcion={opcion.descripcion}
                onCambiar={() => {
                  document.documentElement.style.fontSize = TAMANOS_TEXTO[opcion.valor];
                  guardar({ tamanoTexto: opcion.valor });
                }}
              />
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <GrupoSegmentado
            etiqueta="Separador de los archivos CSV"
            opciones={[
              { valor: ',', etiqueta: 'Coma ( , )' },
              { valor: ';', etiqueta: 'Punto y coma ( ; )' },
            ]}
            valor={ajustes.separadorCsv}
            onCambiar={(valor) => guardar({ separadorCsv: valor as ',' | ';' })}
          />
          <p className="text-sm text-tinta-tenue">
            La coma funciona en la mayoría de los casos. Si Excel junta todo en una sola columna, prueba con punto y coma.
          </p>
        </div>
      </Tarjeta>

      <Separador className="mt-4">Respaldos</Separador>

      <Tarjeta className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-end gap-3">
            <CampoTexto
              etiqueta="Carpeta de respaldo"
              value={ajustes.carpetaRespaldo ?? ''}
              readOnly
              placeholder="Aún no elegiste una carpeta"
              ayuda="Puede ser una carpeta de esta computadora, una ruta de red o una unidad mapeada."
              className="min-w-[16rem] flex-1"
            />
            <Boton variante="secundario" onClick={elegirCarpeta} className="mb-[1.6rem]">
              Elegir carpeta
            </Boton>
          </div>
          {pruebaCarpeta === 'ok' && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-exito">
              <IconoCheck className="h-4 w-4" />
              Carpeta lista: se puede escribir en ella.
            </p>
          )}
          {pruebaCarpeta === 'error' && (
            <p role="alert" className="flex items-start gap-1.5 text-sm text-aviso">
              <IconoAviso className="mt-0.5 h-4 w-4 shrink-0" />
              No se pudo escribir en esa carpeta. Mientras tanto, los respaldos se guardarán en una carpeta local.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoTexto
            etiqueta="Respaldar cada (minutos)"
            type="number"
            min={1}
            value={Number.isNaN(ajustes.frecuenciaRespaldoMinutos) ? '' : ajustes.frecuenciaRespaldoMinutos}
            error={frecuenciaInvalida ? 'Escribe un número de 1 o más.' : null}
            onChange={(e) => setAjustes({ ...ajustes, frecuenciaRespaldoMinutos: e.target.valueAsNumber })}
            onBlur={() => !frecuenciaInvalida && guardar({ frecuenciaRespaldoMinutos: ajustes.frecuenciaRespaldoMinutos })}
          />
          <CampoTexto
            etiqueta="Respaldos a conservar"
            type="number"
            min={1}
            value={Number.isNaN(ajustes.cantidadRespaldosAConservar) ? '' : ajustes.cantidadRespaldosAConservar}
            error={cantidadInvalida ? 'Escribe un número de 1 o más.' : null}
            ayuda={cantidadInvalida ? undefined : 'Cuántos respaldos guardar antes de reemplazar los más antiguos.'}
            onChange={(e) => setAjustes({ ...ajustes, cantidadRespaldosAConservar: e.target.valueAsNumber })}
            onBlur={() => !cantidadInvalida && guardar({ cantidadRespaldosAConservar: ajustes.cantidadRespaldosAConservar })}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-borde pt-5">
          <div className="flex flex-wrap gap-3">
            <Boton onClick={respaldarAhora} cargando={respaldando}>
              Respaldar ahora
            </Boton>
            <Boton variante="secundario" onClick={elegirArchivoParaRestaurar}>
              Restaurar desde un respaldo
            </Boton>
          </div>
          <p className="text-sm text-tinta-tenue">
            Restaurar reemplaza los datos actuales por los del respaldo. Antes de hacerlo se guarda una copia de seguridad.
          </p>
        </div>
      </Tarjeta>

      <Dialogo abierto={Boolean(confirmarRestaurar)} titulo="¿Restaurar este respaldo?" onCerrar={() => setConfirmarRestaurar(null)}>
        <p className="text-tinta-suave">
          Los datos actuales se reemplazarán por los del respaldo elegido. Antes se guardará una copia de seguridad del estado actual y
          la aplicación se reiniciará sola.
        </p>
        <p className="mt-3 break-all rounded-control bg-tarjeta-suave px-3.5 py-2.5 text-sm text-tinta-suave">{confirmarRestaurar}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setConfirmarRestaurar(null)} data-autofocus>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={confirmarYRestaurar} cargando={restaurando}>
            Restaurar y reiniciar
          </Boton>
        </div>
      </Dialogo>
    </div>
  );
}
