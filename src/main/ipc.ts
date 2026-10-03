import { ipcMain } from 'electron';
import type { VisitasRepo } from '../core/db/visitasRepo.js';
import type { AlmacenAjustes } from './ajustes.js';
import type { Registro } from './log.js';

type Dependencias = {
  repo: VisitasRepo;
  ajustes: AlmacenAjustes;
  registro: Registro;
};

/**
 * Registra los manejadores IPC usados por el preload. Esta es la única superficie
 * que el renderer puede invocar: no hay nodeIntegration ni acceso directo a Node.
 *
 * En esta etapa (a) solo se exponen las operaciones básicas para verificar que
 * el renderer puede leer/escribir la base de datos. Las demás pantallas (historial,
 * exportar/importar, respaldos) añaden sus propios canales en etapas posteriores.
 */
export function registrarIpc({ repo, ajustes, registro }: Dependencias): void {
  ipcMain.handle('visitas:dentroAhora', () => {
    try {
      return repo.dentroAhora();
    } catch (error) {
      registro.error('Error en visitas:dentroAhora', error);
      throw error;
    }
  });

  ipcMain.handle('visitas:crear', (_evento, datos) => {
    try {
      return repo.crear(datos);
    } catch (error) {
      registro.error('Error en visitas:crear', error);
      throw error;
    }
  });

  ipcMain.handle('ajustes:leer', () => ajustes.leer());
}
