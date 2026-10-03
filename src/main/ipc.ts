import { ipcMain } from 'electron';
import type { VisitasRepo, DatosNuevaVisita } from '../core/db/visitasRepo.js';
import type { AlmacenAjustes } from './ajustes.js';
import type { Registro } from './log.js';

type Dependencias = {
  repo: VisitasRepo;
  ajustes: AlmacenAjustes;
  registro: Registro;
};

/** Envuelve un manejador IPC para registrar cualquier error en el log sin romper el renderer. */
function manejador<T extends unknown[], R>(
  registro: Registro,
  nombreCanal: string,
  fn: (...args: T) => R,
) {
  return (_evento: unknown, ...args: T) => {
    try {
      return fn(...args);
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

  ipcMain.handle('ajustes:leer', manejador(registro, 'ajustes:leer', () => ajustes.leer()));
}
