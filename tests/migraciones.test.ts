import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { abrirBaseDeDatos } from '../src/core/db/conexion.js';
import { versionEsquemaObjetivo } from '../src/core/db/migraciones.js';
import type Database from 'better-sqlite3';

describe('migraciones', () => {
  let rutaTemp: string;
  let db: Database.Database;

  beforeEach(() => {
    rutaTemp = path.join(os.tmpdir(), `visitas-test-${Date.now()}-${Math.random()}.db`);
  });

  afterEach(() => {
    db?.close();
    for (const sufijo of ['', '-wal', '-shm']) {
      try {
        fs.unlinkSync(rutaTemp + sufijo);
      } catch {
        /* ignorar */
      }
    }
  });

  it('crea la tabla visitas y deja user_version en la última versión', () => {
    db = abrirBaseDeDatos(rutaTemp);
    const version = db.pragma('user_version', { simple: true });
    expect(version).toBe(versionEsquemaObjetivo());

    const columnas = db.prepare("PRAGMA table_info(visitas)").all() as Array<{ name: string }>;
    const nombres = columnas.map((c) => c.name);
    expect(nombres).toContain('documento');
    expect(nombres).toContain('entrada');
    expect(nombres).toContain('salida');
  });

  it('es idempotente: abrir dos veces no falla ni duplica el esquema', () => {
    db = abrirBaseDeDatos(rutaTemp);
    db.close();
    db = abrirBaseDeDatos(rutaTemp);
    const version = db.pragma('user_version', { simple: true });
    expect(version).toBe(versionEsquemaObjetivo());
  });
});
