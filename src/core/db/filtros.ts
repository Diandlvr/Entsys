import { normalizarParaBusqueda } from '../documento.js';

export type EstadoVisita = 'dentro' | 'salio' | 'todos';

export type FiltrosVisitas = {
  desde?: string; // ISO Panamá, inclusive
  hasta?: string; // ISO Panamá, inclusive
  documento?: string; // búsqueda parcial
  nombre?: string; // búsqueda parcial
  empresa?: string; // búsqueda parcial
  destino?: string; // búsqueda parcial
  aQuienVisita?: string; // búsqueda parcial
  estado?: EstadoVisita;
  orden?: string;
  direccion?: 'ASC' | 'DESC';
  limite?: number;
  offset?: number;
};

/** Construye la cláusula WHERE y los parámetros, combinando todos los filtros con AND. */
export function construirFiltroSql(filtros: FiltrosVisitas): { where: string; parametros: unknown[] } {
  const condiciones: string[] = [];
  const parametros: unknown[] = [];

  if (filtros.desde) {
    condiciones.push('entrada >= ?');
    parametros.push(filtros.desde);
  }
  if (filtros.hasta) {
    condiciones.push('entrada <= ?');
    parametros.push(filtros.hasta);
  }
  if (filtros.documento) {
    condiciones.push('documento_busq LIKE ?');
    parametros.push(`%${normalizarParaBusqueda(filtros.documento)}%`);
  }
  if (filtros.nombre) {
    condiciones.push('nombre_busq LIKE ?');
    parametros.push(`%${normalizarParaBusqueda(filtros.nombre)}%`);
  }
  if (filtros.empresa) {
    condiciones.push('empresa_busq LIKE ?');
    parametros.push(`%${normalizarParaBusqueda(filtros.empresa)}%`);
  }
  if (filtros.destino) {
    condiciones.push('destino_busq LIKE ?');
    parametros.push(`%${normalizarParaBusqueda(filtros.destino)}%`);
  }
  if (filtros.aQuienVisita) {
    condiciones.push('visita_busq LIKE ?');
    parametros.push(`%${normalizarParaBusqueda(filtros.aQuienVisita)}%`);
  }
  if (filtros.estado === 'dentro') {
    condiciones.push('salida IS NULL');
  } else if (filtros.estado === 'salio') {
    condiciones.push('salida IS NOT NULL');
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  return { where, parametros };
}
