# Corcho — frontend (Angular 22)

Tablero de corcho para deudas y gastos, **personal** o **compartido** en tiempo real. Consume el backend `deudas-backend` (Express + Socket.IO).

**Stack:** Angular 22 standalone · zoneless · **signals** (`signal`, `computed`, `linkedSignal`, `input`, `output`, `model`, `toSignal`) · formularios reactivos tipados · guards e interceptores funcionales · socket.io-client · SCSS con tokens del diseño de Stitch.

## Correr

```bash
npm install          # hay un .npmrc con legacy-peer-deps (evita un bug de npm 10 con vitest/jsdom)
npm start            # http://localhost:4300  (el backend en http://localhost:3200)
npm run build        # producción en dist/
```

La URL del backend está en `src/environments/environment*.ts` y se inyecta con el token `API_URL`.

## Estructura

```
src/app/
  core/                         ← una sola instancia para toda la app
    config/api-url.token.ts
    models/                     tipos del API (Nota, Tablero, Pago, Balance…)
    services/<servicio>/        cada servicio en su carpeta
      api/            único que habla HTTP; desenvuelve { ok, data } y devuelve promesas
      sesion/         token + usuario en signals (fuente de verdad de "quién soy")
      auth/           entrar, registrarse, perfil, salir
      tableros/ miembros/ notas/ pagos/ invitaciones/ balance/ actividad/
      tiempo-real/    Socket.IO: conectar, unirse al cuarto, cada evento como Observable
      avisos/         toasts en un signal
      almacenamiento/ localStorage a prueba de fallos
    guards/           sesionGuard · invitadoGuard · tableroValidoGuard
    interceptors/     auth (Bearer) · errores (ErrorApi uniforme, 401 → cerrar sesión)
    utils/            errores, fechas, vista previa del reparto
  shared/                       ← piezas reutilizables, sin lógica de negocio
    components/       boton · icono · avatar · grupo-avatares · chinche · nota-adhesiva · etiqueta
                      modal · campo · monto · selector-color (CVA) · control-segmentado (CVA)
                      tarjeta-dato · estado-vacio · cargando · avisos · barra-progreso · marca
                      mini-corcho · dialogo-confirmacion
    directives/       arrastrable (Pointer Events: mouse, dedo y pluma)
    pipes/            moneda · iniciales · fecha-corta · vencimiento
    constants/        catálogos de la UI (colores, tipos de nota, modos de reparto…)
  layout/             shell (barra privada) · bandeja-invitaciones
  features/
    landing/  acceso/  invitacion/
    inicio/           mis-tableros.store.ts + tarjeta-tablero + nuevo-tablero-modal
    tablero/          tablero.store.ts + corcho + nota-corcho + panel-compartido + panel-personal
                      nota-formulario + nota-detalle + pago-formulario + invitar-modal + barra-tablero
```

### Reglas que sigue el código

- **Los componentes no llaman HTTP.** Las páginas usan un *store* de signals (`TableroStore`, `MisTablerosStore`) que se provee en la propia página y vive lo que ella; el store usa los servicios.
- **Componentes presentacionales** (corcho, nota-corcho, paneles): reciben `input()` y emiten `output()`; no inyectan servicios.
- **Modales con acción inyectada**: reciben `guardar`/`accion` como función; así manejan ellos su estado de carga y muestran el error si falla.
- **Tiempo real idempotente**: cada evento (`nota:creada`, `pago:actualizado`…) hace *upsert* en el store, así da igual si llega antes o después de la respuesta HTTP.
- **Balance con retardo**: varios `balance:cambio` seguidos generan una sola petición (250 ms).
- **Arrastre**: local al instante, eco en vivo a los demás cada 60 ms (volátil) y se guarda al soltar con `X-Socket-Id` para no recibir el propio eco. Con teclado: Enter abre, flechas mueven.
- Todo `OnPush`, control flow nuevo (`@if`, `@for`, `@let`), sin `any`, TypeScript estricto y `strictTemplates`.

## Rutas

| Ruta | Guard | Página |
|---|---|---|
| `/` | invitado | Landing |
| `/entrar?modo=registro&volver=…` | invitado | Iniciar sesión / Crear cuenta |
| `/tableros` | sesión | Mis tableros (personales y compartidos, saldos) |
| `/tableros/:tableroId` | sesión + id válido | Corcho + panel (balance compartido o resumen personal) |
| `/invitacion/:codigo` | sesión (vuelve aquí tras entrar) | Aceptar invitación del enlace |

Diseño de referencia: proyecto de Stitch **"Corcho — Tablero de deudas"** (`3040161860727043255`).

## Despliegue (Vercel)

Importa el repo en Vercel (detecta Angular; `vercel.json` ya trae el build y la reescritura a `index.html` para las rutas).
La URL del backend en producción está en `src/environments/environment.ts`.
