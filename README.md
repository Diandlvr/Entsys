# Registro de Visitas

Aplicación de escritorio para la recepción de un edificio. Funciona 100% sin
internet, guarda todo en una base de datos local (SQLite) y está pensada para
uso rápido con teclado en recepción.

## Requisitos

- **Node.js 20 o superior** (probado con Node 24).
- **Windows 10/11** de 64 bits.
- Para compilar el módulo nativo de la base de datos desde el código fuente
  (normalmente no hace falta, ver más abajo): Python 3 y las *Build Tools for
  Visual Studio* con la carga de trabajo "Desarrollo para escritorio con C++".

## Instalación

```powershell
npm install
```

`better-sqlite3` (la base de datos) es un módulo nativo: la primera vez que
se instala, npm descarga un binario ya compilado para Node. Para que la app
de Electron pueda usarlo hace falta recompilarlo contra el motor de Electron
(ver la sección siguiente).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo de Vite (solo el renderer). |
| `npm run rebuild:electron` | Recompila `better-sqlite3` para Electron. |
| `npm run rebuild:node` | Recompila `better-sqlite3` para Node normal (lo necesitan las pruebas). |
| `npm start` | Compila todo y abre la app de escritorio (recompila para Electron primero). |
| `npm test` | Corre las pruebas automáticas (recompila para Node primero). |
| `npm run dist` | Genera el instalador (NSIS) y la versión portable en `dist-empaquetado/`. |
| `npm run dist:portable` | Genera solo la versión portable. |

### Por qué hay dos "rebuild"

`better-sqlite3` tiene que estar compilado contra el motor de JavaScript
exacto que lo va a cargar. Node (usado por las pruebas y por scripts sueltos)
y Electron (usado por la app) son motores distintos, así que el mismo
`node_modules/better-sqlite3` no sirve para los dos al mismo tiempo. Por eso:

- Antes de `npm test` se recompila automáticamente para Node (`pretest`).
- Antes de `npm start` / `npm run dist` se recompila automáticamente para
  Electron.

Si alternás mucho entre probar y correr la app, es normal tener que esperar
unos segundos extra en cada recompilación; es más simple y confiable que
mantener dos copias de `node_modules`.

### Generar el instalador (.exe)

```powershell
npm run dist
```

Esto deja en `dist-empaquetado/`:

- `Registro de Visitas 1.0.0 Instalador.exe` — instalador NSIS normal (el
  usuario elige la carpeta, se crean accesos directos).
- `Registro de Visitas 1.0.0 Portable.exe` — un solo archivo, sin instalar,
  para copiar a una memoria USB o correr directo.

El `.exe` no está firmado digitalmente (no hay certificado de código), así
que Windows SmartScreen puede mostrar una advertencia la primera vez que se
abre ("Windows protegió su PC"). Hay que hacer clic en "Más información" →
"Ejecutar de todas formas". Esto es normal para software sin firmar y no
afecta el funcionamiento.

**Nota para quien empaquete en una Windows sin modo de desarrollador:**
`electron-builder` descarga una herramienta (`winCodeSign`) que incluye
archivos de macOS con enlaces simbólicos; sin privilegios de administrador o
sin el "Modo de desarrollador" de Windows activado, esa extracción puede
fallar (aunque los archivos que realmente hacen falta para Windows sí se
extraen bien). Si el build falla por este motivo, activar el Modo de
desarrollador en *Configuración → Privacidad y seguridad → Para
desarrolladores* y volver a intentar suele resolverlo.

## Configurar el respaldo en una carpeta de red (NAS)

1. Mapear la carpeta del NAS como una unidad de Windows (ej. `Z:\`) o tener
   a mano su ruta de red (`\\servidor\carpeta`).
2. Abrir **Ajustes → Respaldos → Elegir carpeta** y seleccionarla.
3. La app hace una prueba de escritura al elegirla y avisa si no es
   accesible.
4. Ajustar la **frecuencia** (minutos entre respaldos automáticos) y
   **cuántos respaldos conservar** (los más viejos se borran solos).

Si el NAS deja de estar disponible en algún momento (se desconectó el cable,
la VPN se cayó, etc.), la app no se bloquea: guarda un respaldo temporal en
una carpeta local y lo avisa con un aviso amarillo en la barra superior.
Vuelve a intentar la carpeta configurada en el siguiente respaldo
automático.

## Restaurar un respaldo

1. **Ajustes → Restaurar desde un respaldo**.
2. Elegir el archivo `.db` del respaldo (están en la carpeta configurada, o
   en la carpeta local de emergencia si el NAS no estuvo disponible).
3. Confirmar. La app primero guarda un respaldo de seguridad del estado
   actual (por si hace falta deshacer la restauración) y después reemplaza
   la base de datos y se reinicia sola.

## Dónde viven los datos

Todo se guarda en la carpeta de datos del usuario de Windows, **no** dentro
de la carpeta donde está instalada la app, para que reinstalar o actualizar
nunca borre información:

```
%APPDATA%\registro-de-visitas\
├── visitas.db              (la base de datos)
├── ajustes.json            (preferencias)
├── estado-respaldo.json    (último respaldo hecho)
├── respaldos-locales\      (respaldos de emergencia si el NAS no está disponible)
└── logs\app.log            (registro de errores, rotado)
```

## Decisiones y simplificaciones (anotadas según se pidió)

- **Cédula panameña:** se valida el formato solo como advertencia visual;
  nunca bloquea el guardado, porque hay documentos reales con formatos poco
  comunes.
- **Importar CSV:** el importador no trae la columna de salida, solo crea
  visitas con entrada (abiertas). Se puede marcar la salida después desde la
  pantalla de Registro o Historial. Esto simplifica bastante la validación
  sin perder la función principal (traer visitas masivamente).
- **Cambiar la frecuencia de respaldo automático** no requiere reiniciar la
  app: el temporizador se reprograma solo cada vez que corre.
- **Sin certificado de firma de código:** el `.exe` no está firmado (requiere
  comprar un certificado). Windows puede mostrar la advertencia de
  SmartScreen la primera vez.

## Pruebas automáticas

```powershell
npm test
```

Cubren: normalización y validación de documento, migraciones de esquema,
filtros combinados del historial, entrada/salida de visitas, exportación CSV
(con tildes y comillas), importación (mapeo de columnas, fechas flexibles,
duplicados, errores), importación transaccional (todo o nada), y rotación de
respaldos.
