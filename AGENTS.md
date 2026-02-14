# AGENTS.md

While working on PlainSheet, please remember:

- Always use English in code and comments.
- Only add meaningful comments when the code's behavior is difficult to
  understand.
- Only add meaningful tests when they actually verify internal behaviors;
  otherwise, don't create them unless requested.

## Project Overview

- This is an Electron + React + TypeScript + Rust (N-API) desktop app.
- The editor and preview UI live in `src/renderer/`, the main process is in
  `src/main.ts`, and the bridge is in `src/preload.ts`.
- Native Typst rendering is implemented in `native/src/lib.rs` and loaded via
  `src/main/native.ts`.

## Directory Responsibilities

- `src/main.ts`: Electron main process entry and IPC registration.
- `src/main/native.ts`: Native module loading and TypeScript binding types.
- `src/main/protocol.ts`: `plainsheet://` protocol registration and preview
  image cache.
- `src/preload.ts`: Exposes `window.rust` APIs to the renderer process.
- `src/renderer/components/App/`: Editor and preview UI.
- `native/src/lib.rs`: Typst compile pipeline and PNG/SVG rendering entrypoints.

## Development Commands

- Install dependencies: `bun install`
- Start dev app: `bun run start`
- Lint frontend/main code: `bun run lint`
- Format frontend/main code: `bun run format`
- Build Rust native module: `cd native && just build`

## Change Constraints (Important)

- If you change IPC API shapes, update all related files together:
  - `src/main.ts`
  - `src/preload.ts`
  - `src/renderer/global.d.ts`
  - Corresponding renderer call sites
- If you change native exported signatures, update all related files together:
  - `native/src/lib.rs`
  - `src/main/native.ts`
  - `src/main.ts` IPC handlers and input validation
- The preview pipeline is intentionally "main-process cache + custom protocol
  URL". Do not revert to sending full PNG payloads over IPC to the renderer.

## Code Style

- Follow existing TypeScript/Rust style and prefer small, focused changes.
- Avoid unrelated refactors.
- Place new logic in existing modules when possible (for example, protocol logic
  in `src/main/protocol.ts`).

## Git Commit Message Format

- Follow Conventional Commits with optional scope.
- Recommended pattern: `<type>(<scope>): <Summary>.`
- If scope is unnecessary, use: `<type>: <Summary>.`
- Keep `<Summary>` as an imperative sentence, start with an uppercase letter,
  and end with a period.
- Common types in this repo: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
- For native/N-API related changes, prefer `native` as scope (example:
  `refactor(native): Reduce exposed N-API surface.`).

## Validation Requirements

- After TypeScript/main/renderer changes, run at least: `bun run lint`.
- After Rust native changes, run at least: `cd native && just build`.
- For preview-flow changes, do a local manual check by editing Typst content and
  confirming continuous preview updates.
