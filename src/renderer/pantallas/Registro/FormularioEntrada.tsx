import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Boton } from '../../componentes/ui/Boton.js';
import { CampoTextArea, CampoTexto } from '../../componentes/ui/Campo.js';
import { CampoConSugerencias } from '../../componentes/ui/CampoConSugerencias.js';
import { GrupoSegmentado } from '../../componentes/ui/GrupoSegmentado.js';
import { Separador } from '../../componentes/ui/Separador.js';
import { Tarjeta } from '../../componentes/ui/Tarjeta.js';
import { usarToast } from '../../componentes/ui/Toast.js';
import { advertenciaFormatoDocumento, normalizarDocumento } from '../../../core/documento.js';
import { ahoraIsoPanama, isoPanamaALocalInput, localInputAIsoPanama } from '../../../core/fechas.js';
import type { DatosNuevaVisita, TipoDocumento } from '../../tipos.js';

const OPCIONES_TIPO_DOCUMENTO: Array<{ valor: TipoDocumento; etiqueta: string }> = [
  { valor: 'CEDULA', etiqueta: 'Cédula' },
  { valor: 'PASAPORTE', etiqueta: 'Pasaporte' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

const EJEMPLO_DOCUMENTO: Record<TipoDocumento, string> = {
  CEDULA: 'Ej.: 8-123-456',
  PASAPORTE: 'Número de pasaporte',
  OTRO: 'Número del documento',
};

type EstadoFormulario = {
  tipo_documento: TipoDocumento;
  documento: string;
  nombre_completo: string;
  empresa: string;
  a_quien_visita: string;
  destino: string;
  motivo: string;
  observaciones: string;
  entrada: string; // formato datetime-local; solo se usa si la hora se cambió a mano
};

function formularioVacio(): EstadoFormulario {
  return {
    tipo_documento: 'CEDULA',
    documento: '',
    nombre_completo: '',
    empresa: '',
    a_quien_visita: '',
    destino: '',
    motivo: '',
    observaciones: '',
    entrada: isoPanamaALocalInput(ahoraIsoPanama()),
  };
}

type Propiedades = {
  onVisitaCreada: () => void;
};

/**
 * Formulario rápido de registro de entrada. Pensado para uso con teclado:
 * foco automático en documento, Enter avanza de campo y Ctrl+Enter registra desde cualquier campo.
 */
export function FormularioEntrada({ onVisitaCreada }: Propiedades) {
  const [form, setForm] = useState<EstadoFormulario>(formularioVacio());
  const [guardando, setGuardando] = useState(false);
  const [autocompletoAplicado, setAutocompletoAplicado] = useState(false);
  const [datosDeVisitaAnterior, setDatosDeVisitaAnterior] = useState(false);
  const [intentado, setIntentado] = useState(false);
  const [horaManual, setHoraManual] = useState(false);
  const refDocumento = useRef<HTMLInputElement>(null);
  const refFormulario = useRef<HTMLFormElement>(null);
  const mostrarToast = usarToast();

  useEffect(() => {
    refDocumento.current?.focus();
  }, []);

  const actualizarCampo = useCallback(
    <K extends keyof EstadoFormulario>(campo: K, valor: EstadoFormulario[K]) => {
      setForm((actual) => ({ ...actual, [campo]: valor }));
    },
    [],
  );

  // Al salir del campo documento, autocompleta nombre/empresa con la última visita de ese documento.
  const alSalirDeDocumento = useCallback(async () => {
    const documentoNormalizado = normalizarDocumento(form.documento);
    if (documentoNormalizado.length === 0) return;
    const ultima = await window.api.visitas.ultimaVisitaPorDocumento(documentoNormalizado);
    if (ultima && !autocompletoAplicado) {
      setForm((actual) => ({
        ...actual,
        nombre_completo: actual.nombre_completo || ultima.nombre_completo,
        empresa: actual.empresa || ultima.empresa || '',
      }));
      setAutocompletoAplicado(true);
      setDatosDeVisitaAnterior(true);
    }
  }, [form.documento, autocompletoAplicado]);

  const obtenerSugerenciasDestino = useCallback(
    (textoParcial: string) => window.api.visitas.sugerencias('destino', textoParcial),
    [],
  );
  const obtenerSugerenciasVisita = useCallback(
    (textoParcial: string) => window.api.visitas.sugerencias('a_quien_visita', textoParcial),
    [],
  );

  const documentoNormalizado = normalizarDocumento(form.documento);
  const advertenciaDocumento = advertenciaFormatoDocumento(form.tipo_documento, documentoNormalizado);

  // Los mensajes de "falta algo" solo aparecen tras intentar registrar, y se van al corregirlos.
  const faltantes = {
    documento: form.documento.trim().length === 0 ? 'Escribe el número de documento.' : null,
    nombre_completo: form.nombre_completo.trim().length === 0 ? 'Escribe el nombre completo.' : null,
    a_quien_visita: form.a_quien_visita.trim().length === 0 ? 'Indica a quién viene a ver.' : null,
    destino: form.destino.trim().length === 0 ? 'Indica el piso u oficina.' : null,
    motivo: form.motivo.trim().length === 0 ? 'Cuéntanos brevemente el motivo.' : null,
  };
  const cantidadFaltantes = Object.values(faltantes).filter(Boolean).length;
  const error = (campo: keyof typeof faltantes) => (intentado ? faltantes[campo] : null);

  async function guardar() {
    if (guardando) return;
    setIntentado(true);
    if (cantidadFaltantes > 0) {
      // Lleva el foco al primer campo con problema, una vez pintados los mensajes.
      requestAnimationFrame(() => {
        refFormulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    setGuardando(true);
    try {
      const datos: DatosNuevaVisita = {
        tipo_documento: form.tipo_documento,
        documento: form.documento,
        nombre_completo: form.nombre_completo,
        empresa: form.empresa || null,
        a_quien_visita: form.a_quien_visita,
        destino: form.destino,
        motivo: form.motivo,
        observaciones: form.observaciones || null,
        // Si nadie tocó la hora, se toma al guardar (no cuando se abrió el formulario).
        entrada: horaManual ? localInputAIsoPanama(form.entrada) : ahoraIsoPanama(),
      };
      await window.api.visitas.crear(datos);
      mostrarToast(`Entrada registrada: ${datos.nombre_completo}`, { tipo: 'exito' });
      setForm(formularioVacio());
      setAutocompletoAplicado(false);
      setDatosDeVisitaAnterior(false);
      setIntentado(false);
      setHoraManual(false);
      onVisitaCreada();
      refDocumento.current?.focus();
    } catch {
      mostrarToast('No se pudo registrar la entrada. Revisa los datos e intenta de nuevo.', { tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  }

  function alPresionarTecla(evento: KeyboardEvent<HTMLFormElement>) {
    if (evento.key !== 'Enter') return;
    const objetivo = evento.target as HTMLElement;

    // Ctrl+Enter registra desde cualquier campo, incluso desde Observaciones.
    if (evento.ctrlKey || evento.metaKey) {
      evento.preventDefault();
      guardar();
      return;
    }
    // En el textarea, Enter agrega una línea; en botones, Enter los activa.
    if (objetivo.tagName === 'TEXTAREA') return;
    if (objetivo.tagName === 'BUTTON' && (objetivo as HTMLButtonElement).type !== 'submit') return;
    evento.preventDefault();

    // Los radios (tipo de documento) se recorren con flechas, no con Enter.
    const elementosEnfocables = Array.from(
      evento.currentTarget.querySelectorAll<HTMLElement>(
        'input:not([type="radio"]):not([type="hidden"]), select, textarea, button[type="submit"]',
      ),
    ).filter((el) => !el.hasAttribute('disabled'));
    const siguiente = elementosEnfocables.find(
      (el) => el !== objetivo && objetivo.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    if (siguiente && siguiente.getAttribute('type') !== 'submit') {
      siguiente.focus();
    } else {
      guardar();
    }
  }

  return (
    <Tarjeta principal className="pt-8">
      <form
        ref={refFormulario}
        className="flex flex-col gap-campos"
        onKeyDown={alPresionarTecla}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          guardar();
        }}
      >
        <div>
          <h2 className="font-titulo text-3xl font-medium text-tinta">Registrar entrada</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            <span aria-hidden="true" className="text-acento-texto">
              *
            </span>{' '}
            Los campos con asterisco son obligatorios.
          </p>
        </div>

        <Separador>Persona</Separador>

        <div className="grid grid-cols-1 items-start gap-campos sm:grid-cols-[auto_minmax(0,1fr)]">
          <GrupoSegmentado
            etiqueta="Tipo de documento"
            opciones={OPCIONES_TIPO_DOCUMENTO}
            valor={form.tipo_documento}
            onCambiar={(valor) => actualizarCampo('tipo_documento', valor as TipoDocumento)}
          />
          <CampoTexto
            ref={refDocumento}
            etiqueta="Documento"
            requerido
            value={form.documento}
            onChange={(e) => {
              actualizarCampo('documento', e.target.value);
              setAutocompletoAplicado(false);
              setDatosDeVisitaAnterior(false);
            }}
            onBlur={alSalirDeDocumento}
            error={error('documento')}
            advertencia={advertenciaDocumento}
            placeholder={EJEMPLO_DOCUMENTO[form.tipo_documento]}
          />
        </div>

        <div className="grid grid-cols-1 gap-campos sm:grid-cols-2">
          <CampoTexto
            etiqueta="Nombre completo"
            requerido
            value={form.nombre_completo}
            onChange={(e) => actualizarCampo('nombre_completo', e.target.value)}
            error={error('nombre_completo')}
            ayuda={datosDeVisitaAnterior ? 'Datos tomados de su última visita. Corrígelos si cambiaron.' : undefined}
          />
          <CampoTexto
            etiqueta="Empresa"
            opcional
            value={form.empresa}
            onChange={(e) => actualizarCampo('empresa', e.target.value)}
          />
        </div>

        <Separador className="mt-2">Visita</Separador>

        <div className="grid grid-cols-1 gap-campos sm:grid-cols-2">
          <CampoConSugerencias
            etiqueta="A quién visita"
            requerido
            valor={form.a_quien_visita}
            onCambiar={(v) => actualizarCampo('a_quien_visita', v)}
            obtenerSugerencias={obtenerSugerenciasVisita}
            error={error('a_quien_visita')}
          />
          <CampoConSugerencias
            etiqueta="Piso u oficina"
            requerido
            valor={form.destino}
            onCambiar={(v) => actualizarCampo('destino', v)}
            obtenerSugerencias={obtenerSugerenciasDestino}
            error={error('destino')}
          />
        </div>

        <CampoTexto
          etiqueta="Motivo de la visita"
          requerido
          value={form.motivo}
          onChange={(e) => actualizarCampo('motivo', e.target.value)}
          error={error('motivo')}
        />

        <Separador className="mt-2">Notas</Separador>

        <CampoTextArea
          etiqueta="Observaciones"
          opcional
          value={form.observaciones}
          onChange={(e) => actualizarCampo('observaciones', e.target.value)}
        />

        {horaManual ? (
          <div className="flex flex-wrap items-end gap-3">
            <CampoTexto
              etiqueta="Fecha y hora de entrada"
              type="datetime-local"
              value={form.entrada}
              onChange={(e) => actualizarCampo('entrada', e.target.value)}
              className="min-w-[14rem]"
            />
            <Boton
              type="button"
              variante="fantasma"
              onClick={() => {
                setHoraManual(false);
                actualizarCampo('entrada', isoPanamaALocalInput(ahoraIsoPanama()));
              }}
            >
              Usar la hora de ahora
            </Boton>
          </div>
        ) : (
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-tinta-suave">
            La entrada se anota con la hora de ahora.
            <button
              type="button"
              onClick={() => {
                actualizarCampo('entrada', isoPanamaALocalInput(ahoraIsoPanama()));
                setHoraManual(true);
              }}
              className="rounded-lg px-1 py-1 font-medium text-acento-texto underline-offset-2 transition-colors hover:underline"
            >
              Cambiar hora
            </button>
          </p>
        )}

        <div className="mt-2 flex flex-col gap-2">
          {intentado && cantidadFaltantes > 0 && (
            <p role="alert" className="text-sm font-medium text-peligro">
              {cantidadFaltantes === 1
                ? 'Falta 1 dato obligatorio para registrar la entrada.'
                : `Faltan ${cantidadFaltantes} datos obligatorios para registrar la entrada.`}
            </p>
          )}
          <Boton type="submit" tamano="grande" cargando={guardando}>
            Registrar entrada
          </Boton>
          <p className="text-center text-xs text-tinta-tenue">
            Enter pasa al siguiente campo. Ctrl + Enter registra la entrada desde cualquier campo.
          </p>
        </div>
      </form>
    </Tarjeta>
  );
}
