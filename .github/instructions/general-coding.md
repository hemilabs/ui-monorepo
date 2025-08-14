---
applyTo: '**'
---

# Project general rules

- After applying changes, if any variable, import or constant becomes unused, remove them.
- When adding dependencies in a package.json, prefer using a version that's already installed in other projects' package.json. This should prevent having multiple versions of the same package.
- When updating a project, prefer using the same language that is already used. If the project is Typescript based, use Typescript. If it is Javascript based, prefer Javascript. If it uses both, or it is a new project from scratch, prefer Typescript if possible.
- When updating a project, prefer using the same module system for organizing and reusing code. If the project already used CommonJs, keep using it. If the project uses ESM, use ESM. If starting a new project from scratch, prefer using ESM.
- If some functionality needs to be exported into a reusable package, they must be added as a new project under the (packages folder)(../../packages).
- For any web3 code, like reading or writing to Smart Contracts, use `viem`, and `wagmi` if needed.
- Do not use arrow functions, except when the function consist of only one statement. In those cases, use arrow functions without brackets.
- When adding tests, the `test` folder replicates the folder structure where the file being tested is imported from. To run the test, use `npm test` in the project folder.
- After writing all the code, format with prettier. Prettier is installed in the root of the repo, and we use its default config. You can get the prettier version from the root's package.json. To format the code, you can use `npm run format:write`
- Do not export/expose functions unless they are strictly need to. To verify that there are no unused exports, we use `knip`. There is a command in the root repo, `npm run deps:check`
- Prefer functions like filter, map, reduce, over for, while loops for better readability, unless the complexity/performance impact favors the latter over the former.
- When placing object keys, place them in ascending sorted order. This applies when creating objects, or defining properties in parameters / arguments / types.
- Use `camelCase` for variable and function names, as well as file names. If reading a variable from another package does not follow this convention, it is preferred to convert it into a new variable that does follow it, and use the new variable instead.
- When defining parameters for a function, prefer using an object if 3 or more parameters are required. Some exceptions are when the function is a facade/adapter of another known function, and in those cases it may be preferable to maintain a similar signature.
- If changes into a config file are needed, ask before executing them. Config files are sensible changes and may impact many places, so they need to be careful reviewed.
- Each workspace should have a README, which shall be read as part of the context when working on the workspace.
