# CLAUDE.md

This file is the single source of truth for the repo's coding conventions.

Read the structure of the repo in the project [README](./README.md).

Read [docs/DOMAIN.md](./docs/DOMAIN.md) before working on anything that touches the domain rather than plain plumbing: tunneling in either direction, tunnel operation statuses and their transitions, wait times, vaults, partner bridges, or how transaction history is synced. It explains what Hemi is and how the tunnel behaves, which is the background needed to tell a correct change from a plausible one.

Consider these defaults whenever writing/updating code; make them take precedence by default, unless stated otherwise. Each section states the files it applies to: apply a section only when the file being added or changed matches its scope, and ignore that section entirely otherwise.

## General rules

_Applies to all code._

- After applying changes, if any variable, import or constant becomes unused, remove them.
- When adding dependencies in a package.json, use a version that's already installed in other projects' package.json. This should prevent having multiple versions of the same package.
- When updating a project, prefer using the same language that is already used. If the project is TypeScript based, use TypeScript. If it is JavaScript based, prefer JavaScript. If it uses both, or it is a new project from scratch, prefer TypeScript if possible.
- When updating a project, prefer using the same module system for organizing and reusing code. If the project already used CommonJS, keep using it. If the project uses ESM, use ESM. If starting a new project from scratch, prefer using ESM.
- If some functionality needs to be exported into a reusable package, they must be added as a new project under the [packages folder](./packages).
- For any web3 code, like reading or writing to smart contracts, use `viem`, and `wagmi` if needed.
- Do not use arrow functions, except when the function consists of only one statement. In those cases, use arrow functions without brackets.
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
- Do not export/expose functions unless they are strictly needed. To verify that there are no unused exports, we use `knip`. There is a command in the root repo, `pnpm deps:check`
- Prefer functions like filter, map, reduce, over for, while loops for better readability, unless the complexity/performance impact favors the latter over the former.
- When placing object keys, place them in ascending sorted order. This applies when creating objects, or defining properties in parameters / arguments / types.
- Use `camelCase` for variable and function names, as well as file names. If reading a variable from another package does not follow this convention, it is preferred to convert it into a new variable that does follow it, and use the new variable instead.
- When defining parameters for a function, prefer using an object if 3 or more parameters are required. Some exceptions are when the function is a facade/adapter of another known function, and in those cases it may be preferable to maintain a similar signature.
- If changes into a config file are needed, ask before executing them. Config files are sensible changes and may impact many places, so they need to be careful reviewed.
- Each workspace should have a README, which shall be read as part of the context when working on the workspace.
- When adding environment variables, update the README of the project with its name. These env variables may also be added to the workflow files in the [.github](./.github) folder if their values are to be read from GitHub Actions vars and secrets
- The pnpm version is pinned via the `packageManager` field in `package.json`: once in the root and once in each service that ships in a Docker image (portal-backend/api, portal-backend/cron/\*). When bumping pnpm, update all of them — they must stay in sync. Per-service fields are required because corepack's activation is per-user — without the field in the image, the `node` user would download a default pnpm at runtime instead of the pinned version. Which `package.json` a build reads depends on its build context: portal-backend/cron/\* builds from its own directory, so it reads its own field and can't see the root; portal-backend/api builds from the repo root (so its build stage reads the root field), and its own field is carried into the `pnpm deploy` output so the runtime `pnpm run start` stays pinned. Dockerfiles only run `corepack enable`; the version itself comes from the relevant `package.json`.

## TypeScript rules

_Applies to `**/*.{ts,tsx}`._

Apply the [general rules](#general-rules) to all code as a base guideline, unless there is an exception.

- Prefer using `T[]` over `Array<T>`
- Prefer using `type` over `interface`
- When adding a `tsconfig.json`, start with an empty version like this:

```json
{
  "compilerOptions": {
    "erasableSyntaxOnly": true
  },
  "exclude": ["node_modules", "test/*"],
  "extends": "@tsconfig/node24/tsconfig.json",
  "include": ["**/*.ts"]
}
```

Note that `@tsconfig/node24` must be installed in the `package.json`. Install the same exact version that is already part of the [lock file](./pnpm-lock.yaml). If multiple versions are found, use the newest.

- Avoid using `any` whenever possible. If a type is not known, prefer using `unknown`
- When adding or updating tests, don't worry about types not compiling. Tests are excluded from `tsconfig.json`, so feel free to leave errors in the IDE. As long as tests run, it is ok - no need to add `as any` in several places to make types compile in test files. Following that line, prefer using partial objects or the minimum object needed so tests pass, even though it may throw compilation errors. Types in tests should be mostly as a guide.
- When defining Interfaces, Types, or inline types, the names of the keys should be sorted in alphabetic order.
- Do not add the return type of a function, unless strictly needed. Let the TypeScript compiler infer automatically the type returned.
- Imports should be sorted alphabetically in ascending order (A-Z) by module name
- Prefer inline exports over exporting at the end. For example, this is correct

```ts
// prefer exporting inline
export const foo = function () {
  /* ...*/
}
export const baz = function () {
  /* ...*/
}
```

and avoid exporting at the end

```ts
// prefer exporting inline
const foo = function () {
  /* ...*/
}
const baz = function () {
  /* ...*/
}

export { foo, baz }
```

## Frontend rules

_Applies to `**/*.tsx`._

- Use `tailwind` for any CSS code
- Prefer using classes defined by `tailwind`, or by theme defined in the root of the project, in file "tailwind.config.ts". Only when many classes need to be used together (For example, an animation) it is acceptable to create a .css file
- For querying external data sources that are async, we use `react-query`
- When handling `useQuery` or hooks that use `useQuery`, follow the data-first pattern:

1. First check for data availability. If available, render successfully
2. Then check for errors. If so, render the error state
3. If neither, render loading state

Example:

```typescript
const { data, error } = useTodos()

if (data) {
  return <div>{data.map(renderTodo)}</div>
}
if (error) {
  return 'An error has occurred'
}

return 'Loading...'
```

- When creating reusable hooks that internally use `useQuery` or `useMutation`, if the output of these functions is to be returned, don't rename them - just return its return value and let consumers do the rename, if needed.

Example:

```typescript
const useMyHook = function () {
  const someValue = useFoo()
  return useQuery({
    queryFn: () => fetchSome(someValue),
    queryKey: [someValue],
  })
}
```

- All strings that are visible to users must be translated depending on the locale. We use `use-intl` for translated resources.
- Use function-based components in React.

## Portal rules

_Applies to `portal/**`._

Apply the [Frontend rules](#frontend-rules). Check the [portal's README](./portal/README.md) to know about the general overview of the project.  
Furthermore, consider the [code structure](./portal/README.md#structure), which will give hints of where each type of file can be found, or where to place new files when implementing features.

### Rules

- Routing lives in `app.tsx` at the portal root, wired with react-router. Pages still live below the `app` folder, but a folder holding a `page.tsx` is not a route on its own: it only becomes reachable once it is added to the route table in `app.tsx`.
- When creating a new component, hook, or function utility, prefer co-locating these new files in their `_components`, `_hooks` or `_utils` that belong to the page where it is being used. This means that each page will have their own folders for these types of files.
  If the component/hook/util is generic enough, they can be created in/moved to their respective folder `components`/`hooks`/`utils` in the root of the portal project.
- When adding new functions to either `utils` or `_utils`, if they contain logic, add tests in the `test` folder. If the function is only code that calls an external source, tests may be skipped.
- **ALL strings that are visible to users MUST be translated** depending on the locale. The exceptions are numbers in isolation (when they are rendered on their own and not as a part of a string), and if a string consists of a word that is not translated in any language (For example: "Testnet"). This means that when a string rendered to the user is added, its translations to all supported languages must be added to the corresponding files in the [messages](./portal/messages) folder. **Never use hardcoded strings in components - always use the translation functions.**
- When adding translations, follow this pattern:
  - Use `useTranslations('section-name')` hook to get the translation function
  - Add translation keys in a logical hierarchy within the appropriate section
  - Ensure all three language files have the same keys with appropriate translations
  - Keys should be alphabetically sorted
- The current supported languages are English (`en` - it is the default locale), Spanish (`es`) and Portuguese (`pt`).
- **Translations must address the user with a formal, respectful register** (the same "you" the rest of the UI uses). Machine translation defaults to the informal register, so always review the tone of any string you add or edit:
  - **Spanish (`es`)** — use the formal _usted_ form, never the informal _tú_:
    - Possessives: `su` / `sus`, not `tu` / `tus` (e.g. "sus fondos", not "tus fondos").
    - Verbs and imperatives: conjugate for _usted_ — "Haga clic", "Use", "Conecte", "Intente de nuevo" — not "Haz clic", "Usa", "Conecta", "Intenta de nuevo".
    - Pronouns: prefer "le" / "lo" / "la"; avoid "te" / "ti".
  - **Portuguese (`pt`)** — use the _você_ form, never the _tu_ form:
    - Possessives: `seu` / `sua` / `seus` / `suas`, not `teu` / `tua` / `teus` / `tuas` (e.g. "seus fundos", not "teus fundos").
    - Verbs: conjugate for _você_ (third person) — "Clique", "Use" — not "Clica", "Usa".
    - Pronouns: prefer "você" / "lhe"; avoid "te" / "ti" / "contigo".
  - Keep established product terms untranslated, as the rest of the UI does (e.g. "share tokens", "Testnet").
