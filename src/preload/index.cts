import { contextBridge, ipcRenderer } from 'electron';

/**
 * API mínima expuesta al renderer. contextIsolation está activado y nodeIntegration
 * desactivado, así que esta es la única puerta de entrada a funciones del proceso
 * principal. Se amplía en etapas posteriores (historial, CSV, respaldos).
 */
const api = {
  visitas: {
    dentroAhora: () => ipcRenderer.invoke('visitas:dentroAhora'),
    dentroAhoraDeDiasAnteriores: () => ipcRenderer.invoke('visitas:dentroAhoraDeDiasAnteriores'),
    crear: (datos: unknown) => ipcRenderer.invoke('visitas:crear', datos),
    marcarSalida: (id: number, horaSalida?: string) =>
      ipcRenderer.invoke('visitas:marcarSalida', id, horaSalida),
    deshacerSalida: (id: number) => ipcRenderer.invoke('visitas:deshacerSalida', id),
    marcarSalidaEnLote: (ids: number[], horaSalida?: string) =>
      ipcRenderer.invoke('visitas:marcarSalidaEnLote', ids, horaSalida),
    ultimaVisitaPorDocumento: (documento: string) =>
      ipcRenderer.invoke('visitas:ultimaVisitaPorDocumento', documento),
    sugerencias: (campo: 'destino' | 'a_quien_visita', textoParcial: string) =>
      ipcRenderer.invoke('visitas:sugerencias', campo, textoParcial),
    eliminar: (id: number) => ipcRenderer.invoke('visitas:eliminar', id),
    restaurarEliminada: (visita: unknown) => ipcRenderer.invoke('visitas:restaurarEliminada', visita),
  },
  ajustes: {
    leer: () => ipcRenderer.invoke('ajustes:leer'),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
