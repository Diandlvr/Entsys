import type Database from 'better-sqlite3';
import { ahoraIsoPanama, esDeDiaAnterior } from '../fechas.js';
import { normalizarDocumento, normalizarParaBusqueda, type TipoDocumento } from '../documento.js';
import { construirFiltroSql, type FiltrosVisitas } from './filtros.js';

export type Visita = {
  id: number;
  tipo_documento: TipoDocumento;
  documento: string;
  nombre_completo: string;
  empresa: string | null;
  a_quien_visita: string;
  destino: string;
  motivo: string;
  observaciones: string | null;
  entrada: string;
  salida: string | null;
  creado_en: string;
  actualizado_en: string;
};

export type DatosNuevaVisita = {
  tipo_documento: TipoDocumento;
  documento: string;
  nombre_completo: string;
  empresa?: string | null;
  a_quien_visita: string;
  destino: string;
  motivo: string;
  observaciones?: string | null;
  entrada?: string; // si no se da, se usa la hora actual de Panamá
};

export type DatosEditarVisita = Partial<DatosNuevaVisita> & { salida?: string | null };

const COLUMNAS = `id, tipo_documento, documento, nombre_completo, empresa, a_quien_visita,
  destino, motivo, observaciones, entrada, salida, creado_en, actualizado_en`;

export class VisitasRepo {
  constructor(private readonly db: Database.Database) {}

  /** Crea una visita nueva. Normaliza el documento y calcula columnas de búsqueda. */
  crear(datos: DatosNuevaVisita): Visita {
    const ahora = ahoraIsoPanama();
    const documento = normalizarDocumento(datos.documento);
    const stmt = this.db.prepare(`
      INSERT INTO visitas (
        tipo_documento, documento, nombre_completo, empresa, a_quien_visita,
        destino, motivo, observaciones, entrada, salida, creado_en, actualizado_en,
        documento_busq, nombre_busq, empresa_busq, destino_busq, visita_busq
      ) VALUES (
        @tipo_documento, @documento, @nombre_completo, @empresa, @a_quien_visita,
        @destino, @motivo, @observaciones, @entrada, NULL, @creado_en, @actualizado_en,
        @documento_busq, @nombre_busq, @empresa_busq, @destino_busq, @visita_busq
      )
    `);
    const info = stmt.run({
      tipo_documento: datos.tipo_documento,
      documento,
      nombre_completo: datos.nombre_completo.trim(),
      empresa: datos.empresa?.trim() || null,
      a_quien_visita: datos.a_quien_visita.trim(),
      destino: datos.destino.trim(),
      motivo: datos.motivo.trim(),
      observaciones: datos.observaciones?.trim() || null,
      entrada: datos.entrada ?? ahora,
      creado_en: ahora,
      actualizado_en: ahora,
      documento_busq: normalizarParaBusqueda(documento),
      nombre_busq: normalizarParaBusqueda(datos.nombre_completo),
      empresa_busq: normalizarParaBusqueda(datos.empresa ?? ''),
      destino_busq: normalizarParaBusqueda(datos.destino),
      visita_busq: normalizarParaBusqueda(datos.a_quien_visita),
    });
    return this.obtenerPorId(info.lastInsertRowid as number)!;
  }

  obtenerPorId(id: number): Visita | undefined {
    return this.db.prepare(`SELECT ${COLUMNAS} FROM visitas WHERE id = ?`).get(id) as
      | Visita
      | undefined;
  }

  /** Busca la última visita (por entrada) de un documento dado, para autocompletar. */
  ultimaVisitaPorDocumento(documento: string): Visita | undefined {
    const normalizado = normalizarDocumento(documento);
    return this.db
      .prepare(`SELECT ${COLUMNAS} FROM visitas WHERE documento = ? ORDER BY entrada DESC LIMIT 1`)
      .get(normalizado) as Visita | undefined;
  }

  /** Sugerencias de destino o de "a quién visita", basadas en frecuencia reciente. */
  sugerencias(campo: 'destino' | 'a_quien_visita', textoParcial: string, limite = 8): string[] {
    const parcial = normalizarParaBusqueda(textoParcial);
    const columnaBusq = campo === 'destino' ? 'destino_busq' : 'visita_busq';
    const filas = this.db
      .prepare(
        `SELECT ${campo} AS valor, COUNT(*) AS veces
         FROM visitas
         WHERE ${columnaBusq} LIKE ? || '%'
         GROUP BY ${campo}
         ORDER BY veces DESC, MAX(entrada) DESC
         LIMIT ?`,
      )
      .all(parcial, limite) as Array<{ valor: string; veces: number }>;
    return filas.map((f) => f.valor);
  }

  /** Lista las visitas sin salida (dentro ahora), de más antigua a más reciente. */
  dentroAhora(ahora: Date = new Date()): Visita[] {
    const filas = this.db
      .prepare(`SELECT ${COLUMNAS} FROM visitas WHERE salida IS NULL ORDER BY entrada ASC`)
      .all() as Visita[];
    return filas;
  }

  /** De las visitas dentro ahora, cuáles son de un día anterior al de hoy (probable olvido). */
  dentroAhoraDeDiasAnteriores(ahora: Date = new Date()): Visita[] {
    return this.dentroAhora(ahora).filter((v) => esDeDiaAnterior(v.entrada, ahora));
  }

  /** Marca la salida de una visita. Si no se da hora, usa la actual de Panamá. */
  marcarSalida(id: number, horaSalida?: string): Visita {
    const ahora = ahoraIsoPanama();
    this.db
      .prepare('UPDATE visitas SET salida = ?, actualizado_en = ? WHERE id = ?')
      .run(horaSalida ?? ahora, ahora, id);
    return this.obtenerPorId(id)!;
  }

  /** Deshace una salida marcada por error, dejando la visita abierta de nuevo. */
  deshacerSalida(id: number): Visita {
    const ahora = ahoraIsoPanama();
    this.db.prepare('UPDATE visitas SET salida = NULL, actualizado_en = ? WHERE id = ?').run(ahora, id);
    return this.obtenerPorId(id)!;
  }

  /** Marca la salida de varias visitas a la vez (cierre en lote), con la misma hora. */
  marcarSalidaEnLote(ids: number[], horaSalida?: string): void {
    const ahora = ahoraIsoPanama();
    const hora = horaSalida ?? ahora;
    const transaccion = this.db.transaction((listaIds: number[]) => {
      const stmt = this.db.prepare('UPDATE visitas SET salida = ?, actualizado_en = ? WHERE id = ?');
      for (const id of listaIds) stmt.run(hora, ahora, id);
    });
    transaccion(ids);
  }

  editar(id: number, datos: DatosEditarVisita): Visita {
    const actual = this.obtenerPorId(id);
    if (!actual) throw new Error(`No existe la visita ${id}`);
    const ahora = ahoraIsoPanama();

    const documento = datos.documento !== undefined ? normalizarDocumento(datos.documento) : actual.documento;
    const nombre = datos.nombre_completo ?? actual.nombre_completo;
    const empresa = datos.empresa !== undefined ? (datos.empresa?.trim() || null) : actual.empresa;
    const destino = datos.destino ?? actual.destino;
    const aQuienVisita = datos.a_quien_visita ?? actual.a_quien_visita;

    this.db
      .prepare(
        `UPDATE visitas SET
          tipo_documento = @tipo_documento,
          documento = @documento,
          nombre_completo = @nombre_completo,
          empresa = @empresa,
          a_quien_visita = @a_quien_visita,
          destino = @destino,
          motivo = @motivo,
          observaciones = @observaciones,
          entrada = @entrada,
          salida = @salida,
          actualizado_en = @actualizado_en,
          documento_busq = @documento_busq,
          nombre_busq = @nombre_busq,
          empresa_busq = @empresa_busq,
          destino_busq = @destino_busq,
          visita_busq = @visita_busq
        WHERE id = @id`,
      )
      .run({
        id,
        tipo_documento: datos.tipo_documento ?? actual.tipo_documento,
        documento,
        nombre_completo: nombre,
        empresa,
        a_quien_visita: aQuienVisita,
        destino,
        motivo: datos.motivo ?? actual.motivo,
        observaciones: datos.observaciones !== undefined ? (datos.observaciones?.trim() || null) : actual.observaciones,
        entrada: datos.entrada ?? actual.entrada,
        salida: datos.salida !== undefined ? datos.salida : actual.salida,
        actualizado_en: ahora,
        documento_busq: normalizarParaBusqueda(documento),
        nombre_busq: normalizarParaBusqueda(nombre),
        empresa_busq: normalizarParaBusqueda(empresa ?? ''),
        destino_busq: normalizarParaBusqueda(destino),
        visita_busq: normalizarParaBusqueda(aQuienVisita),
      });
    return this.obtenerPorId(id)!;
  }

  eliminar(id: number): Visita | undefined {
    const visita = this.obtenerPorId(id);
    if (!visita) return undefined;
    this.db.prepare('DELETE FROM visitas WHERE id = ?').run(id);
    return visita;
  }

  /** Reinserta una visita eliminada, conservando su id original (para "deshacer"). */
  restaurarEliminada(visita: Visita): void {
    this.db
      .prepare(
        `INSERT INTO visitas (
          id, tipo_documento, documento, nombre_completo, empresa, a_quien_visita,
          destino, motivo, observaciones, entrada, salida, creado_en, actualizado_en,
          documento_busq, nombre_busq, empresa_busq, destino_busq, visita_busq
        ) VALUES (
          @id, @tipo_documento, @documento, @nombre_completo, @empresa, @a_quien_visita,
          @destino, @motivo, @observaciones, @entrada, @salida, @creado_en, @actualizado_en,
          @documento_busq, @nombre_busq, @empresa_busq, @destino_busq, @visita_busq
        )`,
      )
      .run({
        ...visita,
        documento_busq: normalizarParaBusqueda(visita.documento),
        nombre_busq: normalizarParaBusqueda(visita.nombre_completo),
        empresa_busq: normalizarParaBusqueda(visita.empresa ?? ''),
        destino_busq: normalizarParaBusqueda(visita.destino),
        visita_busq: normalizarParaBusqueda(visita.a_quien_visita),
      });
  }

  /** Busca visitas con filtros combinables, con orden y paginación. */
  buscar(filtros: FiltrosVisitas): { visitas: Visita[]; total: number } {
    const { where, parametros } = construirFiltroSql(filtros);
    const orden = filtros.orden ?? 'entrada';
    const direccion = filtros.direccion ?? 'DESC';
    const columnasOrdenables = ['entrada', 'salida', 'nombre_completo', 'documento', 'empresa', 'destino'];
    const columnaOrden = columnasOrdenables.includes(orden) ? orden : 'entrada';

    const total = (
      this.db.prepare(`SELECT COUNT(*) AS n FROM visitas ${where}`).get(...parametros) as { n: number }
    ).n;

    const limite = filtros.limite ?? 100;
    const offset = filtros.offset ?? 0;
    const visitas = this.db
      .prepare(
        `SELECT ${COLUMNAS} FROM visitas ${where} ORDER BY ${columnaOrden} ${direccion}, id ${direccion} LIMIT ? OFFSET ?`,
      )
      .all(...parametros, limite, offset) as Visita[];

    return { visitas, total };
  }

  /** Verifica si ya existe una visita con el mismo documento y la misma hora exacta de entrada. */
  existeDuplicado(documento: string, entrada: string): boolean {
    const normalizado = normalizarDocumento(documento);
    const fila = this.db
      .prepare('SELECT 1 FROM visitas WHERE documento = ? AND entrada = ? LIMIT 1')
      .get(normalizado, entrada);
    return fila !== undefined;
  }

  /**
   * Importa varias visitas en una sola transacción: o entran todas, o ninguna.
   * Para las filas marcadas como duplicadas, aplica la acción elegida (omitir o reemplazar
   * la visita existente con el mismo documento y entrada exacta).
   */
  importarLote(
    filas: Array<{ datos: DatosNuevaVisita; esDuplicado: boolean }>,
    accionDuplicados: 'omitir' | 'reemplazar',
  ): { insertadas: number; omitidas: number } {
    const transaccion = this.db.transaction(() => {
      let insertadas = 0;
      let omitidas = 0;
      for (const fila of filas) {
        if (fila.esDuplicado) {
          if (accionDuplicados === 'omitir') {
            omitidas++;
            continue;
          }
          const documento = normalizarDocumento(fila.datos.documento);
          this.db
            .prepare('DELETE FROM visitas WHERE documento = ? AND entrada = ?')
            .run(documento, fila.datos.entrada);
        }
        this.crear(fila.datos);
        insertadas++;
      }
      return { insertadas, omitidas };
    });
    return transaccion();
  }
}
