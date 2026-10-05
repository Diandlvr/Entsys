/**
 * Genera datos de prueba (varios miles de visitas) para comprobar el rendimiento
 * de los filtros del historial y de la generación de PDF con volumen real.
 *
 * Uso:
 *   npm run seed                         (5000 visitas, en la carpeta de datos de la app)
 *   npm run seed -- --cantidad=10000
 *   npm run seed -- --ruta=./prueba.db   (archivo aparte, no toca los datos reales)
 *
 * No depende de Electron: usa directamente el core (abrirBaseDeDatos + VisitasRepo),
 * igual que lo haría cualquier prueba.
 */
import path from 'node:path';
import os from 'node:os';
import { abrirBaseDeDatos } from '../src/core/db/conexion.js';
import { VisitasRepo } from '../src/core/db/visitasRepo.js';
import type { DatosNuevaVisita } from '../src/core/db/visitasRepo.js';
import type { TipoDocumento } from '../src/core/documento.js';

const NOMBRES = [
  'María', 'José', 'Ana', 'Carlos', 'Luis', 'Carmen', 'Juan', 'Rosa', 'Pedro', 'Isabel',
  'Miguel', 'Elena', 'Francisco', 'Lucía', 'Antonio', 'Patricia', 'Manuel', 'Sofía', 'Jorge', 'Valentina',
];
const APELLIDOS = [
  'Pérez', 'González', 'Rodríguez', 'Martínez', 'López', 'Hernández', 'Sánchez', 'Ramírez',
  'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Vásquez', 'Castillo', 'Jiménez', 'Morales', 'Ortega',
];
const EMPRESAS = [
  'Acme Panamá S.A.', 'Grupo Istmo', 'Consultores del Pacífico', 'Logística Continental',
  'Servicios Profesionales Unidos', 'Constructora Bahía', 'Tecnología Caribeña', null, null,
];
const DESTINOS = ['Piso 1', 'Piso 2', 'Piso 3', 'Piso 4', 'Piso 5', 'Recepción', 'Sala de juntas A', 'Sala de juntas B'];
const MOTIVOS = ['Reunión de trabajo', 'Entrega de documentos', 'Entrevista', 'Mantenimiento', 'Visita personal', 'Capacitación'];
const ANFITRIONES = ['Juan Gómez', 'María Peña', 'Carlos Ruiz', 'Ana Vargas', 'Luis Castro', 'Elena Mora'];
const TIPOS_DOCUMENTO: TipoDocumento[] = ['CEDULA', 'CEDULA', 'CEDULA', 'PASAPORTE', 'OTRO'];

function elegir<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)];
}

function documentoAleatorio(tipo: TipoDocumento): string {
  if (tipo === 'CEDULA') {
    const provincia = 1 + Math.floor(Math.random() * 9);
    const tomo = 1 + Math.floor(Math.random() * 999);
    const asiento = 1 + Math.floor(Math.random() * 99999);
    return `${provincia}-${tomo}-${asiento}`;
  }
  if (tipo === 'PASAPORTE') {
    return `P${Math.floor(1_000_000 + Math.random() * 9_000_000)}`;
  }
  return `OTRO${Math.floor(1000 + Math.random() * 9000)}`;
}

function fechaAleatoriaIsoPanama(diasHaciaAtras: number): string {
  const ahora = Date.now();
  const offsetMs = Math.floor(Math.random() * diasHaciaAtras * 24 * 60 * 60 * 1000);
  const fecha = new Date(ahora - offsetMs);
  // Horario laboral típico: 7am a 7pm.
  const hora = 7 + Math.floor(Math.random() * 12);
  const minuto = Math.floor(Math.random() * 60);
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}T${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00-05:00`;
}

function sumarMinutosIso(iso: string, minutos: number): string {
  const [fechaHora, offset] = [iso.slice(0, 19), iso.slice(19)];
  const fecha = new Date(`${fechaHora}Z`); // se trata como UTC solo para sumar minutos, el offset se reescribe igual
  fecha.setUTCMinutes(fecha.getUTCMinutes() + minutos);
  const anio = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getUTCDate()).padStart(2, '0');
  const hora = String(fecha.getUTCHours()).padStart(2, '0');
  const minuto = String(fecha.getUTCMinutes()).padStart(2, '0');
  return `${anio}-${mes}-${dia}T${hora}:${minuto}:00${offset}`;
}

function generarVisita(): DatosNuevaVisita {
  const tipo_documento = elegir(TIPOS_DOCUMENTO);
  const nombre_completo = `${elegir(NOMBRES)} ${elegir(APELLIDOS)} ${elegir(APELLIDOS)}`;
  const entrada = fechaAleatoriaIsoPanama(90); // últimos 90 días, para tener rango real en los filtros
  return {
    tipo_documento,
    documento: documentoAleatorio(tipo_documento),
    nombre_completo,
    empresa: elegir(EMPRESAS),
    a_quien_visita: elegir(ANFITRIONES),
    destino: elegir(DESTINOS),
    motivo: elegir(MOTIVOS),
    observaciones: Math.random() < 0.1 ? 'Visita con equipaje' : null,
    entrada,
  };
}

function rutaDatosUsuarioWindows(): string {
  // Misma carpeta que usa Electron (app.getPath('userData')) en Windows, sin depender de Electron.
  const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming');
  return path.join(appData, 'registro-de-visitas', 'visitas.db');
}

function leerArgumentos() {
  const args = process.argv.slice(2);
  const obtener = (nombre: string, porDefecto: string) => {
    const prefijo = `--${nombre}=`;
    const encontrado = args.find((a) => a.startsWith(prefijo));
    return encontrado ? encontrado.slice(prefijo.length) : porDefecto;
  };
  return {
    cantidad: parseInt(obtener('cantidad', '5000'), 10),
    ruta: obtener('ruta', rutaDatosUsuarioWindows()),
  };
}

function main() {
  const { cantidad, ruta } = leerArgumentos();
  console.log(`Generando ${cantidad} visitas de prueba en: ${ruta}`);

  const db = abrirBaseDeDatos(ruta);
  const repo = new VisitasRepo(db);

  const inicio = Date.now();
  const transaccion = db.transaction(() => {
    for (let i = 0; i < cantidad; i++) {
      const datos = generarVisita();
      const visita = repo.crear(datos);
      // La mayoría ya salió; una minoría sigue "dentro" (visitas recientes, más realista).
      if (Math.random() < 0.85) {
        const minutosDeVisita = 15 + Math.floor(Math.random() * 180);
        repo.marcarSalida(visita.id, sumarMinutosIso(datos.entrada!, minutosDeVisita));
      }
      if (i > 0 && i % 1000 === 0) console.log(`  ${i} / ${cantidad}`);
    }
  });
  transaccion();

  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`Listo: ${cantidad} visitas insertadas en ${segundos}s.`);
  db.close();
}

main();
