import fs from 'node:fs/promises';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { archivosARotar, esArchivoDeRespaldo, nombreArchivoRespaldo } from '../core/respaldos.js';
import { ahoraIsoPanama } from '../core/fechas.js';
import type { AlmacenAjustes } from './ajustes.js';
import type { Registro } from './log.js';

export type EstadoRespaldo = {
  ok: boolean;
  fecha: string; // ISO Panamá
  ruta?: string;
  usoCarpetaLocal?: boolean;
  error?: string;
};

/**
 * Administra los respaldos: prueba de escritura de la carpeta configurada (pensada para
 * un NAS mapeado), respaldo con la API nativa de SQLite, rotación y respaldo automático.
 * Si la carpeta configurada no está disponible, usa una carpeta local de emergencia y
 * reintenta más tarde, sin bloquear el trabajo de recepción.
 */
export class GestorRespaldos {
  private temporizador: NodeJS.Timeout | null = null;
  private cerrado = false;

  constructor(
    private readonly obtenerDb: () => Database.Database,
    private readonly ajustes: AlmacenAjustes,
    private readonly registro: Registro,
    private readonly carpetaDatos: string,
  ) {}

  private get carpetaRespaldoLocal(): string {
    return path.join(this.carpetaDatos, 'respaldos-locales');
  }

  private get rutaEstado(): string {
    return path.join(this.carpetaDatos, 'estado-respaldo.json');
  }

  async probarCarpeta(ruta: string): Promise<{ accesible: boolean; error?: string }> {
    try {
      await fs.mkdir(ruta, { recursive: true });
      const archivoPrueba = path.join(ruta, '.prueba-escritura.tmp');
      await fs.writeFile(archivoPrueba, 'prueba');
      await fs.unlink(archivoPrueba);
      return { accesible: true };
    } catch (error) {
      return { accesible: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async leerEstado(): Promise<EstadoRespaldo | null> {
    try {
      const texto = await fs.readFile(this.rutaEstado, 'utf-8');
      return JSON.parse(texto) as EstadoRespaldo;
    } catch {
      return null;
    }
  }

  private async guardarEstado(estado: EstadoRespaldo): Promise<void> {
    await fs.writeFile(this.rutaEstado, JSON.stringify(estado, null, 2), 'utf-8');
  }

  /** Ejecuta un respaldo ahora mismo. Usa la carpeta configurada o, si falla, una local. */
  async respaldarAhora(): Promise<EstadoRespaldo> {
    const ajustesActuales = this.ajustes.leer();
    const nombre = nombreArchivoRespaldo();
    let carpetaDestino = ajustesActuales.carpetaRespaldo;
    let usoCarpetaLocal = false;

    if (carpetaDestino) {
      const prueba = await this.probarCarpeta(carpetaDestino);
      if (!prueba.accesible) {
        this.registro.advertencia('Carpeta de respaldo no accesible; se usará una carpeta local temporal', {
          carpeta: carpetaDestino,
          error: prueba.error,
        });
        carpetaDestino = null;
      }
    }

    if (!carpetaDestino) {
      carpetaDestino = this.carpetaRespaldoLocal;
      usoCarpetaLocal = true;
      await fs.mkdir(carpetaDestino, { recursive: true });
    }

    const rutaDestino = path.join(carpetaDestino, nombre);

    try {
      await this.obtenerDb().backup(rutaDestino);
      await this.rotar(carpetaDestino, ajustesActuales.cantidadRespaldosAConservar);
      const estado: EstadoRespaldo = { ok: true, fecha: ahoraIsoPanama(), ruta: rutaDestino, usoCarpetaLocal };
      await this.guardarEstado(estado);
      this.registro.info('Respaldo completado', estado);
      return estado;
    } catch (error) {
      const estado: EstadoRespaldo = {
        ok: false,
        fecha: ahoraIsoPanama(),
        error: error instanceof Error ? error.message : String(error),
      };
      await this.guardarEstado(estado);
      this.registro.error('Falló el respaldo', error);
      return estado;
    }
  }

  private async rotar(carpeta: string, conservar: number): Promise<void> {
    try {
      const archivos = await fs.readdir(carpeta);
      const aEliminar = archivosARotar(archivos, conservar);
      for (const archivo of aEliminar) {
        await fs.unlink(path.join(carpeta, archivo)).catch(() => {});
      }
    } catch (error) {
      this.registro.advertencia('No se pudo rotar los respaldos antiguos', error);
    }
  }

  /** Lista los respaldos disponibles (carpeta configurada + carpeta local), más reciente primero. */
  async listarRespaldos(): Promise<Array<{ ruta: string; nombre: string }>> {
    const carpetas = [this.ajustes.leer().carpetaRespaldo, this.carpetaRespaldoLocal].filter(
      (c): c is string => Boolean(c),
    );
    const resultado: Array<{ ruta: string; nombre: string }> = [];
    for (const carpeta of carpetas) {
      try {
        const archivos = await fs.readdir(carpeta);
        for (const archivo of archivos.filter(esArchivoDeRespaldo)) {
          resultado.push({ ruta: path.join(carpeta, archivo), nombre: archivo });
        }
      } catch {
        // Carpeta no accesible: se omite, no es un error fatal.
      }
    }
    return resultado.sort((a, b) => b.nombre.localeCompare(a.nombre));
  }

  /** Inicia el respaldo automático. Se reprograma solo, así que respeta cambios de frecuencia. */
  iniciarRespaldoAutomatico(): void {
    const programarSiguiente = () => {
      if (this.cerrado) return;
      const minutos = Math.max(1, this.ajustes.leer().frecuenciaRespaldoMinutos);
      this.temporizador = setTimeout(async () => {
        await this.respaldarAhora();
        programarSiguiente();
      }, minutos * 60_000);
    };
    programarSiguiente();
  }

  detener(): void {
    this.cerrado = true;
    if (this.temporizador) clearTimeout(this.temporizador);
  }

  /**
   * Restaura la base de datos desde un archivo de respaldo. Antes crea un respaldo de
   * seguridad del estado actual. Cierra la conexión y reemplaza el archivo; quien llama
   * debe reiniciar la app después (una conexión SQLite no se puede "reabrir" de forma segura
   * tras reemplazar el archivo bajo ella).
   */
  async restaurar(rutaRespaldo: string, rutaBaseDeDatos: string): Promise<void> {
    await this.respaldarAhora();
    const db = this.obtenerDb();
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.close();
    await fs.copyFile(rutaRespaldo, rutaBaseDeDatos);
    for (const sufijo of ['-wal', '-shm']) {
      await fs.unlink(rutaBaseDeDatos + sufijo).catch(() => {});
    }
  }
}
