# Copilot instructions

Read the structure of the repo in the project [README](../README.md) file.

## Project general guidelines and standards

Consider the following defaults/considerations whenever writing/updating code. Make these take precedence by default, unless stated otherwise. Each file is applied automatically via its `applyTo` glob:

- [General guidelines](./instructions/general-coding.instructions.md) — all code (`**`).
- [Frontend guidelines](./instructions/frontend.instructions.md) — frontend code (`**/*.tsx`).
- [Portal guidelines](./instructions/portal.instructions.md) — portal code (`portal/**`).
- [TypeScript guidelines](./instructions/typescript.instructions.md) — TypeScript code (`**/*.{ts,tsx}`).

These rules are shared with Claude via the root [`CLAUDE.md`](../CLAUDE.md). Edit the rules in `.github/instructions/`, not in the wrappers.
