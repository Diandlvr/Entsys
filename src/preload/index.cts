import { contextBridge, ipcRenderer } from 'electron';

/**
 * API mínima expuesta al renderer. contextIsolation está activado y nodeIntegration
 * desactivado, así que esta es la única puerta de entrada a funciones del proceso
 * principal. Se amplía en etapas posteriores (historial, CSV, respaldos).
 */
const api = {
  visitas: {
    dentroAhora: () => ipcRenderer.invoke('visitas:dentroAhora'),
    crear: (datos: unknown) => ipcRenderer.invoke('visitas:crear', datos),
  },
  ajustes: {
    leer: () => ipcRenderer.invoke('ajustes:leer'),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
