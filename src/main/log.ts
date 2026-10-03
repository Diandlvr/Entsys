import fs from 'node:fs';
import path from 'node:path';

/**
 * Registro de errores en un archivo local, con rotación simple por tamaño.
 * No usa Electron directamente (solo recibe la carpeta), para que sea fácil de probar.
 */
const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024; // 2 MB

export class Registro {
  private readonly rutaArchivo: string;

  constructor(carpetaDatos: string) {
    const carpetaLogs = path.join(carpetaDatos, 'logs');
    fs.mkdirSync(carpetaLogs, { recursive: true });
    this.rutaArchivo = path.join(carpetaLogs, 'app.log');
  }

  private escribir(nivel: 'INFO' | 'ADVERTENCIA' | 'ERROR', mensaje: string, detalle?: unknown): void {
    this.rotarSiEsNecesario();
    const fecha = new Date().toISOString();
    const detalleTexto = detalle ? ` | ${this.serializar(detalle)}` : '';
    const linea = `[${fecha}] [${nivel}] ${mensaje}${detalleTexto}\n`;
    try {
      fs.appendFileSync(this.rutaArchivo, linea, 'utf-8');
    } catch {
      // Si no se puede escribir el log, no debe romper la app.
    }
  }

  private serializar(detalle: unknown): string {
    if (detalle instanceof Error) return `${detalle.message}\n${detalle.stack ?? ''}`;
    try {
      return JSON.stringify(detalle);
    } catch {
      return String(detalle);
    }
  }

  private rotarSiEsNecesario(): void {
    try {
      const stats = fs.statSync(this.rutaArchivo);
      if (stats.size > TAMANO_MAXIMO_BYTES) {
        const rutaAnterior = this.rutaArchivo.replace(/\.log$/, '.anterior.log');
        fs.rmSync(rutaAnterior, { force: true });
        fs.renameSync(this.rutaArchivo, rutaAnterior);
      }
    } catch {
      // Si el archivo no existe todavía, no hay nada que rotar.
    }
  }

  info(mensaje: string, detalle?: unknown): void {
    this.escribir('INFO', mensaje, detalle);
  }

  advertencia(mensaje: string, detalle?: unknown): void {
    this.escribir('ADVERTENCIA', mensaje, detalle);
  }

  error(mensaje: string, detalle?: unknown): void {
    this.escribir('ERROR', mensaje, detalle);
  }
}
