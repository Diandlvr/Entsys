import type Database from 'better-sqlite3';

/**
 * Migraciones versionadas usando PRAGMA user_version.
 * Cada migración es idempotente dentro de una transacción: si algo falla,
 * no se aplica ninguna parte de ese paso.
 */

type Migracion = {
  version: number;
  nombre: string;
  ejecutar: (db: Database.Database) => void;
};

const migraciones: Migracion[] = [
  {
    version: 1,
    nombre: 'esquema inicial de visitas',
    ejecutar: (db) => {
      db.exec(`
        CREATE TABLE visitas (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          tipo_documento  TEXT NOT NULL CHECK (tipo_documento IN ('CEDULA','PASAPORTE','OTRO')),
          documento       TEXT NOT NULL,
          nombre_completo TEXT NOT NULL,
          empresa         TEXT,
          a_quien_visita  TEXT NOT NULL,
          destino         TEXT NOT NULL,
          motivo          TEXT NOT NULL,
          observaciones   TEXT,
          entrada         TEXT NOT NULL,
          salida          TEXT,
          creado_en       TEXT NOT NULL,
          actualizado_en  TEXT NOT NULL,
          documento_busq  TEXT NOT NULL DEFAULT '',
          nombre_busq     TEXT NOT NULL DEFAULT '',
          empresa_busq    TEXT NOT NULL DEFAULT '',
          destino_busq    TEXT NOT NULL DEFAULT '',
          visita_busq     TEXT NOT NULL DEFAULT ''
        );
        CREATE INDEX ix_visitas_documento ON visitas(documento);
        CREATE INDEX ix_visitas_entrada ON visitas(entrada);
        CREATE INDEX ix_visitas_salida ON visitas(salida);
        CREATE INDEX ix_visitas_documento_busq ON visitas(documento_busq);
        CREATE INDEX ix_visitas_nombre_busq ON visitas(nombre_busq);
      `);
    },
  },
];

/** Aplica, dentro de una transacción por paso, las migraciones pendientes. */
export function migrar(db: Database.Database): void {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const versionActual = (db.pragma('user_version', { simple: true }) as number) ?? 0;
  const pendientes = migraciones
    .filter((m) => m.version > versionActual)
    .sort((a, b) => a.version - b.version);

  for (const migracion of pendientes) {
    const transaccion = db.transaction(() => {
      migracion.ejecutar(db);
      db.pragma(`user_version = ${migracion.version}`);
    });
    transaccion();
  }
}

export function versionEsquemaObjetivo(): number {
  return migraciones.length > 0 ? migraciones[migraciones.length - 1].version : 0;
}
