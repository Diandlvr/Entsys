import { useEffect, useState } from 'react';
import { Boton } from '../../componentes/ui/Boton.js';
import { CampoTextArea, CampoTexto } from '../../componentes/ui/Campo.js';
import { Dialogo } from '../../componentes/ui/Dialogo.js';
import { GrupoSegmentado } from '../../componentes/ui/GrupoSegmentado.js';
import { usarToast } from '../../componentes/ui/Toast.js';
import { advertenciaFormatoDocumento, normalizarDocumento } from '../../../core/documento.js';
import { isoPanamaALocalInput, localInputAIsoPanama } from '../../../core/fechas.js';
import type { DatosEditarVisita, TipoDocumento, Visita } from '../../tipos.js';

const OPCIONES_TIPO_DOCUMENTO: Array<{ valor: TipoDocumento; etiqueta: string }> = [
  { valor: 'CEDULA', etiqueta: 'Cédula' },
  { valor: 'PASAPORTE', etiqueta: 'Pasaporte' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

type Propiedades = {
  visita: Visita | null;
  onCerrar: () => void;
  onGuardado: () => void;
};

/** Diálogo para editar una visita existente desde el historial. */
export function DialogoEditarVisita({ visita, onCerrar, onGuardado }: Propiedades) {
  const [form, setForm] = useState<Visita | null>(visita);
  const [guardando, setGuardando] = useState(false);
  const mostrarToast = usarToast();

  useEffect(() => setForm(visita), [visita]);

  if (!form) return null;

  const documentoNormalizado = normalizarDocumento(form.documento);
  const advertencia = advertenciaFormatoDocumento(form.tipo_documento, documentoNormalizado);

  async function guardar() {
    if (!form) return;
    setGuardando(true);
    try {
      const datos: DatosEditarVisita = {
        tipo_documento: form.tipo_documento,
        documento: form.documento,
        nombre_completo: form.nombre_completo,
        empresa: form.empresa,
        a_quien_visita: form.a_quien_visita,
        destino: form.destino,
        motivo: form.motivo,
        observaciones: form.observaciones,
        entrada: form.entrada,
        salida: form.salida,
      };
      await window.api.visitas.editar(form.id, datos);
      mostrarToast('Cambios guardados', { tipo: 'exito' });
      onGuardado();
      onCerrar();
    } catch {
      mostrarToast('No se pudieron guardar los cambios. Revisa los datos e intenta de nuevo.', { tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialogo abierto={Boolean(visita)} titulo="Editar visita" onCerrar={onCerrar} ancho="amplio">
      <form
        className="flex flex-col gap-campos"
        onSubmit={(e) => {
          e.preventDefault();
          guardar();
        }}
      >
        <div className="grid grid-cols-1 items-start gap-campos sm:grid-cols-[auto_minmax(0,1fr)]">
          <GrupoSegmentado
            etiqueta="Tipo de documento"
            opciones={OPCIONES_TIPO_DOCUMENTO}
            valor={form.tipo_documento}
            onCambiar={(valor) => setForm({ ...form, tipo_documento: valor as TipoDocumento })}
          />
          <CampoTexto
            etiqueta="Documento"
            value={form.documento}
            onChange={(e) => setForm({ ...form, documento: e.target.value })}
            advertencia={advertencia}
          />
        </div>

        <div className="grid grid-cols-1 gap-campos sm:grid-cols-2">
          <CampoTexto
            etiqueta="Nombre completo"
            value={form.nombre_completo}
            onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
            data-autofocus
          />
          <CampoTexto
            etiqueta="Empresa"
            opcional
            value={form.empresa ?? ''}
            onChange={(e) => setForm({ ...form, empresa: e.target.value || null })}
          />
        </div>

        <div className="grid grid-cols-1 gap-campos sm:grid-cols-2">
          <CampoTexto
            etiqueta="A quién visita"
            value={form.a_quien_visita}
            onChange={(e) => setForm({ ...form, a_quien_visita: e.target.value })}
          />
          <CampoTexto
            etiqueta="Piso u oficina"
            value={form.destino}
            onChange={(e) => setForm({ ...form, destino: e.target.value })}
          />
        </div>

        <CampoTexto
          etiqueta="Motivo de la visita"
          value={form.motivo}
          onChange={(e) => setForm({ ...form, motivo: e.target.value })}
        />

        <CampoTextArea
          etiqueta="Observaciones"
          opcional
          value={form.observaciones ?? ''}
          onChange={(e) => setForm({ ...form, observaciones: e.target.value || null })}
        />

        <div className="grid grid-cols-1 gap-campos sm:grid-cols-2">
          <CampoTexto
            etiqueta="Entrada"
            type="datetime-local"
            value={isoPanamaALocalInput(form.entrada)}
            onChange={(e) => setForm({ ...form, entrada: localInputAIsoPanama(e.target.value) })}
          />
          <CampoTexto
            etiqueta="Salida"
            type="datetime-local"
            value={form.salida ? isoPanamaALocalInput(form.salida) : ''}
            onChange={(e) =>
              setForm({ ...form, salida: e.target.value ? localInputAIsoPanama(e.target.value) : null })
            }
            ayuda="Déjala vacía si la persona sigue dentro."
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Boton type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={guardando}>
            Guardar cambios
          </Boton>
        </div>
      </form>
    </Dialogo>
  );
}
