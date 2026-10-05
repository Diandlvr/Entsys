import fs from 'node:fs';
import path from 'node:path';

/** Ajustes configurables de la aplicación, guardados como JSON en la carpeta de datos del usuario. */
export type Ajustes = {
  nombreEdificio: string;
  carpetaRespaldo: string | null;
  frecuenciaRespaldoMinutos: number;
  cantidadRespaldosAConservar: number;
  separadorCsv: ',' | ';';
  tema: 'claro' | 'oscuro' | 'automatico';
  tamanoTexto: 'normal' | 'grande' | 'muy-grande';
};

export const AJUSTES_POR_DEFECTO: Ajustes = {
  nombreEdificio: 'P.H. Twist',
  carpetaRespaldo: null,
  frecuenciaRespaldoMinutos: 30,
  cantidadRespaldosAConservar: 30,
  separadorCsv: ',',
  tema: 'claro',
  tamanoTexto: 'normal',
};

export class AlmacenAjustes {
  private readonly rutaArchivo: string;

  constructor(carpetaDatos: string) {
    this.rutaArchivo = path.join(carpetaDatos, 'ajustes.json');
  }

  leer(): Ajustes {
    try {
      const texto = fs.readFileSync(this.rutaArchivo, 'utf-8');
      const guardado = JSON.parse(texto) as Partial<Ajustes>;
      return { ...AJUSTES_POR_DEFECTO, ...guardado };
    } catch {
      return { ...AJUSTES_POR_DEFECTO };
    }
  }

  guardar(ajustes: Ajustes): void {
    fs.writeFileSync(this.rutaArchivo, JSON.stringify(ajustes, null, 2), 'utf-8');
  }

  actualizar(parcial: Partial<Ajustes>): Ajustes {
    const actuales = this.leer();
    const nuevos = { ...actuales, ...parcial };
    this.guardar(nuevos);
    return nuevos;
  }
}
