import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Boton } from '../../componentes/ui/Boton.js';
import { CampoSelect, CampoTextArea, CampoTexto } from '../../componentes/ui/Campo.js';
import { CampoConSugerencias } from '../../componentes/ui/CampoConSugerencias.js';
import { usarToast } from '../../componentes/ui/Toast.js';
import { advertenciaFormatoDocumento, normalizarDocumento } from '../../../core/documento.js';
import { ahoraIsoPanama, isoPanamaALocalInput, localInputAIsoPanama } from '../../../core/fechas.js';
import type { DatosNuevaVisita, TipoDocumento } from '../../tipos.js';

const OPCIONES_TIPO_DOCUMENTO: Array<{ valor: TipoDocumento; etiqueta: string }> = [
  { valor: 'CEDULA', etiqueta: 'Cédula' },
  { valor: 'PASAPORTE', etiqueta: 'Pasaporte' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

type EstadoFormulario = {
  tipo_documento: TipoDocumento;
  documento: string;
  nombre_completo: string;
  empresa: string;
  a_quien_visita: string;
  destino: string;
  motivo: string;
  observaciones: string;
  entrada: string; // formato datetime-local
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
 * foco automático en documento, Enter avanza de campo y guarda al final.
 */
export function FormularioEntrada({ onVisitaCreada }: Propiedades) {
  const [form, setForm] = useState<EstadoFormulario>(formularioVacio());
  const [guardando, setGuardando] = useState(false);
  const [autocompletoAplicado, setAutocompletoAplicado] = useState(false);
  const refDocumento = useRef<HTMLInputElement>(null);
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

  const camposValidos =
    form.documento.trim().length > 0 &&
    form.nombre_completo.trim().length > 0 &&
    form.a_quien_visita.trim().length > 0 &&
    form.destino.trim().length > 0 &&
    form.motivo.trim().length > 0;

  async function guardar() {
    if (!camposValidos || guardando) return;
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
        entrada: localInputAIsoPanama(form.entrada),
      };
      await window.api.visitas.crear(datos);
      mostrarToast(`Entrada registrada: ${datos.nombre_completo}`, { tipo: 'exito' });
      setForm(formularioVacio());
      setAutocompletoAplicado(false);
      onVisitaCreada();
      refDocumento.current?.focus();
    } catch {
      mostrarToast('No se pudo guardar la visita. Intenta de nuevo.', { tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  }

  function alPresionarTecla(evento: KeyboardEvent<HTMLFormElement>) {
    if (evento.key !== 'Enter') return;
    const objetivo = evento.target as HTMLElement;
    // En el textarea, Enter agrega una línea en vez de avanzar.
    if (objetivo.tagName === 'TEXTAREA') return;
    evento.preventDefault();

    const elementosEnfocables = Array.from(
      evento.currentTarget.querySelectorAll<HTMLElement>('input, select, textarea, button[type="submit"]'),
    ).filter((el) => !el.hasAttribute('disabled'));
    const indiceActual = elementosEnfocables.indexOf(objetivo);
    const siguiente = elementosEnfocables[indiceActual + 1];
    if (siguiente) {
      siguiente.focus();
    } else {
      guardar();
    }
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
      onKeyDown={alPresionarTecla}
      onSubmit={(e) => {
        e.preventDefault();
        guardar();
      }}
    >
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Registrar entrada</h2>

      <div className="grid grid-cols-2 gap-4">
        <CampoSelect
          etiqueta="Tipo de documento"
          opciones={OPCIONES_TIPO_DOCUMENTO}
          value={form.tipo_documento}
          onChange={(e) => actualizarCampo('tipo_documento', e.target.value as TipoDocumento)}
        />
        <CampoTexto
          ref={refDocumento}
          etiqueta="Documento"
          requerido
          value={form.documento}
          onChange={(e) => {
            actualizarCampo('documento', e.target.value);
            setAutocompletoAplicado(false);
          }}
          onBlur={alSalirDeDocumento}
          advertencia={advertenciaDocumento}
          placeholder="8-123-456"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoTexto
          etiqueta="Nombre completo"
          requerido
          value={form.nombre_completo}
          onChange={(e) => actualizarCampo('nombre_completo', e.target.value)}
        />
        <CampoTexto
          etiqueta="Empresa (opcional)"
          value={form.empresa}
          onChange={(e) => actualizarCampo('empresa', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoConSugerencias
          etiqueta="A quién visita"
          requerido
          valor={form.a_quien_visita}
          onCambiar={(v) => actualizarCampo('a_quien_visita', v)}
          obtenerSugerencias={obtenerSugerenciasVisita}
        />
        <CampoConSugerencias
          etiqueta="Destino (piso/oficina)"
          requerido
          valor={form.destino}
          onCambiar={(v) => actualizarCampo('destino', v)}
          obtenerSugerencias={obtenerSugerenciasDestino}
        />
      </div>

      <CampoTexto
        etiqueta="Motivo"
        requerido
        value={form.motivo}
        onChange={(e) => actualizarCampo('motivo', e.target.value)}
      />

      <CampoTextArea
        etiqueta="Observaciones (opcional)"
        value={form.observaciones}
        onChange={(e) => actualizarCampo('observaciones', e.target.value)}
      />

      <CampoTexto
        etiqueta="Fecha y hora de entrada"
        type="datetime-local"
        value={form.entrada}
        onChange={(e) => actualizarCampo('entrada', e.target.value)}
        ayuda="Se llena sola, pero puedes editarla si hace falta."
      />

      <Boton type="submit" tamano="grande" disabled={!camposValidos || guardando} className="mt-2">
        {guardando ? 'Guardando…' : 'Registrar entrada'}
      </Boton>
    </form>
  );
}
