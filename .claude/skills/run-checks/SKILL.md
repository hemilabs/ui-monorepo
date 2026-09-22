---
name: run-checks
description: Verify a change in this monorepo before it is committed or pushed — format, lint, knip, typecheck and test, scoped to the workspaces the change touched, with a whole-repo run for big changes. Use it after you finish any non-trivial edit in packages/, portal/, portal-backend/ or subgraphs/, and whenever the user asks to verify, check, validate, "run the checks", "make sure it passes / CI is green", or is about to commit or open a PR — even if they do not name the checks.
---

# Run checks (ui-monorepo)

CI ([`js-checks.yml`](../../../.github/workflows/js-checks.yml)) runs the full
matrix on every PR: `format:check`, `lint`, `deps:check`, `pnpm -r build` and
`pnpm -r test`. Locally, run only what the change can break. CI catches the
rest.

## 1. Find what changed

```bash
git status --short
git diff --name-only main...HEAD
```

Group the files by workspace. Then pick the scope:

- **Only docs (`*.md`)**: format and lint them (see §2). Nothing else.
- **Root config, lockfile or a dependency bump in many workspaces** (for
  example `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `patches/`, eslint,
  prettier or knip config): go to [§3](#3-big-change-run-the-ci-matrix).
- **Anything else**: go to §2.

## 2. Scoped checks

Format the changed files, and lint the changed `.js`, `.md`, `.ts` and `.tsx`
files. This is what the pre-commit hook runs:

```bash
pnpm prettier --write <files>
pnpm eslint --cache --max-warnings 0 <js/md/ts/tsx files>
```

Do not lint `subgraphs/**/*.ts` (except `hemi-earn-requests-subgraph`).
`.eslintrc.json` ignores these files, and with `--max-warnings 0` the
"file ignored" warning fails the run.

Run `pnpm deps:check` (knip) only if you added, removed or moved exports,
files or dependencies. knip always checks the whole repo.

Then typecheck and test each changed workspace:

- **`packages/<pkg>`** — a leading `...` adds the dependents, so the portal and
  the API are checked too. `build` emits JS only in the packages that have a
  `tsconfig.build.json`. In the others, it is the same as `typecheck`.

  ```bash
  pnpm --fail-if-no-match --filter '...<pkg>' run --if-present typecheck
  pnpm --fail-if-no-match --filter <pkg> run --if-present build
  pnpm --fail-if-no-match --filter '...<pkg>' run --if-present test
  ```

- **`portal`** — `types:check` fails if the generated wrangler types are out of
  date. Run `build` (Vite) only if you changed Vite config, package `exports`,
  or imports that the bundler must resolve.

  ```bash
  pnpm --filter portal run types:check
  pnpm --filter portal run typecheck
  pnpm --filter portal run test
  ```

- **`portal-backend/api`**

  ```bash
  pnpm --filter portal-backend run typecheck
  pnpm --filter portal-backend run test
  ```

- **`portal-backend/cron/<name>`** — no scripts. Review by hand, and see the
  Docker note below.

- **`subgraphs/<name>`** — `build` runs `codegen` first. `test` exists only in
  some subgraphs.

  ```bash
  pnpm --fail-if-no-match --filter <name> run build
  pnpm --filter <name> run --if-present test
  ```

- **`subgraphs/utils`** — not a workspace. Build and test the subgraphs that
  import it:

  ```bash
  pnpm --filter hemi-tunnel-deposits-subgraph --filter hemi-tunnel-withdrawals-subgraph --filter ve-hemi-subgraph run build
  pnpm --filter hemi-tunnel-deposits-subgraph --filter hemi-tunnel-withdrawals-subgraph --filter ve-hemi-subgraph run --if-present test
  ```

`--fail-if-no-match` makes a filter that matches nothing fail. Without it,
pnpm exits 0 and runs nothing. Filter on the `name` in the workspace's
`package.json`, not on the folder name.

CI also builds the Docker images
([`docker-checks.yml`](../../../.github/workflows/docker-checks.yml)) when
`portal-backend/`, `packages/ve-hemi-actions`, `packages/ve-hemi-rewards` or
`pnpm-lock.yaml` change. If you changed a `Dockerfile` or dependencies, build
the affected image: `docker build -f <path>/Dockerfile .` (the build context is
the repo root).

## 3. Big change? Run the CI matrix

```bash
pnpm format:write
pnpm lint --max-warnings 0
pnpm deps:check
pnpm -r --if-present typecheck
pnpm -r --if-present build
pnpm -r --if-present test
```

If `pnpm-lock.yaml` changed, run `pnpm install --frozen-lockfile` first. CI and
the Dockerfiles install that way.

## 4. Report

Tell the user which commands you ran and which passed or failed. Give the
error output for each failure. If you skipped a check, say which and why.
Then read `git diff` against [`CLAUDE.md`](../../../CLAUDE.md), because the
checks do not catch every rule there.
