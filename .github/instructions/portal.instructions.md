---
applyTo: 'portal/**'
---

# Portal rules

Apply the [Frontend rules](./frontend.instructions.md). Check the [portal's README](../../portal/README.md) to know about the general overview of the project.  
Furthermore, consider the [code structure](../../portal/README.md#structure), which will give hints of where each type of file can be found, or where to place new files when implementing features.

## Rules

- This app uses the App router from next (v14). Therefore, below the `app` folder, each folder that contains a `page.tsx` is a route segment.
- When creating a new component, hook, or function utility, prefer co-locating these new files in their `_components`, `_hooks` or `_utils` that belongs to the page where it is being used. This mean that each page will have their own folders for these types of files.
  If the component/hook/util is generic enough, they can be created in/moved to their respective folder `components`/`hooks`/`utils` in the root of the portal project.
- When adding new functions to either `utils` or `_utils`, if they contain logic, add tests in the `test` folder. If the function is only code that calls an external source, tests may be skipped.
- **ALL strings that are visible to users MUST be translated** depending on the locale. The exceptions are numbers in isolation (when they are rendered on their own and not as a part of a string), and if a string consist of a word that is not translated in any language (For example: "Testnet"). This means that when a string rendered to the user is added, its translations to all supported languages must be added to the corresponding files in the [messages](../../portal/messages) folder. **Never use hardcoded strings in components - always use the translation functions.**
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
