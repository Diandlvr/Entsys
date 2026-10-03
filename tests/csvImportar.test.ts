import { describe, it, expect } from 'vitest';
import {
  detectarMapeoColumnas,
  parsearFechaFlexible,
  validarFilasImportacion,
} from '../src/core/csv/importar.js';

describe('detectarMapeoColumnas', () => {
  it('reconoce encabezados en español con variantes de mayúsculas/tildes', () => {
    const mapeo = detectarMapeoColumnas([
      'Tipo de Documento',
      'Documento',
      'Nombre Completo',
      'Empresa',
      'A quién visita',
      'Destino',
      'Motivo',
      'Observaciones',
      'Entrada',
    ]);
    expect(mapeo.tipo_documento).toBe('Tipo de Documento');
    expect(mapeo.documento).toBe('Documento');
    expect(mapeo.nombre_completo).toBe('Nombre Completo');
    expect(mapeo.a_quien_visita).toBe('A quién visita');
    expect(mapeo.entrada).toBe('Entrada');
  });

  it('deja null cuando no encuentra una columna equivalente', () => {
    const mapeo = detectarMapeoColumnas(['documento', 'nombre_completo']);
    expect(mapeo.empresa).toBeNull();
  });
});

describe('parsearFechaFlexible', () => {
  it('acepta fecha en formato dd/mm/aaaa hh:mm a. m./p. m.', () => {
    expect(parsearFechaFlexible('03/10/2026 09:30 a. m.')).toBe('2026-10-03T09:30:00-05:00');
    expect(parsearFechaFlexible('03/10/2026 02:15 p. m.')).toBe('2026-10-03T14:15:00-05:00');
    expect(parsearFechaFlexible('03/10/2026 12:00 a. m.')).toBe('2026-10-03T00:00:00-05:00');
    expect(parsearFechaFlexible('03/10/2026 12:00 p. m.')).toBe('2026-10-03T12:00:00-05:00');
  });

  it('acepta ISO ya formateado', () => {
    expect(parsearFechaFlexible('2026-10-03T09:30:00-05:00')).toBe('2026-10-03T09:30:00-05:00');
  });

  it('devuelve null para texto no interpretable', () => {
    expect(parsearFechaFlexible('no es una fecha')).toBeNull();
  });
});

describe('validarFilasImportacion', () => {
  const mapeo = {
    tipo_documento: 'tipo',
    documento: 'documento',
    nombre_completo: 'nombre',
    empresa: null,
    a_quien_visita: 'visita',
    destino: 'destino',
    motivo: 'motivo',
    observaciones: null,
    entrada: 'entrada',
  };

  it('marca como válida una fila completa y bien formada', () => {
    const [fila] = validarFilasImportacion(
      [{ tipo: 'CEDULA', documento: '8-1-1', nombre: 'Ana', visita: 'Juan', destino: 'P1', motivo: 'M', entrada: '03/10/2026 09:00 a. m.' }],
      mapeo,
    );
    expect(fila.errores).toHaveLength(0);
    expect(fila.datos).not.toBeNull();
    expect(fila.datos?.entrada).toBe('2026-10-03T09:00:00-05:00');
  });

  it('reporta errores por campos faltantes', () => {
    const [fila] = validarFilasImportacion(
      [{ tipo: 'CEDULA', documento: '', nombre: '', visita: '', destino: '', motivo: '', entrada: '' }],
      mapeo,
    );
    expect(fila.datos).toBeNull();
    expect(fila.errores.length).toBeGreaterThan(0);
  });

  it('detecta duplicados dentro del mismo archivo (mismo documento + entrada)', () => {
    const filas = validarFilasImportacion(
      [
        { tipo: 'OTRO', documento: 'X1', nombre: 'A', visita: 'V', destino: 'D', motivo: 'M', entrada: '03/10/2026 09:00 a. m.' },
        { tipo: 'OTRO', documento: 'X1', nombre: 'A', visita: 'V', destino: 'D', motivo: 'M', entrada: '03/10/2026 09:00 a. m.' },
      ],
      mapeo,
    );
    expect(filas[0].duplicadoEnArchivo).toBe(false);
    expect(filas[1].duplicadoEnArchivo).toBe(true);
  });

  it('agrega advertencia (no error) si la cédula no tiene el formato habitual', () => {
    const [fila] = validarFilasImportacion(
      [{ tipo: 'CEDULA', documento: 'XYZ999', nombre: 'A', visita: 'V', destino: 'D', motivo: 'M', entrada: '03/10/2026 09:00 a. m.' }],
      mapeo,
    );
    expect(fila.datos).not.toBeNull();
    expect(fila.advertencias.length).toBeGreaterThan(0);
  });
});
