import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import type { VisitasRepo, DatosNuevaVisita, DatosEditarVisita } from '../core/db/visitasRepo.js';
import type { FiltrosVisitas } from '../core/db/filtros.js';
import { construirCsv, construirCsvGenerico, construirPlantillaCsv } from '../core/csv/exportar.js';
import { construirHtmlReporte } from '../core/reporte/plantillaHtml.js';
import { formatearFechaHora, ahoraIsoPanama } from '../core/fechas.js';
import type { AlmacenAjustes } from './ajustes.js';
import type { Registro } from './log.js';
import { generarPdfDesdeHtml } from './pdf.js';

type Dependencias = {
  repo: VisitasRepo;
  ajustes: AlmacenAjustes;
  registro: Registro;
};

const BOM_UTF8 = '﻿';

/** Arma un texto legible con los filtros aplicados, para el encabezado del reporte PDF. */
function resumenFiltros(filtros: FiltrosVisitas): string {
  const partes: string[] = [];
  if (filtros.desde || filtros.hasta) {
    partes.push(`Fecha: ${filtros.desde ? formatearFechaHora(filtros.desde) : '…'} a ${filtros.hasta ? formatearFechaHora(filtros.hasta) : '…'}`);
  }
  if (filtros.documento) partes.push(`Documento: ${filtros.documento}`);
  if (filtros.nombre) partes.push(`Nombre: ${filtros.nombre}`);
  if (filtros.empresa) partes.push(`Empresa: ${filtros.empresa}`);
  if (filtros.destino) partes.push(`Destino: ${filtros.destino}`);
  if (filtros.aQuienVisita) partes.push(`Visita a: ${filtros.aQuienVisita}`);
  if (filtros.estado && filtros.estado !== 'todos') partes.push(`Estado: ${filtros.estado === 'dentro' ? 'Dentro' : 'Salió'}`);
  return partes.length > 0 ? `Filtros: ${partes.join(' · ')}` : 'Sin filtros aplicados';
}

/**
 * Envuelve un manejador IPC para registrar cualquier error en el log sin romper el renderer.
 * Funciona tanto con handlers síncronos como con handlers que devuelven una promesa
 * (el `catch` de la promesa también se registra; un try/catch síncrono no lo vería).
 */
function manejador<T extends unknown[], R>(
  registro: Registro,
  nombreCanal: string,
  fn: (...args: T) => R,
) {
  return (_evento: unknown, ...args: T) => {
    try {
      const resultado = fn(...args);
      if (resultado instanceof Promise) {
        return resultado.catch((error: unknown) => {
          registro.error(`Error en ${nombreCanal}`, error);
          throw error;
        });
      }
      return resultado;
    } catch (error) {
      registro.error(`Error en ${nombreCanal}`, error);
      throw error;
    }
  };
}

/**
 * Registra los manejadores IPC usados por el preload. Esta es la única superficie
 * que el renderer puede invocar: no hay nodeIntegration ni acceso directo a Node.
 *
 * Etapa (b): registro de entrada/salida y el panel "Dentro ahora".
 * El historial, exportar/importar y respaldos añaden sus propios canales después.
 */
export function registrarIpc({ repo, ajustes, registro }: Dependencias): void {
  ipcMain.handle(
    'visitas:dentroAhora',
    manejador(registro, 'visitas:dentroAhora', () => repo.dentroAhora()),
  );

  ipcMain.handle(
    'visitas:crear',
    manejador(registro, 'visitas:crear', (datos: DatosNuevaVisita) => repo.crear(datos)),
  );

  ipcMain.handle(
    'visitas:marcarSalida',
    manejador(registro, 'visitas:marcarSalida', (id: number, horaSalida?: string) =>
      repo.marcarSalida(id, horaSalida),
    ),
  );

  ipcMain.handle(
    'visitas:deshacerSalida',
    manejador(registro, 'visitas:deshacerSalida', (id: number) => repo.deshacerSalida(id)),
  );

  ipcMain.handle(
    'visitas:marcarSalidaEnLote',
    manejador(registro, 'visitas:marcarSalidaEnLote', (ids: number[], horaSalida?: string) =>
      repo.marcarSalidaEnLote(ids, horaSalida),
    ),
  );

  ipcMain.handle(
    'visitas:ultimaVisitaPorDocumento',
    manejador(registro, 'visitas:ultimaVisitaPorDocumento', (documento: string) =>
      repo.ultimaVisitaPorDocumento(documento),
    ),
  );

  ipcMain.handle(
    'visitas:sugerencias',
    manejador(
      registro,
      'visitas:sugerencias',
      (campo: 'destino' | 'a_quien_visita', textoParcial: string) =>
        repo.sugerencias(campo, textoParcial),
    ),
  );

  ipcMain.handle(
    'visitas:dentroAhoraDeDiasAnteriores',
    manejador(registro, 'visitas:dentroAhoraDeDiasAnteriores', () =>
      repo.dentroAhoraDeDiasAnteriores(),
    ),
  );

  ipcMain.handle(
    'visitas:eliminar',
    manejador(registro, 'visitas:eliminar', (id: number) => repo.eliminar(id)),
  );

  ipcMain.handle(
    'visitas:restaurarEliminada',
    manejador(registro, 'visitas:restaurarEliminada', (visita: Parameters<VisitasRepo['restaurarEliminada']>[0]) =>
      repo.restaurarEliminada(visita),
    ),
  );

  ipcMain.handle(
    'visitas:buscar',
    manejador(registro, 'visitas:buscar', (filtros: FiltrosVisitas) => repo.buscar(filtros)),
  );

  ipcMain.handle(
    'visitas:editar',
    manejador(registro, 'visitas:editar', (id: number, datos: DatosEditarVisita) =>
      repo.editar(id, datos),
    ),
  );

  ipcMain.handle(
    'visitas:existeDuplicado',
    manejador(registro, 'visitas:existeDuplicado', (documento: string, entrada: string) =>
      repo.existeDuplicado(documento, entrada),
    ),
  );

  ipcMain.handle(
    'visitas:importarLote',
    manejador(
      registro,
      'visitas:importarLote',
      (
        filas: Array<{ datos: DatosNuevaVisita; esDuplicado: boolean }>,
        accionDuplicados: 'omitir' | 'reemplazar',
      ) => repo.importarLote(filas, accionDuplicados),
    ),
  );

  ipcMain.handle(
    'exportar:csv',
    manejador(registro, 'exportar:csv', async (filtrosSinPaginar: FiltrosVisitas) => {
      const { visitas } = repo.buscar({ ...filtrosSinPaginar, limite: 1_000_000, offset: 0 });
      const separador = ajustes.leer().separadorCsv;
      const csv = construirCsv(visitas, separador);
      const sugerido = `visitas_${new Date().toISOString().slice(0, 10)}.csv`;
      const resultado = await dialog.showSaveDialog({
        title: 'Exportar historial a CSV',
        defaultPath: sugerido,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      });
      if (resultado.canceled || !resultado.filePath) return { guardado: false as const };
      await fs.writeFile(resultado.filePath, BOM_UTF8 + csv, 'utf-8');
      return { guardado: true as const, ruta: resultado.filePath, cantidad: visitas.length };
    }),
  );

  ipcMain.handle(
    'exportar:pdf',
    manejador(registro, 'exportar:pdf', async (filtrosSinPaginar: FiltrosVisitas) => {
      const { visitas } = repo.buscar({ ...filtrosSinPaginar, limite: 1_000_000, offset: 0 });
      const html = construirHtmlReporte({
        nombreEdificio: ajustes.leer().nombreEdificio,
        visitas,
        resumenFiltros: resumenFiltros(filtrosSinPaginar),
        generadoEn: formatearFechaHora(ahoraIsoPanama()),
      });
      const buffer = await generarPdfDesdeHtml(html);
      const sugerido = `visitas_${new Date().toISOString().slice(0, 10)}.pdf`;
      const resultado = await dialog.showSaveDialog({
        title: 'Exportar historial a PDF',
        defaultPath: sugerido,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (resultado.canceled || !resultado.filePath) return { guardado: false as const };
      await fs.writeFile(resultado.filePath, buffer);
      return { guardado: true as const, ruta: resultado.filePath, cantidad: visitas.length };
    }),
  );

  ipcMain.handle(
    'exportar:plantillaCsv',
    manejador(registro, 'exportar:plantillaCsv', async () => {
      const separador = ajustes.leer().separadorCsv;
      const csv = construirPlantillaCsv(separador);
      const resultado = await dialog.showSaveDialog({
        title: 'Guardar plantilla de ejemplo',
        defaultPath: 'plantilla_visitas.csv',
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      });
      if (resultado.canceled || !resultado.filePath) return { guardado: false as const };
      await fs.writeFile(resultado.filePath, BOM_UTF8 + csv, 'utf-8');
      return { guardado: true as const, ruta: resultado.filePath };
    }),
  );

  ipcMain.handle(
    'exportar:filasConError',
    manejador(
      registro,
      'exportar:filasConError',
      async (filas: Array<Record<string, string>>, columnas: string[]) => {
        const separador = ajustes.leer().separadorCsv;
        const csv = construirCsvGenerico(filas, columnas, separador);
        const resultado = await dialog.showSaveDialog({
          title: 'Guardar filas con error',
          defaultPath: 'errores_importacion.csv',
          filters: [{ name: 'CSV', extensions: ['csv'] }],
        });
        if (resultado.canceled || !resultado.filePath) return { guardado: false as const };
        await fs.writeFile(resultado.filePath, BOM_UTF8 + csv, 'utf-8');
        return { guardado: true as const, ruta: resultado.filePath };
      },
    ),
  );

  ipcMain.handle('ajustes:leer', manejador(registro, 'ajustes:leer', () => ajustes.leer()));
}
