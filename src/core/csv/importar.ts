import { advertenciaFormatoDocumento, normalizarDocumento, normalizarParaBusqueda } from '../documento.js';
import type { TipoDocumento } from '../documento.js';
import type { DatosNuevaVisita } from '../db/visitasRepo.js';

export type CampoVisita =
  | 'tipo_documento'
  | 'documento'
  | 'nombre_completo'
  | 'empresa'
  | 'a_quien_visita'
  | 'destino'
  | 'motivo'
  | 'observaciones'
  | 'entrada';

export type MapeoColumnas = Record<CampoVisita, string | null>;

export const CAMPOS_VISITA: CampoVisita[] = [
  'tipo_documento',
  'documento',
  'nombre_completo',
  'empresa',
  'a_quien_visita',
  'destino',
  'motivo',
  'observaciones',
  'entrada',
];

export const ETIQUETAS_CAMPO: Record<CampoVisita, string> = {
  tipo_documento: 'Tipo de documento',
  documento: 'Documento',
  nombre_completo: 'Nombre completo',
  empresa: 'Empresa',
  a_quien_visita: 'A quién visita',
  destino: 'Destino',
  motivo: 'Motivo',
  observaciones: 'Observaciones',
  entrada: 'Entrada',
};

const ALIAS_COLUMNAS: Record<CampoVisita, string[]> = {
  tipo_documento: ['tipodedocumento', 'tipodocumento', 'tipo'],
  documento: ['documento', 'cedula', 'nodedocumento', 'numerodedocumento'],
  nombre_completo: ['nombrecompleto', 'nombre'],
  empresa: ['empresa', 'compania'],
  a_quien_visita: ['aquienvisita', 'visitaa', 'visita', 'persona', 'contacto', 'anfitrion'],
  destino: ['destino', 'pisooficina', 'piso', 'oficina'],
  motivo: ['motivo'],
  observaciones: ['observaciones', 'notas', 'comentarios'],
  entrada: ['entrada', 'fechaentrada', 'horaentrada', 'fechayhoraentrada'],
};

function clave(texto: string): string {
  return normalizarParaBusqueda(texto).replace(/[^a-z0-9]/g, '');
}

/** Intenta adivinar qué columna del CSV corresponde a cada campo, por nombre de encabezado. */
export function detectarMapeoColumnas(columnasCsv: string[]): MapeoColumnas {
  const resultado = {} as MapeoColumnas;
  for (const campo of CAMPOS_VISITA) {
    const alias = ALIAS_COLUMNAS[campo];
    resultado[campo] = columnasCsv.find((columna) => alias.includes(clave(columna))) ?? null;
  }
  return resultado;
}

/**
 * Interpreta una fecha en formato ISO con offset, o "dd/mm/aaaa hh:mm a. m./p. m.".
 * Devuelve null si no se pudo interpretar.
 */
export function parsearFechaFlexible(texto: string): string | null {
  const limpio = texto.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(limpio)) {
    return limpio.length === 19 ? `${limpio}-05:00` : limpio;
  }
  const coincidencia = limpio.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)$/i,
  );
  if (!coincidencia) return null;
  const [, diaStr, mesStr, anio, horaStr, minuto, meridianoRaw] = coincidencia;
  let hora = parseInt(horaStr, 10);
  const esPM = /p/i.test(meridianoRaw);
  if (esPM && hora !== 12) hora += 12;
  if (!esPM && hora === 12) hora = 0;
  const dia = diaStr.padStart(2, '0');
  const mes = mesStr.padStart(2, '0');
  return `${anio}-${mes}-${dia}T${String(hora).padStart(2, '0')}:${minuto}:00-05:00`;
}

export type FilaValidada = {
  numeroFila: number;
  filaOriginal: Record<string, string>;
  datos: DatosNuevaVisita | null;
  errores: string[];
  advertencias: string[];
  duplicadoEnArchivo: boolean;
  /** Se completa después, al consultar la base de datos (requiere IPC; no se hace aquí). */
  duplicadoEnBaseDeDatos?: boolean;
};

/**
 * Valida cada fila del CSV según el mapeo de columnas elegido. No toca la base de datos
 * (la detección de duplicados contra lo ya guardado se hace aparte, de forma asíncrona).
 */
export function validarFilasImportacion(
  filas: Array<Record<string, string>>,
  mapeo: MapeoColumnas,
): FilaValidada[] {
  const vistosEnArchivo = new Set<string>();

  return filas.map((fila, indice) => {
    const errores: string[] = [];
    const advertencias: string[] = [];

    function obtener(campo: CampoVisita): string {
      const columna = mapeo[campo];
      return columna ? (fila[columna] ?? '').trim() : '';
    }

    const tipoRaw = obtener('tipo_documento').toUpperCase();
    const tipo_documento: TipoDocumento = ['CEDULA', 'PASAPORTE', 'OTRO'].includes(tipoRaw)
      ? (tipoRaw as TipoDocumento)
      : 'OTRO';
    const documento = obtener('documento');
    const nombre_completo = obtener('nombre_completo');
    const a_quien_visita = obtener('a_quien_visita');
    const destino = obtener('destino');
    const motivo = obtener('motivo');
    const empresa = obtener('empresa') || null;
    const observaciones = obtener('observaciones') || null;
    const entradaTexto = obtener('entrada');

    if (!documento) errores.push('Falta el documento.');
    if (!nombre_completo) errores.push('Falta el nombre completo.');
    if (!a_quien_visita) errores.push('Falta "a quién visita".');
    if (!destino) errores.push('Falta el destino.');
    if (!motivo) errores.push('Falta el motivo.');

    let entrada: string | null = null;
    if (!entradaTexto) {
      errores.push('Falta la fecha de entrada.');
    } else {
      entrada = parsearFechaFlexible(entradaTexto);
      if (!entrada) errores.push(`No se pudo interpretar la fecha de entrada: "${entradaTexto}".`);
    }

    if (documento && tipo_documento === 'CEDULA') {
      const advertencia = advertenciaFormatoDocumento('CEDULA', normalizarDocumento(documento));
      if (advertencia) advertencias.push(advertencia);
    }

    let duplicadoEnArchivo = false;
    if (documento && entrada) {
      const claveFila = `${normalizarDocumento(documento)}|${entrada}`;
      if (vistosEnArchivo.has(claveFila)) {
        duplicadoEnArchivo = true;
        advertencias.push('Fila duplicada dentro del mismo archivo (mismo documento y entrada).');
      }
      vistosEnArchivo.add(claveFila);
    }

    const datos: DatosNuevaVisita | null =
      errores.length === 0
        ? {
            tipo_documento,
            documento,
            nombre_completo,
            empresa,
            a_quien_visita,
            destino,
            motivo,
            observaciones,
            entrada: entrada!,
          }
        : null;

    return {
      numeroFila: indice + 2, // +2: la fila 1 es el encabezado y los números de fila son base 1
      filaOriginal: fila,
      datos,
      errores,
      advertencias,
      duplicadoEnArchivo,
    };
  });
}
