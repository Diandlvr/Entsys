import { formatearFechaHora } from '../fechas.js';
import type { Visita } from '../db/visitasRepo.js';

type DatosReporte = {
  nombreEdificio: string;
  visitas: Visita[];
  resumenFiltros: string;
  generadoEn: string; // texto ya formateado (dd/mm/aaaa hh:mm a. m./p. m.)
};

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Genera el HTML del reporte de visitas para convertir a PDF con webContents.printToPDF.
 * El encabezado de la tabla (<thead>) se repite automáticamente en cada página impresa.
 */
export function construirHtmlReporte({ nombreEdificio, visitas, resumenFiltros, generadoEn }: DatosReporte): string {
  const filas = visitas
    .map(
      (v) => `
    <tr>
      <td>${escaparHtml(formatearFechaHora(v.entrada))}</td>
      <td>${v.salida ? escaparHtml(formatearFechaHora(v.salida)) : 'Dentro'}</td>
      <td>${escaparHtml(v.nombre_completo)}</td>
      <td>${escaparHtml(v.documento)}</td>
      <td>${escaparHtml(v.empresa ?? '')}</td>
      <td>${escaparHtml(v.a_quien_visita)}</td>
      <td>${escaparHtml(v.destino)}</td>
      <td>${escaparHtml(v.motivo)}</td>
    </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="es-PA">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; margin: 24px; }
  header { margin-bottom: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 12px; }
  h1 { margin: 0 0 4px; font-size: 20px; color: #1e3a8a; }
  .meta { font-size: 12px; color: #475569; margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead { display: table-header-group; }
  th { background: #eff6ff; color: #1e3a8a; text-align: left; padding: 6px 8px; border-bottom: 2px solid #93c5fd; }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
  tr { page-break-inside: avoid; }
  footer { margin-top: 12px; font-size: 11px; color: #64748b; }
</style>
</head>
<body>
  <header>
    <h1>${escaparHtml(nombreEdificio)} — Reporte de visitas</h1>
    <p class="meta">${escaparHtml(resumenFiltros)}</p>
    <p class="meta">Generado el ${escaparHtml(generadoEn)}</p>
  </header>
  <table>
    <thead>
      <tr>
        <th>Entrada</th>
        <th>Salida</th>
        <th>Nombre</th>
        <th>Documento</th>
        <th>Empresa</th>
        <th>Visita a</th>
        <th>Destino</th>
        <th>Motivo</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <footer>Total de registros: ${visitas.length}</footer>
</body>
</html>`;
}
