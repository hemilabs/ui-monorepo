---
applyTo: '**/*.tsx'
---

# Frontend rules

- Use `tailwind` for any css code
- Prefer using classes defined by `tailwind`, or by theme defined in the root of the project, in file "tailwind.config.ts". Only when many classes need to be used together (For example, an animation) it is acceptable to create a .css file
- For querying external data sources that are async, we use `react-query`
- When handling `useQuery` or hooks that use `useQuery`, follow the data-first pattern:

1. First check for data availability. If available, render successfully
2. Then check for errors. If so, render the error state
3. If neither, render loading state

Example:

```typescript
const { data, error } = useTodos()

if (todos.data) {
  return <div>{todos.data.map(renderTodo)}</div>
}
if (todos.error) {
  return 'An error has occurred'
}

return 'Loading...'
```

- When creating reusable hooks that internally use `useQuery` or `useMutation`, if if the output of these functions is to be returned, don't rename them - just return its return value and let consumers do the rename, if needed.

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

- All strings that are visible to users must be translated depending on the locale. We use `next-intl` for translated resources.
- Use function based components in React.
