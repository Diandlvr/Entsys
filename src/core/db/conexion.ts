import DatabaseConstructor from 'better-sqlite3';
import type Database from 'better-sqlite3';
import { migrar } from './migraciones.js';

/**
 * Abre (o crea) la base de datos SQLite en la ruta indicada y aplica migraciones.
 * No depende de Electron: recibe la ruta del archivo como parámetro, así se puede
 * probar con archivos temporales desde Vitest.
 */
export function abrirBaseDeDatos(rutaArchivo: string): Database.Database {
  const db = new DatabaseConstructor(rutaArchivo);
  migrar(db);
  return db;
}

export type { Database };
