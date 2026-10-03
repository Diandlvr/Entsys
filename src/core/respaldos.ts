/** Lógica pura de respaldos: nombres de archivo y rotación. No toca el disco ni Electron. */

const PREFIJO = 'respaldo_';
const SUFIJO = '.db';

/** Nombre de archivo de respaldo con fecha y hora, ordenable alfabéticamente = ordenable cronológicamente. */
export function nombreArchivoRespaldo(fecha: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const partes = [
    fecha.getFullYear(),
    pad(fecha.getMonth() + 1),
    pad(fecha.getDate()),
    '_',
    pad(fecha.getHours()),
    pad(fecha.getMinutes()),
    pad(fecha.getSeconds()),
  ];
  return `${PREFIJO}${partes[0]}-${partes[1]}-${partes[2]}${partes[3]}${partes[4]}-${partes[5]}-${partes[6]}${SUFIJO}`;
}

export function esArchivoDeRespaldo(nombre: string): boolean {
  return nombre.startsWith(PREFIJO) && nombre.endsWith(SUFIJO);
}

/** Dado el listado de respaldos existentes, decide cuáles sobran según cuántos se quieren conservar. */
export function archivosARotar(nombresExistentes: string[], conservar: number): string[] {
  const ordenados = nombresExistentes.filter(esArchivoDeRespaldo).sort().reverse(); // más reciente primero
  return ordenados.slice(Math.max(0, conservar));
}
