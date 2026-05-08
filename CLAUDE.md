# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado del repositorio

Este repositorio está en estado inicial. Al momento del último commit, el único archivo versionado es `README.md`; aún no existe código fuente, configuración de build, manifiesto de dependencias, suite de pruebas ni CI. Trata cualquier trabajo nuevo como greenfield: al agregar el primer código, introduce también el tooling correspondiente (gestor de paquetes / sistema de build / linter / test runner) y actualiza este archivo con los comandos resultantes.

## Contexto del producto

Tomado de `README.md`: **AutoSocio | Élite Automotriz** es una plataforma de optimización de activos automotrices impulsada por inteligencia artificial. Los usuarios objetivo son conductores profesionales, flotillas, talleres y propietarios de vehículos particulares y comerciales. El producto se describe como un ecosistema único que centraliza la gestión inteligente del mantenimiento vehicular (y operaciones relacionadas — el README es una descripción parcial).

Implicaciones para el código que se agregue aquí:
- El dominio es gestión de flotillas y ciclo de vida vehicular, no SaaS genérico — favorece nombres y modelado en torno a vehículos, conductores, flotillas, talleres, eventos de mantenimiento, etc.
- El README está en español; los textos de cara al usuario deben estar en español por defecto, salvo que el usuario indique lo contrario. Los identificadores de código y comentarios permanecen en inglés.

## Trabajando en este repositorio

- Rama activa de desarrollo para tareas de documentación: `claude/add-claude-documentation-9Hnqp` (siguiendo la convención del repositorio, sube los cambios a la rama designada por el usuario en lugar de `main`).
- Aún no hay comandos de build, lint ni test. No inventes scripts de relleno en este archivo — agrégalos solo cuando exista el tooling correspondiente.
