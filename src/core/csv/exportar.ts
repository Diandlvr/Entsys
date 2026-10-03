import Papa from 'papaparse';
import { formatearFechaHora } from '../fechas.js';
import type { Visita } from '../db/visitasRepo.js';

const ENCABEZADOS = [
  'tipo_documento',
  'documento',
  'nombre_completo',
  'empresa',
  'a_quien_visita',
  'destino',
  'motivo',
  'observaciones',
  'entrada',
  'salida',
] as const;

/**
 * Convierte visitas a texto CSV (sin BOM; el BOM se agrega al escribir el archivo).
 * Las fechas se exportan en formato legible (dd/mm/aaaa hh:mm a. m./p. m.) para Excel.
 */
export function construirCsv(visitas: Visita[], separador: ',' | ';' = ','): string {
  const filas = visitas.map((v) => ({
    tipo_documento: v.tipo_documento,
    documento: v.documento,
    nombre_completo: v.nombre_completo,
    empresa: v.empresa ?? '',
    a_quien_visita: v.a_quien_visita,
    destino: v.destino,
    motivo: v.motivo,
    observaciones: v.observaciones ?? '',
    entrada: formatearFechaHora(v.entrada),
    salida: v.salida ? formatearFechaHora(v.salida) : '',
  }));
  return Papa.unparse(
    { fields: [...ENCABEZADOS], data: filas },
    { delimiter: separador, newline: '\r\n' },
  );
}

/** Convierte filas genéricas (ej. errores de importación) a CSV, con las columnas dadas. */
export function construirCsvGenerico(
  filas: Array<Record<string, string>>,
  columnas: string[],
  separador: ',' | ';' = ',',
): string {
  return Papa.unparse(
    { fields: columnas, data: filas.map((fila) => columnas.map((c) => fila[c] ?? '')) },
    { delimiter: separador, newline: '\r\n' },
  );
}

/** Plantilla de ejemplo para que el usuario sepa qué columnas espera el importador. */
export function construirPlantillaCsv(separador: ',' | ';' = ','): string {
  const ejemplo = {
    tipo_documento: 'CEDULA',
    documento: '8-123-456',
    nombre_completo: 'Juan Pérez',
    empresa: 'Empresa Ejemplo S.A.',
    a_quien_visita: 'María López',
    destino: 'Piso 4',
    motivo: 'Reunión de trabajo',
    observaciones: '',
    entrada: '03/10/2026 09:30 a. m.',
    salida: '',
  };
  return Papa.unparse({ fields: [...ENCABEZADOS], data: [ejemplo] }, { delimiter: separador, newline: '\r\n' });
}
