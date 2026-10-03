import { describe, it, expect } from 'vitest';
import { construirCsv, construirCsvGenerico, construirPlantillaCsv } from '../src/core/csv/exportar.js';
import type { Visita } from '../src/core/db/visitasRepo.js';

function visitaDeEjemplo(parcial: Partial<Visita> = {}): Visita {
  return {
    id: 1,
    tipo_documento: 'CEDULA',
    documento: '8-123-456',
    nombre_completo: 'José "Pepe" Núñez',
    empresa: 'Acme, S.A.',
    a_quien_visita: 'María Peña',
    destino: 'Piso 3',
    motivo: 'Reunión',
    observaciones: null,
    entrada: '2026-10-03T09:00:00-05:00',
    salida: null,
    creado_en: '2026-10-03T09:00:00-05:00',
    actualizado_en: '2026-10-03T09:00:00-05:00',
    ...parcial,
  };
}

describe('construirCsv', () => {
  it('conserva tildes y comillas, escapándolas correctamente', () => {
    const csv = construirCsv([visitaDeEjemplo()]);
    expect(csv).toContain('"José ""Pepe"" Núñez"');
    expect(csv).toContain('"Acme, S.A."');
    expect(csv).toContain('María Peña');
  });

  it('usa el separador configurado (punto y coma)', () => {
    const csv = construirCsv([visitaDeEjemplo()], ';');
    const primeraLinea = csv.split('\r\n')[0];
    expect(primeraLinea.split(';').length).toBeGreaterThan(5);
  });

  it('muestra "Dentro" vacío (celda vacía) cuando no hay salida', () => {
    const csv = construirCsv([visitaDeEjemplo()]);
    const lineas = csv.split('\r\n');
    expect(lineas[1].endsWith(',')).toBe(true); // última columna (salida) vacía
  });

  it('formatea fechas en dd/mm/aaaa hora 12h', () => {
    const csv = construirCsv([visitaDeEjemplo()]);
    expect(csv).toContain('03/10/2026');
  });
});

describe('construirCsvGenerico', () => {
  it('arma CSV a partir de filas y columnas arbitrarias', () => {
    const csv = construirCsvGenerico([{ a: '1', b: 'dos' }], ['a', 'b']);
    expect(csv).toBe('a,b\r\n1,dos');
  });
});

describe('construirPlantillaCsv', () => {
  it('incluye todos los encabezados esperados', () => {
    const csv = construirPlantillaCsv();
    const encabezado = csv.split('\r\n')[0];
    for (const columna of ['tipo_documento', 'documento', 'nombre_completo', 'entrada', 'salida']) {
      expect(encabezado).toContain(columna);
    }
  });
});
