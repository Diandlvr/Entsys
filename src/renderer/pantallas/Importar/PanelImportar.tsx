import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { Boton } from '../../componentes/ui/Boton.js';
import { CampoSelect } from '../../componentes/ui/Campo.js';
import { Dialogo } from '../../componentes/ui/Dialogo.js';
import { OpcionTarjeta } from '../../componentes/ui/OpcionTarjeta.js';
import { Pasos } from '../../componentes/ui/Pasos.js';
import { Pill } from '../../componentes/ui/Pill.js';
import { ZonaArchivo } from '../../componentes/ui/ZonaArchivo.js';
import { usarToast } from '../../componentes/ui/Toast.js';
import {
  CAMPOS_VISITA,
  ETIQUETAS_CAMPO,
  detectarMapeoColumnas,
  validarFilasImportacion,
} from '../../../core/csv/importar.js';
import type { CampoVisita, FilaValidada, MapeoColumnas } from '../../tipos.js';

type Paso = 'archivo' | 'revision' | 'resultado';

const NOMBRES_PASOS = ['Archivo', 'Revisar', 'Listo'];
const INDICE_PASO: Record<Paso, number> = { archivo: 0, revision: 1, resultado: 2 };

type Propiedades = {
  onCerrar: () => void;
  onImportado: () => void;
};

/** Asistente de importación en 3 pasos: archivo + columnas, revisión de filas, resultado. */
export function PanelImportar({ onCerrar, onImportado }: Propiedades) {
  const [paso, setPaso] = useState<Paso>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [columnasCsv, setColumnasCsv] = useState<string[]>([]);
  const [filasCrudas, setFilasCrudas] = useState<Array<Record<string, string>>>([]);
  const [mapeo, setMapeo] = useState<MapeoColumnas | null>(null);
  const [filasValidadas, setFilasValidadas] = useState<FilaValidada[]>([]);
  const [validando, setValidando] = useState(false);
  const [accionDuplicados, setAccionDuplicados] = useState<'omitir' | 'reemplazar'>('omitir');
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ insertadas: number; omitidas: number } | null>(null);
  const mostrarToast = usarToast();

  function alSeleccionarArchivo(elegido: File) {
    setArchivo(elegido);
    const lector = new FileReader();
    lector.onload = () => {
      const texto = String(lector.result ?? '');
      const parseado = Papa.parse<Record<string, string>>(texto, { header: true, skipEmptyLines: true });
      const columnas = parseado.meta.fields ?? [];
      setColumnasCsv(columnas);
      setFilasCrudas(parseado.data);
      setMapeo(detectarMapeoColumnas(columnas));
    };
    lector.readAsText(elegido, 'utf-8');
  }

  async function validar() {
    if (!mapeo) return;
    setValidando(true);
    try {
      const validadas = validarFilasImportacion(filasCrudas, mapeo);
      // Consulta duplicados contra lo ya guardado, solo para filas sin errores.
      for (const fila of validadas) {
        if (fila.datos) {
          fila.duplicadoEnBaseDeDatos = await window.api.visitas.existeDuplicado(
            fila.datos.documento,
            fila.datos.entrada!,
          );
        }
      }
      setFilasValidadas(validadas);
      setPaso('revision');
    } finally {
      setValidando(false);
    }
  }

  const resumen = useMemo(() => {
    const validas = filasValidadas.filter((f) => f.datos && !f.duplicadoEnArchivo && !f.duplicadoEnBaseDeDatos);
    const duplicadas = filasValidadas.filter((f) => f.datos && (f.duplicadoEnArchivo || f.duplicadoEnBaseDeDatos));
    const conError = filasValidadas.filter((f) => !f.datos);
    return { validas, duplicadas, conError };
  }, [filasValidadas]);

  async function confirmarImportacion() {
    setImportando(true);
    try {
      const filas = [...resumen.validas, ...resumen.duplicadas].map((f) => ({
        datos: f.datos!,
        esDuplicado: Boolean(f.duplicadoEnArchivo || f.duplicadoEnBaseDeDatos),
      }));
      const resultadoImportacion = await window.api.visitas.importarLote(filas, accionDuplicados);
      setResultado(resultadoImportacion);
      setPaso('resultado');
      onImportado();
    } catch {
      mostrarToast('No se pudo completar la importación. No se guardó ninguna fila; puedes intentarlo de nuevo.', {
        tipo: 'error',
      });
    } finally {
      setImportando(false);
    }
  }

  async function descargarPlantilla() {
    const r = await window.api.exportar.plantillaCsv();
    if (r.guardado) mostrarToast('Plantilla guardada', { tipo: 'exito' });
  }

  async function descargarErrores() {
    const columnas = ['fila', 'errores', ...columnasCsv];
    const filas = resumen.conError.map((f) => ({
      fila: String(f.numeroFila),
      errores: f.errores.join(' | '),
      ...f.filaOriginal,
    }));
    const r = await window.api.exportar.filasConError(filas, columnas);
    if (r.guardado) mostrarToast('Filas con error guardadas', { tipo: 'exito' });
  }

  const totalAImportar = resumen.validas.length + resumen.duplicadas.length;

  return (
    <Dialogo abierto titulo="Importar visitas desde CSV" onCerrar={onCerrar} ancho="amplio">
      <div className="mb-6">
        <Pasos pasos={NOMBRES_PASOS} actual={INDICE_PASO[paso]} />
      </div>

      {paso === 'archivo' && (
        <div className="flex flex-col gap-5">
          <p className="text-tinta-suave">
            Elige un archivo CSV con visitas anteriores. Detectamos solos qué columna es cada dato, y puedes corregirlo antes de revisar.
          </p>

          <ZonaArchivo accept=".csv,text/csv" archivo={archivo} onArchivo={alSeleccionarArchivo} />

          {mapeo && (
            <div className="flex flex-col gap-3">
              <p className="font-medium text-tinta">¿Qué columna del archivo corresponde a cada dato?</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CAMPOS_VISITA.map((campo: CampoVisita) => (
                  <CampoSelect
                    key={campo}
                    etiqueta={ETIQUETAS_CAMPO[campo]}
                    value={mapeo[campo] ?? ''}
                    onChange={(e) => setMapeo({ ...mapeo, [campo]: e.target.value || null })}
                    opciones={[
                      { valor: '', etiqueta: 'No importar este dato' },
                      ...columnasCsv.map((c) => ({ valor: c, etiqueta: c })),
                    ]}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-borde pt-5">
            <Boton variante="fantasma" onClick={descargarPlantilla}>
              Descargar archivo de ejemplo
            </Boton>
            <Boton
              onClick={validar}
              cargando={validando}
              disabled={!mapeo || filasCrudas.length === 0}
              motivoDeshabilitado={!archivo ? 'Primero elige un archivo CSV' : 'El archivo no tiene filas para importar'}
            >
              {filasCrudas.length > 0 ? `Revisar ${filasCrudas.length} filas` : 'Revisar filas'}
            </Boton>
          </div>
        </div>
      )}

      {paso === 'revision' && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <Pill tono="dentro">{resumen.validas.length} listas para importar</Pill>
            <Pill tono="aviso">{resumen.duplicadas.length} repetidas</Pill>
            <Pill tono="neutro">{resumen.conError.length} con errores</Pill>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-control border border-borde">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-tarjeta-suave">
                <tr className="text-left text-tinta-suave">
                  <th scope="col" className="px-3 py-2 font-medium">
                    Fila
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Estado
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody>
                {filasValidadas.map((fila) => {
                  const esError = !fila.datos;
                  const esDuplicada = fila.datos && (fila.duplicadoEnArchivo || fila.duplicadoEnBaseDeDatos);
                  const detalles = [...fila.errores, ...fila.advertencias];
                  return (
                    <tr key={fila.numeroFila} className="border-t border-borde align-top">
                      <td className="cifras px-3 py-2">{fila.numeroFila}</td>
                      <td className="px-3 py-2">
                        {esError ? (
                          <span className="font-medium text-peligro">Con error</span>
                        ) : esDuplicada ? (
                          <span className="font-medium text-aviso">Repetida</span>
                        ) : (
                          <span className="font-medium text-exito">Lista</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-tinta-suave">
                        {detalles.length === 0 ? '—' : detalles.map((d) => <p key={d}>{d}</p>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {resumen.duplicadas.length > 0 && (
            <fieldset>
              <legend className="mb-2 font-medium text-tinta">
                {resumen.duplicadas.length === 1
                  ? '1 fila ya existe. ¿Qué hacemos con ella?'
                  : `${resumen.duplicadas.length} filas ya existen. ¿Qué hacemos con ellas?`}
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <OpcionTarjeta
                  name="duplicados"
                  valor="omitir"
                  marcado={accionDuplicados === 'omitir'}
                  onCambiar={() => setAccionDuplicados('omitir')}
                  titulo="Saltarlas"
                  descripcion="Se queda lo que ya estaba guardado."
                />
                <OpcionTarjeta
                  name="duplicados"
                  valor="reemplazar"
                  marcado={accionDuplicados === 'reemplazar'}
                  onCambiar={() => setAccionDuplicados('reemplazar')}
                  titulo="Reemplazarlas"
                  descripcion="Se usan los datos del archivo."
                  advertencia="Los datos guardados se sobrescriben."
                />
              </div>
            </fieldset>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-borde pt-5">
            <div className="flex gap-2">
              <Boton variante="secundario" onClick={() => setPaso('archivo')}>
                Volver
              </Boton>
              {resumen.conError.length > 0 && (
                <Boton variante="fantasma" onClick={descargarErrores}>
                  Guardar las filas con error
                </Boton>
              )}
            </div>
            <Boton
              onClick={confirmarImportacion}
              cargando={importando}
              disabled={totalAImportar === 0}
              motivoDeshabilitado="No hay filas válidas para importar"
            >
              {totalAImportar === 1 ? 'Importar 1 fila' : `Importar ${totalAImportar} filas`}
            </Boton>
          </div>
        </div>
      )}

      {paso === 'resultado' && resultado && (
        <div className="flex flex-col gap-5">
          <p className="text-tinta">
            Listo: se importaron <strong>{resultado.insertadas}</strong> {resultado.insertadas === 1 ? 'visita' : 'visitas'}
            {resultado.omitidas > 0 && (
              <>
                {' '}
                y se saltaron <strong>{resultado.omitidas}</strong> repetidas
              </>
            )}
            .
            {resumen.conError.length > 0 && (
              <>
                {' '}
                {resumen.conError.length === 1
                  ? '1 fila no se importó porque tenía errores.'
                  : `${resumen.conError.length} filas no se importaron porque tenían errores.`}
              </>
            )}
          </p>
          <div className="flex justify-end gap-2">
            {resumen.conError.length > 0 && (
              <Boton variante="secundario" onClick={descargarErrores}>
                Guardar las filas con error
              </Boton>
            )}
            <Boton onClick={onCerrar}>Cerrar</Boton>
          </div>
        </div>
      )}
    </Dialogo>
  );
}
