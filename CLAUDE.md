# CLAUDE.md

The project's coding rules are shared between Claude and GitHub Copilot and live in
`.github/instructions/*.instructions.md` (single source of truth). Copilot loads them
via each file's `applyTo` glob; Claude loads them through the imports below. Edit the
rules in `.github/instructions/`, not here. The `applyTo` headers are a Copilot
directive and can be ignored when read as Claude.

Read the structure of the repo in the project [README](./README.md).

## Project general guidelines and standards

Consider these defaults whenever writing/updating code; make them take precedence by
default, unless stated otherwise:

@.github/instructions/general-coding.instructions.md
@.github/instructions/frontend.instructions.md
@.github/instructions/portal.instructions.md
@.github/instructions/typescript.instructions.md
