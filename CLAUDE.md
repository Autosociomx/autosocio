# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repository is in an initial state. As of the latest commit, the only tracked file is `README.md`; there is no source code, build configuration, dependency manifest, test suite, or CI setup yet. Treat any new work as greenfield: when you add the first code, also introduce the matching tooling (package manager / build system / linter / test runner) and update this file with the resulting commands.

## Product context

From `README.md` (Spanish): **AutoSocio | Élite Automotriz** is an AI-powered automotive asset optimization platform. The intended users are professional drivers, fleets, workshops, and owners of private and commercial vehicles. The product is described as a single ecosystem that centralizes intelligent management of vehicle maintenance (and related operations — the README is a partial description).

Implications for any code added here:
- The domain is automotive fleet / vehicle lifecycle management, not generic SaaS — favor naming and modeling around vehicles, drivers, fleets, workshops, maintenance events, etc.
- The README is in Spanish; user-facing copy should default to Spanish unless the user specifies otherwise. Code identifiers and comments should remain in English.

## Working in this repo

- Active development branch for documentation work: `claude/add-claude-documentation-9Hnqp` (per repository conventions, push changes to the branch the user has designated rather than `main`).
- There are no commands to build, lint, or test yet. Do not invent placeholder scripts in this file — add them once the corresponding tooling actually exists.
