---
applyTo: 'portal/**'
---

# Portal rules

Apply the [Frontend rules](./frontend.md).

## Overview

The [portal](../../portal/) is a Web3 app that allows users to interact with Hemi, an L2 that integrates Ethereum with Bitcoin. Users can tunnel their assets from EVM chains to Hemi, and viceversa, as well as participate in other activities.

## Structure

The portal is a Next app that uses static building and the app router. As it is a static page, it does not rely with SSR features (Except on local development).

Some relevant folders are:

- [/app](../../portal/app/) folder, which contains the Next's App router code
- [/components](../../portal/components/) folder, which contains reusable components to the entire app that are not tied to a specific page.
- [/hooks](../../portal/hooks/) folder, which contains reusable hooks to the entire app that are not tied to a specific page.
- [/messages/](../../portal/messages) folder, which contain a file per locale with all the translated resources.
- [/test](../../portal//test/) folder, which contains some tests for different portal files. These tests are for plain Typescript function, and not for components.
- [/types](../../portal/types/) folder, which contains many reusable Typescript types across the entire app
- [/utils](../../portal/utils/) folder, which contains most of the logic that is not tied to UI.

This folder should be reviewed when implementing new features to see which ones can be reused. If a new component is to be written, and it is abstract enough to be reused across many pages, it should be created here.

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
