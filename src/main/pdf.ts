import { BrowserWindow } from 'electron';

/**
 * Convierte un HTML a PDF usando una ventana oculta y webContents.printToPDF.
 * La ventana se destruye apenas termina; nunca es visible para el usuario.
 */
export async function generarPdfDesdeHtml(html: string): Promise<Buffer> {
  const ventanaOculta = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true, contextIsolation: true },
  });

  try {
    await ventanaOculta.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const buffer = await ventanaOculta.webContents.printToPDF({
      printBackground: true,
      pageSize: 'Letter',
      margins: { marginType: 'custom', top: 0.5, bottom: 0.5, left: 0.4, right: 0.4 },
    });
    return buffer;
  } finally {
    ventanaOculta.destroy();
  }
}
