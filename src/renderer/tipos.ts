// Re-exporta los tipos del core para el renderer. Son solo tipos (se eliminan al compilar),
// así que no agregan código de Node/Electron al bundle del navegador.
export type { Visita, DatosNuevaVisita, DatosEditarVisita } from '../core/db/visitasRepo.js';
export type { TipoDocumento } from '../core/documento.js';
export type { FiltrosVisitas, EstadoVisita } from '../core/db/filtros.js';
export type { CampoVisita, MapeoColumnas, FilaValidada } from '../core/csv/importar.js';
