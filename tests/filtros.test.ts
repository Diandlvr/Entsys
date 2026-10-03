import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { abrirBaseDeDatos } from '../src/core/db/conexion.js';
import { VisitasRepo } from '../src/core/db/visitasRepo.js';
import type Database from 'better-sqlite3';

describe('filtros combinados en VisitasRepo.buscar', () => {
  let rutaTemp: string;
  let db: Database.Database;
  let repo: VisitasRepo;

  beforeEach(() => {
    rutaTemp = path.join(os.tmpdir(), `visitas-filtros-${Date.now()}-${Math.random()}.db`);
    db = abrirBaseDeDatos(rutaTemp);
    repo = new VisitasRepo(db);

    repo.crear({
      tipo_documento: 'CEDULA',
      documento: '8-123-456',
      nombre_completo: 'Ana Pérez',
      empresa: 'Acme Corp',
      a_quien_visita: 'Juan Gómez',
      destino: 'Piso 3',
      motivo: 'Reunión',
      entrada: '2026-10-01T09:00:00-05:00',
    });
    const v2 = repo.crear({
      tipo_documento: 'CEDULA',
      documento: '8-999-999',
      nombre_completo: 'Carlos Ruiz',
      empresa: 'Beta SA',
      a_quien_visita: 'María López',
      destino: 'Piso 5',
      motivo: 'Entrega',
      entrada: '2026-10-02T10:00:00-05:00',
    });
    repo.marcarSalida(v2.id, '2026-10-02T11:00:00-05:00');
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

  it('filtra por estado "dentro"', () => {
    const { visitas, total } = repo.buscar({ estado: 'dentro' });
    expect(total).toBe(1);
    expect(visitas[0].nombre_completo).toBe('Ana Pérez');
  });

  it('filtra por estado "salio"', () => {
    const { visitas, total } = repo.buscar({ estado: 'salio' });
    expect(total).toBe(1);
    expect(visitas[0].nombre_completo).toBe('Carlos Ruiz');
  });

  it('combina rango de fechas con búsqueda parcial de nombre sin distinguir tildes', () => {
    const { visitas, total } = repo.buscar({
      desde: '2026-10-01T00:00:00-05:00',
      hasta: '2026-10-01T23:59:59-05:00',
      nombre: 'perez', // sin tilde, debe encontrar "Pérez"
    });
    expect(total).toBe(1);
    expect(visitas[0].documento).toBe('8-123-456');
  });

  it('combina empresa + destino + estado a la vez', () => {
    const { total } = repo.buscar({
      empresa: 'beta',
      destino: 'piso 5',
      estado: 'salio',
    });
    expect(total).toBe(1);
  });

  it('devuelve 0 resultados cuando los filtros no coinciden con nada', () => {
    const { total } = repo.buscar({ nombre: 'nadie existe' });
    expect(total).toBe(0);
  });

  it('respeta paginación (limite/offset)', () => {
    const pagina1 = repo.buscar({ limite: 1, offset: 0, orden: 'entrada', direccion: 'ASC' });
    const pagina2 = repo.buscar({ limite: 1, offset: 1, orden: 'entrada', direccion: 'ASC' });
    expect(pagina1.visitas[0].documento).toBe('8-123-456');
    expect(pagina2.visitas[0].documento).toBe('8-999-999');
    expect(pagina1.total).toBe(2);
  });
});

describe('entrada y salida', () => {
  let rutaTemp: string;
  let db: Database.Database;
  let repo: VisitasRepo;

  beforeEach(() => {
    rutaTemp = path.join(os.tmpdir(), `visitas-entsal-${Date.now()}-${Math.random()}.db`);
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

  it('crea una visita con documento normalizado', () => {
    const v = repo.crear({
      tipo_documento: 'CEDULA',
      documento: ' 8-123-456 ',
      nombre_completo: 'Ana Pérez',
      a_quien_visita: 'Juan Gómez',
      destino: 'Piso 3',
      motivo: 'Reunión',
    });
    expect(v.documento).toBe('8-123-456');
    expect(v.salida).toBeNull();
  });

  it('marca salida y permite deshacerla', () => {
    const v = repo.crear({
      tipo_documento: 'OTRO',
      documento: 'X1',
      nombre_completo: 'Test',
      a_quien_visita: 'Alguien',
      destino: 'Piso 1',
      motivo: 'Visita',
    });
    const conSalida = repo.marcarSalida(v.id, '2026-10-03T12:00:00-05:00');
    expect(conSalida.salida).toBe('2026-10-03T12:00:00-05:00');

    const deshecha = repo.deshacerSalida(v.id);
    expect(deshecha.salida).toBeNull();
  });

  it('cierra en lote varias visitas abiertas', () => {
    const v1 = repo.crear({
      tipo_documento: 'OTRO', documento: 'A1', nombre_completo: 'Uno',
      a_quien_visita: 'X', destino: 'P1', motivo: 'M',
    });
    const v2 = repo.crear({
      tipo_documento: 'OTRO', documento: 'A2', nombre_completo: 'Dos',
      a_quien_visita: 'X', destino: 'P1', motivo: 'M',
    });
    repo.marcarSalidaEnLote([v1.id, v2.id], '2026-10-03T18:00:00-05:00');
    expect(repo.obtenerPorId(v1.id)!.salida).toBe('2026-10-03T18:00:00-05:00');
    expect(repo.obtenerPorId(v2.id)!.salida).toBe('2026-10-03T18:00:00-05:00');
  });

  it('autocompleta con la última visita del mismo documento', () => {
    repo.crear({
      tipo_documento: 'CEDULA', documento: '8-1-1', nombre_completo: 'Primero',
      empresa: 'Emp A', a_quien_visita: 'X', destino: 'P1', motivo: 'M',
      entrada: '2026-09-01T09:00:00-05:00',
    });
    repo.crear({
      tipo_documento: 'CEDULA', documento: '8-1-1', nombre_completo: 'Primero',
      empresa: 'Emp B', a_quien_visita: 'X', destino: 'P1', motivo: 'M',
      entrada: '2026-10-01T09:00:00-05:00',
    });
    const ultima = repo.ultimaVisitaPorDocumento('8-1-1');
    expect(ultima?.empresa).toBe('Emp B');
  });

  it('detecta duplicado por documento + misma hora exacta de entrada', () => {
    repo.crear({
      tipo_documento: 'OTRO', documento: 'D1', nombre_completo: 'Uno',
      a_quien_visita: 'X', destino: 'P1', motivo: 'M',
      entrada: '2026-10-03T09:00:00-05:00',
    });
    expect(repo.existeDuplicado('D1', '2026-10-03T09:00:00-05:00')).toBe(true);
    expect(repo.existeDuplicado('D1', '2026-10-03T10:00:00-05:00')).toBe(false);
  });
});
