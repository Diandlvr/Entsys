import { describe, it, expect } from 'vitest';
import { archivosARotar, esArchivoDeRespaldo, nombreArchivoRespaldo } from '../src/core/respaldos.js';

describe('nombreArchivoRespaldo', () => {
  it('genera un nombre ordenable cronológicamente', () => {
    const nombre = nombreArchivoRespaldo(new Date(2026, 9, 3, 14, 5, 9)); // 03/10/2026 14:05:09
    expect(nombre).toBe('respaldo_2026-10-03_14-05-09.db');
  });
});

describe('esArchivoDeRespaldo', () => {
  it('reconoce solo archivos con el prefijo y sufijo esperados', () => {
    expect(esArchivoDeRespaldo('respaldo_2026-10-03_14-05-09.db')).toBe(true);
    expect(esArchivoDeRespaldo('otra-cosa.db')).toBe(false);
    expect(esArchivoDeRespaldo('respaldo_2026.txt')).toBe(false);
  });
});

describe('archivosARotar', () => {
  it('conserva los N más recientes y marca el resto para borrar', () => {
    const archivos = [
      'respaldo_2026-10-01_09-00-00.db',
      'respaldo_2026-10-02_09-00-00.db',
      'respaldo_2026-10-03_09-00-00.db',
    ];
    expect(archivosARotar(archivos, 2)).toEqual(['respaldo_2026-10-01_09-00-00.db']);
  });

  it('no borra nada si hay menos archivos que el límite', () => {
    const archivos = ['respaldo_2026-10-03_09-00-00.db'];
    expect(archivosARotar(archivos, 30)).toEqual([]);
  });

  it('ignora archivos que no son respaldos', () => {
    const archivos = ['respaldo_2026-10-01_09-00-00.db', 'notas.txt'];
    expect(archivosARotar(archivos, 0)).toEqual(['respaldo_2026-10-01_09-00-00.db']);
  });
});
