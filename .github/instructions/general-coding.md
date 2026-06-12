---
applyTo: '**'
---

# Project general rules

- After applying changes, if any variable, import or constant becomes unused, remove them.
- When adding dependencies in a package.json, use a version that's already installed in other projects' package.json. This should prevent having multiple versions of the same package.
- When updating a project, prefer using the same language that is already used. If the project is Typescript based, use Typescript. If it is Javascript based, prefer Javascript. If it uses both, or it is a new project from scratch, prefer Typescript if possible.
- When updating a project, prefer using the same module system for organizing and reusing code. If the project already used CommonJs, keep using it. If the project uses ESM, use ESM. If starting a new project from scratch, prefer using ESM.
- If some functionality needs to be exported into a reusable package, they must be added as a new project under the [packages folder](../../packages).
- For any web3 code, like reading or writing to smart contracts, use `viem`, and `wagmi` if needed.
- Do not use arrow functions, except when the function consist of only one statement. In those cases, use arrow functions without brackets.
- When adding tests, the `test` folder replicates the folder structure where the file being tested is imported from. To run the test, use `pnpm test` in the project folder.
- When adding a `vitest.config.ts`, use this configuration:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    clearMocks: true,
  },
})
```

With that vitest config, there's no need to use

```ts
beforeEach(function () {
  vi.clearAllMocks()
})
```

in tests as the vitest config will automatically clear the mocks.

- After writing all the code, format with prettier. Prettier is installed in the root of the repo, and we use its default config. You can get the prettier version from the root's package.json. To format the code, you can use `pnpm format:write`
- Do not export/expose functions unless they are strictly need to. To verify that there are no unused exports, we use `knip`. There is a command in the root repo, `pnpm deps:check`
- Prefer functions like filter, map, reduce, over for, while loops for better readability, unless the complexity/performance impact favors the latter over the former.
- When placing object keys, place them in ascending sorted order. This applies when creating objects, or defining properties in parameters / arguments / types.
- Use `camelCase` for variable and function names, as well as file names. If reading a variable from another package does not follow this convention, it is preferred to convert it into a new variable that does follow it, and use the new variable instead.
- When defining parameters for a function, prefer using an object if 3 or more parameters are required. Some exceptions are when the function is a facade/adapter of another known function, and in those cases it may be preferable to maintain a similar signature.
- If changes into a config file are needed, ask before executing them. Config files are sensible changes and may impact many places, so they need to be careful reviewed.
- Each workspace should have a README, which shall be read as part of the context when working on the workspace.
- When adding environment variables, update the README of the project with its name. These env variables may also be added to the workflow files in the [../](.github) folder if their values are to be read from Github Actions vars and secrets
- The pnpm version is pinned via the `packageManager` field in `package.json`: once in the root and once in each service that ships in a Docker image (portal-backend/api, portal-backend/cron/\*). When bumping pnpm, update all of them — they must stay in sync. Per-service fields are required because corepack's activation is per-user — without the field in the image, the `node` user would download a default pnpm at runtime instead of the pinned version. Which `package.json` a build reads depends on its build context: portal-backend/cron/\* builds from its own directory, so it reads its own field and can't see the root; portal-backend/api builds from the repo root (so its build stage reads the root field), and its own field is carried into the `pnpm deploy` output so the runtime `pnpm run start` stays pinned. Dockerfiles only run `corepack enable`; the version itself comes from the relevant `package.json`.
