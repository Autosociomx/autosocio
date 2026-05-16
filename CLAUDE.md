# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexto del producto

**AutoSocio | Élite Automotriz** es una plataforma de optimización de activos automotrices. Esta base de código implementa la gestión del **equipo de mantenimiento de flotillas** para empresas pequeñas, medianas y grandes, donde el tamaño de la empresa corresponde a un **plan de servicio** que impone límites operativos reales.

- Textos de cara al usuario en **español**; identificadores y comentarios de código en **inglés** (el dominio —`empresa`, `vehiculo`, `tecnico`, `orden`— se nombra en español por ser lenguaje ubicuo del negocio).
- Sube los cambios a la rama designada por el usuario, no a `main`.

## Stack y comandos

Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS. Vitest para pruebas.

- `npm run dev` — servidor de desarrollo (http://localhost:3000)
- `npm run build` — build de producción
- `npm start` — sirve el build (`npm start -- -p 3100` para otro puerto)
- `npm test` — corre todas las pruebas (`vitest run`)
- `npm run test:watch` — pruebas en watch
- Una sola prueba: `npx vitest run src/lib/store.test.ts -t "nombre del test"`
- `npm run lint` — ESLint (config `next/core-web-vitals`)
- Type-check sin emitir: `npx tsc --noEmit`

Persistencia: SQLite vía `better-sqlite3`. La ruta se controla con `AUTOSOCIO_DB`; por defecto `data/autosocio.db` (ignorado por git), y `:memory:` cuando `NODE_ENV=test`. Para empezar de cero borra `data/`; el esquema y la semilla se recrean solos al primer acceso.

Sesiones: `AUTOSOCIO_SECRET` firma la cookie de sesión. En desarrollo hay un valor por defecto; en producción (`npm start`) es **obligatorio** o las operaciones de sesión fallan (`npm start` ⇒ `AUTOSOCIO_SECRET=... npm start`).

## Arquitectura

El núcleo de negocio vive en `src/lib`, separado del transporte HTTP y de la UI:

- **`src/lib/domain/planes.ts`** — fuente de verdad de los tres planes (`pequena` / `mediana` / `grande`). Cada `Plan` define `maxVehiculos`, `maxTecnicos` (`null` = ilimitado) y `slaHoras`. Toda regla de segmentación por tamaño de empresa se deriva de aquí; **no dupliques límites en otra parte**.
- **`src/lib/domain/tipos.ts`** — tipos del dominio (`Empresa`, `Vehiculo`, `Tecnico`, `OrdenMantenimiento`) y sus enums.
- **`src/lib/db.ts`** — conexión SQLite (`better-sqlite3`), esquema (columnas en `snake_case`), semilla y `reiniciarBaseDeDatos()` (solo para pruebas). La conexión se cachea en `globalThis.__autosocioSqlite` para sobrevivir al hot-reload. **No** consumas `db()` fuera de `store.ts`.
- **`src/lib/store.ts`** — única capa que aplica las reglas de plan y la única que toca `db()`. Mapea filas `snake_case` → tipos de dominio `camelCase`. `agregarVehiculo` / `agregarTecnico` lanzan `ErrorLimitePlan` al exceder el plan; `crearOrdenMantenimiento` calcula `venceEn` a partir del `slaHoras` del plan. Su superficie pública es el contrato estable: la UI y las rutas API dependen de estas firmas, no de SQLite. Cambiar de motor de almacenamiento solo debe tocar `db.ts` + el mapeo en `store.ts`.
- **`src/lib/password.ts`** — hash/verificación de contraseñas con scrypt (`node:crypto`). Módulo aislado para que `db.ts` (semilla) y `auth.ts` lo compartan sin ciclos de importación.
- **`src/lib/auth.ts`** — autenticación por empresa. La sesión es una cookie httpOnly (`autosocio_sesion`) con el id de usuario firmado por HMAC; el secreto sale de `AUTOSOCIO_SECRET` (obligatorio solo en producción; se valida de forma perezosa, no al importar). `sesionActual()` devuelve el `Usuario` o `null`. **No** firmes/leas la cookie fuera de este módulo.
- **`src/lib/api.ts`** — `manejarError` traduce errores a HTTP: `ErrorNoAutorizado` → 401, `ErrorLimitePlan` → 409, `ErrorNoEncontrado` → 404, otros → 400. `exigirEmpresa(empresaId)` es el guard multi-empresa: lanza `ErrorNoAutorizado` (401) tanto si no hay sesión como si la empresa no coincide (mismo código para no filtrar existencia de recursos ajenos). Toda ruta API debe enrutar sus errores por aquí.

Flujo de datos:

- **Autenticación**: cada usuario pertenece a una empresa. `src/app/page.tsx` redirige a `/empresas/[suEmpresa]` o a `/login` según haya sesión; `src/app/empresas/[id]/page.tsx` exige sesión y que `id` coincida con la empresa del usuario (si no, redirige a la suya). Las cuentas semilla son `admin@trans.mx` / `admin@logimax.mx` / `admin@flota.mx`, contraseña `demo1234`.
- **Páginas de servidor** leen del store directamente; son dinámicas porque usan `cookies()` (vía `sesionActual()`) y/o el store muta en runtime.
- **Mutaciones** pasan por rutas API en `src/app/api/**`. **Toda ruta con `[id]` de empresa debe llamar `exigirEmpresa(params.id)` como primera línea del `try`**; `/api/ordenes/[id]` usa `exigirEmpresa(empresaDeOrden(params.id))`. El componente cliente `src/app/empresas/[id]/PanelEmpresa.tsx` hace `fetch` y luego `router.refresh()` para re-renderizar el árbol de servidor con el estado nuevo (no hay estado de cliente duplicado de la data del dominio).
- Las etiquetas legibles de los enums están centralizadas en `src/lib/etiquetas.ts`; los colores de badges en `src/components/Badges.tsx`. Al agregar un valor de enum, actualiza ambos.

## Convenciones

- La validación de límites de plan es responsabilidad **exclusiva** del store; las rutas API y la UI solo validan presencia/forma de los campos. No reimplementes reglas de plan en la capa HTTP ni en React.
- El aislamiento multi-empresa es responsabilidad de la capa HTTP (`exigirEmpresa`) y de los guards en las páginas de servidor; el store no conoce la sesión. Nunca devuelvas datos de una empresa sin verificar la sesión.
- Las pruebas (`*.test.ts`) llaman `reiniciarBaseDeDatos()` en `afterEach` para volver a la semilla; corren con `NODE_ENV=test`, que usa SQLite `:memory:`. Replica ese aislamiento al añadir pruebas que toquen el store. Las funciones que usan `cookies()` (sesión) no se pueden probar fuera de una petición; prueba `autenticar`/`password` en su lugar.
