---
applyTo: '**/*.ts'
---

# Project rules for Typescript

Apply the [general coding guidelines](./general-coding.md) to all code as a base guideline, unless there is an exception.

## Tests Guidelines

- Prefer using `T[]` over `Array<T>`
- Prefer using `type` over `interface`
- When adding a `tsconfig.json`, start with an empty version like this:

```json
{
  "exclude": ["node_modules", "test/*"],
  "extends": "@tsconfig/node22/tsconfig.json",
  "include": ["**/*.ts"]
}
```

Note that `@tsconfig/node22` must be installed in the `package.json`. Install the same exact version that is already part of the [package-lock file](../../package-lock.json). If multiple versions are found, use the newest.

- Avoid using `any` whenever possible. If a type is not known, prefer using `unknown`
- When adding or updating tests, don't worry about types not compiling. Tests are excluded from `tsconfig.json`, so feel free to leave errors in the IDE. As long as tests run, it is ok - no need to add `as any` in several places to make types compile in test files. Following that line, prefer using partial objects or the minimum object needed so tests pass, even though it may throw compilation errors. Types in tests should be mostly as a guide.
