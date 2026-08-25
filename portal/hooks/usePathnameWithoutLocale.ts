import { usePathname } from 'i18n/navigation'

/**
 * Hook that returns the pathname without the locale segment and without a
 * trailing slash. Useful for relative links where you want to update the
 * current pathname, without changing the locale (for example, adding a
 * particular query string).
 * @returns The pathname, locale segment and trailing slash removed
 */
export const usePathnameWithoutLocale = usePathname
