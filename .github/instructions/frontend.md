---
applyTo: '**/*.tsx'
---

# Frontend rules

- Use `tailwind` for any css code
- Prefer using classes defined by `tailwind`, or by theme defined in the root of the project, in file "tailwind.config.ts". Only when many classes need to be used together (For example, an animation) it is acceptable to create a .css file
- For querying external data sources that are async, we use `react-query`
- All strings that are visible to users must be translated depending on the locale. We use `next-intl` for translated resources.
- Use function based components in React.
