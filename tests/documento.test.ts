import { describe, it, expect } from 'vitest';
import { normalizarDocumento, pareceCedulaPanamena, advertenciaFormatoDocumento } from '../src/core/documento.js';

describe('normalizarDocumento', () => {
  it('convierte a mayúsculas y quita espacios', () => {
    expect(normalizarDocumento(' 8-123-456 ')).toBe('8-123-456');
    expect(normalizarDocumento('pe-1 -234')).toBe('PE-1-234');
  });
});

describe('pareceCedulaPanamena', () => {
  it('acepta formatos numéricos y con prefijo de letras', () => {
    expect(pareceCedulaPanamena('8-123-456')).toBe(true);
    expect(pareceCedulaPanamena('PE-1-234')).toBe(true);
    expect(pareceCedulaPanamena('E-8-12345')).toBe(true);
    expect(pareceCedulaPanamena('N-12-345')).toBe(true);
    expect(pareceCedulaPanamena('4-AV-123-456')).toBe(true);
  });

  it('rechaza formatos que no se parecen a una cédula', () => {
    expect(pareceCedulaPanamena('ABC123')).toBe(false);
    expect(pareceCedulaPanamena('123456789')).toBe(false);
  });
});

describe('advertenciaFormatoDocumento', () => {
  it('no advierte si el tipo no es cédula', () => {
    expect(advertenciaFormatoDocumento('PASAPORTE', 'ABC123')).toBeNull();
  });

  it('no advierte si el formato de cédula es válido', () => {
    expect(advertenciaFormatoDocumento('CEDULA', '8-123-456')).toBeNull();
  });

  it('advierte (sin bloquear) si el formato no se parece a una cédula', () => {
    expect(advertenciaFormatoDocumento('CEDULA', 'XYZ999')).not.toBeNull();
  });
});
