# AGENTS.md

## Core Rules

- Code and comments MUST be written in English.
- Comments MUST only explain non-obvious behavior.
- Tests MUST only be added when they verify meaningful behavior or when
  explicitly requested.
- You MUST NOT add comments or tests without clear value.

## Project Overview

- PlainSheet is an Electron + React + TypeScript + Rust (N-API) desktop app.
- The renderer UI is defined in `src/renderer/`.
- The main process is defined in `src/main.ts` and `src/main/`.
- The preload bridge is defined in `src/preload.ts` and exposes `window.app`.
- `window.app` methods invoke IPC channels with the `app:*` prefix.
- `src/main.ts` loads the native module, registers `app:*` handlers and
  protocols, and manages windows.
- The native module is implemented in `native/src/` and is used for Typst
  rendering and SQLite database access, etc.

## Development Commands

- Lint frontend/main/renderer code: `bun run lint`.
- Format frontend/main/renderer code: `bun run format`.
- Build the native Rust module: `(cd native; just build)`.

## Change Constraints

- If IPC API shapes change, you MUST update all related files together:
  - `src/main.ts`
  - `src/preload.ts`
  - `src/renderer/global.d.ts`
- When IPC shape changes, all listed files MUST be updated in the same change.

## Code Style

- Changes SHOULD be small, focused, and consistent with the existing codebase.
- You MUST NOT perform unrelated refactors.
- New logic SHOULD be placed in existing modules when possible (for example,
  protocol logic in `src/main/protocol.ts`).

## Commit Message Format

- Commit messages MUST follow Conventional Commits.
- Preferred patterns:
  - `<type>(<scope>): <Summary>.`
  - `<type>: <Summary>.`
- `<Summary>` MUST be imperative, start with an uppercase letter, and end with a
  period.
- Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
- Native/N-API changes SHOULD use the `native` scope when appropriate.

## Validation Requirements

- After TypeScript/main/renderer changes, you MUST run: `bun run lint`.
- After native Rust changes, you MUST run: `(cd native; just build)`.
