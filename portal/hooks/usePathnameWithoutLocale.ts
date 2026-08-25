import { usePathname } from 'i18n/navigation'

/**
 * Hook that returns the pathname without the locale. Useful for relative links
 * where you want to update the current pathname, without changing the locale
 * (for example, adding a particular query string).
 * @returns The full pathname without the locale
 */
export const usePathnameWithoutLocale = usePathname
