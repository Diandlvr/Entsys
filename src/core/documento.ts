/**
 * Normalización y validación (solo como advertencia) de documentos de identidad.
 *
 * La validación de cédula panameña NUNCA bloquea el guardado: el formulario
 * tiene documentos reales con muchas variantes, y es mejor registrar algo
 * "raro" que perder la visita en recepción.
 */

export type TipoDocumento = 'CEDULA' | 'PASAPORTE' | 'OTRO';

/** Normaliza el documento: mayúsculas y sin espacios (ni al inicio/fin ni internos repetidos). */
export function normalizarDocumento(valor: string): string {
  return valor.trim().toUpperCase().replace(/\s+/g, '');
}

// Formatos de cédula panameña soportados (todos ya sin espacios, en mayúsculas):
//   8-123-456          provincia-tomo-asiento
//   PE-1-234           Panamá Este
//   E-8-12345          extranjero
//   N-12-345           naturalización
//   4-AV-123-456       con letras de provincia/comarca (ej. AV = Veraguas... variantes locales)
const PATRON_CEDULA_NUMERICA = /^\d{1,2}-\d{1,4}-\d{1,6}$/;
const PATRON_CEDULA_PREFIJO_LETRAS = /^(PE|E|N)-\d{1,4}-\d{1,6}$/;
const PATRON_CEDULA_PROVINCIA_LETRAS = /^\d{1,2}-[A-Z]{1,3}-\d{1,4}-\d{1,6}$/;

/**
 * Revisa si el documento normalizado parece una cédula panameña válida.
 * Devuelve true/false solo para mostrar una advertencia visual; nunca se usa para bloquear.
 */
export function pareceCedulaPanamena(documentoNormalizado: string): boolean {
  return (
    PATRON_CEDULA_NUMERICA.test(documentoNormalizado) ||
    PATRON_CEDULA_PREFIJO_LETRAS.test(documentoNormalizado) ||
    PATRON_CEDULA_PROVINCIA_LETRAS.test(documentoNormalizado)
  );
}

/** Mensaje de advertencia a mostrar cuando el tipo es Cédula pero el formato no coincide. */
export function advertenciaFormatoDocumento(
  tipo: TipoDocumento,
  documentoNormalizado: string,
): string | null {
  if (tipo !== 'CEDULA') return null;
  if (documentoNormalizado.length === 0) return null;
  if (pareceCedulaPanamena(documentoNormalizado)) return null;
  return 'El formato no parece una cédula panameña habitual (ej. 8-123-456). Se guardará igual.';
}

/** Normaliza texto libre para búsquedas sin distinguir tildes ni mayúsculas. */
export function normalizarParaBusqueda(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
