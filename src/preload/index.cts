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
    buscar: (filtros: unknown) => ipcRenderer.invoke('visitas:buscar', filtros),
    editar: (id: number, datos: unknown) => ipcRenderer.invoke('visitas:editar', id, datos),
    existeDuplicado: (documento: string, entrada: string) =>
      ipcRenderer.invoke('visitas:existeDuplicado', documento, entrada),
    importarLote: (
      filas: Array<{ datos: unknown; esDuplicado: boolean }>,
      accionDuplicados: 'omitir' | 'reemplazar',
    ) => ipcRenderer.invoke('visitas:importarLote', filas, accionDuplicados),
  },
  ajustes: {
    leer: () => ipcRenderer.invoke('ajustes:leer'),
    guardar: (parcial: unknown) => ipcRenderer.invoke('ajustes:guardar', parcial),
  },
  exportar: {
    csv: (filtros: unknown) => ipcRenderer.invoke('exportar:csv', filtros),
    pdf: (filtros: unknown) => ipcRenderer.invoke('exportar:pdf', filtros),
    plantillaCsv: () => ipcRenderer.invoke('exportar:plantillaCsv'),
    filasConError: (filas: Array<Record<string, string>>, columnas: string[]) =>
      ipcRenderer.invoke('exportar:filasConError', filas, columnas),
  },
  respaldos: {
    elegirCarpeta: () => ipcRenderer.invoke('respaldos:elegirCarpeta'),
    probarCarpeta: (ruta: string) => ipcRenderer.invoke('respaldos:probarCarpeta', ruta),
    respaldarAhora: () => ipcRenderer.invoke('respaldos:respaldarAhora'),
    estado: () => ipcRenderer.invoke('respaldos:estado'),
    listar: () => ipcRenderer.invoke('respaldos:listar'),
    elegirArchivoParaRestaurar: () => ipcRenderer.invoke('respaldos:elegirArchivoParaRestaurar'),
    restaurar: (ruta: string) => ipcRenderer.invoke('respaldos:restaurar', ruta),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
