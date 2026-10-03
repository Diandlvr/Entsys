import { app, BrowserWindow, session } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { abrirBaseDeDatos } from '../core/db/conexion.js';
import { VisitasRepo } from '../core/db/visitasRepo.js';
import { AlmacenAjustes } from './ajustes.js';
import { Registro } from './log.js';
import { GestorRespaldos } from './respaldos.js';
import { registrarIpc } from './ipc.js';
import type Database from 'better-sqlite3';

// __dirname no existe en ESM; lo reconstruimos.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ESTA_EN_DESARROLLO = !app.isPackaged;

let respaldoAlCerrarHecho = false;
let gestorRespaldosGlobal: GestorRespaldos | null = null;
let rutaBaseDeDatosGlobal = '';

// Una sola instancia: si ya hay una ventana abierta, enfocamos esa en vez de abrir otra.
const obtuvoCandado = app.requestSingleInstanceLock();
if (!obtuvoCandado) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const ventanas = BrowserWindow.getAllWindows();
    if (ventanas.length > 0) {
      const ventana = ventanas[0];
      if (ventana.isMinimized()) ventana.restore();
      ventana.focus();
    }
  });

  iniciarAplicacion();
}

function iniciarAplicacion(): void {
  const carpetaDatos = app.getPath('userData');
  const registro = new Registro(carpetaDatos);

  app.whenReady().then(() => {
    // Bloquea toda petición de red saliente: la app debe funcionar 100% sin internet.
    // Solo se permiten esquemas locales (file, data, devtools en desarrollo).
    session.defaultSession.webRequest.onBeforeRequest((detalle, callback) => {
      const esquemasPermitidos = ['file:', 'data:', 'devtools:', 'chrome-extension:'];
      const esLocal = esquemasPermitidos.some((esquema) => detalle.url.startsWith(esquema));
      const esServidorDeDesarrollo = ESTA_EN_DESARROLLO && detalle.url.startsWith('http://localhost:5173');
      if (esLocal || esServidorDeDesarrollo) {
        callback({ cancel: false });
      } else {
        registro.advertencia('Petición de red bloqueada', { url: detalle.url });
        callback({ cancel: true });
      }
    });

    let db: Database.Database;
    const rutaBaseDeDatos = path.join(carpetaDatos, 'visitas.db');
    rutaBaseDeDatosGlobal = rutaBaseDeDatos;
    try {
      db = abrirBaseDeDatos(rutaBaseDeDatos);
      registro.info('Base de datos abierta correctamente', { ruta: rutaBaseDeDatos });
    } catch (error) {
      registro.error('No se pudo abrir la base de datos', error);
      throw error;
    }

    const repo = new VisitasRepo(db);
    const ajustes = new AlmacenAjustes(carpetaDatos);
    const gestorRespaldos = new GestorRespaldos(() => db, ajustes, registro, carpetaDatos);
    gestorRespaldosGlobal = gestorRespaldos;
    gestorRespaldos.iniciarRespaldoAutomatico();

    registrarIpc({ repo, ajustes, registro, gestorRespaldos, rutaBaseDeDatos });

    crearVentanaPrincipal(registro);
  });

  // Respaldo automático al cerrar la app: se posterga el cierre real hasta que termine.
  app.on('before-quit', (evento) => {
    if (respaldoAlCerrarHecho || !gestorRespaldosGlobal) return;
    evento.preventDefault();
    respaldoAlCerrarHecho = true;
    gestorRespaldosGlobal.respaldarAhora().finally(() => app.quit());
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}

function crearVentanaPrincipal(registro: Registro): void {
  const ventana = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  ventana.once('ready-to-show', () => ventana.show());

  ventana.webContents.on('did-fail-load', (_evento, codigo, descripcion, url) => {
    registro.error('La ventana no pudo cargar el contenido', { codigo, descripcion, url });
  });

  if (ESTA_EN_DESARROLLO) {
    ventana.loadURL('http://localhost:5173');
  } else {
    ventana.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}
