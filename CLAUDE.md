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

## Arquitectura

El núcleo de negocio vive en `src/lib`, separado del transporte HTTP y de la UI:

- **`src/lib/domain/planes.ts`** — fuente de verdad de los tres planes (`pequena` / `mediana` / `grande`). Cada `Plan` define `maxVehiculos`, `maxTecnicos` (`null` = ilimitado) y `slaHoras`. Toda regla de segmentación por tamaño de empresa se deriva de aquí; **no dupliques límites en otra parte**.
- **`src/lib/domain/tipos.ts`** — tipos del dominio (`Empresa`, `Vehiculo`, `Tecnico`, `OrdenMantenimiento`) y sus enums.
- **`src/lib/store.ts`** — store **en memoria** con datos semilla, persistido en `globalThis.__autosocioDb` para sobrevivir al hot-reload. Es la única capa que aplica las reglas de plan: `agregarVehiculo` / `agregarTecnico` lanzan `ErrorLimitePlan` al exceder el plan, y `crearOrdenMantenimiento` calcula `venceEn` a partir del `slaHoras` del plan. Esta es la frontera a reemplazar cuando se introduzca una base de datos real; mantener su superficie pública estable.
- **`src/lib/api.ts`** — `manejarError` traduce los errores del dominio a códigos HTTP: `ErrorLimitePlan` → 409, `ErrorNoEncontrado` → 404, otros → 400. Toda ruta API debe enrutar sus errores por aquí.

Flujo de datos:

- **Páginas de servidor** (`src/app/page.tsx`, `src/app/empresas/[id]/page.tsx`) leen del store directamente; llevan `export const dynamic = "force-dynamic"` porque el store muta en tiempo de ejecución.
- **Mutaciones** pasan por rutas API en `src/app/api/**`. El componente cliente `src/app/empresas/[id]/PanelEmpresa.tsx` hace `fetch` y luego `router.refresh()` para re-renderizar el árbol de servidor con el estado nuevo (no hay estado de cliente duplicado de la data del dominio).
- Las etiquetas legibles de los enums están centralizadas en `src/lib/etiquetas.ts`; los colores de badges en `src/components/Badges.tsx`. Al agregar un valor de enum, actualiza ambos.

## Convenciones

- La validación de límites de plan es responsabilidad **exclusiva** del store; las rutas API y la UI solo validan presencia/forma de los campos. No reimplementes reglas de plan en la capa HTTP ni en React.
- Las pruebas del dominio (`src/lib/store.test.ts`) limpian `globalThis.__autosocioDb` en `afterEach`; al añadir pruebas que toquen el store, replica ese aislamiento.
