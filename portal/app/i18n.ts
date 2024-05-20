// i18n for static pages based on
// https://medium.com/@ferlat.simon/internationalize-your-next-js-static-site-with-app-router-772f9f16e63
export const defaultLocale = 'en' as const
export const locales = [defaultLocale, 'es'] as const
export type Locale = (typeof locales)[number]
