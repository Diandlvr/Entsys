import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import Papa from 'papaparse';
import { Boton } from '../../componentes/ui/Boton.js';
import { CampoSelect } from '../../componentes/ui/Campo.js';
import { Dialogo } from '../../componentes/ui/Dialogo.js';
import { usarToast } from '../../componentes/ui/Toast.js';
import {
  CAMPOS_VISITA,
  ETIQUETAS_CAMPO,
  detectarMapeoColumnas,
  validarFilasImportacion,
} from '../../../core/csv/importar.js';
import type { CampoVisita, FilaValidada, MapeoColumnas } from '../../tipos.js';

type Paso = 'archivo' | 'revision' | 'resultado';

type Propiedades = {
  onCerrar: () => void;
  onImportado: () => void;
};

/** Asistente de importación en 3 pasos: archivo + mapeo, vista previa/validación, resultado. */
export function PanelImportar({ onCerrar, onImportado }: Propiedades) {
  const [paso, setPaso] = useState<Paso>('archivo');
  const [columnasCsv, setColumnasCsv] = useState<string[]>([]);
  const [filasCrudas, setFilasCrudas] = useState<Array<Record<string, string>>>([]);
  const [mapeo, setMapeo] = useState<MapeoColumnas | null>(null);
  const [filasValidadas, setFilasValidadas] = useState<FilaValidada[]>([]);
  const [validando, setValidando] = useState(false);
  const [accionDuplicados, setAccionDuplicados] = useState<'omitir' | 'reemplazar'>('omitir');
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ insertadas: number; omitidas: number } | null>(null);
  const mostrarToast = usarToast();

  function alSeleccionarArchivo(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      const texto = String(lector.result ?? '');
      const resultado = Papa.parse<Record<string, string>>(texto, { header: true, skipEmptyLines: true });
      const columnas = resultado.meta.fields ?? [];
      setColumnasCsv(columnas);
      setFilasCrudas(resultado.data);
      setMapeo(detectarMapeoColumnas(columnas));
    };
    lector.readAsText(archivo, 'utf-8');
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
      mostrarToast('No se pudo completar la importación. No se guardó ningún registro.', { tipo: 'error' });
    } finally {
      setImportando(false);
    }
  }

  async function descargarPlantilla() {
    const r = await window.api.exportar.plantillaCsv();
    if (r.guardado) mostrarToast('Plantilla guardada.', { tipo: 'exito' });
  }

  async function descargarErrores() {
    const columnas = ['fila', 'errores', ...columnasCsv];
    const filas = resumen.conError.map((f) => ({
      fila: String(f.numeroFila),
      errores: f.errores.join(' | '),
      ...f.filaOriginal,
    }));
    const r = await window.api.exportar.filasConError(filas, columnas);
    if (r.guardado) mostrarToast('Filas con error guardadas.', { tipo: 'exito' });
  }

  return (
    <Dialogo abierto titulo="Importar CSV" onCerrar={onCerrar}>
      {paso === 'archivo' && (
        <div className="flex flex-col gap-4">
          <p className="text-slate-600 dark:text-slate-300">
            Selecciona un archivo CSV. Se intentará detectar automáticamente qué columna corresponde a cada
            campo; puedes ajustarlo antes de validar.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={alSeleccionarArchivo}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-acento-600 file:px-3 file:py-2 file:text-white hover:file:bg-acento-700 dark:text-slate-300"
          />

          {mapeo && (
            <div className="grid grid-cols-2 gap-3">
              {CAMPOS_VISITA.map((campo: CampoVisita) => (
                <CampoSelect
                  key={campo}
                  etiqueta={ETIQUETAS_CAMPO[campo]}
                  value={mapeo[campo] ?? ''}
                  onChange={(e) => setMapeo({ ...mapeo, [campo]: e.target.value || null })}
                  opciones={[{ valor: '', etiqueta: '(ninguna)' }, ...columnasCsv.map((c) => ({ valor: c, etiqueta: c }))]}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Boton variante="fantasma" onClick={descargarPlantilla}>
              Descargar plantilla de ejemplo
            </Boton>
            <Boton onClick={validar} disabled={!mapeo || filasCrudas.length === 0 || validando}>
              {validando ? 'Validando…' : `Validar ${filasCrudas.length} filas`}
            </Boton>
          </div>
        </div>
      )}

      {paso === 'revision' && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 text-sm">
            <span className="text-green-700 dark:text-green-400">{resumen.validas.length} válidas</span>
            <span className="text-amber-700 dark:text-amber-400">{resumen.duplicadas.length} duplicadas</span>
            <span className="text-red-700 dark:text-red-400">{resumen.conError.length} con error</span>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900">
                <tr className="text-left text-slate-500 dark:text-slate-400">
                  <th className="px-2 py-1.5">Fila</th>
                  <th className="px-2 py-1.5">Estado</th>
                  <th className="px-2 py-1.5">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filasValidadas.map((fila) => {
                  const esError = !fila.datos;
                  const esDuplicada = fila.datos && (fila.duplicadoEnArchivo || fila.duplicadoEnBaseDeDatos);
                  return (
                    <tr key={fila.numeroFila} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-2 py-1.5">{fila.numeroFila}</td>
                      <td className="px-2 py-1.5">
                        {esError ? (
                          <span className="text-red-600 dark:text-red-400">Error</span>
                        ) : esDuplicada ? (
                          <span className="text-amber-600 dark:text-amber-400">Duplicada</span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">Válida</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-slate-600 dark:text-slate-300">
                        {[...fila.errores, ...fila.advertencias].join(' · ') || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {resumen.duplicadas.length > 0 && (
            <CampoSelect
              etiqueta="Si una fila está duplicada"
              value={accionDuplicados}
              onChange={(e) => setAccionDuplicados(e.target.value as 'omitir' | 'reemplazar')}
              opciones={[
                { valor: 'omitir', etiqueta: 'Omitirla (no tocar lo ya guardado)' },
                { valor: 'reemplazar', etiqueta: 'Reemplazar la visita existente' },
              ]}
            />
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Boton variante="secundario" onClick={() => setPaso('archivo')}>
                Volver
              </Boton>
              {resumen.conError.length > 0 && (
                <Boton variante="fantasma" onClick={descargarErrores}>
                  Descargar filas con error
                </Boton>
              )}
            </div>
            <Boton
              onClick={confirmarImportacion}
              disabled={importando || resumen.validas.length + resumen.duplicadas.length === 0}
            >
              {importando ? 'Importando…' : `Importar ${resumen.validas.length + resumen.duplicadas.length} filas`}
            </Boton>
          </div>
        </div>
      )}

      {paso === 'resultado' && resultado && (
        <div className="flex flex-col gap-4">
          <p className="text-slate-700 dark:text-slate-200">
            Se importaron <strong>{resultado.insertadas}</strong> visitas
            {resultado.omitidas > 0 && <> y se omitieron <strong>{resultado.omitidas}</strong> duplicadas</>}.
            {resumen.conError.length > 0 && (
              <> {resumen.conError.length} filas no se importaron por tener errores.</>
            )}
          </p>
          <div className="flex justify-end gap-2">
            {resumen.conError.length > 0 && (
              <Boton variante="secundario" onClick={descargarErrores}>
                Descargar filas con error
              </Boton>
            )}
            <Boton onClick={onCerrar}>Cerrar</Boton>
          </div>
        </div>
      )}
    </Dialogo>
  );
}
