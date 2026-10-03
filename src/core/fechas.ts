/**
 * Utilidades de fecha y hora para la zona America/Panama (UTC-5, sin horario de verano).
 *
 * Las fechas se guardan en la base de datos como texto ISO 8601 con el desfase
 * explícito (-05:00), por ejemplo "2026-10-03T14:30:00-05:00". Así el orden
 * alfabético coincide con el orden cronológico y no hay ambigüedad de zona.
 */

export const ZONA_PANAMA = 'America/Panama';
const DESFASE_PANAMA = '-05:00';

/** Devuelve la fecha/hora actual en Panamá como texto ISO con desfase -05:00. */
export function ahoraIsoPanama(): string {
  return fechaAIsoPanama(new Date());
}

/** Convierte un Date (instante absoluto) al texto ISO local de Panamá. */
export function fechaAIsoPanama(fecha: Date): string {
  const partes = obtenerPartesPanama(fecha);
  return `${partes.anio}-${partes.mes}-${partes.dia}T${partes.hora}:${partes.minuto}:${partes.segundo}${DESFASE_PANAMA}`;
}

function obtenerPartesPanama(fecha: Date) {
  const formateador = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_PANAMA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const partes = formateador.formatToParts(fecha);
  const obtener = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '00';
  // hour12:false en Intl puede devolver "24" para medianoche; lo normalizamos a "00".
  const hora = obtener('hour') === '24' ? '00' : obtener('hour');
  return {
    anio: obtener('year'),
    mes: obtener('month'),
    dia: obtener('day'),
    hora,
    minuto: obtener('minute'),
    segundo: obtener('second'),
  };
}

/** Construye el texto ISO de Panamá a partir de un `<input type="datetime-local">`. */
export function localInputAIsoPanama(valorInput: string): string {
  // valorInput llega como "2026-10-03T14:30" (sin segundos ni zona).
  const [fecha, hora] = valorInput.split('T');
  const horaCompleta = hora && hora.length === 5 ? `${hora}:00` : hora ?? '00:00:00';
  return `${fecha}T${horaCompleta}${DESFASE_PANAMA}`;
}

/** Convierte un ISO de Panamá al formato de `<input type="datetime-local">`. */
export function isoPanamaALocalInput(isoPanama: string): string {
  return isoPanama.slice(0, 16);
}

/** Formatea un ISO de Panamá como "dd/mm/aaaa". */
export function formatearFecha(isoPanama: string): string {
  const [fecha] = isoPanama.split('T');
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Formatea un ISO de Panamá como hora de 12 h, ej. "02:30 p. m.". */
export function formatearHora(isoPanama: string): string {
  const horaPart = isoPanama.split('T')[1] ?? '00:00:00';
  const [horaStr, minutoStr] = horaPart.split(':');
  let hora24 = parseInt(horaStr, 10);
  const minuto = minutoStr;
  const meridiano = hora24 >= 12 ? 'p. m.' : 'a. m.';
  let hora12 = hora24 % 12;
  if (hora12 === 0) hora12 = 12;
  return `${String(hora12).padStart(2, '0')}:${minuto} ${meridiano}`;
}

/** Formatea fecha y hora juntas: "dd/mm/aaaa hh:mm a. m./p. m.". */
export function formatearFechaHora(isoPanama: string): string {
  return `${formatearFecha(isoPanama)} ${formatearHora(isoPanama)}`;
}

/** Calcula el tiempo transcurrido desde un ISO de Panamá hasta ahora, en texto legible. */
export function tiempoTranscurrido(isoPanama: string, ahora: Date = new Date()): string {
  const inicio = new Date(isoPanama).getTime();
  const diffMs = ahora.getTime() - inicio;
  const minutos = Math.max(0, Math.floor(diffMs / 60000));
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  if (horas < 24) return `${horas} h ${minutosRestantes} min`;
  const dias = Math.floor(horas / 24);
  return `${dias} d ${horas % 24} h`;
}

/** Indica si un ISO de Panamá corresponde a un día anterior al de hoy (en Panamá). */
export function esDeDiaAnterior(isoPanama: string, ahora: Date = new Date()): boolean {
  const hoy = fechaAIsoPanama(ahora).slice(0, 10);
  const diaVisita = isoPanama.slice(0, 10);
  return diaVisita < hoy;
}

/** Devuelve el rango [inicio, fin] en ISO de Panamá para atajos de fecha comunes. */
export function rangoAtajo(
  atajo: 'hoy' | 'ayer' | 'esta_semana' | 'este_mes',
  ahora: Date = new Date(),
): { desde: string; hasta: string } {
  const partesHoy = obtenerPartesPanama(ahora);
  const hoyIso = `${partesHoy.anio}-${partesHoy.mes}-${partesHoy.dia}`;

  if (atajo === 'hoy') {
    return { desde: `${hoyIso}T00:00:00${DESFASE_PANAMA}`, hasta: `${hoyIso}T23:59:59${DESFASE_PANAMA}` };
  }

  if (atajo === 'ayer') {
    const ayer = sumarDias(hoyIso, -1);
    return { desde: `${ayer}T00:00:00${DESFASE_PANAMA}`, hasta: `${ayer}T23:59:59${DESFASE_PANAMA}` };
  }

  if (atajo === 'esta_semana') {
    // Semana de lunes a domingo.
    const diaSemana = new Date(`${hoyIso}T12:00:00${DESFASE_PANAMA}`).getDay(); // 0=domingo
    const diasDesdeElLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    const lunes = sumarDias(hoyIso, -diasDesdeElLunes);
    return { desde: `${lunes}T00:00:00${DESFASE_PANAMA}`, hasta: `${hoyIso}T23:59:59${DESFASE_PANAMA}` };
  }

  // este_mes
  const primerDiaMes = `${partesHoy.anio}-${partesHoy.mes}-01`;
  return { desde: `${primerDiaMes}T00:00:00${DESFASE_PANAMA}`, hasta: `${hoyIso}T23:59:59${DESFASE_PANAMA}` };
}

function sumarDias(fechaIso: string, dias: number): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  // Usamos mediodía UTC para evitar problemas de desfase al sumar/restar días.
  const fecha = new Date(Date.UTC(anio, mes - 1, dia, 12));
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  const anioR = fecha.getUTCFullYear();
  const mesR = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const diaR = String(fecha.getUTCDate()).padStart(2, '0');
  return `${anioR}-${mesR}-${diaR}`;
}
