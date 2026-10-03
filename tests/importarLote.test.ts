import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { abrirBaseDeDatos } from '../src/core/db/conexion.js';
import { VisitasRepo } from '../src/core/db/visitasRepo.js';
import type Database from 'better-sqlite3';

describe('VisitasRepo.importarLote', () => {
  let rutaTemp: string;
  let db: Database.Database;
  let repo: VisitasRepo;

  beforeEach(() => {
    rutaTemp = path.join(os.tmpdir(), `visitas-importar-${Date.now()}-${Math.random()}.db`);
    db = abrirBaseDeDatos(rutaTemp);
    repo = new VisitasRepo(db);
  });

  afterEach(() => {
    db.close();
    for (const sufijo of ['', '-wal', '-shm']) {
      try {
        fs.unlinkSync(rutaTemp + sufijo);
      } catch {
        /* ignorar */
      }
    }
  });

  it('inserta todas las filas válidas en una sola transacción', () => {
    const resultado = repo.importarLote(
      [
        { datos: { tipo_documento: 'OTRO', documento: 'A1', nombre_completo: 'Uno', a_quien_visita: 'X', destino: 'P1', motivo: 'M', entrada: '2026-10-01T09:00:00-05:00' }, esDuplicado: false },
        { datos: { tipo_documento: 'OTRO', documento: 'A2', nombre_completo: 'Dos', a_quien_visita: 'X', destino: 'P1', motivo: 'M', entrada: '2026-10-01T10:00:00-05:00' }, esDuplicado: false },
      ],
      'omitir',
    );
    expect(resultado.insertadas).toBe(2);
    expect(repo.buscar({}).total).toBe(2);
  });

  it('omite las filas duplicadas cuando la acción es "omitir"', () => {
    repo.crear({ tipo_documento: 'OTRO', documento: 'A1', nombre_completo: 'Original', a_quien_visita: 'X', destino: 'P1', motivo: 'M', entrada: '2026-10-01T09:00:00-05:00' });

    const resultado = repo.importarLote(
      [{ datos: { tipo_documento: 'OTRO', documento: 'A1', nombre_completo: 'Nuevo', a_quien_visita: 'X', destino: 'P1', motivo: 'M', entrada: '2026-10-01T09:00:00-05:00' }, esDuplicado: true }],
      'omitir',
    );
    expect(resultado.insertadas).toBe(0);
    expect(resultado.omitidas).toBe(1);
    expect(repo.ultimaVisitaPorDocumento('A1')?.nombre_completo).toBe('Original');
  });

  it('reemplaza la visita existente cuando la acción es "reemplazar"', () => {
    repo.crear({ tipo_documento: 'OTRO', documento: 'A1', nombre_completo: 'Original', a_quien_visita: 'X', destino: 'P1', motivo: 'M', entrada: '2026-10-01T09:00:00-05:00' });

    const resultado = repo.importarLote(
      [{ datos: { tipo_documento: 'OTRO', documento: 'A1', nombre_completo: 'Reemplazo', a_quien_visita: 'X', destino: 'P1', motivo: 'M', entrada: '2026-10-01T09:00:00-05:00' }, esDuplicado: true }],
      'reemplazar',
    );
    expect(resultado.insertadas).toBe(1);
    expect(repo.buscar({}).total).toBe(1);
    expect(repo.ultimaVisitaPorDocumento('A1')?.nombre_completo).toBe('Reemplazo');
  });

  it('no inserta nada si una fila del lote falla (todo o nada)', () => {
    expect(() =>
      repo.importarLote(
        [
          { datos: { tipo_documento: 'OTRO', documento: 'A1', nombre_completo: 'Uno', a_quien_visita: 'X', destino: 'P1', motivo: 'M', entrada: '2026-10-01T09:00:00-05:00' }, esDuplicado: false },
          // tipo_documento inválido: viola el CHECK de la tabla y hace fallar la transacción completa.
          { datos: { tipo_documento: 'INVALIDO' as any, documento: 'A2', nombre_completo: 'Dos', a_quien_visita: 'X', destino: 'P1', motivo: 'M', entrada: '2026-10-01T10:00:00-05:00' }, esDuplicado: false },
        ],
        'omitir',
      ),
    ).toThrow();
    expect(repo.buscar({}).total).toBe(0);
  });
});
